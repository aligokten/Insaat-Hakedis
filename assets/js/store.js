/* Kalici veri katmani.
   Iki modda calisir:
     yerel  - kayitlar yalnizca bu tarayicinin localStorage'inda durur
     bulut  - kayitlar Supabase'de tutulur, tum kullanicilar ayni veriyi gorur
   Her iki modda da okuma es zamanlidir: bellekte tutulan onbellek okunur.
   Bulut modunda yazma once onbellege islenir, ardindan sunucuya gonderilir;
   sunucu reddederse degisiklik geri alinir. */
window.Store = (function () {
  const KEY = 'insaat-hakedis:v2';
  const KOLEKSIYONLAR = ['projeler', 'paftalar', 'metraj', 'taseronlar', 'isler',
                         'personel', 'puantaj', 'kaliteKontrol', 'hakedisler',
                         'stok', 'hareketler', 'siparisler', 'raporlar',
                         'kullanicilar', 'gunluk'];

  let db = null;
  let mod = 'yerel';                 // yerel | bulut
  const aboneler = [];
  const AYAR_ID = 'yetkiler';        // taseron yetki haritasinin bulut kaydi

  function uid(onek) {
    return (onek || 'K') + '-' + Date.now().toString(36).slice(-5).toUpperCase() +
           Math.random().toString(36).slice(2, 5).toUpperCase();
  }

  function tohum() {
    const veri = { _v: 2, yetkiler: {} };
    KOLEKSIYONLAR.forEach((k) => {
      veri[k] = JSON.parse(JSON.stringify(window.DB[k] || [])).map((x) => ({ ...x, _id: uid(k.slice(0, 3).toUpperCase()) }));
    });
    (window.DB.taseronlar || []).forEach((t, i) => { veri.yetkiler[t.id] = (t.yetkiler || []).slice(); });
    return veri;
  }

  function yukle() {
    try {
      const ham = localStorage.getItem(KEY);
      if (ham) {
        const c = JSON.parse(ham);
        if (c && c._v === 2) return c;
      }
    } catch (e) { /* bozuk kayit: tohumla devam */ }
    return tohum();
  }

  function kaydet() {
    try {
      localStorage.setItem(mod === 'bulut' ? KEY + ':bulut' : KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Kayit basarisiz:', e);
      if (window.UI) window.UI.toast('Tarayici depolama alani dolu, kayit yapilamadi.');
      return false;
    }
    return true;
  }

  /* Bulut yazmasi: basarisiz olursa kullaniciyi uyarir ve onbellegi tazeler */
  function buluta(islem, koleksiyon, kayit) {
    if (mod !== 'bulut' || !window.Bulut) return;
    const is = islem === 'sil' ? window.Bulut.sil(koleksiyon, kayit._id)
                               : window.Bulut.yaz(koleksiyon, kayit);
    is.catch((e) => {
      console.error('Bulut yazma hatası:', e);
      if (window.UI) {
        window.UI.toast('Kayıt sunucuya yazılamadı: ' + (e.message || e) +
                        ' — sayfayı yenileyin.');
      }
    });
  }

  /* Taseron yetki haritasi tek kayit olarak saklanir */
  function yetkileriYaz() {
    if (mod !== 'bulut') return;
    buluta('yaz', 'ayarlar', { _id: AYAR_ID, ...db.yetkiler });
  }

  function bildir(olay) {
    aboneler.forEach((fn) => { try { fn(olay); } catch (e) { console.error(e); } });
  }

  /* Islem gunlugu: kullanici, gunluk ve oturum kayitlari haric her degisiklik yazilir */
  const GUNLUK_DISI = ['gunluk'];
  function gunlukYaz(eylem, koleksiyon, kayit) {
    if (GUNLUK_DISI.indexOf(koleksiyon) > -1) return;
    const k = window.Yetki && window.Yetki.kullanici();
    if (!db.gunluk) db.gunluk = [];
    db.gunluk.unshift({
      _id: uid('LOG'),
      kullanici: k ? k.ad : 'sistem',
      kullaniciId: k ? k._id : '',
      eylem, koleksiyon,
      kayit: kayit ? (kayit.ad || kayit.no || kayit.id || kayit.poz || kayit._id) : '',
      tarih: new Date().toISOString()
    });
    if (mod === 'bulut') buluta('yaz', 'gunluk', db.gunluk[0]);
    if (db.gunluk.length > 500) db.gunluk.length = 500;   // onbellek sinirsiz buyumesin
  }

  /* ------------------------------------------------------------------ API */

  /* Eski bir yedekte olmayan koleksiyon istenirse bos olarak olusturulur */
  function get(koleksiyon) {
    if (!db) db = yukle();
    if (!Array.isArray(db[koleksiyon])) { db[koleksiyon] = []; kaydet(); }
    return db[koleksiyon];
  }

  function bul(koleksiyon, id) {
    return get(koleksiyon).find((x) => x._id === id) || null;
  }

  function ekle(koleksiyon, kayit) {
    const yeni = { ...kayit, _id: kayit._id || uid(koleksiyon.slice(0, 3).toUpperCase()) };
    get(koleksiyon).unshift(yeni);
    gunlukYaz('ekledi', koleksiyon, yeni);
    kaydet(); buluta('yaz', koleksiyon, yeni);
    bildir({ tur: 'ekle', koleksiyon, kayit: yeni });
    return yeni;
  }

  function guncelle(koleksiyon, id, yama) {
    const kayit = bul(koleksiyon, id);
    if (!kayit) return null;
    Object.assign(kayit, yama);
    gunlukYaz('güncelledi', koleksiyon, kayit);
    kaydet(); buluta('yaz', koleksiyon, kayit);
    bildir({ tur: 'guncelle', koleksiyon, kayit });
    return kayit;
  }

  function sil(koleksiyon, id) {
    const liste = get(koleksiyon);
    const i = liste.findIndex((x) => x._id === id);
    if (i < 0) return false;
    const [kayit] = liste.splice(i, 1);
    gunlukYaz('sildi', koleksiyon, kayit);
    kaydet(); buluta('sil', koleksiyon, kayit);
    bildir({ tur: 'sil', koleksiyon, kayit });
    return true;
  }

  /* Arsivleme: kayit silinmez, listelerden gizlenir ve geri alinabilir */
  function arsivle(koleksiyon, id, arsivli) {
    const kayit = bul(koleksiyon, id);
    if (!kayit) return null;
    kayit.arsivli = arsivli !== false;
    kayit.arsivTarih = kayit.arsivli ? new Date().toISOString() : '';
    gunlukYaz(kayit.arsivli ? 'arşivledi' : 'arşivden çıkardı', koleksiyon, kayit);
    kaydet(); buluta('yaz', koleksiyon, kayit);
    bildir({ tur: 'arsiv', koleksiyon, kayit });
    return kayit;
  }

  /* Yalnizca arsivlenmemis kayitlar */
  const aktif = (koleksiyon) => get(koleksiyon).filter((x) => !x.arsivli);
  const arsivdekiler = (koleksiyon) => get(koleksiyon).filter((x) => x.arsivli);

  /* taseron yetkileri ayri tutulur (taseron kaydindan bagimsiz duzenlenir) */
  function yetkiler(taseronId) {
    if (!db) db = yukle();
    if (!db.yetkiler[taseronId]) db.yetkiler[taseronId] = [];
    return db.yetkiler[taseronId];
  }

  function yetkiDegistir(taseronId, anahtar) {
    const liste = yetkiler(taseronId);
    const i = liste.indexOf(anahtar);
    if (i > -1) liste.splice(i, 1); else liste.push(anahtar);
    kaydet(); yetkileriYaz();
    bildir({ tur: 'yetki', taseronId, anahtar, acik: i === -1 });
    return i === -1;
  }

  function abone(fn) { aboneler.push(fn); return () => aboneler.splice(aboneler.indexOf(fn), 1); }

  function sifirla() {
    db = tohum(); kaydet(); bildir({ tur: 'sifirla' });
  }

  function disaAktar() {
    if (!db) db = yukle();
    return JSON.stringify(db, null, 2);
  }

  function iceAktar(metin) {
    const gelen = JSON.parse(metin);
    if (!gelen || typeof gelen !== 'object' || !Array.isArray(gelen.projeler)) {
      throw new Error('Dosya bu panele ait bir yedek gibi gorunmuyor.');
    }
    gelen._v = 2;
    gelen.yetkiler = gelen.yetkiler || {};
    KOLEKSIYONLAR.forEach((k) => { if (!Array.isArray(gelen[k])) gelen[k] = []; });
    db = gelen; kaydet(); bildir({ tur: 'iceAktar' });
  }

  /* ------------------------------------------------------------- bulut */

  /* Sunucudan gelen anlik goruntuyu onbellege alir ve bulut moduna gecer */
  function bulutaGec(anlik) {
    const veri = { _v: 2, yetkiler: {} };
    KOLEKSIYONLAR.forEach((k) => { veri[k] = Array.isArray(anlik[k]) ? anlik[k] : []; });
    const ayar = (anlik.ayarlar || []).find((x) => x._id === AYAR_ID);
    if (ayar) {
      Object.keys(ayar).forEach((k) => { if (k !== '_id') veri.yetkiler[k] = ayar[k]; });
    }
    db = veri; mod = 'bulut';
    kaydet(); bildir({ tur: 'bulutYuklendi' });
  }

  /* Baska bir kullanicinin degisikligini onbellege isler (sunucuya geri yazmaz) */
  function uzaktanUygula(olay) {
    if (mod !== 'bulut' || !olay || !olay.koleksiyon) return;
    if (olay.koleksiyon === 'ayarlar') {
      if (olay.kayit && olay.kayit._id === AYAR_ID) {
        db.yetkiler = {};
        Object.keys(olay.kayit).forEach((k) => { if (k !== '_id') db.yetkiler[k] = olay.kayit[k]; });
        kaydet(); bildir({ tur: 'uzak', koleksiyon: 'ayarlar' });
      }
      return;
    }
    if (KOLEKSIYONLAR.indexOf(olay.koleksiyon) < 0) return;
    const liste = get(olay.koleksiyon);
    const i = liste.findIndex((x) => x._id === olay.kayit._id);
    if (olay.tur === 'sil') {
      if (i < 0) return;
      liste.splice(i, 1);
    } else if (i > -1) {
      liste[i] = olay.kayit;
    } else {
      liste.unshift(olay.kayit);
    }
    kaydet();
    bildir({ tur: 'uzak', koleksiyon: olay.koleksiyon, kayit: olay.kayit, eylem: olay.tur });
  }

  const kaynak = () => mod;

  return { get, aktif, arsivdekiler, arsivle, bul, ekle, guncelle, sil,
           yetkiler, yetkiDegistir, gunlukYaz,
           abone, sifirla, disaAktar, iceAktar, uid, KOLEKSIYONLAR,
           bulutaGec, uzaktanUygula, kaynak };
})();
