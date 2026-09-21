/* Otomatik kesif motoru.
   Girdi : mimari ruhsat projesinden okunan / elle girilen bina parametreleri
   Cikti : poz bazli detayli metraj listesi + maliyet icmali

   Tum miktarlar acik formullerle uretilir; her kalem hangi formulden ciktigini
   "formul" alaninda tasir, boylece kesif elle denetlenebilir.
   Birim fiyatlar ve oranlar VARSAYILAN degerlerdir: yururlukteki birim fiyat
   kitabi ve piyasa kosullarina gore ekrandan guncellenmelidir. */
window.Kesif = (function () {

  /* ===================================================== poz kutuphanesi */
  const KATEGORILER = [
    'Toprak İşleri', 'Betonarme', 'Duvar ve Yalıtım', 'Çatı',
    'İnce Yapı', 'Doğrama', 'Tesisat', 'Çevre ve Diğer'
  ];

  /* grup: kaba | ince | tesisat | cevre  (maliyet dagilimi icin) */
  const POZLAR = [
    { poz: '15.140.1002', ad: 'Makine ile yumuşak-sert toprak kazısı', birim: 'm³', fiyat: 260,
      kategori: 'Toprak İşleri', grup: 'kaba' },
    { poz: '15.120.1002', ad: 'Temel tabanı el ile tesviye ve sıkıştırma', birim: 'm²', fiyat: 90,
      kategori: 'Toprak İşleri', grup: 'kaba' },
    { poz: '15.160.1004', ad: 'Kazı fazlası malzemenin yüklenip taşınması', birim: 'm³', fiyat: 320,
      kategori: 'Toprak İşleri', grup: 'kaba' },
    { poz: '15.150.1003', ad: 'Temel çevresi dolgu ve sıkıştırma', birim: 'm³', fiyat: 480,
      kategori: 'Toprak İşleri', grup: 'kaba' },

    { poz: '16.050.1003', ad: 'C16/20 grobeton (temel altı)', birim: 'm³', fiyat: 3100,
      kategori: 'Betonarme', grup: 'kaba' },
    { poz: '16.058.1005', ad: 'C30/37 hazır beton — temel / radye', birim: 'm³', fiyat: 3900,
      kategori: 'Betonarme', grup: 'kaba' },
    { poz: '16.058.1006', ad: 'C30/37 hazır beton — kolon, perde, kiriş, döşeme', birim: 'm³', fiyat: 3950,
      kategori: 'Betonarme', grup: 'kaba' },
    { poz: '21.011.1001', ad: 'Düz yüzeyli betonarme kalıbı', birim: 'm²', fiyat: 620,
      kategori: 'Betonarme', grup: 'kaba' },
    { poz: '23.015.1002', ad: 'B420C nervürlü betonarme çeliği (kesme, bükme, yerine koyma)', birim: 'ton', fiyat: 32000,
      kategori: 'Betonarme', grup: 'kaba' },
    { poz: '18.461.1001', ad: 'Temel ve perde su yalıtımı (çift kat membran)', birim: 'm²', fiyat: 600,
      kategori: 'Betonarme', grup: 'kaba' },
    { poz: '19.055.1002', ad: 'Perde dışı XPS ısı yalıtımı + drenaj levhası', birim: 'm²', fiyat: 520,
      kategori: 'Betonarme', grup: 'kaba' },

    { poz: '18.071.1003', ad: 'Yatay delikli tuğla ile 19 cm dış duvar', birim: 'm²', fiyat: 950,
      kategori: 'Duvar ve Yalıtım', grup: 'kaba' },
    { poz: '18.071.1001', ad: 'Yatay delikli tuğla ile 8,5 cm iç bölme duvar', birim: 'm²', fiyat: 700,
      kategori: 'Duvar ve Yalıtım', grup: 'kaba' },
    { poz: '16.058.1008', ad: 'Kapı-pencere lentosu ve duvar hatılı', birim: 'mtül', fiyat: 700,
      kategori: 'Duvar ve Yalıtım', grup: 'kaba' },
    { poz: '19.100.1005', ad: 'Dış cephe ısı yalıtım sistemi (mantolama, 5 cm EPS)', birim: 'm²', fiyat: 1150,
      kategori: 'Duvar ve Yalıtım', grup: 'ince' },

    { poz: '21.060.1002', ad: 'Ahşap oturtma çatı ve kiremit örtü', birim: 'm²', fiyat: 1900,
      kategori: 'Çatı', grup: 'kaba' },
    { poz: '18.465.1004', ad: 'Teras çatı su + ısı yalıtımı ve koruma betonu', birim: 'm²', fiyat: 1450,
      kategori: 'Çatı', grup: 'kaba' },
    { poz: '25.015.1001', ad: 'Çatı oluk, iniş borusu ve saçak kaplaması', birim: 'mtül', fiyat: 620,
      kategori: 'Çatı', grup: 'kaba' },

    { poz: '27.525.1002', ad: 'İç cephe alçı sıva (kara + saten)', birim: 'm²', fiyat: 320,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '25.116.1003', ad: 'Su bazlı iç cephe boyası (astar + 2 kat)', birim: 'm²', fiyat: 210,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '25.120.1004', ad: 'Dış cephe kaplama boyası', birim: 'm²', fiyat: 280,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '26.005.1002', ad: 'Tesviye şapı (ortalama 5 cm)', birim: 'm²', fiyat: 380,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '26.621.1003', ad: 'Islak hacim zemin seramiği (1. sınıf)', birim: 'm²', fiyat: 900,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '26.621.1005', ad: 'Islak hacim duvar seramiği (tavana kadar)', birim: 'm²', fiyat: 950,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '26.700.1002', ad: 'Laminat parke ve şilte', birim: 'm²', fiyat: 750,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '26.701.1001', ad: 'Süpürgelik', birim: 'mtül', fiyat: 120,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '27.581.1002', ad: 'Alçıpan asma tavan (ıslak hacim ve hol)', birim: 'm²', fiyat: 850,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '26.351.1002', ad: 'Mermer merdiven basamağı ve rıhtı', birim: 'mtül', fiyat: 1400,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '24.240.1003', ad: 'Merdiven ve balkon korkuluğu', birim: 'mtül', fiyat: 2200,
      kategori: 'İnce Yapı', grup: 'ince' },
    { poz: '18.480.1001', ad: 'Islak hacim zemin ve duvar su yalıtımı', birim: 'm²', fiyat: 420,
      kategori: 'İnce Yapı', grup: 'ince' },

    { poz: '24.010.1002', ad: 'Ahşap iç kapı (kasa + kanat + aksesuar)', birim: 'adet', fiyat: 9500,
      kategori: 'Doğrama', grup: 'ince' },
    { poz: '24.011.1001', ad: 'Daire giriş çelik kapısı', birim: 'adet', fiyat: 18000,
      kategori: 'Doğrama', grup: 'ince' },
    { poz: '24.100.1004', ad: 'PVC doğrama + ısıcam (montaj dahil)', birim: 'm²', fiyat: 3200,
      kategori: 'Doğrama', grup: 'ince' },
    { poz: '26.320.1002', ad: 'Pencere denizliği ve mermer eşik', birim: 'mtül', fiyat: 850,
      kategori: 'Doğrama', grup: 'ince' },

    { poz: '33.100.1001', ad: 'Elektrik tesisatı (pano, kablo, anahtar-priz, aydınlatma)', birim: 'm²', fiyat: 950,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '32.100.1001', ad: 'Sıhhi tesisat (temiz-pis su boru ve ekipman)', birim: 'm²', fiyat: 850,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '32.300.1002', ad: 'Isıtma tesisatı (kazan/kombi, radyatör, boru)', birim: 'm²', fiyat: 900,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '32.150.1003', ad: 'Vitrifiye, armatür ve banyo aksesuar takımı', birim: 'takım', fiyat: 35000,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '32.400.1001', ad: 'Doğalgaz iç tesisatı', birim: 'adet', fiyat: 22000,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '33.400.1002', ad: 'Yangın algılama ve söndürme tesisatı', birim: 'm²', fiyat: 180,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '33.600.1001', ad: 'Asansör (makine dairesiz, 6 kişilik)', birim: 'adet', fiyat: 95000,
      kategori: 'Tesisat', grup: 'tesisat' },
    { poz: '26.900.1001', ad: 'Mutfak tezgâhı ve dolabı', birim: 'mtül', fiyat: 7500,
      kategori: 'İnce Yapı', grup: 'ince' },

    { poz: '15.500.1002', ad: 'Bahçe / istinat duvarı', birim: 'mtül', fiyat: 2800,
      kategori: 'Çevre ve Diğer', grup: 'cevre' },
    { poz: '16.059.1001', ad: 'Saha betonu ve çevre tretuvarı', birim: 'm²', fiyat: 700,
      kategori: 'Çevre ve Diğer', grup: 'cevre' },
    { poz: '15.550.1003', ad: 'Çevre düzenlemesi ve peyzaj', birim: 'm²', fiyat: 550,
      kategori: 'Çevre ve Diğer', grup: 'cevre' },
    { poz: '15.001.1001', ad: 'Şantiye kurulumu, iksa ve güvenlik önlemleri', birim: 'm²', fiyat: 140,
      kategori: 'Çevre ve Diğer', grup: 'cevre' }
  ];

  const pozBul = (poz) => POZLAR.find((p) => p.poz === poz) || null;

  /* ================================================ varsayilan parametre */
  const VARSAYILAN = {
    proje: '', paftaId: '', paftaAd: '',
    sistem: 'Betonarme karkas',
    temel: 'Radye temel',
    catiTipi: 'Kırma çatı',

    tabanAlani: 0,          // m²  — bir katın brüt oturum alanı
    bodrumKat: 0, zeminKat: 1, normalKat: 0,
    katYuksekligi: 3,       // m   — brüt kat yüksekliği
    dosemeKalinligi: 0.15,  // m
    binaCevresi: 0,         // m   — dış duvar çevre uzunluğu
    disDuvarUzunluk: 0,     // m   — bir kattaki dış duvar uzunluğu
    icDuvarUzunluk: 0,      // m   — bir kattaki iç duvar uzunluğu
    pencereAlani: 0,        // m²  — bina genelinde toplam pencere alanı
    pencereAdet: 0,
    icKapiAdet: 0,
    disKapiAdet: 0,
    islakHacimAlani: 0,     // m²  — bina genelinde ıslak hacim zemin alanı
    daireAdet: 1,
    merdivenKolu: 0,        // mtül — toplam basamak uzunluğu
    kaziDerinligi: 1.5,     // m
    radyeKalinlik: 0.6,     // m
    asansorAdet: 0,
    arsaAlani: 0,           // m²  — çevre düzenlemesi için

    oranlar: {
      betonOrani: 0.32,     // m³ beton / m² inşaat (kolon+perde+kiriş+döşeme)
      kalipOrani: 7.5,      // m² kalıp / m³ üst yapı betonu
      donatiTemel: 90,      // kg/m³
      donatiUst: 130,       // kg/m³
      sevKatsayisi: 0.5,    // kazı şev eğimi (yatay/düşey)
      calismaPayi: 1,       // m — temel çevresi çalışma şeridi
      kabarma: 1.25,        // nakliyede kabarma katsayısı
      dolguOrani: 0.2,      // kazının dolguya dönen oranı
      kullanimOrani: 0.85,  // brüt alandan net kullanım alanına
      tavanOrani: 0.9       // sıva/boya yapılan tavan oranı
    },
    giderler: {
      genelGider: 8,        // % — şantiye genel giderleri
      muteahhitKari: 12,    // %
      beklenmeyen: 5,       // %
      kdv: 20               // %
    },
    fiyat: {},              // poz -> kullanıcının girdiği birim fiyat
    kapali: {}              // poz -> true ise kalem kesife alınmaz
  };

  const kopya = (o) => JSON.parse(JSON.stringify(o));

  /* Eksik alanlari varsayilanla tamamlar (eski kayitlar icin) */
  function tamamla(girdi) {
    const g = { ...kopya(VARSAYILAN), ...(girdi || {}) };
    g.oranlar = { ...VARSAYILAN.oranlar, ...((girdi || {}).oranlar || {}) };
    g.giderler = { ...VARSAYILAN.giderler, ...((girdi || {}).giderler || {}) };
    g.fiyat = { ...((girdi || {}).fiyat || {}) };
    g.kapali = { ...((girdi || {}).kapali || {}) };
    return g;
  }

  /* ======================================== katman adindan imalat tahmini */
  /* DXF katman adlari buyuk olcude standart degildir; asagidaki desenler
     yaygin Turkce/Ingilizce mimari katman adlarini yakalar. */
  /* Sira onemlidir: ilk eslesen kural kazanir. Once yok sayilacak yardimci
     katmanlar, sonra ozel (dis/ic) ayrimlar, en sonda genel desenler gelir.
     Desenler hem CIZIM-STANDARDI.md adlarini hem de ArchiCAD / Revit / AutoCAD
     yaygin katman adlarini yakalar. */
  const KURALLAR = [
    /* --- metraja girmeyen yardimci katmanlar --- */
    { tur: 'yoksay',     desen: /mobilya|furniture|donati|donatı|rebar|arac|araç|vehicle|ağaç|agac|tree|peyzaj[\s_-]*bitki|kuzey|north|antet|pafta[\s_-]*cerceve|title[\s_-]*block|legend|lejant|tarama|hatch/i },
    { tur: 'olcu',       desen: /olcu|ölçü|dimension|dim[\s_-]|kot|elevation[\s_-]*mark|marker|text|yazi|yazı|aks|axis|grid|nkot|sev(ust|alt)?[\s_-]*$|tarama[\s_-]*cizgi|hatch[\s_-]*line/i },

    /* --- yapi elemanlari --- */
    { tur: 'disDuvar',   desen: /(dis|dış)[\s_-]*duvar|duvar[\s_-]*(dis|dış)|^d[\s_-]*duvar|ext(erior)?[\s_-]*wall|wall[\s_-]*ext/i },
    { tur: 'icDuvar',    desen: /(ic|iç)[\s_-]*duvar|duvar[\s_-]*(ic|iç)|bolme|bölme|int(erior)?[\s_-]*wall|partition/i },
    { tur: 'perde',      desen: /perde|shear[\s_-]*wall|betonarme[\s_-]*duvar/i },
    { tur: 'kolon',      desen: /kolon|column|structural[\s_-]*bearing|bearing[\s_-]*wall/i },
    { tur: 'kiris',      desen: /kiris|kiriş|beam|hatil|hatıl|lento/i },
    { tur: 'doseme',     desen: /doseme|döşeme|slab|floor[\s_-]*plate|kalip[\s_-]*plan|kalıp[\s_-]*plan/i },
    { tur: 'duvar',      desen: /duvar|wall|tugla|tuğla|gazbeton/i },
    { tur: 'kapiDis',    desen: /(dis|dış|giris|giriş|daire|celik|çelik)[\s_-]*kapi|kapi[\s_-]*(dis|dış|giris|giriş)|entrance[\s_-]*door/i },
    { tur: 'kapi',       desen: /kapi|kapı|door/i },
    { tur: 'pencere',    desen: /pencere|window|dograma|doğrama|cam[\s_-]|opening/i },
    { tur: 'merdiven',   desen: /merdiven|stair|basamak|railing|korkuluk/i },
    { tur: 'cati',       desen: /cati|çatı|roof|teras/i },

    /* --- alan sinirlari --- */
    { tur: 'islak',      desen: /islak|wc|banyo|bath|tuvalet|mutfak|kitchen/i },
    { tur: 'parsel',     desen: /parsel|arsa|ada[\s_-]*parsel|plot|site[\s_-]*boundary/i },
    { tur: 'bina',       desen: /(^|[\s_-])bina([\s_-]|$)|bina[\s_-]*(oturum|sinir|sınır|alan)|oturum[\s_-]*alan|footprint|building[\s_-]*outline/i },
    { tur: 'alan',       desen: /alan|mahal|oda|room|net|brut|brüt|zone/i }
  ];

  const TUR_ADI = {
    disDuvar: 'Dış duvar', icDuvar: 'İç duvar', duvar: 'Duvar (ayrışmamış)',
    perde: 'Betonarme perde', kolon: 'Kolon', kiris: 'Kiriş / hatıl',
    doseme: 'Döşeme', kapi: 'Kapı', kapiDis: 'Dış / daire kapısı',
    pencere: 'Pencere', merdiven: 'Merdiven', cati: 'Çatı',
    islak: 'Islak hacim', alan: 'Mahal alanı', parsel: 'Parsel sınırı',
    bina: 'Bina oturumu', olcu: 'Ölçü / yazı', yoksay: 'Metraj dışı',
    bilinmiyor: 'Sınıflandırılmadı'
  };

  /* Metraja veri saglamayan turler: uyum raporunda "eksik" sayilmazlar */
  const NOTR_TURLER = ['olcu', 'yoksay', 'bilinmiyor'];

  function katmanTuru(ad) {
    const k = KURALLAR.find((r) => r.desen.test(String(ad || '')));
    return k ? k.tur : 'bilinmiyor';
  }

  /* Pafta katmanlarindan bina parametrelerini tahmin eder.
     Duvarlar cizimde iki paralel cizgiyle gosterildiginden olculen toplam
     uzunluk ikiye bolunur (duvarBolen). */
  function paftadanTahmin(katmanlar, secenek) {
    const ayar = { duvarBolen: 2, ...(secenek || {}) };
    const eslesme = (katmanlar || []).map((k) => ({
      ad: k.ad, tur: katmanTuru(k.ad),
      uzunluk: k.uzunluk || 0, alan: k.alan || 0, adet: k.adet || 0
    }));

    const topla = (tur, olcu) => eslesme.filter((e) => e.tur === tur)
      .reduce((t, e) => t + (e[olcu] || 0), 0);

    const disDuvar = topla('disDuvar', 'uzunluk') / ayar.duvarBolen;
    const icDuvar = topla('icDuvar', 'uzunluk') / ayar.duvarBolen;
    const ayrismamis = topla('duvar', 'uzunluk') / ayar.duvarBolen;

    /* Dis/ic ayrimi yoksa ayrismamis duvarin %35'i dis, %65'i ic kabul edilir */
    const disSonuc = disDuvar || ayrismamis * 0.35;
    const icSonuc = icDuvar || ayrismamis * 0.65;

    /* Taban alani icin oncelik sirasi: bina oturumu > doseme > mahal toplami */
    const binaAlani = topla('bina', 'alan');
    const dosemeAlani = topla('doseme', 'alan');
    const mahalAlani = topla('alan', 'alan');
    const tabanAlani = binaAlani || dosemeAlani || mahalAlani;
    const tabanKaynak = binaAlani ? 'bina oturumu' : dosemeAlani ? 'döşeme' : 'mahal toplamı';

    const islakAlani = topla('islak', 'alan');
    const kapiAdet = topla('kapi', 'adet');
    const kapiDisAdet = topla('kapiDis', 'adet');
    const pencereAdet = topla('pencere', 'adet');
    const parselAlani = topla('parsel', 'alan');
    const merdivenUz = topla('merdiven', 'uzunluk');

    /* Uyum raporu: hangi katman ne oldu, hangi olcu okunamadi */
    const taninan = eslesme.filter((e) => NOTR_TURLER.indexOf(e.tur) < 0);
    const taninmayan = eslesme.filter((e) => e.tur === 'bilinmiyor' &&
      (e.uzunluk > 0 || e.alan > 0 || e.adet > 0));
    const eksik = [];
    if (!disDuvar && !ayrismamis) eksik.push('dış duvar');
    if (!icDuvar && !ayrismamis) eksik.push('iç duvar');
    if (!tabanAlani) eksik.push('taban alanı (bina oturumu / döşeme / mahal)');
    if (!kapiAdet) eksik.push('kapı');
    if (!pencereAdet) eksik.push('pencere');
    if (!islakAlani) eksik.push('ıslak hacim');

    /* Guven: ayrisik duvar katmani + alan siniri varsa yuksek */
    let guven = 0.4;
    if (disDuvar || icDuvar) guven = 0.75;
    else if (ayrismamis) guven = 0.55;
    if ((disDuvar || icDuvar) && (binaAlani || dosemeAlani)) guven = 0.95;
    else if ((disDuvar || icDuvar) && mahalAlani) guven = 0.85;
    if (taninmayan.length > taninan.length) guven = Math.min(guven, 0.5);

    return {
      disDuvarUzunluk: yuvarla(disSonuc, 1),
      icDuvarUzunluk: yuvarla(icSonuc, 1),
      binaCevresi: yuvarla(disSonuc, 1),
      tabanAlani: yuvarla(tabanAlani, 1),
      tabanKaynak,
      arsaAlani: yuvarla(parselAlani, 1),
      islakHacimAlani: yuvarla(islakAlani, 1),
      icKapiAdet: Math.round(kapiAdet),
      disKapiAdet: Math.round(kapiDisAdet),
      pencereAdet: Math.round(pencereAdet),
      /* Standart 1,40 × 1,50 m pencere kabulüyle alan tahmini */
      pencereAlani: yuvarla(pencereAdet * 2.1, 1),
      merdivenKolu: yuvarla(merdivenUz, 1),
      eslesme, taninan, taninmayan, eksik,
      guven
    };
  }

  const yuvarla = (v, basamak) => {
    const c = Math.pow(10, basamak === undefined ? 2 : basamak);
    return Math.round((v || 0) * c) / c;
  };

  /* ============================================================== hesap */
  function hesapla(ham) {
    const g = tamamla(ham);
    const o = g.oranlar;
    const kalemler = [];
    /* Taban alani ve kat girilmeden kesif uretilmez: eksik girdiyle olusan
       kismi listeler yaniltici olur. */
    const hazir = (+g.tabanAlani || 0) > 0 &&
      ((+g.bodrumKat || 0) + (+g.zeminKat || 0) + (+g.normalKat || 0)) > 0;

    /* ------------------------------------------------ türetilen ölçüler */
    const katSayisi = (+g.bodrumKat || 0) + (+g.zeminKat || 0) + (+g.normalKat || 0);
    const toplamAlan = (+g.tabanAlani || 0) * katSayisi;
    const netYukseklik = Math.max(0, (+g.katYuksekligi || 0) - (+g.dosemeKalinligi || 0));
    const ustKat = Math.max(0, katSayisi - (+g.bodrumKat || 0));   // bodrumda dış duvar perdedir
    const kullanimAlani = toplamAlan * o.kullanimOrani;

    const disDuvarBrut = (+g.disDuvarUzunluk || 0) * netYukseklik * ustKat;
    const bosluk = (+g.pencereAlani || 0) + (+g.disKapiAdet || 0) * 2.2;
    const disDuvarNet = Math.max(0, disDuvarBrut - bosluk);
    const icDuvarBrut = (+g.icDuvarUzunluk || 0) * netYukseklik * katSayisi;
    const icDuvarNet = Math.max(0, icDuvarBrut - (+g.icKapiAdet || 0) * 1.8);
    const tavanAlani = toplamAlan * o.tavanOrani;
    /* iç sıva: iç duvarın iki yüzü + dış duvarın iç yüzü + tavanlar */
    const icSivaAlani = icDuvarNet * 2 + disDuvarNet + tavanAlani;

    const kaziAlani = (+g.tabanAlani || 0) +
      (+g.binaCevresi || 0) * (o.calismaPayi + (+g.kaziDerinligi || 0) * o.sevKatsayisi / 2);
    const kaziHacmi = kaziAlani * (+g.kaziDerinligi || 0);
    const dolguHacmi = kaziHacmi * o.dolguOrani;
    const nakliyeHacmi = Math.max(0, kaziHacmi - dolguHacmi) * o.kabarma;

    const temelKalinlik = g.temel === 'Radye temel' ? (+g.radyeKalinlik || 0) : 0.35;
    const temelBeton = (+g.tabanAlani || 0) * temelKalinlik;
    const groBeton = (+g.tabanAlani || 0) * 1.1 * 0.1;
    const ustBeton = toplamAlan * o.betonOrani;
    const ustKalip = ustBeton * o.kalipOrani;
    const temelKalip = (+g.binaCevresi || 0) * temelKalinlik;
    const donatiTon = (temelBeton * o.donatiTemel + ustBeton * o.donatiUst) / 1000;

    const bodrumPerdeAlani = (+g.binaCevresi || 0) * (+g.kaziDerinligi || 0);
    const catiAlani = g.catiTipi === 'Teras çatı'
      ? (+g.tabanAlani || 0) : (+g.tabanAlani || 0) * 1.25;

    /* ------------------------------------------------------- kalem yaz */
    const ekle = (poz, miktar, formul, notu) => {
      const p = pozBul(poz);
      if (!hazir || !p || !(miktar > 0) || g.kapali[poz]) return;
      const fiyat = g.fiyat[poz] !== undefined && g.fiyat[poz] !== ''
        ? +g.fiyat[poz] : p.fiyat;
      const m = yuvarla(miktar, 2);
      kalemler.push({
        poz: p.poz, tanim: p.ad, birim: p.birim, kategori: p.kategori, grup: p.grup,
        miktar: m, birimFiyat: fiyat, tutar: m * fiyat, formul, not: notu || '',
        ozel: false
      });
    };

    /* --- toprak işleri --- */
    ekle('15.140.1002', kaziHacmi,
      `(${num(g.tabanAlani)} m² taban + ${num(g.binaCevresi)} m çevre × ${num(o.calismaPayi)} m çalışma payı ve şev) × ${num(g.kaziDerinligi)} m derinlik`);
    ekle('15.120.1002', +g.tabanAlani * 1.1,
      `${num(g.tabanAlani)} m² taban alanı × 1,10 çalışma payı`);
    ekle('15.160.1004', nakliyeHacmi,
      `(${num(kaziHacmi)} m³ kazı − ${num(dolguHacmi)} m³ dolgu) × ${num(o.kabarma)} kabarma`);
    ekle('15.150.1003', dolguHacmi,
      `${num(kaziHacmi)} m³ kazı × %${num(o.dolguOrani * 100)} dolgu oranı`);

    /* --- betonarme --- */
    ekle('16.050.1003', groBeton,
      `${num(g.tabanAlani)} m² × 1,10 taşma payı × 0,10 m grobeton kalınlığı`);
    ekle('16.058.1005', temelBeton,
      `${num(g.tabanAlani)} m² × ${num(temelKalinlik)} m ${g.temel.toLocaleLowerCase('tr')} kalınlığı`);
    ekle('16.058.1006', ustBeton,
      `${num(toplamAlan)} m² toplam inşaat alanı × ${num(o.betonOrani)} m³/m² beton oranı`);
    ekle('21.011.1001', ustKalip + temelKalip,
      `${num(ustBeton)} m³ × ${num(o.kalipOrani)} m²/m³ + temel yan kalıbı ${num(temelKalip)} m²`);
    ekle('23.015.1002', donatiTon,
      `temel ${num(temelBeton)} m³ × ${num(o.donatiTemel)} kg/m³ + üst yapı ${num(ustBeton)} m³ × ${num(o.donatiUst)} kg/m³`);
    ekle('18.461.1001', (+g.tabanAlani || 0) + bodrumPerdeAlani,
      `temel altı ${num(g.tabanAlani)} m² + perde dışı ${num(bodrumPerdeAlani)} m²`);
    if (g.bodrumKat > 0) {
      ekle('19.055.1002', bodrumPerdeAlani,
        `${num(g.binaCevresi)} m çevre × ${num(g.kaziDerinligi)} m toprak altı yükseklik`);
    }

    /* --- duvar ve yalıtım --- */
    ekle('18.071.1003', disDuvarNet,
      `${num(g.disDuvarUzunluk)} m × ${num(netYukseklik)} m net yükseklik × ${ustKat} kat − ${num(bosluk)} m² boşluk`);
    ekle('18.071.1001', icDuvarNet,
      `${num(g.icDuvarUzunluk)} m × ${num(netYukseklik)} m × ${katSayisi} kat − ${g.icKapiAdet} kapı × 1,80 m²`);
    ekle('16.058.1008', ((+g.pencereAdet || 0) + (+g.icKapiAdet || 0) + (+g.disKapiAdet || 0)) * 1.6,
      `(${g.pencereAdet} pencere + ${g.icKapiAdet + g.disKapiAdet} kapı) × 1,60 m ortalama lento`);
    ekle('19.100.1005', disDuvarBrut,
      `dış cephe brüt alanı ${num(g.disDuvarUzunluk)} m × ${num(netYukseklik)} m × ${ustKat} kat`);

    /* --- çatı --- */
    if (g.catiTipi === 'Teras çatı') {
      ekle('18.465.1004', catiAlani, `${num(g.tabanAlani)} m² teras çatı alanı`);
    } else {
      ekle('21.060.1002', catiAlani, `${num(g.tabanAlani)} m² × 1,25 çatı eğim payı`);
    }
    ekle('25.015.1001', +g.binaCevresi || 0, `${num(g.binaCevresi)} m bina çevresi`);

    /* --- ince yapı --- */
    ekle('27.525.1002', icSivaAlani,
      `iç duvar ${num(icDuvarNet)} m² × 2 yüz + dış duvar iç yüzü ${num(disDuvarNet)} m² + tavan ${num(tavanAlani)} m²`);
    ekle('25.116.1003', icSivaAlani, `sıva alanı ile aynı: ${num(icSivaAlani)} m²`);
    ekle('25.120.1004', disDuvarBrut, `dış cephe brüt alanı ${num(disDuvarBrut)} m²`);
    ekle('26.005.1002', toplamAlan * 0.92, `${num(toplamAlan)} m² × 0,92 (şap yapılmayan alanlar düşülmüş)`);
    ekle('18.480.1001', (+g.islakHacimAlani || 0) * 1.6,
      `${num(g.islakHacimAlani)} m² ıslak hacim × 1,60 (zemin + duvar etek)`);
    ekle('26.621.1003', +g.islakHacimAlani || 0, `${num(g.islakHacimAlani)} m² ıslak hacim zemini`);
    ekle('26.621.1005', (+g.islakHacimAlani || 0) * 3.2,
      `${num(g.islakHacimAlani)} m² × 3,20 (ıslak hacim duvar yüzeyi katsayısı)`);
    ekle('26.700.1002', Math.max(0, kullanimAlani - (+g.islakHacimAlani || 0)),
      `net kullanım alanı ${num(kullanimAlani)} m² − ıslak hacim ${num(g.islakHacimAlani)} m²`);
    ekle('26.701.1001', Math.max(0, kullanimAlani - (+g.islakHacimAlani || 0)) * 0.9,
      `parke alanı × 0,90 mtül/m² süpürgelik katsayısı`);
    ekle('27.581.1002', (+g.islakHacimAlani || 0) * 1.4,
      `${num(g.islakHacimAlani)} m² ıslak hacim × 1,40 (hol ve koridor dahil)`);
    ekle('26.351.1002', +g.merdivenKolu || 0, `${num(g.merdivenKolu)} mtül merdiven basamağı`);
    ekle('24.240.1003', (+g.merdivenKolu || 0) * 1.1, `merdiven ${num(g.merdivenKolu)} mtül × 1,10 korkuluk payı`);
    ekle('26.900.1001', (+g.daireAdet || 0) * 4.5, `${g.daireAdet} daire × 4,50 mtül mutfak tezgâhı`);

    /* --- doğrama --- */
    ekle('24.010.1002', +g.icKapiAdet || 0, `${g.icKapiAdet} adet iç kapı`);
    ekle('24.011.1001', +g.disKapiAdet || 0, `${g.disKapiAdet} adet dış / daire giriş kapısı`);
    ekle('24.100.1004', +g.pencereAlani || 0, `${num(g.pencereAlani)} m² toplam pencere alanı`);
    ekle('26.320.1002', (+g.pencereAdet || 0) * 1.4, `${g.pencereAdet} pencere × 1,40 m denizlik`);

    /* --- tesisat --- */
    ekle('33.100.1001', toplamAlan, `${num(toplamAlan)} m² toplam inşaat alanı`);
    ekle('32.100.1001', toplamAlan, `${num(toplamAlan)} m² toplam inşaat alanı`);
    ekle('32.300.1002', toplamAlan, `${num(toplamAlan)} m² toplam inşaat alanı`);
    ekle('33.400.1002', toplamAlan, `${num(toplamAlan)} m² toplam inşaat alanı`);
    ekle('32.150.1003', +g.daireAdet || 0, `${g.daireAdet} daire × 1 takım`);
    ekle('32.400.1001', +g.daireAdet || 0, `${g.daireAdet} daire doğalgaz iç tesisatı`);
    ekle('33.600.1001', +g.asansorAdet || 0, `${g.asansorAdet} adet asansör`);

    /* --- çevre --- */
    const bahceAlani = Math.max(0, (+g.arsaAlani || 0) - (+g.tabanAlani || 0));
    ekle('16.059.1001', bahceAlani * 0.35, `açık alan ${num(bahceAlani)} m² × 0,35 sert zemin oranı`);
    ekle('15.550.1003', bahceAlani * 0.65, `açık alan ${num(bahceAlani)} m² × 0,65 peyzaj oranı`);
    ekle('15.001.1001', toplamAlan, `${num(toplamAlan)} m² inşaat alanı üzerinden şantiye gideri`);

    /* kullanıcının elle eklediği kalemler */
    (g.ekKalemler || []).forEach((k) => {
      const m = +k.miktar || 0, f = +k.birimFiyat || 0;
      if (!hazir || !m) return;
      kalemler.push({ poz: k.poz || 'ÖZEL', tanim: k.tanim, birim: k.birim || 'adet',
        kategori: k.kategori || 'Çevre ve Diğer', grup: k.grup || 'ince',
        miktar: m, birimFiyat: f, tutar: m * f,
        formul: 'Elle eklenen kalem', not: '', ozel: true, _id: k._id });
    });

    /* --------------------------------------------------------- icmal */
    const imalat = kalemler.reduce((t, k) => t + k.tutar, 0);
    const gd = g.giderler;
    const genelGider = imalat * (gd.genelGider / 100);
    const beklenmeyen = imalat * (gd.beklenmeyen / 100);
    const muteahhitKari = (imalat + genelGider + beklenmeyen) * (gd.muteahhitKari / 100);
    const araToplam = imalat + genelGider + beklenmeyen + muteahhitKari;
    const kdv = araToplam * (gd.kdv / 100);

    const grupToplam = kalemler.reduce((a, k) => {
      a[k.grup] = (a[k.grup] || 0) + k.tutar; return a;
    }, {});
    const kategoriToplam = KATEGORILER.map((ad) => ({
      ad, tutar: kalemler.filter((k) => k.kategori === ad).reduce((t, k) => t + k.tutar, 0)
    })).filter((x) => x.tutar > 0);

    return {
      girdi: g,
      kalemler,
      olculer: {
        katSayisi, toplamAlan, kullanimAlani, netYukseklik,
        disDuvarNet, icDuvarNet, icSivaAlani, kaziHacmi,
        toplamBeton: groBeton + temelBeton + ustBeton,
        toplamKalip: ustKalip + temelKalip, donatiTon, catiAlani
      },
      icmal: {
        imalat, genelGider, beklenmeyen, muteahhitKari, araToplam, kdv,
        genelToplam: araToplam + kdv,
        m2Maliyet: toplamAlan ? araToplam / toplamAlan : 0,
        m2MaliyetKdv: toplamAlan ? (araToplam + kdv) / toplamAlan : 0,
        daireMaliyet: g.daireAdet ? araToplam / g.daireAdet : 0,
        grupToplam, kategoriToplam
      }
    };
  }

  const nfmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
  function num(v) { return nfmt.format(+v || 0); }

  return { POZLAR, KATEGORILER, VARSAYILAN, TUR_ADI, NOTR_TURLER,
           pozBul, tamamla, hesapla, paftadanTahmin, katmanTuru, yuvarla };
})();
