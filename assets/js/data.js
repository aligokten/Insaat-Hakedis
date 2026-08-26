/* İnşaat-Hakediş - demo veri katmani (mock).
   Gercek uygulamada bu nesne bir API'den gelir. */
window.DB = (function () {
  const projeler = [];

  /* Yüklenen mimari / statik DWG paftaları */
  const paftalar = [];

  /* Paftalardan üretilen metraj kalemleri */
  const metraj = [];

  const taseronlar = [];

  const YETKI_LISTESI = [
    { key: 'metraj:goruntule', ad: 'Metraj Görüntüle' },
    { key: 'dwg:indir', ad: 'DWG İndir' },
    { key: 'hakedis:hazirla', ad: 'Hakediş Hazırla' },
    { key: 'kalite:formdoldur', ad: 'Kalite Formu' },
    { key: 'stok:talep', ad: 'Stok Talebi' }
  ];

  const kaliteKontrol = [];

  const hakedisler = [];

  const stok = [];

  /* Stok giris/cikis hareketleri */
  const hareketler = [];

  const siparisler = [];

  const raporlar = [];



  /* Proje altindaki is kalemleri (imalat paketleri) */
  const isler = [];

  const PERSONEL_GOREV = ['Proje Müdürü', 'Şantiye Şefi', 'Formen', 'Usta', 'Kalfa',
                          'Düz İşçi', 'Operatör', 'İSG Uzmanı', 'Tekniker'];
  const PUANTAJ_DURUM = {
    'Tam gün':      { katsayi: 1,    kind: 'ok' },
    'Yarım gün':    { katsayi: 0.5,  kind: 'warn' },
    'Fazla mesai':  { katsayi: 1.5,  kind: 'info' },
    'İzinli':       { katsayi: 0,    kind: '' },
    'Raporlu':      { katsayi: 0,    kind: 'warn' },
    'Devamsız':     { katsayi: 0,    kind: 'bad' }
  };

  /* Saha personeli ozluk kartlari */
  const personel = [];

  /* Gunluk puantaj kayitlari */
  const puantaj = [];

  /* Imalat turune gore kontrol sablonlari; agirlik puani skoru belirler */
  const KALITE_SABLON = {
    'Beton Dökümü': [
      { ad: 'Donatı yerleşimi ve paspayı', agirlik: 3 },
      { ad: 'Kalıp sızdırmazlığı ve düşeyliği', agirlik: 2 },
      { ad: 'Beton sınıfı ve slump testi', agirlik: 3 },
      { ad: 'Vibrasyon uygulaması', agirlik: 2 },
      { ad: 'Kür ve koruma önlemleri', agirlik: 2 },
      { ad: 'Kot ve aks kontrolü', agirlik: 1 }
    ],
    'Duvar Örgüsü': [
      { ad: 'Şakül ve terazi', agirlik: 3 },
      { ad: 'Derz kalınlığı ve dolgusu', agirlik: 2 },
      { ad: 'Lento ve hatıl uygulaması', agirlik: 3 },
      { ad: 'Duvar-kolon bağlantı donatısı', agirlik: 2 },
      { ad: 'Malzeme uygunluğu (blok sınıfı)', agirlik: 1 }
    ],
    'Sıva ve Alçı': [
      { ad: 'Yüzey hazırlığı ve astar', agirlik: 2 },
      { ad: 'Şakül, terazi ve mastar', agirlik: 3 },
      { ad: 'Sıva kalınlığı', agirlik: 2 },
      { ad: 'Köşe profilleri', agirlik: 1 },
      { ad: 'Çatlak ve kabarma kontrolü', agirlik: 2 }
    ],
    'Seramik Kaplama': [
      { ad: 'Zemin şapı ve eğim', agirlik: 3 },
      { ad: 'Su yalıtımı devamlılığı', agirlik: 3 },
      { ad: 'Yapıştırıcı sarfiyatı / boşluk kontrolü', agirlik: 3 },
      { ad: 'Derz genişliği ve düzlüğü', agirlik: 2 },
      { ad: 'Kesim ve köşe detayları', agirlik: 1 }
    ],
    'Mekanik Tesisat': [
      { ad: 'Basınç testi', agirlik: 3 },
      { ad: 'Askı ve sabitleme aralıkları', agirlik: 2 },
      { ad: 'Boru yalıtımı', agirlik: 2 },
      { ad: 'Eğim ve tahliye', agirlik: 2 },
      { ad: 'Vana ve armatür erişilebilirliği', agirlik: 1 }
    ],
    'Elektrik Tesisatı': [
      { ad: 'Kablo kesiti ve etiketleme', agirlik: 3 },
      { ad: 'Topraklama sürekliliği', agirlik: 3 },
      { ad: 'İzolasyon direnci ölçümü', agirlik: 3 },
      { ad: 'Pano montajı ve etiket', agirlik: 2 },
      { ad: 'Buat ve ek kutusu düzeni', agirlik: 1 }
    ],
    'Cephe Mantolama': [
      { ad: 'Yapıştırma harcı oranı ve temas alanı', agirlik: 2 },
      { ad: 'Dübel sıklığı ve gömme derinliği', agirlik: 3 },
      { ad: 'Levha derzleri ve şaşırtmalı dizilim', agirlik: 2 },
      { ad: 'Donatı filesi bindirme payı', agirlik: 2 },
      { ad: 'Denizlik ve damlalık detayı', agirlik: 2 }
    ]
  };

  /* Skora gore onerilen sonuc */
  const KALITE_ESIK = [
    { alt: 90, sonuc: 'Onaylandı' },
    { alt: 60, sonuc: 'Şartlı Onay' },
    { alt: 0,  sonuc: 'Red' }
  ];



  return { projeler, paftalar, metraj, taseronlar, isler, personel, puantaj,
           YETKI_LISTESI, KALITE_SABLON, KALITE_ESIK, PERSONEL_GOREV, PUANTAJ_DURUM,
           kaliteKontrol, hakedisler, stok, hareketler, siparisler, raporlar,
           kullanicilar: [], gunluk: [] };
})();
