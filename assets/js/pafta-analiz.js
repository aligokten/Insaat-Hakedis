/* Pafta dosyasi cozumleyici.
   DXF : tam ayristirma (katman, varlik, sinir, uzunluk/alan olcumu, vektor onizleme)
   DWG : ikili kapali format; basliktan surum ve GOMULU ONIZLEME goruntusu okunur,
         geometri tarayicida cozulemez -> kullaniciya DXF onerilir.  */
window.PaftaAnaliz = (function () {

  /* ============================================================ yardimci */
  const DWG_SURUM = {
    AC1009: 'AutoCAD R11/R12', AC1012: 'AutoCAD R13', AC1014: 'AutoCAD R14',
    AC1015: 'AutoCAD 2000', AC1018: 'AutoCAD 2004', AC1021: 'AutoCAD 2007',
    AC1024: 'AutoCAD 2010', AC1027: 'AutoCAD 2013', AC1032: 'AutoCAD 2018'
  };

  /* $INSUNITS -> metre carpani */
  const BIRIM_CARPAN = { 1: 0.0254, 2: 0.3048, 4: 0.001, 5: 0.01, 6: 1, 8: 0.0000254, 9: 0.0000254, 10: 0.9144 };
  const BIRIM_ADI = { 0: 'birimsiz', 1: 'inç', 2: 'ft', 4: 'mm', 5: 'cm', 6: 'm', 10: 'yard' };

  const oku = (dosya) => new Promise((coz, red) => {
    const r = new FileReader();
    r.onload = () => coz(r.result);
    r.onerror = () => red(r.error);
    r.readAsArrayBuffer(dosya);
  });

  /* ======================================================== DWG onizleme */
  /* DWG basligi: 0x00 surum kodu (6 bayt), 0x0D onizleme bolumu adresi (uint32 LE).
     Bolum: 16 bayt sentinel, uint32 genel boyut, 1 bayt girdi sayisi,
     her girdi: kod(1) + baslangic(4) + boyut(4).  kod 2 = BMP, 6 = PNG. */
  function dwgCozumle(tampon) {
    const gorunum = new DataView(tampon);
    const bayt = new Uint8Array(tampon);
    const surumKodu = String.fromCharCode.apply(null, bayt.subarray(0, 6));
    const sonuc = {
      format: 'DWG',
      surum: DWG_SURUM[surumKodu] || surumKodu,
      surumKodu,
      onizleme: null,
      cozulebilir: false,
      not: 'DWG ikili ve kapalı bir formattır; geometrisi tarayıcıda okunamaz. ' +
           'Katman ve metraj çıkarımı için aynı çizimin DXF sürümünü yükleyin.'
    };
    if (tampon.byteLength < 0x20) return sonuc;

    try {
      const adres = gorunum.getUint32(0x0D, true);
      if (!adres || adres + 21 > tampon.byteLength) return sonuc;

      let p = adres + 16;                       // sentinel atlanir
      p += 4;                                   // genel boyut
      const girdiSayisi = gorunum.getUint8(p); p += 1;
      if (girdiSayisi > 16) return sonuc;

      for (let i = 0; i < girdiSayisi; i++) {
        const kod = gorunum.getUint8(p);
        const bas = gorunum.getUint32(p + 1, true);
        const boy = gorunum.getUint32(p + 5, true);
        p += 9;
        if (!boy || bas + boy > tampon.byteLength) continue;
        const veri = bayt.subarray(bas, bas + boy);
        if (kod === 6) {                        // PNG dogrudan
          sonuc.onizleme = { tur: 'png', blob: new Blob([veri], { type: 'image/png' }) };
          break;
        }
        if (kod === 2) {                        // BMP: dosya basligi yeniden kurulur
          sonuc.onizleme = { tur: 'bmp', blob: bmpBlob(veri) };
          break;
        }
      }
    } catch (e) { /* bozuk baslik: onizleme yok */ }
    return sonuc;
  }

  /* DWG icinde BMP, 14 baytlik dosya basligi olmadan (DIB olarak) saklanir */
  function bmpBlob(dib) {
    const g = new DataView(dib.buffer, dib.byteOffset, dib.byteLength);
    const basSize = g.getUint32(0, true);
    const bitSayisi = g.getUint16(14, true);
    let paletBayt = 0;
    if (bitSayisi <= 8) {
      const kullanilan = g.getUint32(32, true);
      paletBayt = (kullanilan || (1 << bitSayisi)) * 4;
    }
    const baslik = new Uint8Array(14);
    const bg = new DataView(baslik.buffer);
    baslik[0] = 0x42; baslik[1] = 0x4D;                       // 'BM'
    bg.setUint32(2, 14 + dib.byteLength, true);               // dosya boyutu
    bg.setUint32(10, 14 + basSize + paletBayt, true);         // piksel verisi ofseti
    return new Blob([baslik, dib], { type: 'image/bmp' });
  }

  /* ============================================================ DXF ayristirma */
  function dxfCiftleri(metin) {
    const satirlar = metin.split(/\r\n|\r|\n/);
    const cift = [];
    for (let i = 0; i + 1 < satirlar.length; i += 2) {
      const kod = parseInt(satirlar[i].trim(), 10);
      if (Number.isNaN(kod)) continue;
      cift.push([kod, satirlar[i + 1].trim()]);
    }
    return cift;
  }

  function dxfCozumle(metin) {
    const cift = dxfCiftleri(metin);
    const sonuc = {
      format: 'DXF', cozulebilir: true, surum: '', onizleme: null,
      katmanlar: [], varliklar: {}, sinir: null, birimKodu: 0, birimAdi: '',
      olcek: 1, cizim: [], not: ''
    };
    if (!cift.length) { sonuc.cozulebilir = false; sonuc.not = 'Dosya DXF metin yapısında değil.'; return sonuc; }

    const katmanSet = new Map();     // ad -> {ad, renk, uzunluk, alan, adet}
    const katmanAl = (ad) => {
      if (!katmanSet.has(ad)) katmanSet.set(ad, { ad, renk: 7, uzunluk: 0, alan: 0, adet: 0 });
      return katmanSet.get(ad);
    };

    let bolum = '', altTur = '', extMin = null, extMax = null;
    let v = null;                     // isle­nen varlik
    const varliklar = [];

    /* TABLES icindeki katman tanimlari varlik sayimina girmez */
    const varligiKapat = () => {
      if (v && v.tur && v.tur !== 'LAYER' && Array.isArray(v.nokta)) varliklar.push(v);
      v = null;
    };

    for (let i = 0; i < cift.length; i++) {
      const [kod, deg] = cift[i];

      if (kod === 0) {
        if (deg === 'SECTION') { varligiKapat(); bolum = (cift[i + 1] || [])[1] || ''; continue; }
        if (deg === 'ENDSEC') { varligiKapat(); bolum = ''; continue; }
        if (deg === 'EOF') break;

        if (bolum === 'TABLES') { altTur = deg; if (deg === 'LAYER') v = { tur: 'LAYER' }; continue; }

        if (bolum === 'ENTITIES' || bolum === 'BLOCKS') {
          varligiKapat();
          v = { tur: deg, katman: '0', nokta: [], bolum };
          continue;
        }
        continue;
      }

      /* --- HEADER --- */
      if (bolum === 'HEADER') {
        if (kod === 9) { altTur = deg; continue; }
        if (altTur === '$ACADVER' && kod === 1) sonuc.surum = DWG_SURUM[deg] || deg;
        if (altTur === '$INSUNITS' && kod === 70) sonuc.birimKodu = parseInt(deg, 10) || 0;
        if (altTur === '$EXTMIN') { extMin = extMin || {}; if (kod === 10) extMin.x = +deg; if (kod === 20) extMin.y = +deg; }
        if (altTur === '$EXTMAX') { extMax = extMax || {}; if (kod === 10) extMax.x = +deg; if (kod === 20) extMax.y = +deg; }
        continue;
      }

      /* --- TABLES: katman tanimlari --- */
      if (bolum === 'TABLES' && v && v.tur === 'LAYER') {
        if (kod === 2) v.ad = deg;
        if (kod === 62) v.renk = Math.abs(parseInt(deg, 10) || 7);
        if (kod === 6 || kod === 70) { /* cizgi tipi / bayrak */ }
        if (v.ad && (kod === 62 || kod === 70)) { const k = katmanAl(v.ad); k.renk = v.renk || 7; }
        continue;
      }

      /* --- ENTITIES --- */
      if (!v) continue;
      if (kod === 8) { v.katman = deg; katmanAl(deg); continue; }
      if (kod === 10) { v.nokta.push({ x: +deg, y: 0 }); continue; }
      if (kod === 20) { const n = v.nokta[v.nokta.length - 1]; if (n) n.y = +deg; continue; }
      if (kod === 11) { v.ikinci = { x: +deg, y: 0 }; continue; }
      if (kod === 21) { if (v.ikinci) v.ikinci.y = +deg; continue; }
      if (kod === 40) { v.r = +deg; continue; }
      if (kod === 50) { v.bas = +deg; continue; }
      if (kod === 51) { v.son = +deg; continue; }
      if (kod === 70) { v.bayrak = parseInt(deg, 10) || 0; continue; }
      if (kod === 1)  { v.metin = deg; continue; }
      if (kod === 2 && v.tur === 'INSERT') { v.blok = deg; continue; }
    }
    varligiKapat();

    /* olcek: cizim birimini metreye cevirir */
    let carpan = BIRIM_CARPAN[sonuc.birimKodu];
    let birimAdi = BIRIM_ADI[sonuc.birimKodu] || 'birimsiz';
    if (!carpan) {                       // birim tanimsiz: sinir buyuklugune gore tahmin
      const genislik = extMin && extMax ? Math.abs(extMax.x - extMin.x) : 0;
      carpan = genislik > 1000 ? 0.001 : (genislik > 100 ? 0.01 : 1);
      birimAdi = (carpan === 0.001 ? 'mm' : carpan === 0.01 ? 'cm' : 'm') + ' (tahmin)';
    }
    sonuc.olcek = carpan;
    sonuc.birimAdi = birimAdi;

    /* olcumler + cizim verisi */
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const genislet = (x, y) => {
      if (!isFinite(x) || !isFinite(y)) return;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    };

    varliklar.forEach((e) => {
      if (e.bolum === 'BLOCKS') return;                 // blok tanimlari olcume katilmaz
      sonuc.varliklar[e.tur] = (sonuc.varliklar[e.tur] || 0) + 1;
      const k = katmanAl(e.katman);
      k.adet++;

      if (e.tur === 'LINE' && e.nokta[0] && e.ikinci) {
        const a = e.nokta[0], b = e.ikinci;
        k.uzunluk += Math.hypot(b.x - a.x, b.y - a.y) * carpan;
        genislet(a.x, a.y); genislet(b.x, b.y);
        sonuc.cizim.push({ t: 'l', p: [a.x, a.y, b.x, b.y], k: e.katman });

      } else if ((e.tur === 'LWPOLYLINE' || e.tur === 'POLYLINE') && e.nokta.length > 1) {
        let uz = 0;
        for (let i = 1; i < e.nokta.length; i++) {
          uz += Math.hypot(e.nokta[i].x - e.nokta[i - 1].x, e.nokta[i].y - e.nokta[i - 1].y);
        }
        const kapali = (e.bayrak & 1) === 1;
        if (kapali && e.nokta.length > 2) {
          const ilk = e.nokta[0], son = e.nokta[e.nokta.length - 1];
          uz += Math.hypot(ilk.x - son.x, ilk.y - son.y);
          k.alan += Math.abs(alanHesapla(e.nokta)) * carpan * carpan;
        }
        k.uzunluk += uz * carpan;
        e.nokta.forEach((n) => genislet(n.x, n.y));
        sonuc.cizim.push({ t: 'p', p: e.nokta.map((n) => [n.x, n.y]), kapali, k: e.katman });

      } else if (e.tur === 'CIRCLE' && e.nokta[0] && e.r) {
        k.uzunluk += 2 * Math.PI * e.r * carpan;
        k.alan += Math.PI * e.r * e.r * carpan * carpan;
        genislet(e.nokta[0].x - e.r, e.nokta[0].y - e.r);
        genislet(e.nokta[0].x + e.r, e.nokta[0].y + e.r);
        sonuc.cizim.push({ t: 'c', p: [e.nokta[0].x, e.nokta[0].y, e.r], k: e.katman });

      } else if (e.tur === 'ARC' && e.nokta[0] && e.r) {
        const yay = ((((e.son - e.bas) % 360) + 360) % 360) * Math.PI / 180;
        k.uzunluk += yay * e.r * carpan;
        genislet(e.nokta[0].x - e.r, e.nokta[0].y - e.r);
        genislet(e.nokta[0].x + e.r, e.nokta[0].y + e.r);
        sonuc.cizim.push({ t: 'a', p: [e.nokta[0].x, e.nokta[0].y, e.r, e.bas || 0, e.son || 0], k: e.katman });

      } else if (e.nokta[0]) {
        genislet(e.nokta[0].x, e.nokta[0].y);
        if (e.tur === 'TEXT' || e.tur === 'MTEXT') {
          sonuc.cizim.push({ t: 'x', p: [e.nokta[0].x, e.nokta[0].y], m: (e.metin || '').slice(0, 40), k: e.katman });
        }
      }
    });

    if (extMin && extMax && isFinite(extMin.x)) {
      sonuc.sinir = { minX: extMin.x, minY: extMin.y, maxX: extMax.x, maxY: extMax.y, kaynak: 'başlık' };
    } else if (isFinite(minX)) {
      sonuc.sinir = { minX, minY, maxX, maxY, kaynak: 'varlıklardan' };
    }

    sonuc.katmanlar = [...katmanSet.values()]
      .filter((k) => k.adet > 0 || k.ad !== '0')
      .sort((a, b) => b.adet - a.adet);
    sonuc.onizleme = { tur: 'vektor', cizim: sonuc.cizim, sinir: sonuc.sinir };
    if (!sonuc.cizim.length) sonuc.not = 'Dosyada çizilebilir geometri bulunamadı.';
    return sonuc;
  }

  /* kapali cokgen alani (shoelace) */
  function alanHesapla(nokta) {
    let a = 0;
    for (let i = 0, j = nokta.length - 1; i < nokta.length; j = i++) {
      a += (nokta[j].x + nokta[i].x) * (nokta[j].y - nokta[i].y);
    }
    return a / 2;
  }

  /* ============================================================ giris noktasi */
  async function cozumle(dosya) {
    const uzanti = (dosya.name.split('.').pop() || '').toLowerCase();
    const tampon = await oku(dosya);
    const bayt = new Uint8Array(tampon);
    const bas = String.fromCharCode.apply(null, bayt.subarray(0, 6));

    let sonuc;
    if (/^AC10\d\d$/.test(bas)) {
      sonuc = dwgCozumle(tampon);
    } else if (uzanti === 'dxf' || /^\s*0\s*[\r\n]+\s*SECTION/.test(
                 new TextDecoder('utf-8', { fatal: false }).decode(bayt.subarray(0, 64)))) {
      sonuc = dxfCozumle(new TextDecoder('utf-8', { fatal: false }).decode(bayt));
    } else if (uzanti === 'pdf' || bas.startsWith('%PDF')) {
      sonuc = { format: 'PDF', cozulebilir: false, onizleme: null,
                not: 'PDF dosyası saklandı. Metraj çıkarımı için DXF yükleyin.' };
    } else {
      sonuc = { format: uzanti.toUpperCase() || 'Bilinmiyor', cozulebilir: false, onizleme: null,
                not: 'Dosya türü tanınamadı; içerik olduğu gibi saklandı.' };
    }

    sonuc.ad = dosya.name;
    sonuc.bayt = dosya.size;
    sonuc.katmanlar = sonuc.katmanlar || [];
    sonuc.varliklar = sonuc.varliklar || {};
    return sonuc;
  }

  /* ============================================================ cizim */
  /* Ayristirilan DXF geometrisini canvas'a olceklenerek cizer. */
  function ciz(canvas, cizim, sinir, secilenKatman) {
    const c = canvas.getContext('2d');
    const G = canvas.width, Y = canvas.height;
    c.clearRect(0, 0, G, Y);
    if (!cizim || !cizim.length || !sinir) return false;

    const gen = (sinir.maxX - sinir.minX) || 1;
    const yuk = (sinir.maxY - sinir.minY) || 1;
    const kenar = 12;
    const olcek = Math.min((G - kenar * 2) / gen, (Y - kenar * 2) / yuk);
    const ox = (G - gen * olcek) / 2 - sinir.minX * olcek;
    const oy = (Y - yuk * olcek) / 2 + sinir.maxY * olcek;
    const X = (x) => x * olcek + ox;
    const D = (y) => oy - y * olcek;      // DXF y yukari, canvas y asagi

    c.lineWidth = 1;
    c.lineJoin = 'round';
    cizim.forEach((e) => {
      const vurgu = secilenKatman && e.k === secilenKatman;
      c.strokeStyle = vurgu ? '#f0421c' : 'rgba(23,22,26,.55)';
      c.lineWidth = vurgu ? 1.6 : 0.9;
      c.beginPath();
      if (e.t === 'l') {
        c.moveTo(X(e.p[0]), D(e.p[1])); c.lineTo(X(e.p[2]), D(e.p[3]));
      } else if (e.t === 'p') {
        e.p.forEach((n, i) => (i ? c.lineTo(X(n[0]), D(n[1])) : c.moveTo(X(n[0]), D(n[1]))));
        if (e.kapali) c.closePath();
      } else if (e.t === 'c') {
        c.arc(X(e.p[0]), D(e.p[1]), Math.abs(e.p[2] * olcek), 0, Math.PI * 2);
      } else if (e.t === 'a') {
        c.arc(X(e.p[0]), D(e.p[1]), Math.abs(e.p[2] * olcek),
              -e.p[4] * Math.PI / 180, -e.p[3] * Math.PI / 180);
      } else if (e.t === 'x') {
        c.fillStyle = vurgu ? '#f0421c' : 'rgba(23,22,26,.5)';
        c.font = '9px Inter, sans-serif';
        c.fillText(e.m, X(e.p[0]), D(e.p[1]));
      }
      c.stroke();
    });
    return true;
  }

  return { cozumle, ciz, dxfCozumle, dwgCozumle };
})();
