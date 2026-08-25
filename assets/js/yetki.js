/* Kullanici, rol ve izin katmani.
   NOT: Bu kontroller tarayicida calisir; veri de tarayicida durur.
   Yetkilendirme is akisini duzenler, veriyi kriptografik olarak korumaz. */
window.Yetki = (function () {
  const OTURUM = 'insaat-hakedis:oturum';
  const SURE = 12 * 60 * 60 * 1000;             // 12 saat

  const MODULLER = [
    { id: 'ozet',      ad: 'Genel Bakış' },
    { id: 'paftalar',  ad: 'Projeler & DWG' },
    { id: 'metraj',    ad: 'Metraj' },
    { id: 'isler',     ad: 'İşler' },
    { id: 'taseron',   ad: 'Taşeronlar' },
    { id: 'personel',  ad: 'Personel' },
    { id: 'kalite',    ad: 'Kalite Kontrol' },
    { id: 'hakedis',   ad: 'Hakediş' },
    { id: 'stok',      ad: 'Stok' },
    { id: 'tedarik',   ad: 'Tedarik' },
    { id: 'rapor',     ad: 'Raporlar' },
    { id: 'kullanici', ad: 'Kullanıcılar' }
  ];

  /* Yetki seviyeleri artan siradadir */
  const SEVIYE = ['yok', 'goruntule', 'duzenle', 'onayla'];
  const SEVIYE_ADI = {
    yok: 'Erişim yok', goruntule: 'Görüntüle', duzenle: 'Düzenle', onayla: 'Onayla'
  };

  const hepsi = (s) => MODULLER.reduce((a, m) => (a[m.id] = s, a), {});

  /* Rol sablonlari: kullanici bazinda uzerine yazilabilir */
  const ROLLER = {
    'Sistem Yöneticisi': { ...hepsi('onayla') },
    'Proje Müdürü':      { ...hepsi('onayla'), kullanici: 'goruntule' },
    'Şantiye Şefi':      { ...hepsi('duzenle'), hakedis: 'duzenle', tedarik: 'goruntule',
                           kullanici: 'yok' },
    'Kontrol Şefi':      { ...hepsi('goruntule'), metraj: 'duzenle', kalite: 'onayla',
                           hakedis: 'duzenle', kullanici: 'yok' },
    'Satın Alma':        { ...hepsi('goruntule'), stok: 'onayla', tedarik: 'onayla',
                           personel: 'yok', kullanici: 'yok' },
    'Taşeron':           { ozet: 'goruntule', paftalar: 'goruntule', metraj: 'goruntule',
                           isler: 'goruntule', taseron: 'yok', personel: 'goruntule',
                           kalite: 'duzenle', hakedis: 'duzenle', stok: 'yok',
                           tedarik: 'yok', rapor: 'goruntule', kullanici: 'yok' },
    'İzleyici':          { ...hepsi('goruntule'), kullanici: 'yok' }
  };

  /* --------------------------------------------------------------- şifre */
  const enc = new TextEncoder();

  function saltUret() {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  /* PBKDF2-SHA256, 120k tur. Sifre asla duz metin saklanmaz. */
  async function hashla(sifre, salt) {
    const anahtar = await crypto.subtle.importKey('raw', enc.encode(sifre), 'PBKDF2', false, ['deriveBits']);
    const bit = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' },
      anahtar, 256);
    return [...new Uint8Array(bit)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  const dogrula = async (sifre, kayit) =>
    !!kayit.sifreHash && (await hashla(sifre, kayit.salt)) === kayit.sifreHash;

  async function sifreAta(sifre) {
    const salt = saltUret();
    return { salt, sifreHash: await hashla(sifre, salt) };
  }

  /* -------------------------------------------------------------- oturum */
  let aktif = null;

  function oturumOku() {
    try {
      const o = JSON.parse(localStorage.getItem(OTURUM) || 'null');
      if (!o || Date.now() - o.zaman > SURE) return null;
      return o;
    } catch (e) { return null; }
  }

  function oturumAc(kullanici) {
    aktif = kullanici;
    localStorage.setItem(OTURUM, JSON.stringify({ id: kullanici._id, zaman: Date.now() }));
  }

  function oturumKapat() {
    aktif = null;
    localStorage.removeItem(OTURUM);
  }

  /* Kayitli oturumu depodaki kullaniciyla eslestirir */
  function oturumYukle(kullanicilar) {
    const o = oturumOku();
    if (!o) { aktif = null; return null; }
    const k = kullanicilar.find((x) => x._id === o.id && x.durum === 'Aktif');
    aktif = k || null;
    if (!k) localStorage.removeItem(OTURUM);
    return aktif;
  }

  const kullanici = () => aktif;

  /* ------------------------------------------------------------- izinler */
  function izinler(k) {
    const taban = ROLLER[(k || aktif || {}).rol] || {};
    const ozel = ((k || aktif || {}).izinler) || {};
    return { ...hepsi('yok'), ...taban, ...ozel };
  }

  function seviye(modul, k) { return izinler(k)[modul] || 'yok'; }

  /* Verilen modulde en az istenen seviyede yetki var mi */
  function var_(modul, gereken, k) {
    return SEVIYE.indexOf(seviye(modul, k)) >= SEVIYE.indexOf(gereken || 'goruntule');
  }

  const gorunurModuller = (k) => MODULLER.filter((m) => var_(m.id, 'goruntule', k));

  return { MODULLER, SEVIYE, SEVIYE_ADI, ROLLER,
           saltUret, hashla, dogrula, sifreAta,
           oturumAc, oturumKapat, oturumYukle, oturumOku, kullanici,
           izinler, seviye, var: var_, gorunurModuller };
})();
