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

  /* Stok giris/cikis hareketleri */
  const hareketler = [
    { malzeme: 'MLZ-001', tur: 'Giriş', miktar: 120, tarih: '2026-08-23', aciklama: 'SIP-3301 kısmi teslimat', kaynak: 'Tedarik' },
    { malzeme: 'MLZ-003', tur: 'Çıkış', miktar: 1800, tarih: '2026-08-21', aciklama: '3. kat duvar imalatı', kaynak: 'Saha' },
    { malzeme: 'MLZ-005', tur: 'Çıkış', miktar: 640, tarih: '2026-08-22', aciklama: '2. kat seramik kaplama', kaynak: 'Saha' },
    { malzeme: 'MLZ-002', tur: 'Çıkış', miktar: 24, tarih: '2026-08-24', aciklama: 'Perde donatı imalatı', kaynak: 'Saha' },
    { malzeme: 'MLZ-007', tur: 'Giriş', miktar: 3000, tarih: '2026-08-18', aciklama: 'Devir sayımı', kaynak: 'Sayım' }
  ];

  const siparisler = [
    { no: 'SIP-3301', tedarikci: 'Batı Çimento', malzeme: 'Çimento CEM I 42.5R', miktar: '120 ton', tutar: 582000, siparis: '2026-08-10', teslim: '2026-08-27', durum: 'Yolda', ilerleme: 70 },
    { no: 'SIP-3302', tedarikci: 'Demirsan Metal', malzeme: 'İnşaat Demiri 12mm', miktar: '80 ton', tutar: 2272000, siparis: '2026-08-12', teslim: '2026-08-26', durum: 'Yolda', ilerleme: 55 },
    { no: 'SIP-3303', tedarikci: 'Yalıtım Market', malzeme: 'XPS Levha 8cm', miktar: '2400 m2', tutar: 744000, siparis: '2026-08-14', teslim: '2026-09-02', durum: 'Onaylandı', ilerleme: 30 },
    { no: 'SIP-3304', tedarikci: 'Anadolu Seramik', malzeme: 'Seramik 60x60', miktar: '1800 m2', tutar: 1116000, siparis: '2026-08-05', teslim: '2026-08-20', durum: 'Teslim Edildi', ilerleme: 100 },
    { no: 'SIP-3305', tedarikci: 'Poliboru A.Ş.', malzeme: 'PPRC Boru 32mm', miktar: '3000 m', tutar: 288000, siparis: '2026-08-18', teslim: '2026-08-19', durum: 'Onaylandı', ilerleme: 30 },
    { no: 'SIP-3306', tedarikci: 'Volt Kablo', malzeme: 'NYA Kablo 3x2.5', miktar: '10000 m', tutar: 420000, siparis: '2026-08-21', teslim: '2026-09-05', durum: 'Onay Bekliyor', ilerleme: 10 }
  ];

  const raporlar = [
    { id: 'RPR-501', ad: 'Aylık Üst Yönetim Özeti', hedef: 'Üst Yetkili', kapsam: 'Tüm Projeler', periyot: 'Aylık', sonGonderim: '2026-08-01', kanal: 'E-posta + PDF', icerik: ['Nakit akışı', 'Hakediş özeti', 'Risk matrisi', 'İlerleme eğrisi'] },
    { id: 'RPR-502', ad: 'Haftalık Saha İlerleme Raporu', hedef: 'Üst Yetkili', kapsam: 'PRJ-01', periyot: 'Haftalık', sonGonderim: '2026-08-18', kanal: 'Panel', icerik: ['İmalat miktarları', 'Kalite skorları', 'İş gücü'] },
    { id: 'RPR-503', ad: 'Taşeron Bilgi Raporu', hedef: 'Alt Taşeron', kapsam: 'TSR-01', periyot: 'Haftalık', sonGonderim: '2026-08-19', kanal: 'Portal', icerik: ['Onaylanan metraj', 'Hakediş durumu', 'Kalite uyarıları'] },
    { id: 'RPR-504', ad: 'Malzeme ve Tedarik Bülteni', hedef: 'Alt Taşeron', kapsam: 'Tüm Projeler', periyot: 'Haftalık', sonGonderim: '2026-08-20', kanal: 'Portal', icerik: ['Kritik stok', 'Bekleyen sipariş', 'Teslim takvimi'] }
  ];



  /* Proje altindaki is kalemleri (imalat paketleri) */
  const isler = [
    { id: 'IS-001', ad: 'B1-B2 perde ve kolon betonarme imalatı', proje: 'PRJ-01', taseron: 'TSR-01',
      mahal: 'A Blok · Bodrum', baslangic: '2026-06-01', bitis: '2026-09-15',
      planlanan: 24500000, ilerleme: 78, durum: 'Devam', sorumlu: 'S. Arslan',
      metrajIds: [], malzemeler: [{ kod: 'MLZ-001', miktar: 90 }, { kod: 'MLZ-002', miktar: 45 }],
      personelIds: ['PRS-001', 'PRS-002', 'PRS-005'] },
    { id: 'IS-002', ad: '3-6. kat duvar örgüsü', proje: 'PRJ-01', taseron: 'TSR-04',
      mahal: 'A Blok · 3-6. Kat', baslangic: '2026-07-10', bitis: '2026-10-30',
      planlanan: 8600000, ilerleme: 45, durum: 'Devam', sorumlu: 'H. Çetin',
      metrajIds: [], malzemeler: [{ kod: 'MLZ-003', miktar: 2200 }],
      personelIds: ['PRS-003', 'PRS-004'] },
    { id: 'IS-003', ad: 'Islak hacim seramik kaplama', proje: 'PRJ-01', taseron: 'TSR-04',
      mahal: 'A Blok · 1-2. Kat', baslangic: '2026-08-01', bitis: '2026-11-20',
      planlanan: 5400000, ilerleme: 22, durum: 'Devam', sorumlu: 'H. Çetin',
      metrajIds: [], malzemeler: [{ kod: 'MLZ-005', miktar: 940 }],
      personelIds: ['PRS-006'] },
    { id: 'IS-004', ad: 'Sıhhi tesisat ana hat montajı', proje: 'PRJ-02', taseron: 'TSR-02',
      mahal: 'Kule 2 · Şaft', baslangic: '2026-07-01', bitis: '2026-09-30',
      planlanan: 12300000, ilerleme: 60, durum: 'Durduruldu', sorumlu: 'S. Korkmaz',
      metrajIds: [], malzemeler: [{ kod: 'MLZ-006', miktar: 300 }],
      personelIds: ['PRS-007'] },
    { id: 'IS-005', ad: 'Kuzey cephe mantolama', proje: 'PRJ-01', taseron: 'TSR-05',
      mahal: 'A Blok · Kuzey cephe', baslangic: '2026-08-15', bitis: '2026-12-15',
      planlanan: 7900000, ilerleme: 12, durum: 'Planlandı', sorumlu: 'E. Yılmaz',
      metrajIds: [], malzemeler: [{ kod: 'MLZ-004', miktar: 800 }],
      personelIds: [] }
  ];

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
  const personel = [
    { id: 'PRS-001', ad: 'Mehmet Aydın', sicil: '1042', gorev: 'Formen', firma: 'TSR-01',
      telefon: '0532 000 10 42', girisTarihi: '2024-03-04', yevmiye: 2400,
      sgkDurum: 'Geçerli', sgkBitis: '2027-03-31', isgTarih: '2026-02-10', isgGecerlilik: '2029-02-10',
      saglikRaporu: '2026-03-01', kanGrubu: '0 Rh+', acilKisi: 'Ayşe Aydın', acilTelefon: '0532 000 10 43',
      durum: 'Aktif', notlar: 'Yüksekte çalışma sertifikası mevcut.' },
    { id: 'PRS-002', ad: 'Hasan Demirtaş', sicil: '1055', gorev: 'Usta', firma: 'TSR-01',
      telefon: '0533 000 10 55', girisTarihi: '2025-01-15', yevmiye: 2100,
      sgkDurum: 'Geçerli', sgkBitis: '2027-01-15', isgTarih: '2025-11-20', isgGecerlilik: '2028-11-20',
      saglikRaporu: '2025-12-05', kanGrubu: 'A Rh+', acilKisi: 'Fatma Demirtaş', acilTelefon: '0533 000 10 56',
      durum: 'Aktif', notlar: 'Kalıp ustası.' },
    { id: 'PRS-003', ad: 'Ramazan Koç', sicil: '1071', gorev: 'Usta', firma: 'TSR-04',
      telefon: '0534 000 10 71', girisTarihi: '2025-06-01', yevmiye: 2050,
      sgkDurum: 'Geçerli', sgkBitis: '2027-06-30', isgTarih: '2023-05-12', isgGecerlilik: '2026-05-12',
      saglikRaporu: '2026-01-18', kanGrubu: 'B Rh-', acilKisi: 'Elif Koç', acilTelefon: '0534 000 10 72',
      durum: 'Aktif', notlar: 'İSG eğitimi yenilenmeli.' },
    { id: 'PRS-004', ad: 'Yusuf Bal', sicil: '1088', gorev: 'Düz İşçi', firma: 'TSR-04',
      telefon: '0535 000 10 88', girisTarihi: '2026-02-10', yevmiye: 1500,
      sgkDurum: 'Geçerli', sgkBitis: '2027-02-10', isgTarih: '2026-02-12', isgGecerlilik: '2029-02-12',
      saglikRaporu: '2026-02-11', kanGrubu: 'A Rh-', acilKisi: 'Zeynep Bal', acilTelefon: '0535 000 10 89',
      durum: 'Aktif', notlar: '' },
    { id: 'PRS-005', ad: 'Serkan Uçar', sicil: '1090', gorev: 'Operatör', firma: 'Kendi bünyemiz',
      telefon: '0536 000 10 90', girisTarihi: '2023-09-20', yevmiye: 2800,
      sgkDurum: 'Geçerli', sgkBitis: '2027-09-20', isgTarih: '2025-08-01', isgGecerlilik: '2028-08-01',
      saglikRaporu: '2026-04-02', kanGrubu: '0 Rh-', acilKisi: 'Nur Uçar', acilTelefon: '0536 000 10 91',
      durum: 'Aktif', notlar: 'Kule vinç operatörü, G sınıfı belge.' },
    { id: 'PRS-006', ad: 'İbrahim Şahin', sicil: '1103', gorev: 'Kalfa', firma: 'TSR-04',
      telefon: '0537 000 11 03', girisTarihi: '2025-10-05', yevmiye: 1850,
      sgkDurum: 'Süresi Doldu', sgkBitis: '2026-08-01', isgTarih: '2025-10-06', isgGecerlilik: '2028-10-06',
      saglikRaporu: '2025-10-06', kanGrubu: 'AB Rh+', acilKisi: 'Hatice Şahin', acilTelefon: '0537 000 11 04',
      durum: 'Aktif', notlar: 'SGK evrakı yenilenmeli.' },
    { id: 'PRS-007', ad: 'Kemal Aslan', sicil: '1115', gorev: 'Usta', firma: 'TSR-02',
      telefon: '0538 000 11 15', girisTarihi: '2026-04-12', yevmiye: 2250,
      sgkDurum: 'Geçerli', sgkBitis: '2027-04-12', isgTarih: '2026-04-13', isgGecerlilik: '2029-04-13',
      saglikRaporu: '2026-04-13', kanGrubu: 'B Rh+', acilKisi: 'Sevgi Aslan', acilTelefon: '0538 000 11 16',
      durum: 'İzinli', notlar: 'Mekanik tesisat ustası.' },
    { id: 'PRS-008', ad: 'Ali Doğan', sicil: '1120', gorev: 'Şantiye Şefi', firma: 'Kendi bünyemiz',
      telefon: '0539 000 11 20', girisTarihi: '2022-05-02', yevmiye: 4200,
      sgkDurum: 'Geçerli', sgkBitis: '2028-05-02', isgTarih: '2026-01-15', isgGecerlilik: '2029-01-15',
      saglikRaporu: '2026-01-16', kanGrubu: 'A Rh+', acilKisi: 'Merve Doğan', acilTelefon: '0539 000 11 21',
      durum: 'Aktif', notlar: 'İnşaat mühendisi.' }
  ];

  /* Gunluk puantaj kayitlari */
  const puantaj = [
    { personel: 'PRS-001', tarih: '2026-08-24', durum: 'Tam gün', is: 'IS-001', aciklama: '' },
    { personel: 'PRS-002', tarih: '2026-08-24', durum: 'Fazla mesai', is: 'IS-001', aciklama: 'Beton dökümü' },
    { personel: 'PRS-003', tarih: '2026-08-24', durum: 'Tam gün', is: 'IS-002', aciklama: '' },
    { personel: 'PRS-004', tarih: '2026-08-24', durum: 'Yarım gün', is: 'IS-002', aciklama: 'Öğleden sonra ayrıldı' },
    { personel: 'PRS-005', tarih: '2026-08-24', durum: 'Tam gün', is: 'IS-001', aciklama: '' },
    { personel: 'PRS-006', tarih: '2026-08-24', durum: 'Devamsız', is: 'IS-003', aciklama: 'Bildirimsiz' },
    { personel: 'PRS-007', tarih: '2026-08-24', durum: 'İzinli', is: 'IS-004', aciklama: 'Yıllık izin' },
    { personel: 'PRS-008', tarih: '2026-08-24', durum: 'Tam gün', is: '', aciklama: '' },
    { personel: 'PRS-001', tarih: '2026-08-23', durum: 'Tam gün', is: 'IS-001', aciklama: '' },
    { personel: 'PRS-002', tarih: '2026-08-23', durum: 'Tam gün', is: 'IS-001', aciklama: '' },
    { personel: 'PRS-003', tarih: '2026-08-23', durum: 'Tam gün', is: 'IS-002', aciklama: '' },
    { personel: 'PRS-006', tarih: '2026-08-23', durum: 'Tam gün', is: 'IS-003', aciklama: '' }
  ];

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

  /* Platformdaki hakediş hacminin yillara gore buyumesi (yay grafik) */
  const buyume = [
    { yil: 2023, deger: 42 },
    { yil: 2024, deger: 68 },
    { yil: 2025, deger: 88 },
    { yil: 2026, deger: 100 }
  ];

  return { projeler, paftalar, metraj, taseronlar, isler, personel, puantaj,
           YETKI_LISTESI, KALITE_SABLON, KALITE_ESIK, PERSONEL_GOREV, PUANTAJ_DURUM,
           kaliteKontrol, hakedisler, stok, hareketler, siparisler, raporlar, buyume };
})();
