# İnşaat Hakediş Paneli

Referans dashboard tasarımının (kapsül navigasyon, turuncu vurgu, yay grafik ve donut
ilerleme kartları) inşaat proje yönetimi için klonlanmış hâli; **Liquid Glass** temasıyla.

**Canlı:** https://aligokten.github.io/Insaat-Hakedis/

Bağımlılığı yok — `index.html` dosyasını tarayıcıda açmanız da yeterli.

```
git clone <repo> && cd Insaat-Hakedis
# tarayıcıda index.html
# veya: python3 -m http.server 8000
```

## Modüller

| Modül | Ne yapar |
|---|---|
| **Genel Bakış** | Portföy özeti, hakediş hacmi yay grafiği, proje tamamlanma kartları, KPI'lar |
| **Projeler & DWG** ✅ | Dosyayı gerçekten saklar (IndexedDB), indirir, siler; DXF'i ayrıştırıp katman/geometri/ölçüm çıkarır ve vektör önizleme çizer; DWG'nin gömülü küçük resmini ve sürümünü okur; katman ölçüsünü tek tıkla metraja aktarır |
| **İşler** ✅ | Proje altında iş paketi ekle/düzenle/sil; taşeron ataması, personel görevlendirmesi, malzeme tahsisi (stokta rezerve ayırır), metraj kalemi bağlama, ilerleme ve termin takibi, CSV |
| **Personel** ✅ | Özlük kartı (SGK, İSG, sağlık raporu, kan grubu, acil durum), evrak geçerlilik uyarıları, görevli olduğu işler, günlük puantaj ve hak ediş hesabı, toplu puantaj, CSV |
| **Metraj** ✅ | Poz ekleme/düzenleme/silme, proje filtresi, otomatik tutar hesabı, manuel doğrulama, CSV dışa aktarma |
| **Taşeronlar** ✅ | Taşeron ekle/düzenle/sil (bağlı kayıt uyarısıyla), sözleşme/SGK durumu ve modül bazlı yetki anahtarları |
| **Kalite Kontrol** ✅ | İmalat türüne göre kontrol şablonları, madde bazlı Uygun / Uygun Değil / Kapsam Dışı işaretleme, ağırlıklı otomatik puanlama ve sonuç önerisi, saha fotoğrafı ekleme, sapma notları, yeniden kontrol zinciri, taşeron karnesi, CSV |
| **Hakediş** ✅ | Metraj kalemlerinden hakediş oluşturma (canlı tutar özeti), kesinti/avans/KDV hesabı, Taslak → Kontrolde → Onay Bekliyor → Onaylandı akışı, red gerekçesi, kalem detayı ve CSV |
| **Stok** ✅ | Malzeme kartı ekle/düzenle/sil, depo filtresi, giriş · çıkış · rezerve · sayım hareketleri (sınır kontrollü), hareket geçmişi, kritik seviye uyarısı, CSV |
| **Tedarik** ✅ | Sipariş oluştur/düzenle/sil, Onay Bekliyor → Onaylandı → Yolda → Teslim Edildi akışı, teslim alındığında otomatik stok girişi, tarihe göre otomatik gecikme, teslim takvimi, CSV |
| **Raporlar** ✅ | Dört rapor türü panel verisinden anlık üretilir (Üst Yönetim Özeti, Taşeron Bilgi Raporu, Personel ve Puantaj Raporu, Malzeme ve Tedarik Bülteni); A4 düzeninde yazdırılabilir çıktı (Yazdır → PDF) veya CSV, imza blokları dâhil |

Sağ üstteki **Yönetici / Taşeron** anahtarı rolü değiştirir; taşeron rolünde hakediş
onay butonları gizlenir.

## Dosya yapısı

```
index.html               iskelet (topbar, ikon rayı, görünüm konteyneri)
assets/css/style.css     tasarım sistemi: renk/tipografi token'ları, kart, tablo, rozet, grafik stilleri
assets/js/data.js        demo veri katmanı (projeler, paftalar, metraj, taşeron, kalite, hakediş, stok, sipariş, rapor)
assets/js/ui.js          ikon seti, TR sayı/para biçimlendirme, donut · yay · çizgi · sütun grafik üreticileri
assets/js/app.js         hash tabanlı yönlendirici, dokuz görünüm ve etkileşimler
```

## Notlar

- Veriler `assets/js/data.js` içindeki mock veri kümesinden gelir; gerçek kullanımda
  bu nesnenin yerine bir API katmanı geçirilmelidir.
- Pafta yükleme tarayıcı içinde çalışır (dosya adından tür/disiplin tahmini yapılır),
  dosyalar sunucuya gönderilmez. Gerçek DWG ayrıştırma için sunucu tarafında bir
  CAD kütüphanesi (ör. ODA File Converter, Teigha) gerekir.
- Grafikler harici kütüphane olmadan, elle üretilen SVG ile çizilir.

## Yayın

Site GitHub Pages üzerinden `gh-pages` dalından yayınlanır.
`main` dalına yapılan her push'ta `.github/workflows/pages.yml` iş akışı
`gh-pages` dalını günceller ve GitHub Pages siteyi yeniden yayınlar
(genellikle 1-2 dakika içinde).

## Liquid Glass teması

Arka planda sabit duran yumuşak renk kümeleri (`body::before`) tüm yüzeylerin altında bir
renk zemini oluşturur. Panel yüzeyleri — kartlar, navigasyon, ikon rayı, çipler, diyaloglar —
yarı saydam dolgu + `backdrop-filter: saturate(180%) blur(20px)` ile bu zemini bulanıklaştırıp
doygunlaştırarak gösterir; böylece her yüzey bulunduğu yerin rengini alır. Derinlik üç katmanla
kurulur: üst kenarda ince ışık yansıması (`::before` sheen), içeriden aydınlatan `inset`
kenar çizgisi ve aşağıya doğru açılan yumuşak gölge.

Token'lar `:root` içinde toplanmıştır: `--glass`, `--glass-strong`, `--glass-fill` (üstten alta
azalan dolgu), `--glass-border`, `--glass-hi`, `--blur`, `--shadow-glass`. Bir yüzeyi cama
çevirmek için bu token'ları kullanmak yeterlidir.

## Veri katmanı

Kayıtlar tarayıcının `localStorage` alanında (`insaat-hakedis:v1` anahtarı) saklanır;
ilk açılışta `assets/js/data.js` içindeki örnek veri tohum olarak yazılır.
Sol raydaki veritabanı simgesi **Veri yönetimi** panelini açar: JSON yedek indirme,
yedekten geri yükleme ve örnek veriye sıfırlama.

Veri her kullanıcının kendi tarayıcısında kalır — cihazlar arasında paylaşılmaz.
Ortak veri tabanı gerektiğinde `assets/js/store.js` içindeki `Store` API'si
(`get / bul / ekle / guncelle / sil / abone`) bir sunucu istemcisiyle
değiştirilecek şekilde tasarlandı; görünüm kodunda değişiklik gerekmez.

### Modül durumu

Tüm modüller bağlı; panelde demo amaçlı bırakılmış işlev kalmadı.

## İş paketi ve kaynak atama

Bir **iş**, projenin altındaki imalat paketidir (örn. "3-6. kat duvar örgüsü"). İş kartından:

- **Taşeron** atanır, saha sorumlusu ve termin girilir.
- **Personel** görevlendirilir; kişi kartındaki "görevli olduğu işler" listesi otomatik güncellenir.
- **Malzeme tahsis edilir**: tahsis edilen miktar stokta *rezerve* olarak ayrılır, bir stok
  hareketi yazılır ve kullanılabilir miktardan düşer. Tahsis kaldırılınca rezerve serbest bırakılır.
- **Metraj kalemi bağlanır**; işin metraj karşılığı, malzeme tahsisi ve puantajdan gelen işgücü
  maliyeti detay penceresinde birlikte görünür.

## Puantaj ve hak ediş

Puantaj durumları katsayılıdır: Tam gün 1 · Yarım gün 0,5 · Fazla mesai 1,5 ·
İzinli / Raporlu / Devamsız 0. Kişinin hak edişi *yevmiye günü × günlük yevmiye* olarak
hesaplanır; işin işgücü maliyeti o işe yazılan puantajlardan toplanır.

Özlük evrakları izlenir: SGK geçersiz ya da 30 günden az kalmışsa, İSG eğitimi süresi dolmuş
ya da 60 günden az kalmışsa, sağlık raporu bir yılı aşmışsa uyarı üretilir; bu uyarılar
personel ekranında, personel kartında ve raporların risk gündeminde görünür.

## Raporlar

Raporlar sabit metin değildir — çağrıldığı anda depodaki veriden üretilir. "Raporu aç" sayfadan
ayrılmadan bir pencere açar; arka plandaki panel bulanıklaşır. Pencerede özet kutuları, bölüm
tabloları ve imza blokları yer alır.

**Yazdır / PDF** düğmesi pencereyi kapatmadan tarayıcının yazdırma iletişimini açar;
`@media print` kuralları panelin tamamını gizleyip yalnızca rapor gövdesini A4 düzeninde,
beyaz zeminde kağıda gönderir. Aynı rapor CSV olarak da indirilebilir.

## Stok ve tedarik akışı

Kritik seviyeye düşen malzemede **Talep** düğmesi, eksik miktarın %20 emniyet payıyla
hesaplanmış ön dolu bir sipariş formu açar. Sipariş
`Onay Bekliyor → Onaylandı → Yolda → Teslim Edildi` akışında ilerler; onay adımı yalnızca
yönetici rolünde görünür. Teslim alma penceresinde girilen irsaliye miktarı, sipariş bir
stok kartına bağlıysa **otomatik stok girişine** dönüşür ve hareket geçmişine yazılır.

Teslim tarihi geçmiş ve tamamlanmamış siparişler listede otomatik **Gecikmeli** gösterilir;
bu türetilmiş bir durumdur, siparişin akışını kilitlemez.

Stok hareketleri (Giriş, Çıkış, Rezerve, Rezerve İptal, Sayım Düzeltme) sınır kontrollüdür:
çıkış ve rezerve, kullanılabilir miktarı (mevcut − rezerve) aşamaz.

## Kalite puanlama

Puan = *uygun işaretlenen maddelerin ağırlık toplamı* / *kapsamdaki toplam ağırlık* × 100.
“Kapsam dışı” maddeler paydaya girmez. Sonuç otomatik önerilir: **%90+** Onaylandı,
**%60–89** Şartlı Onay, **%60 altı** Red.

Şablonlar `assets/js/data.js` içindeki `KALITE_SABLON` nesnesinde tanımlıdır
(Beton Dökümü, Duvar Örgüsü, Sıva ve Alçı, Seramik Kaplama, Mekanik Tesisat,
Elektrik Tesisatı, Cephe Mantolama). Yeni şablon eklemek için bu nesneye
`'Şablon adı': [{ ad, agirlik }, …]` girdisi eklemek yeterlidir.

Red veya Şartlı Onay alan kayıtlar “açık sapma” sayılır; yeniden kontrol yapıldığında
eski kayda bağlanır ve açık sapma listesinden düşer. Hakediş oluştururken seçilen
taşeronun açık sapmaları uyarı olarak gösterilir.

## Pafta formatları

| Format | Ne yapılır | Nasıl |
|---|---|---|
| **DXF** | Tam okuma | ASCII DXF ayrıştırılır: `HEADER` ($ACADVER, $INSUNITS, $EXTMIN/$EXTMAX), `TABLES`'tan katmanlar, `ENTITIES`'ten LINE / LWPOLYLINE / POLYLINE / CIRCLE / ARC / TEXT. Katman başına uzunluk ve kapalı polyline alanı (shoelace) hesaplanır, çizim birimi metreye çevrilir, geometri canvas'a çizilir. |
| **DWG** | Sürüm + gömülü önizleme | DWG başlığındaki sürüm kodu (AC1015…AC1032) ve 0x0D adresindeki önizleme bölümü okunur; gömülü BMP/PNG küçük resmi çıkarılır (BMP için dosya başlığı yeniden kurulur). |
| **PDF** | Arşiv | Saklanır ve indirilir. |

**DWG geometrisi tarayıcıda okunamaz.** DWG kapalı bir ikili formattır; açık bir JavaScript
ayrıştırıcısı yoktur. Metraj çıkarımı için CAD programından aynı çizimi **DXF** olarak dışa
aktarın (AutoCAD: `SAVEAS` → DXF; ArchiCAD/Revit: DXF dışa aktarım). Sunucu tarafında ODA File
Converter gibi bir dönüştürücü eklenirse DWG→DXF dönüşümü otomatikleştirilebilir.

Dosya içerikleri IndexedDB'de (`insaat-hakedis-dosya`) saklanır, sunucuya gönderilmez.
Aynı ada sahip dosya yeniden yüklendiğinde revizyon harfi ilerler (A → B → C).
