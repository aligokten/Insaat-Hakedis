/* Kalici veri katmani.
   Tum kayitlar tarayicinin localStorage'inda saklanir; ilk acilista
   data.js icindeki ornek veri tohum olarak yazilir. */
window.Store = (function () {
  const KEY = 'insaat-hakedis:v1';
  const KOLEKSIYONLAR = ['projeler', 'paftalar', 'metraj', 'taseronlar',
                         'kaliteKontrol', 'hakedisler', 'stok', 'siparisler', 'raporlar'];

  let db = null;
  const aboneler = [];

  function uid(onek) {
    return (onek || 'K') + '-' + Date.now().toString(36).slice(-5).toUpperCase() +
           Math.random().toString(36).slice(2, 5).toUpperCase();
  }

  function tohum() {
    const veri = { _v: 1, yetkiler: {} };
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
        if (c && c._v === 1) return c;
      }
    } catch (e) { /* bozuk kayit: tohumla devam */ }
    return tohum();
  }

  function kaydet() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Kayit basarisiz:', e);
      if (window.UI) window.UI.toast('Tarayici depolama alani dolu, kayit yapilamadi.');
      return false;
    }
    return true;
  }

  function bildir(olay) {
    aboneler.forEach((fn) => { try { fn(olay); } catch (e) { console.error(e); } });
  }

  /* ------------------------------------------------------------------ API */

  function get(koleksiyon) {
    if (!db) db = yukle();
    return db[koleksiyon] || [];
  }

  function bul(koleksiyon, id) {
    return get(koleksiyon).find((x) => x._id === id) || null;
  }

  function ekle(koleksiyon, kayit) {
    const yeni = { ...kayit, _id: kayit._id || uid(koleksiyon.slice(0, 3).toUpperCase()) };
    get(koleksiyon).unshift(yeni);
    kaydet(); bildir({ tur: 'ekle', koleksiyon, kayit: yeni });
    return yeni;
  }

  function guncelle(koleksiyon, id, yama) {
    const kayit = bul(koleksiyon, id);
    if (!kayit) return null;
    Object.assign(kayit, yama);
    kaydet(); bildir({ tur: 'guncelle', koleksiyon, kayit });
    return kayit;
  }

  function sil(koleksiyon, id) {
    const liste = get(koleksiyon);
    const i = liste.findIndex((x) => x._id === id);
    if (i < 0) return false;
    const [kayit] = liste.splice(i, 1);
    kaydet(); bildir({ tur: 'sil', koleksiyon, kayit });
    return true;
  }

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
    kaydet(); bildir({ tur: 'yetki', taseronId, anahtar, acik: i === -1 });
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
    gelen._v = 1;
    gelen.yetkiler = gelen.yetkiler || {};
    KOLEKSIYONLAR.forEach((k) => { if (!Array.isArray(gelen[k])) gelen[k] = []; });
    db = gelen; kaydet(); bildir({ tur: 'iceAktar' });
  }

  return { get, bul, ekle, guncelle, sil, yetkiler, yetkiDegistir,
           abone, sifirla, disaAktar, iceAktar, uid, KOLEKSIYONLAR };
})();
