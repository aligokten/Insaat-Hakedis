# Çok kullanıcılı kurulum (Supabase)

Panel varsayılan olarak **yerel modda** çalışır: veriler yalnızca o tarayıcıda durur.
Aşağıdaki adımlardan sonra **ortak moda** geçer — herkes aynı veriyi görür, bir
kullanıcının kaydettiği değişiklik diğerlerinin ekranına anlık yansır.

Süre: yaklaşık 10 dakika. Ücretsiz Supabase planı bu panel için yeterlidir.

---

## 1. Supabase projesi oluşturun

1. https://supabase.com adresinde ücretsiz hesap açın.
2. **New project** → bir ad ve veritabanı şifresi verin, bölge olarak size en
   yakınını (örn. Frankfurt) seçin. Proje birkaç dakikada hazır olur.

## 2. Şemayı kurun

1. Sol menüden **SQL Editor** → **New query**.
2. Bu depodaki `supabase/sema.sql` dosyasının tamamını yapıştırın → **Run**.

Bu adım `kayitlar` tablosunu, yetki fonksiyonlarını, satır bazlı güvenlik (RLS)
kurallarını ve anlık yayını kurar.

## 3. Kimlik doğrulama ayarları

**Authentication → Providers → Email**

- **Confirm email** seçeneğini **kapatın**. Panel kullanıcı kodlarını
  `kod@alanadi` biçiminde teknik bir e-postaya çevirir; gerçek posta kutusu yoktur,
  onay e-postası kimseye ulaşmaz. Kapatılmazsa yeni kullanıcılar giriş yapamaz.
- **Enable email provider** açık kalmalı.

> Kayıt olma (sign-up) açık kalır; bu gereklidir, çünkü panelden kullanıcı
> eklerken hesap bu uçtan açılır. Kendiliğinden kayıt olan biri **hiçbir veri
> göremez**: okuma izni, panelde tanımlı ve aktif bir kullanıcı kaydı olmasına
> bağlıdır (bkz. `kayitlar_oku` politikası).

## 4. Bağlantı bilgilerini panele girin

**Project Settings → API** ekranından iki değeri alın:

- **Project URL** — `https://xxxxxxxx.supabase.co`
- **anon public** anahtarı

İki yol var:

**a) Tüm ekip için kalıcı (önerilen).** `assets/js/yapilandirma.js` dosyasını
düzenleyip depoya gönderin:

```js
window.YAPILANDIRMA = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseAnonAnahtar: 'eyJhbGciOi...',
  girisAlanAdi: 'panel.saggplus.com'
};
```

Yayın akışı (GitHub Actions) değişikliği otomatik yayına alır; herkes siteyi
açtığında ortak moda bağlanır.

**b) Yalnızca kendi tarayıcınızda denemek için.** Panelde
**Kullanıcılar → Bulut bağlantısı → Bağlantıyı yapılandır** ile aynı iki değeri
girin. Bu ayar yalnızca o tarayıcıda geçerlidir.

> anon anahtarı gizli değildir, tarayıcıya iner ve öyle olması beklenir.
> Güvenlik RLS kurallarıyla sağlanır. **service_role** anahtarını asla panele
> veya depoya koymayın.

## 5. İlk yöneticiyi oluşturun

Paneli açın → giriş ekranında **"yönetici hesabı oluşturun"** bağlantısı.
Ad, kullanıcı kodu ve şifre girin. Bu hesap **Sistem Yöneticisi** olur.

Sonrasında **Kullanıcılar → Kullanıcı ekle** ile ekip arkadaşlarınızı
ekleyin; her birine kullanıcı kodu, şifre ve rol verin. Kullanıcı kodu ve
şifreyi kendilerine siz iletirsiniz.

## 6. (Varsa) mevcut verinizi taşıyın

Paneli daha önce yerel modda kullandıysanız, o tarayıcıda
**Kullanıcılar → Bulut bağlantısı → Yerel veriyi buluta taşı** düğmesi
kayıtları sunucuya kopyalar. Kullanıcı hesapları taşınmaz; onları 5. adımdaki
gibi yeniden tanımlayın.

---

## Nasıl çalışır

| Konu | Davranış |
|---|---|
| Veri | Tüm kayıtlar `public.kayitlar` tablosunda: `koleksiyon` + `kayit_id` + `veri` (jsonb) |
| Okuma | Panel açılışta tüm kayıtları çeker, bellekte tutar; ekranlar bu önbellekten çizilir |
| Yazma | Önce ekranda uygulanır, hemen ardından sunucuya yazılır; sunucu reddederse uyarı çıkar |
| Anlık yayın | Supabase Realtime aboneliği; kanal kurulamazsa 12 saniyede bir yoklamaya düşer |
| Yetki | Menü ve düğmeler panelde gizlenir **ve** yazma isteği sunucuda RLS ile ayrıca denetlenir |
| Oturum | Supabase Auth (kullanıcı kodu + şifre); jeton tarayıcıda tutulur, süresi dolunca yenilenir |

## Sınırlar

- **Dosya içerikleri buluta gönderilmez.** DWG/DXF/PDF/görseller yükleyen kişinin
  tarayıcısındaki IndexedDB'de kalır. Diğer kullanıcılar dosyanın künyesini,
  ölçümlerini ve küçük resmini görür; içeriğini açmak isterse "dosya bu
  bilgisayarda yok" uyarısı alır. Dosyaların da ortak olması istenirse Supabase
  Storage eklenebilir.
- **Şifre sıfırlama** panelden yapılamaz (bunun için gizli `service_role`
  anahtarı gerekir, o da statik siteye konulamaz). Kullanıcı kendi şifresini
  panelden değiştirebilir; unutulan şifre Supabase panelinden
  (Authentication → Users) sıfırlanır.
- **Kullanıcı silme** panel erişimini hemen kapatır; sunucudaki oturum hesabının
  tamamen silinmesi Supabase panelinden yapılır.
- Rol şablonları iki yerde tanımlıdır: `assets/js/yetki.js` (arayüz) ve
  `supabase/sema.sql` içindeki `rol_izinleri()` (sunucu). Rolleri değiştirirseniz
  **ikisini birden** güncelleyin.

## Sorun giderme

| Belirti | Sebep / çözüm |
|---|---|
| "Sunucuya bağlanılamadı" | URL/anahtar hatalı ya da internet yok. Kullanıcılar → Bulut bağlantısı ayarlarını kontrol edin. |
| "Kullanıcı kodu veya şifre hatalı" | Kod büyük/küçük harf duyarsızdır; şifre yanlış olabilir. |
| "Hesap henüz onaylanmamış" | 3. adımdaki **Confirm email** kapatılmamış. |
| Giriş oluyor ama liste boş | Hesap Supabase'de var, panelde kullanıcı kaydı yok. Yönetici **Kullanıcı ekle** ile aynı kodu tanımlamalı. |
| "Kayıt sunucuya yazılamadı" | RLS o modülde yazma izni vermiyor. Kullanıcının rolünü/izinlerini kontrol edin. |
| Değişiklikler geç görünüyor | Realtime kapalıysa panel 12 saniyelik yoklamaya düşer. Supabase → Database → Replication'da `kayitlar` tablosunun yayında olduğunu doğrulayın. |
