/* Tablo bicimli belgeleri (CSV, TSV, XLSX) tarayicida okur.
   XLSX bir ZIP arsividir; ZIP dizini elle cozulur ve icerik
   DecompressionStream('deflate-raw') ile acilir - harici kutuphane yoktur. */
window.TabloOku = (function () {

  /* ============================================================ CSV / TSV */
  /* Tirnak icindeki ayraci ve satir sonunu dogru ele alan ayristirici */
  function csvAyristir(metin, ayrac) {
    const satirlar = [];
    let satir = [], hucre = '', tirnak = false;

    for (let i = 0; i < metin.length; i++) {
      const k = metin[i];
      if (tirnak) {
        if (k === '"') {
          if (metin[i + 1] === '"') { hucre += '"'; i++; }
          else tirnak = false;
        } else hucre += k;
        continue;
      }
      if (k === '"') { tirnak = true; continue; }
      if (k === ayrac) { satir.push(hucre); hucre = ''; continue; }
      if (k === '\n' || k === '\r') {
        if (k === '\r' && metin[i + 1] === '\n') i++;
        satir.push(hucre); satirlar.push(satir);
        satir = []; hucre = '';
        continue;
      }
      hucre += k;
    }
    if (hucre !== '' || satir.length) { satir.push(hucre); satirlar.push(satir); }
    return satirlar.filter((s) => s.some((h) => String(h).trim() !== ''));
  }

  /* Ilk satirlarda en tutarli ayraci secer */
  function ayracTahmin(metin) {
    const ornek = metin.split(/\r?\n/).slice(0, 8).join('\n');
    const adaylar = [';', ',', '\t', '|'];
    let en_iyi = ';', en_cok = 0;
    adaylar.forEach((a) => {
      const n = (ornek.match(new RegExp('\\' + a, 'g')) || []).length;
      if (n > en_cok) { en_cok = n; en_iyi = a; }
    });
    return en_iyi;
  }

  /* ================================================================ XLSX */
  const dv = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);

  async function sisirmeAc(bayt, yontem) {
    if (yontem === 0) return bayt;                       // saklanmis
    if (yontem !== 8) throw new Error('Desteklenmeyen sıkıştırma yöntemi: ' + yontem);
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Bu tarayıcı XLSX açmayı desteklemiyor; dosyayı CSV olarak kaydedin.');
    }
    const akis = new Blob([bayt]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(akis).arrayBuffer());
  }

  /* ZIP merkezi dizinini okuyup dosyalari cozer */
  async function zipAc(tampon) {
    const b = new Uint8Array(tampon);
    const g = dv(b);
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) {
      if (g.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Dosya geçerli bir XLSX (ZIP) değil.');

    const girdiSayisi = g.getUint16(eocd + 10, true);
    let p = g.getUint32(eocd + 16, true);
    const dosyalar = {};
    const cozucu = new TextDecoder('utf-8');

    for (let i = 0; i < girdiSayisi; i++) {
      if (g.getUint32(p, true) !== 0x02014b50) break;
      const yontem = g.getUint16(p + 10, true);
      const sikBoyut = g.getUint32(p + 20, true);
      const adUz = g.getUint16(p + 28, true);
      const ekUz = g.getUint16(p + 30, true);
      const yorumUz = g.getUint16(p + 32, true);
      const yerelOfs = g.getUint32(p + 42, true);
      const ad = cozucu.decode(b.subarray(p + 46, p + 46 + adUz));
      p += 46 + adUz + ekUz + yorumUz;

      /* yerel baslikta ad ve ek alan uzunluklari yeniden okunur */
      const yAdUz = g.getUint16(yerelOfs + 26, true);
      const yEkUz = g.getUint16(yerelOfs + 28, true);
      const veriBas = yerelOfs + 30 + yAdUz + yEkUz;
      dosyalar[ad] = { yontem, veri: b.subarray(veriBas, veriBas + sikBoyut) };
    }

    return {
      async metin(ad) {
        const d = dosyalar[ad];
        if (!d) return null;
        return cozucu.decode(await sisirmeAc(d.veri, d.yontem));
      },
      adlar: () => Object.keys(dosyalar)
    };
  }

  const sutunIndeksi = (ref) => {
    const harf = (ref.match(/^[A-Z]+/) || ['A'])[0];
    let n = 0;
    for (const k of harf) n = n * 26 + (k.charCodeAt(0) - 64);
    return n - 1;
  };

  function xmlEtiketler(xml, etiket) {
    const re = new RegExp('<' + etiket + '(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</' + etiket + '>)', 'g');
    const out = [];
    let m;
    while ((m = re.exec(xml))) out.push({ tam: m[0], ic: m[1] || '' });
    return out;
  }

  const xmlCoz = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

  async function xlsxOku(tampon) {
    const zip = await zipAc(tampon);

    /* paylasilan metin tablosu */
    const paylasilanXml = await zip.metin('xl/sharedStrings.xml');
    const paylasilan = paylasilanXml
      ? xmlEtiketler(paylasilanXml, 'si').map((si) =>
          xmlEtiketler(si.ic, 't').map((t) => xmlCoz(t.ic)).join(''))
      : [];

    /* ilk sayfa */
    const sayfaAdi = zip.adlar().find((a) => /^xl\/worksheets\/sheet\d+\.xml$/.test(a));
    if (!sayfaAdi) throw new Error('Çalışma sayfası bulunamadı.');
    const sayfa = await zip.metin(sayfaAdi);

    const satirlar = [];
    xmlEtiketler(sayfa, 'row').forEach((r) => {
      const hucreler = [];
      xmlEtiketler(r.ic, 'c').forEach((c) => {
        const refM = c.tam.match(/r="([A-Z]+\d+)"/);
        const i = refM ? sutunIndeksi(refM[1]) : hucreler.length;
        const tur = (c.tam.match(/t="([^"]+)"/) || [])[1];
        let deger = '';
        if (tur === 's') {
          const v = xmlEtiketler(c.ic, 'v')[0];
          deger = v ? (paylasilan[Number(v.ic)] || '') : '';
        } else if (tur === 'inlineStr') {
          deger = xmlEtiketler(c.ic, 't').map((t) => xmlCoz(t.ic)).join('');
        } else {
          const v = xmlEtiketler(c.ic, 'v')[0];
          deger = v ? xmlCoz(v.ic) : '';
        }
        while (hucreler.length < i) hucreler.push('');
        hucreler[i] = deger;
      });
      satirlar.push(hucreler);
    });
    return satirlar.filter((s) => s.some((h) => String(h).trim() !== ''));
  }

  /* ============================================================== giriş */
  /* Dosyayi okur; {basliklar, satirlar, format} dondurur */
  async function oku(dosya) {
    const uzanti = (dosya.name.split('.').pop() || '').toLowerCase();
    let hucreler, format;

    if (uzanti === 'xlsx' || uzanti === 'xlsm') {
      hucreler = await xlsxOku(await dosya.arrayBuffer());
      format = 'XLSX';
    } else if (uzanti === 'csv' || uzanti === 'tsv' || uzanti === 'txt') {
      let metin = await dosya.text();
      if (metin.charCodeAt(0) === 0xfeff) metin = metin.slice(1);   // BOM
      hucreler = csvAyristir(metin, uzanti === 'tsv' ? '\t' : ayracTahmin(metin));
      format = uzanti.toUpperCase();
    } else if (uzanti === 'xls') {
      throw new Error('Eski XLS biçimi okunamıyor. Dosyayı XLSX ya da CSV olarak kaydedin.');
    } else {
      throw new Error('Bu dosya türünden tablo okunamıyor (CSV, TSV veya XLSX kullanın).');
    }

    if (!hucreler.length) throw new Error('Dosyada okunabilir satır yok.');

    /* ilk dolu satir baslik kabul edilir */
    const basliklar = hucreler[0].map((h, i) => String(h).trim() || 'Sütun ' + (i + 1));
    const satirlar = hucreler.slice(1);
    return { basliklar, satirlar, format };
  }

  /* Turkce ondalik ayraci ve bin ayracini sayiya cevirir */
  function sayi(deger) {
    if (typeof deger === 'number') return deger;
    let s = String(deger || '').trim().replace(/[^\d.,\-]/g, '');
    if (!s) return 0;
    const sonVirgul = s.lastIndexOf(','), sonNokta = s.lastIndexOf('.');
    if (sonVirgul > sonNokta) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  return { oku, sayi, csvAyristir };
})();
