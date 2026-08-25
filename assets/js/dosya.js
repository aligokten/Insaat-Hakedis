/* Pafta dosyalarinin ikili icerigini IndexedDB'de saklar.
   localStorage yalnizca ustveri tutar; dosyanin kendisi buradadir. */
window.Dosya = (function () {
  const AD = 'insaat-hakedis-dosya';
  const DEPO = 'paftalar';
  let dbSoz = null;

  function ac() {
    if (dbSoz) return dbSoz;
    dbSoz = new Promise((coz, red) => {
      if (!('indexedDB' in window)) { red(new Error('Bu tarayıcı IndexedDB desteklemiyor.')); return; }
      const istek = indexedDB.open(AD, 1);
      istek.onupgradeneeded = () => {
        const db = istek.result;
        if (!db.objectStoreNames.contains(DEPO)) db.createObjectStore(DEPO, { keyPath: 'id' });
      };
      istek.onsuccess = () => coz(istek.result);
      istek.onerror = () => red(istek.error);
    });
    return dbSoz;
  }

  function islem(mod, isleyici) {
    return ac().then((db) => new Promise((coz, red) => {
      const t = db.transaction(DEPO, mod);
      const istek = isleyici(t.objectStore(DEPO));
      t.oncomplete = () => coz(istek ? istek.result : undefined);
      t.onerror = () => red(t.error);
      t.onabort = () => red(t.error || new Error('İşlem iptal edildi.'));
    }));
  }

  const yaz  = (id, blob, ad) => islem('readwrite', (d) => d.put({ id, blob, ad, tarih: Date.now() }));
  const oku  = (id) => islem('readonly',  (d) => d.get(id));
  const sil  = (id) => islem('readwrite', (d) => d.delete(id));
  const hepsi = () => islem('readonly',   (d) => d.getAll());

  /* Tarayicinin ayirdigi ve kullanilan depolama alani */
  async function kota() {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    return { kullanilan: usage || 0, toplam: quota || 0 };
  }

  function indir(id, adi) {
    return oku(id).then((kayit) => {
      if (!kayit) throw new Error('Dosya bulunamadı.');
      const url = URL.createObjectURL(kayit.blob);
      const a = document.createElement('a');
      a.href = url; a.download = adi || kayit.ad || 'pafta';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  return { yaz, oku, sil, hepsi, kota, indir };
})();
