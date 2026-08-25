/* İnşaat-Hakediş - demo veri katmani (mock).
   Gercek uygulamada bu nesne bir API'den gelir. */
window.DB = (function () {
  const projeler = [
    {
      id: 'PRJ-01', ad: 'Marina Rezidans', blok: 'A Blok',
      isveren: 'Deniz Yapı A.Ş.', sehir: 'İzmir',
      sozlesme: 184500000, gerceklesen: 154980000,
      ilerleme: 84, durum: 'Devam', guncelleme: '7 sa önce',
      etiketler: ['İnce İşler', 'Mekanik', 'Kaba Yapı']
    },
    {
      id: 'PRJ-02', ad: 'Vadi Ofis Kule', blok: 'Kule 2',
      isveren: 'Vadi GYO', sehir: 'İstanbul',
      sozlesme: 265000000, gerceklesen: 243800000,
      ilerleme: 92, durum: 'Devam', guncelleme: '2 sa önce',
      etiketler: ['Cephe', 'Elektrik', 'İnce İşler']
    },
    {
      id: 'PRJ-03', ad: 'Sanayi Lojistik Deposu', blok: 'Hangar 1',
      isveren: 'Kuzey Lojistik', sehir: 'Kocaeli',
      sozlesme: 98400000, gerceklesen: 61990000,
      ilerleme: 63, durum: 'Riskli', guncelleme: '9 sa önce',
      etiketler: ['Çelik', 'Saha', 'Altyapı']
    },
    {
      id: 'PRJ-04', ad: 'Şehir Hastanesi Ek Bina', blok: 'B Blok',
      isveren: 'Sağlık Yatırım', sehir: 'Ankara',
      sozlesme: 412000000, gerceklesen: 333720000,
      ilerleme: 81, durum: 'Devam', guncelleme: '11 sa önce',
      etiketler: ['Mekanik', 'Kaba Yapı', 'Elektrik']
    },
    {
      id: 'PRJ-05', ad: 'Sahil Otel Yenileme', blok: 'Ana Bina',
      isveren: 'Ege Turizm', sehir: 'Muğla',
      sozlesme: 76200000, gerceklesen: 41148000,
      ilerleme: 54, durum: 'Beklemede', guncelleme: '1 gun önce',
      etiketler: ['Tadilat', 'İnce İşler']
    }
  ];

  /* Yüklenen mimari / statik DWG paftaları */
  const paftalar = [
    { id: 'DWG-1001', ad: 'A-101_Kat_Plani_Normal.dwg', tur: 'Kat Planı', disiplin: 'Mimari', proje: 'PRJ-01', rev: 'C', olcek: '1/50', boyut: '4.2 MB', tarih: '2026-08-12', durum: 'İşlendi', katman: 42, alanM2: 1284 },
    { id: 'DWG-1002', ad: 'A-201_Kesit_AA.dwg', tur: 'Kesit', disiplin: 'Mimari', proje: 'PRJ-01', rev: 'B', olcek: '1/50', boyut: '2.8 MB', tarih: '2026-08-12', durum: 'İşlendi', katman: 31, alanM2: 0 },
    { id: 'DWG-1003', ad: 'A-301_Gorunus_Kuzey.dwg', tur: 'Görünüş', disiplin: 'Mimari', proje: 'PRJ-01', rev: 'A', olcek: '1/100', boyut: '1.9 MB', tarih: '2026-08-13', durum: 'Kuyrukta', katman: 22, alanM2: 0 },
    { id: 'DWG-1004', ad: 'S-101_Kalip_Plani.dwg', tur: 'Kalıp Planı', disiplin: 'Statik', proje: 'PRJ-01', rev: 'D', olcek: '1/50', boyut: '6.1 MB', tarih: '2026-08-14', durum: 'İşlendi', katman: 55, alanM2: 1284 },
    { id: 'DWG-1005', ad: 'S-401_Kolon_Detay.dwg', tur: 'Detay', disiplin: 'Statik', proje: 'PRJ-02', rev: 'B', olcek: '1/20', boyut: '3.4 MB', tarih: '2026-08-15', durum: 'İşlendi', katman: 27, alanM2: 0 },
    { id: 'DWG-1006', ad: 'M-101_Tesisat_Plani.dwg', tur: 'Kat Planı', disiplin: 'Mekanik', proje: 'PRJ-02', rev: 'A', olcek: '1/50', boyut: '5.0 MB', tarih: '2026-08-16', durum: 'Hata', katman: 38, alanM2: 2010 }
  ];

  /* Paftalardan üretilen metraj kalemleri */
  const metraj = [
    { poz: '16.058/1A', tanim: 'C30/37 hazır beton dökümü (perde-kolon)', birim: 'm3', pafta: 'S-101', miktar: 1842.5, birimFiyat: 3150, kaynak: 'Otomatik', guven: 0.97, proje: 'PRJ-01' },
    { poz: '15.140/2', tanim: 'Nervurlu çelik hasır donatı B500C', birim: 'ton', pafta: 'S-101', miktar: 214.8, birimFiyat: 28400, kaynak: 'Otomatik', guven: 0.94, proje: 'PRJ-01' },
    { poz: '19.055', tanim: 'Ahşap kalıp yapılması (düz yüzey)', birim: 'm2', pafta: 'S-101', miktar: 9640.0, birimFiyat: 410, kaynak: 'Otomatik', guven: 0.91, proje: 'PRJ-01' },
    { poz: '18.233/3', tanim: 'Gazbeton bloklu duvar örülmesi (20 cm)', birim: 'm2', pafta: 'A-101', miktar: 4318.2, birimFiyat: 690, kaynak: 'Otomatik', guven: 0.96, proje: 'PRJ-01' },
    { poz: '27.501/2', tanim: 'İç cephe alçı sıva yapılması', birim: 'm2', pafta: 'A-101', miktar: 11250.0, birimFiyat: 265, kaynak: 'Otomatik', guven: 0.89, proje: 'PRJ-01' },
    { poz: '26.006/4', tanim: 'Seramik yer kaplaması 60x60', birim: 'm2', pafta: 'A-101', miktar: 3960.4, birimFiyat: 940, kaynak: 'Manuel', guven: 1.00, proje: 'PRJ-01' },
    { poz: '25.116', tanim: 'Isı yalıtımlı mantolama (8 cm XPS)', birim: 'm2', pafta: 'A-301', miktar: 5120.0, birimFiyat: 780, kaynak: 'Otomatik', guven: 0.85, proje: 'PRJ-01' },
    { poz: '23.014/1', tanim: 'PVC pencere imalatı ve montajı', birim: 'm2', pafta: 'A-301', miktar: 1486.7, birimFiyat: 3850, kaynak: 'Otomatik', guven: 0.92, proje: 'PRJ-01' },
    { poz: '21.011', tanim: 'Su yalıtımı - çift kat membran', birim: 'm2', pafta: 'A-201', miktar: 2240.0, birimFiyat: 520, kaynak: 'Otomatik', guven: 0.88, proje: 'PRJ-01' },
    { poz: '33.201/5', tanim: 'Elektrik tesisatı kablo çekimi', birim: 'm', pafta: 'M-101', miktar: 18400.0, birimFiyat: 145, kaynak: 'Otomatik', guven: 0.83, proje: 'PRJ-02' }
  ];

  const taseronlar = [
    { id: 'TSR-01', ad: 'Anadolu Kaba Yapı Ltd.', brans: 'Kaba Yapı', yetkili: 'M. Aydın', puan: 4.6, aktifIs: 3, sozlesme: 52400000, yetkiler: ['metraj:goruntule', 'hakedis:hazirla', 'dwg:indir'], sgk: 'Geçerli', sozlesmeBitis: '2027-03-31', durum: 'Aktif' },
    { id: 'TSR-02', ad: 'Ege Mekanik Tesisat', brans: 'Mekanik', yetkili: 'S. Korkmaz', puan: 4.2, aktifIs: 2, sozlesme: 31800000, yetkiler: ['metraj:goruntule', 'dwg:indir'], sgk: 'Geçerli', sozlesmeBitis: '2026-12-15', durum: 'Aktif' },
    { id: 'TSR-03', ad: 'Nova Elektrik Sistemleri', brans: 'Elektrik', yetkili: 'B. Toprak', puan: 3.8, aktifIs: 1, sozlesme: 19600000, yetkiler: ['metraj:goruntule'], sgk: 'Süresi Doldu', sozlesmeBitis: '2026-09-30', durum: 'Uyarı' },
    { id: 'TSR-04', ad: 'Mermer İnce İşler', brans: 'İnce İşler', yetkili: 'H. Çetin', puan: 4.8, aktifIs: 4, sozlesme: 44150000, yetkiler: ['metraj:goruntule', 'hakedis:hazirla', 'kalite:formdoldur', 'dwg:indir'], sgk: 'Geçerli', sozlesmeBitis: '2027-06-30', durum: 'Aktif' },
    { id: 'TSR-05', ad: 'Kuzey Cephe Kaplama', brans: 'Cephe', yetkili: 'E. Yılmaz', puan: 4.0, aktifIs: 2, sozlesme: 27350000, yetkiler: ['metraj:goruntule', 'kalite:formdoldur'], sgk: 'Geçerli', sozlesmeBitis: '2027-01-20', durum: 'Aktif' },
    { id: 'TSR-06', ad: 'Saha Altyapı İnşaat', brans: 'Altyapı', yetkili: 'K. Demir', puan: 3.4, aktifIs: 1, sozlesme: 12900000, yetkiler: [], sgk: 'Eksik Evrak', sozlesmeBitis: '2026-11-01', durum: 'Askıda' }
  ];

  const YETKI_LISTESI = [
    { key: 'metraj:goruntule', ad: 'Metraj Görüntüle' },
    { key: 'dwg:indir', ad: 'DWG İndir' },
    { key: 'hakedis:hazirla', ad: 'Hakediş Hazırla' },
    { key: 'kalite:formdoldur', ad: 'Kalite Formu' },
    { key: 'stok:talep', ad: 'Stok Talebi' }
  ];

  const kaliteKontrol = [
    { id: 'QC-2201', imalat: 'Perde beton dökümü - 4. Kat', taseron: 'TSR-01', kontrolor: 'S. Arslan', tarih: '2026-08-18', sonuc: 'Onaylandı', skor: 96, tamamlanma: 100, notlar: 'Slump ve kur şartları uygun.' },
    { id: 'QC-2202', imalat: 'Duvar örgüsü - 3. Kat doğu', taseron: 'TSR-04', kontrolor: 'S. Arslan', tarih: '2026-08-19', sonuc: 'Şartlı Onay', skor: 78, tamamlanma: 92, notlar: 'Lento kotlarında 2 cm sapma, düzeltilecek.' },
    { id: 'QC-2203', imalat: 'Sıhhi tesisat hattı - B1', taseron: 'TSR-02', kontrolor: 'D. Özkan', tarih: '2026-08-20', sonuc: 'Red', skor: 41, tamamlanma: 60, notlar: 'Basınç testi başarısız, hat yenilenecek.' },
    { id: 'QC-2204', imalat: 'Cephe mantolama - Kuzey', taseron: 'TSR-05', kontrolor: 'D. Özkan', tarih: '2026-08-21', sonuc: 'Onaylandı', skor: 91, tamamlanma: 88, notlar: 'Dubel sıklığı şartname ile uyumlu.' },
    { id: 'QC-2205', imalat: 'Elektrik pano montajı - B1', taseron: 'TSR-03', kontrolor: 'M. Ulusoy', tarih: '2026-08-22', sonuc: 'Beklemede', skor: 0, tamamlanma: 35, notlar: 'Test raporu bekleniyor.' },
    { id: 'QC-2206', imalat: 'Seramik kaplama - 2. Kat', taseron: 'TSR-04', kontrolor: 'M. Ulusoy', tarih: '2026-08-23', sonuc: 'Onaylandı', skor: 94, tamamlanma: 100, notlar: 'Derz genişlikleri uygun.' }
  ];

  const hakedisler = [
    { no: 'HK-014', donem: 'Temmuz 2026', proje: 'PRJ-01', taseron: 'TSR-01', imalat: 18420000, kesinti: 1842000, avansMahsup: 900000, kdv: 3535600, durum: 'Onaylandı', onaylayan: 'Proje Müdürü', tarih: '2026-08-05' },
    { no: 'HK-015', donem: 'Ağustos 2026', proje: 'PRJ-01', taseron: 'TSR-04', imalat: 9640000, kesinti: 964000, avansMahsup: 0, kdv: 1735200, durum: 'Onay Bekliyor', onaylayan: '-', tarih: '2026-08-22' },
    { no: 'HK-016', donem: 'Ağustos 2026', proje: 'PRJ-02', taseron: 'TSR-02', imalat: 12750000, kesinti: 1275000, avansMahsup: 1500000, kdv: 1995000, durum: 'Kontrolde', onaylayan: 'Kontrol Şefi', tarih: '2026-08-23' },
    { no: 'HK-017', donem: 'Ağustos 2026', proje: 'PRJ-03', taseron: 'TSR-06', imalat: 4180000, kesinti: 418000, avansMahsup: 0, kdv: 752400, durum: 'Reddedildi', onaylayan: 'Proje Müdürü', tarih: '2026-08-20' },
    { no: 'HK-018', donem: 'Ağustos 2026', proje: 'PRJ-04', taseron: 'TSR-05', imalat: 15980000, kesinti: 1598000, avansMahsup: 700000, kdv: 2876400, durum: 'Onay Bekliyor', onaylayan: '-', tarih: '2026-08-24' }
  ];

  const stok = [
    { kod: 'MLZ-001', ad: 'Çimento CEM I 42.5R', birim: 'ton', mevcut: 148, kritik: 120, rezerve: 60, depo: 'Saha Depo A', sonHareket: '2026-08-23', birimFiyat: 4850 },
    { kod: 'MLZ-002', ad: 'Nervurlu İnşaat Demiri 12mm', birim: 'ton', mevcut: 62, kritik: 90, rezerve: 40, depo: 'Saha Depo A', sonHareket: '2026-08-24', birimFiyat: 28400 },
    { kod: 'MLZ-003', ad: 'Gazbeton Blok 20cm', birim: 'adet', mevcut: 9400, kritik: 4000, rezerve: 2200, depo: 'Saha Depo B', sonHareket: '2026-08-21', birimFiyat: 78 },
    { kod: 'MLZ-004', ad: 'XPS Isı Yalıtım Levhası 8cm', birim: 'm2', mevcut: 1120, kritik: 1500, rezerve: 800, depo: 'Merkez Depo', sonHareket: '2026-08-19', birimFiyat: 310 },
    { kod: 'MLZ-005', ad: 'Seramik 60x60 Gri', birim: 'm2', mevcut: 2860, kritik: 1200, rezerve: 940, depo: 'Merkez Depo', sonHareket: '2026-08-22', birimFiyat: 620 },
    { kod: 'MLZ-006', ad: 'PPRC Boru 32mm', birim: 'm', mevcut: 480, kritik: 900, rezerve: 300, depo: 'Saha Depo B', sonHareket: '2026-08-24', birimFiyat: 96 },
    { kod: 'MLZ-007', ad: 'NYA Kablo 3x2.5', birim: 'm', mevcut: 7200, kritik: 3000, rezerve: 1500, depo: 'Merkez Depo', sonHareket: '2026-08-18', birimFiyat: 42 }
  ];

  const siparisler = [
    { no: 'SIP-3301', tedarikci: 'Batı Çimento', malzeme: 'Çimento CEM I 42.5R', miktar: '120 ton', tutar: 582000, siparis: '2026-08-10', teslim: '2026-08-27', durum: 'Yolda', ilerleme: 70 },
    { no: 'SIP-3302', tedarikci: 'Demirsan Metal', malzeme: 'İnşaat Demiri 12mm', miktar: '80 ton', tutar: 2272000, siparis: '2026-08-12', teslim: '2026-08-26', durum: 'Yolda', ilerleme: 55 },
    { no: 'SIP-3303', tedarikci: 'Yalıtım Market', malzeme: 'XPS Levha 8cm', miktar: '2400 m2', tutar: 744000, siparis: '2026-08-14', teslim: '2026-09-02', durum: 'Onaylandı', ilerleme: 30 },
    { no: 'SIP-3304', tedarikci: 'Anadolu Seramik', malzeme: 'Seramik 60x60', miktar: '1800 m2', tutar: 1116000, siparis: '2026-08-05', teslim: '2026-08-20', durum: 'Teslim Edildi', ilerleme: 100 },
    { no: 'SIP-3305', tedarikci: 'Poliboru A.Ş.', malzeme: 'PPRC Boru 32mm', miktar: '3000 m', tutar: 288000, siparis: '2026-08-18', teslim: '2026-09-08', durum: 'Gecikmeli', ilerleme: 20 },
    { no: 'SIP-3306', tedarikci: 'Volt Kablo', malzeme: 'NYA Kablo 3x2.5', miktar: '10000 m', tutar: 420000, siparis: '2026-08-21', teslim: '2026-09-05', durum: 'Onay Bekliyor', ilerleme: 10 }
  ];

  const raporlar = [
    { id: 'RPR-501', ad: 'Aylık Üst Yönetim Özeti', hedef: 'Üst Yetkili', kapsam: 'Tüm Projeler', periyot: 'Aylık', sonGonderim: '2026-08-01', kanal: 'E-posta + PDF', icerik: ['Nakit akışı', 'Hakediş özeti', 'Risk matrisi', 'İlerleme eğrisi'] },
    { id: 'RPR-502', ad: 'Haftalık Saha İlerleme Raporu', hedef: 'Üst Yetkili', kapsam: 'PRJ-01', periyot: 'Haftalık', sonGonderim: '2026-08-18', kanal: 'Panel', icerik: ['İmalat miktarları', 'Kalite skorları', 'İş gücü'] },
    { id: 'RPR-503', ad: 'Taşeron Bilgi Raporu', hedef: 'Alt Taşeron', kapsam: 'TSR-01', periyot: 'Haftalık', sonGonderim: '2026-08-19', kanal: 'Portal', icerik: ['Onaylanan metraj', 'Hakediş durumu', 'Kalite uyarıları'] },
    { id: 'RPR-504', ad: 'Malzeme ve Tedarik Bülteni', hedef: 'Alt Taşeron', kapsam: 'Tüm Projeler', periyot: 'Haftalık', sonGonderim: '2026-08-20', kanal: 'Portal', icerik: ['Kritik stok', 'Bekleyen sipariş', 'Teslim takvimi'] }
  ];

  /* Platformdaki hakediş hacminin yillara gore buyumesi (yay grafik) */
  const buyume = [
    { yil: 2023, deger: 42 },
    { yil: 2024, deger: 68 },
    { yil: 2025, deger: 88 },
    { yil: 2026, deger: 100 }
  ];

  return { projeler, paftalar, metraj, taseronlar, YETKI_LISTESI, kaliteKontrol, hakedisler, stok, siparisler, raporlar, buyume };
})();
