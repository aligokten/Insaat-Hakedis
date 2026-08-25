# İnşaat Hakediş Paneli

Referans dashboard tasarımının (yumuşak gri-beyaz zemin, kapsül navigasyon, turuncu
vurgu, yay grafik ve donut ilerleme kartları) inşaat proje yönetimi için klonlanmış hâli.

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
| **Projeler & DWG** | Mimari/statik pafta yükleme (sürükle-bırak), kat planı · kesit · görünüş · detay · kalıp planı sınıflandırması, katman/ölçek/revizyon takibi, işleme hattı |
| **Metraj** ✅ | Poz ekleme/düzenleme/silme, proje filtresi, otomatik tutar hesabı, manuel doğrulama, CSV dışa aktarma |
| **Taşeronlar** | Alt yüklenici kartları, sözleşme/SGK durumu ve modül bazlı yetki anahtarları (metraj görüntüleme, DWG indirme, hakediş hazırlama, kalite formu, stok talebi) |
| **Kalite Kontrol** | İmalat bazlı kontrol kayıtları, sonuç (onay/şartlı/red), skor, tamamlanma yüzdesi ve taşeron kalite karnesi |
| **Hakediş** ✅ | Metraj kalemlerinden hakediş oluşturma (canlı tutar özeti), kesinti/avans/KDV hesabı, Taslak → Kontrolde → Onay Bekliyor → Onaylandı akışı, red gerekçesi, kalem detayı ve CSV |
| **Stok** | Depo bazlı mevcut/rezerve/kullanılabilir miktar, kritik seviye uyarısı ve sipariş önerileri |
| **Tedarik** | Satın alma siparişlerinin onay–sevkiyat–teslim takibi ve teslim takvimi |
| **Raporlar** | Üst yetkiliye yönetim özeti ve alt taşerona bilgi raporu; portföy ilerlemesi, nakit akış projeksiyonu, risk gündemi |

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

- ✅ **Bağlandı:** Metraj, Hakediş, taşeron yetkileri, pafta kaydı (üstveri), veri yönetimi
- ⏳ **Sırada:** Pafta dosya saklama (IndexedDB), Kalite Kontrol, Stok, Tedarik, Raporlama
