# Villa Proje Yönetimi

Anahtar teslim villa projelerinin **maliyet, hakediş, iş takip, tedarik, sipariş ve cari**
işlemlerini tek ekrandan takip etmek için hazırlanmış bağımsız bir programdır.
Ana dizindeki DWG/metraj tabanlı "Proje Hakediş Paneli" ile hiçbir dosyayı paylaşmaz;
tek bir `index.html` dosyasından ibarettir.

## Modüller

| Modül | İçerik |
|---|---|
| **Panel** | Aktif projenin bütçe / gerçekleşen maliyet / ödenen / borç özetleri, imalat grubu bazlı maliyet dağılımı, iş ilerlemesi, geciken işler, bekleyen teslimatlar, ödenmemiş hakedişler, cari bakiyeler |
| **Projeler** | Sınırsız proje ekleme. İşveren, adres, arsa/inşaat alanı, tarihler, hedef bütçe, satış bedeli, durum. Üst bandaki seçiciden proje değiştirilir; "Tüm Projeler" portföy özetini açar |
| **Cari Kartlar** | Taşeron, malzeme tedarikçisi, işçi/usta, nakliyeci, iş makinesi kiralama, müşavir. İletişim, vergi bilgisi, IBAN, günlük ücret, değerlendirme puanı ve **cari ekstre** (borç / ödeme / bakiye) |
| **Maliyet / Bütçe** | Keşif ve hedef maliyet kalemleri (imalat grubu, birim, miktar, birim fiyat) |
| **Sözleşmeler** | Taşeron/tedarikçi sözleşmeleri; bedel, süre, teminat ve stopaj oranları, hakediş gerçekleşme yüzdesi |
| **Hakedişler** | İmalat satırlı hakediş düzenleme, bütçe kalemlerinden satır aktarma, teminat / stopaj / avans / diğer kesintiler ve net ödenecek tutar. Taslak → Onayda → Onaylandı → Ödendi akışı |
| **Ödemeler** | Cari bazlı ödeme kaydı; hakedişten tek tuşla ödeme ve otomatik "Ödendi" işaretleme |
| **Genel Masraflar** | Ruhsat, harç, şantiye gideri gibi cariye bağlı olmayan giderler |
| **Sipariş / Tedarik** | Malzeme ve nakliye siparişleri, planlanan teslim tarihi, gecikme uyarısı, tek tuşla teslim alma |
| **İş Takip** | Şantiye iş programı: aşama, taşeron, tarih, ilerleme %, öncelik, durum. Liste ve **zaman çizelgesi** görünümü |
| **Raporlar** | Maliyet analizi (bütçe/gerçekleşen/fark), cari bakiye listesi, aylık nakit akışı, hakediş özeti. Yazdır / PDF |
| **Ayarlar / Yedek** | Firma bilgisi, JSON yedek indirme ve geri yükleme, CSV dışa aktarma, örnek veri, tüm veriyi silme |

## Kullanım

1. Sayfayı açın, **Örnek veri yükle** ile programı deneyin veya doğrudan **+ Proje** ile başlayın.
2. Cari kartları (taşeron, tedarikçi, işçi, nakliyeci) tanımlayın.
3. Bütçe kalemlerini girin, sözleşmeleri açın, hakediş ve siparişleri işleyin.
4. **Ayarlar → Yedek indir** ile düzenli yedek alın.

## Veri saklama

Tüm veriler tarayıcının `localStorage` alanında (`villa-yonetim-v1` anahtarı) saklanır;
hiçbir sunucuya gönderilmez. Başka bir bilgisayara taşımak için JSON yedeğini indirip
oradan geri yükleyin.

## Teknik

Bağımlılık yok: tek dosya, saf HTML + CSS + JavaScript. Dosyayı çift tıklayarak da açabilirsiniz.
Renkler `:root` altındaki CSS değişkenleriyle, modüller `MODULLER` dizisiyle yönetilir;
arayüz tasarımı bu iki yerden kolayca değiştirilebilir.
