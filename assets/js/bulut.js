/* Bulut katmani (Supabase).
   Yapilandirma varsa panel cok kullanicili calisir:
     - kimlik dogrulama: kullanici kodu + sifre (Supabase Auth)
     - veri: public.kayitlar tablosunda tek satir = tek kayit
     - anlik yayin: realtime aboneligi, calismazsa periyodik yoklama

   Dosya icerikleri (DWG/DXF/PDF/gorsel) buluta gonderilmez; yukleyen
   kullanicinin tarayicisindaki IndexedDB'de kalir. */
window.Bulut = (function () {
  const AYAR_ANAHTAR = 'insaat-hakedis:bulut-ayar';
  const YOKLAMA_MS = 12000;          // realtime yoksa yedek yoklama araligi
  const CDN = [
    'https://esm.sh/@supabase/supabase-js@2.45.4',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'
  ];

  let sb = null;                     // supabase istemcisi
  let ikinciIstemci = null;          // kullanici olustururken oturumu bozmamak icin
  let durum = 'kapali';              // kapali | baglaniyor | bagli | hata
  let hataMetni = '';
  let kanal = null;
  let yoklamaZaman = null;
  let sonDamga = null;               // yoklamada kullanilan en son guncelleme zamani
  let uzakOlay = null;               // Store tarafindan atanir
  const dinleyiciler = [];

  /* ---------------------------------------------------------- ayarlar */

  /* localStorage'daki ayar, dosyadaki yapilandirmayi ezer (deneme icin) */
  function ayar() {
    const dosya = window.YAPILANDIRMA || {};
    let yerel = {};
    try { yerel = JSON.parse(localStorage.getItem(AYAR_ANAHTAR) || '{}') || {}; } catch (e) { /* yok say */ }
    return {
      url: (yerel.url || dosya.supabaseUrl || '').trim().replace(/\/+$/, ''),
      anahtar: (yerel.anahtar || dosya.supabaseAnonAnahtar || '').trim(),
      alanAdi: (yerel.alanAdi || dosya.girisAlanAdi || 'panel.local').trim(),
      kaynak: yerel.url ? 'tarayıcı' : (dosya.supabaseUrl ? 'yapılandırma dosyası' : '')
    };
  }

  function ayarYaz(yeni) {
    if (!yeni) localStorage.removeItem(AYAR_ANAHTAR);
    else localStorage.setItem(AYAR_ANAHTAR, JSON.stringify(yeni));
  }

  const yapilandirildi = () => !!(ayar().url && ayar().anahtar);
  const bagli = () => durum === 'bagli';
  const durumBilgi = () => ({ durum, hata: hataMetni, ayar: ayar() });

  function bildir() {
    dinleyiciler.forEach((fn) => { try { fn(durumBilgi()); } catch (e) { console.error(e); } });
  }
  function abone(fn) { dinleyiciler.push(fn); return () => dinleyiciler.splice(dinleyiciler.indexOf(fn), 1); }
  function durumAta(d, hata) {
    durum = d; hataMetni = hata || '';
    bildir();
  }

  /* Kullanici kodu -> Supabase Auth e-postasi */
  const kodEposta = (kod) =>
    String(kod).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') + '@' + ayar().alanAdi;

  /* -------------------------------------------------------- istemci */

  async function kutuphane() {
    let sonHata = null;
    for (const adres of CDN) {
      try { return await import(/* webpackIgnore: true */ adres); }
      catch (e) { sonHata = e; }
    }
    throw new Error('Supabase kütüphanesi yüklenemedi (internet erişimi yok mu?): ' +
                    (sonHata && sonHata.message ? sonHata.message : ''));
  }

  async function istemci() {
    if (sb) return sb;
    const a = ayar();
    if (!a.url || !a.anahtar) throw new Error('Bulut yapılandırması eksik.');
    const { createClient } = await kutuphane();
    sb = createClient(a.url, a.anahtar, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'insaat-hakedis:sb' },
      realtime: { params: { eventsPerSecond: 20 } }
    });
    return sb;
  }

  /* Kullanici olustururken aktif oturumun degismemesi icin ayri istemci */
  async function yalitilmisIstemci() {
    if (ikinciIstemci) return ikinciIstemci;
    const a = ayar();
    const { createClient } = await kutuphane();
    ikinciIstemci = createClient(a.url, a.anahtar, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return ikinciIstemci;
  }

  /* --------------------------------------------------------- oturum */

  async function baslat() {
    if (!yapilandirildi()) { durumAta('kapali'); return false; }
    durumAta('baglaniyor');
    try {
      const c = await istemci();
      const { error } = await c.auth.getSession();
      if (error) throw error;
      durumAta('bagli');
      return true;
    } catch (e) {
      durumAta('hata', e.message || String(e));
      return false;
    }
  }

  async function oturum() {
    const c = await istemci();
    const { data } = await c.auth.getSession();
    return (data && data.session) || null;
  }

  async function girisYap(kod, sifre) {
    const c = await istemci();
    const { data, error } = await c.auth.signInWithPassword({
      email: kodEposta(kod), password: sifre
    });
    if (error) {
      const m = String(error.message || '');
      if (/invalid login/i.test(m)) throw new Error('Kullanıcı kodu veya şifre hatalı.');
      if (/email not confirmed/i.test(m)) throw new Error('Hesap henüz onaylanmamış. Yöneticinizle görüşün.');
      throw new Error(m);
    }
    durumAta('bagli');
    return data.user;
  }

  async function cikisYap() {
    try { const c = await istemci(); await c.auth.signOut(); } catch (e) { /* yok say */ }
    kanalKapat();
  }

  /* Yeni kullanici hesabi acar; aktif oturum bozulmaz. authId dondurur. */
  async function hesapAc(kod, sifre) {
    const c = await yalitilmisIstemci();
    const { data, error } = await c.auth.signUp({
      email: kodEposta(kod), password: sifre
    });
    if (error) {
      const m = String(error.message || '');
      if (/already registered|already exists/i.test(m)) {
        throw new Error('Bu kullanıcı kodu zaten kayıtlı.');
      }
      throw new Error(m);
    }
    return {
      authId: data.user ? data.user.id : '',
      onayGerekli: !data.session
    };
  }

  /* Kullanici kendi sifresini degistirir */
  async function sifreDegistir(yeni) {
    const c = await istemci();
    const { error } = await c.auth.updateUser({ password: yeni });
    if (error) throw new Error(error.message);
  }

  /* ----------------------------------------------------------- veri */

  /* Sunucu hatalarini anlasilir mesaja cevirir */
  function veriHatasi(e) {
    const m = String((e && e.message) || e || '');
    if (/does not exist|schema cache|relation .* kayitlar/i.test(m)) {
      return new Error('Veritabanı şeması kurulmamış. Supabase → SQL Editor’de ' +
                       'supabase/sema.sql dosyasını çalıştırın.');
    }
    if (/row-level security|violates row-level/i.test(m)) {
      return new Error('Bu işlem için sunucuda yetkiniz yok (RLS). ' +
                       'Rolünüzü ve modül izinlerinizi kontrol ettirin.');
    }
    if (/JWT|token is expired/i.test(m)) {
      return new Error('Oturum süresi doldu. Yeniden giriş yapın.');
    }
    return new Error(m);
  }

  /* Tum kayitlari cekip {koleksiyon: [kayit...]} bicimine cevirir */
  async function anlikGoruntu() {
    const c = await istemci();
    const cikti = {};
    const sayfa = 1000;
    let bas = 0;
    for (;;) {
      const { data, error } = await c.from('kayitlar')
        .select('koleksiyon,kayit_id,veri,guncelleme')
        .eq('silindi', false)
        .order('guncelleme', { ascending: true })
        .range(bas, bas + sayfa - 1);
      if (error) throw veriHatasi(error);
      (data || []).forEach((satir) => {
        if (satir.guncelleme && (!sonDamga || satir.guncelleme > sonDamga)) sonDamga = satir.guncelleme;
        if (!cikti[satir.koleksiyon]) cikti[satir.koleksiyon] = [];
        cikti[satir.koleksiyon].push({ ...satir.veri, _id: satir.kayit_id });
      });
      if (!data || data.length < sayfa) break;
      bas += sayfa;
    }
    return cikti;
  }

  async function yaz(koleksiyon, kayit) {
    const c = await istemci();
    const { _id, ...veri } = kayit;
    const { error } = await c.from('kayitlar').upsert({
      koleksiyon, kayit_id: _id, veri, silindi: false,
      guncelleme: new Date().toISOString()
    }, { onConflict: 'koleksiyon,kayit_id' });
    if (error) throw veriHatasi(error);
  }

  /* Silme yumusak yapilir: satir kalir, silindi=true olur.
     Boylece degisiklik hem anlik yayinda hem yoklamada digerlerine ulasir. */
  async function sil(koleksiyon, id) {
    const c = await istemci();
    const { error } = await c.from('kayitlar').upsert({
      koleksiyon, kayit_id: id, veri: {}, silindi: true,
      guncelleme: new Date().toISOString()
    }, { onConflict: 'koleksiyon,kayit_id' });
    if (error) throw veriHatasi(error);
  }

  /* Yerel veriyi topluca buluta tasir (ilk kurulumda kullanilir) */
  async function topluYaz(veri) {
    const c = await istemci();
    const satirlar = [];
    Object.keys(veri).forEach((koleksiyon) => {
      if (!Array.isArray(veri[koleksiyon])) return;
      veri[koleksiyon].forEach((kayit) => {
        const { _id, ...govde } = kayit;
        if (!_id) return;
        satirlar.push({ koleksiyon, kayit_id: _id, veri: govde, silindi: false });
      });
    });
    for (let i = 0; i < satirlar.length; i += 200) {
      const { error } = await c.from('kayitlar')
        .upsert(satirlar.slice(i, i + 200), { onConflict: 'koleksiyon,kayit_id' });
      if (error) throw veriHatasi(error);
    }
    return satirlar.length;
  }

  /* ------------------------------------------------------ anlik yayin */

  function olayGonder(tur, satir, eski) {
    if (!uzakOlay) return;
    const kaynak = satir || eski;
    if (!kaynak || !kaynak.koleksiyon) return;
    /* silindi=true isaretli satir, silme olayi olarak iletilir */
    const silmeMi = tur === 'sil' || (satir && satir.silindi);
    uzakOlay({
      tur: silmeMi ? 'sil' : tur,
      koleksiyon: kaynak.koleksiyon,
      kayit: satir && !silmeMi ? { ...satir.veri, _id: satir.kayit_id }
                               : { _id: kaynak.kayit_id }
    });
  }

  async function dinle(geriCagirma) {
    uzakOlay = geriCagirma;
    const c = await istemci();
    kanalKapat();
    kanal = c.channel('panel-kayitlar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kayitlar' }, (p) => {
        if (p.eventType === 'DELETE') olayGonder('sil', null, p.old);
        else olayGonder(p.eventType === 'INSERT' ? 'ekle' : 'guncelle', p.new);
        if (p.new && p.new.guncelleme && (!sonDamga || p.new.guncelleme > sonDamga)) {
          sonDamga = p.new.guncelleme;
        }
      })
      .subscribe((s) => {
        /* Realtime kapaliysa ya da baglanamazsa yoklamaya duselim */
        if (s === 'SUBSCRIBED') yoklamaDurdur();
        else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') yoklamaBaslat();
      });
    yoklamaBaslat();          // ilk anda yedek acik, abonelik kurulunca kapanir
  }

  /* Realtime yoksa: son damgadan yeni kayitlari cek */
  function yoklamaBaslat() {
    if (yoklamaZaman) return;
    yoklamaZaman = setInterval(async () => {
      if (!uzakOlay) return;
      try {
        const c = await istemci();
        const s = await c.auth.getSession();
        if (!s.data || !s.data.session) return;
        let sorgu = c.from('kayitlar').select('koleksiyon,kayit_id,veri,silindi,guncelleme')
          .order('guncelleme', { ascending: true }).limit(500);
        if (sonDamga) sorgu = sorgu.gt('guncelleme', sonDamga);
        const { data, error } = await sorgu;
        if (error || !data || !data.length) return;
        data.forEach((satir) => {
          sonDamga = satir.guncelleme;
          olayGonder('guncelle', satir);
        });
      } catch (e) { /* gecici hata: sonraki turda yeniden denenir */ }
    }, YOKLAMA_MS);
  }

  function yoklamaDurdur() {
    if (yoklamaZaman) { clearInterval(yoklamaZaman); yoklamaZaman = null; }
  }

  function kanalKapat() {
    yoklamaDurdur();
    if (kanal && sb) { try { sb.removeChannel(kanal); } catch (e) { /* yok say */ } }
    kanal = null;
  }

  /* Ayar degistiginde istemciler yeniden kurulur */
  function sifirla() {
    kanalKapat();
    sb = null; ikinciIstemci = null; sonDamga = null;
    durumAta('kapali');
  }

  return {
    ayar, ayarYaz, yapilandirildi, bagli, durumBilgi, abone, kodEposta,
    baslat, oturum, girisYap, cikisYap, hesapAc, sifreDegistir,
    anlikGoruntu, yaz, sil, topluYaz, dinle, kanalKapat, sifirla
  };
})();
