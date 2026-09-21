# Metraj Çizim ve Katman Standardı

Bu belge, **Keşif & Maliyet** modülünün mimari projeden otomatik metraj
çıkarabilmesi için gereken çizim kurallarını tanımlar.

Amaç mimari projenizin çizim alışkanlıklarını değiştirmek değildir. Uygulama
projesi her zamanki gibi çizilir; metraj için o projeden **türetilen ayrı bir
dosya** hazırlanır. Bu dosya 20 dakikalık bir işlemdir ve her revizyonda
tekrarlanır.

---

## 1. Neden ayrı bir dosya

Tipik bir uygulama projesi DXF'i, kat planlarını, kesitleri, görünüşleri,
vaziyet planını ve detayları **tek koordinat alanında yan yana** taşır.
Otomatik metraj bu dosyada üç nedenle çalışmaz:

| Sorun | Sonuç |
|---|---|
| Aynı dosyada 1/50, 1/100, 1/200 ölçekli paftalar | Tek birim katsayısı yok; vaziyet planındaki duvar, kat planındakinin 4 katı uzunlukta okunur |
| Kesit ve görünüş paftaları | Cephedeki çizgiler de "duvar" sayılır, metraj 2–3 katına çıkar |
| Her katın planı aynı dosyada | Kat sayısı bilinemez, alanlar toplanır |
| Üst üste binmiş kopya çizgiler | Her uzunluk iki kez sayılır |

Panel bu durumları algılar ve *"Bu dosya metraja uygun değil"* uyarısı verir.
Uyarıyı görüyorsanız aşağıdaki adımları uygulayın.

---

## 2. Metraj dosyasının kuralları

### 2.1 Kapsam — her kat için bir dosya

Her kat **ayrı bir DXF** olur. Panelde her biri ayrı pafta olarak yüklenir;
okuma sırasında "bu plan kaç katta tekrarlıyor?" sorusuna normal kat sayısı
girilir.

```
MTR_BODRUM.dxf
MTR_ZEMIN.dxf
MTR_NORMAL_KAT.dxf      (tip kat — 4 katta tekrarlıyorsa bir kez çizilir)
MTR_CATI.dxf
MTR_VAZIYET.dxf         (yalnızca parsel ve bina oturumu)
```

Dosyada **yalnızca o katın planı** bulunur. Kesit, görünüş, detay, antet,
lejant, pafta çerçevesi **olmaz**.

### 2.2 Birim ve ölçek

- Çizim **model uzayında, 1/1** ölçekte olur. Kâğıt/layout uzayı kullanılmaz.
- Birim **santimetre** (tercih) veya **metre** olabilir; karışık olamaz.
- Dosya birimi doğru ayarlanmalıdır — AutoCAD'de `UNITS` → *Insertion scale*,
  ArchiCAD/Revit dışa aktarımında birim seçimi. Panel bu ayarı (`$INSUNITS`)
  okur; ayarsız dosyada çizim büyüklüğüne bakarak tahmin eder ve bu tahmin
  yanılabilir.
- Dosyada **tek ölçek** olur.

### 2.3 Temizlik

Dışa aktarmadan önce metraj dosyasında şunlar çalıştırılır:

| Komut | Ne yapar |
|---|---|
| `OVERKILL` | Üst üste binmiş ve kopya çizgileri siler — **en kritik adım**, yapılmazsa metraj ikiye katlanır |
| `PURGE` | Kullanılmayan katman, blok ve stilleri atar |
| `AUDIT` | Bozuk nesneleri onarır |
| `EXPLODE` | Metraj katmanlarındaki grup ve xref'leri çözer (bloklar hariç — bkz. 3.4) |

`WIPEOUT`, `HATCH` ve görsel süs nesneleri metraj katmanlarında bulunmaz.

### 2.4 Dışa aktarma

`SAVEAS` → **AutoCAD 2013 DXF (*.dxf)** veya daha yenisi. ASCII DXF seçilir
(binary DXF okunmaz). DWG de yüklenebilir ancak **DWG'den metraj çıkarılamaz**;
panel yalnızca DWG'nin sürüm bilgisini ve gömülü önizlemesini okur.

---

## 3. Katman standardı

Katman adı **`MTR-` ön eki** ile başlar. Panel katmanı adından tanır; büyük/küçük
harf farkı ve `_` / `-` ayracı önemsizdir.

### 3.1 Metraja giren katmanlar

| Katman adı | İçerik | Çizim tipi | Neyi besler |
|---|---|---|---|
| `MTR-DUVAR-DIS` | Dış duvar ekseni | Çizgi / polyline | Dış duvar m², mantolama, cephe boyası |
| `MTR-DUVAR-IC` | İç bölme duvar ekseni | Çizgi / polyline | İç duvar m², sıva, boya |
| `MTR-PERDE` | Betonarme perde ekseni | Çizgi / polyline | Perde betonu (bilgi amaçlı) |
| `MTR-KOLON` | Kolon kesitleri | Kapalı polyline | Kolon adedi (bilgi amaçlı) |
| `MTR-KIRIS` | Kiriş ekseni | Çizgi | Lento / hatıl kontrolü |
| `MTR-DOSEME` | Kat döşeme sınırı | **Kapalı** polyline | Taban alanı, şap, kaplama |
| `MTR-BINA` | Bina oturum sınırı | **Kapalı** polyline | Taban alanı (öncelikli kaynak) |
| `MTR-MAHAL` | Her oda için bir sınır | **Kapalı** polyline | Mahal alanı, net kullanım |
| `MTR-ISLAK` | Banyo, WC, mutfak sınırı | **Kapalı** polyline | Seramik, su yalıtımı, vitrifiye |
| `MTR-KAPI` | İç kapı | Blok (1 kapı = 1 blok) | İç kapı adedi |
| `MTR-KAPI-DIS` | Daire girişi / dış kapı | Blok | Çelik kapı adedi |
| `MTR-PENCERE` | Pencere | Blok | Pencere adedi ve alanı |
| `MTR-MERDIVEN` | Merdiven kolu ekseni | Çizgi | Basamak mtül, korkuluk |
| `MTR-CATI` | Çatı sınırı | **Kapalı** polyline | Çatı alanı |
| `MTR-PARSEL` | Parsel sınırı | **Kapalı** polyline | Arsa alanı, peyzaj |

### 3.2 Metraja girmeyen katmanlar

Bu adları taşıyan katmanlar okunur ama hesaba katılmaz — plan okunabilirliği
için kalabilirler:

```
MTR-OLCU      ölçü çizgileri ve kotlar
MTR-YAZI      mahal adları, notlar
MTR-AKS       aks çizgileri ve balonları
MTR-MOBILYA   mobilya, donanım, bitki
MTR-TARAMA    süs taramaları
```

### 3.3 Duvar çizimi — tek çizgi kuralı

Metraj katmanında duvar **ekseninden tek çizgi** ile gösterilir:

```
MTR-DUVAR-DIS  ─────────────────────   ✔ tek çizgi (eksen)
mimari çizim   ═════════════════════   ✘ iki yüz çizgisi
```

Uygulama projesinden kopyaladığınız duvarlar iki yüz çizgisi olarak geliyorsa
silmeyin — okuma penceresinde **"Çift çizgi (÷2)"** seçeneğini işaretleyin,
panel ölçülen uzunluğu ikiye böler. Doğruluk için tek çizgi tercih edilmelidir;
çift çizgide köşe birleşimleri ve kapı boşlukları %3–5 sapma yaratır.

Duvar çizgileri **kapı ve pencere boşluklarında kesilmez** — boşluklar
`MTR-KAPI` / `MTR-PENCERE` bloklarının adedinden düşülür.

### 3.4 Kapı ve pencere — blok kuralı

Kapı ve pencereler **blok** olarak yerleştirilir: bir kapı = bir blok referansı.
Panel blok sayısını adet olarak okur.

- Blok adı serbesttir (`KAPI_90`, `PVC_140x150` …), önemli olan **katman**.
- Blok patlatılırsa (`EXPLODE`) adet sayılamaz — patlatmayın.
- Blok kullanamıyorsanız her kapı/pencere yerine `MTR-KAPI` katmanında **bir
  daire** çizin; daire de adet olarak sayılır.
- Pencere alanı adet × 2,10 m² kabulüyle tahmin edilir. Gerçek alanı biliyorsanız
  okuma sonrası "Pencere alanı" alanına elle yazın.

### 3.5 Alan sınırları — kapalı polyline kuralı

Alan okunan katmanlarda (`MTR-DOSEME`, `MTR-BINA`, `MTR-MAHAL`, `MTR-ISLAK`,
`MTR-CATI`, `MTR-PARSEL`) sınır **mutlaka kapalı polyline** olmalıdır
(`PLINE` → `C` ile kapatma, ya da `BPOLY` ile otomatik sınır).

Açık polyline ya da ayrı çizgilerden oluşan sınırın **alanı hesaplanamaz**;
yalnızca uzunluğu okunur ve alan sıfır görünür.

Her mahal için **bir** kapalı polyline çizilir. Aynı odayı iki kez çizmek alanı
iki katına çıkarır.

---

## 4. ArchiCAD / Revit'ten geliyorsanız

Bu programların varsayılan katman adları da tanınır, ama ayrım yapamazlar:

| Gelen katman | Panelin yorumu | Sorun |
|---|---|---|
| `Structural - Bearing` | Kolon | Dış duvar / iç duvar / kolon hepsi aynı katmanda |
| `Interior - Stair & Railing` | Merdiven | Korkuluk ve basamak ayrı değil |
| `Model Unit - Zone` | Mahal alanı | ✔ genelde doğru çalışır |
| `Dimensioning - General` | Ölçü | ✔ metraja girmez |
| `Interior - Furniture` | Metraj dışı | ✔ metraja girmez |

Dışa aktarımda pen numarasına göre katman bölünmesi (`…_Pen_No__81`) açıksa
kapatın; her eleman tek katmanda kalsın.

**Önerilen yol:** ArchiCAD'de metraj için ayrı bir *Layer Combination*
oluşturup elemanları yukarıdaki `MTR-` katmanlarına taşıyın. Bir kez kurulur,
sonraki revizyonlarda dışa aktarım tek tıkla tekrarlanır.

---

## 5. Hazırlık akışı (özet)

1. Uygulama projesini **farklı kaydet** → `MTR_ZEMIN.dxf`
2. Kat planı dışındaki her şeyi sil (kesit, görünüş, antet, lejant, diğer katlar)
3. Katmanları `MTR-` adlarına çevir (`LAYMRG` / `LAYER` yöneticisi)
4. Duvarları tek çizgiye indir — ya da çift çizgi bırakıp okuma penceresinde ÷2 seç
5. Mahal ve döşeme sınırlarını kapalı polyline yap (`BPOLY`)
6. `OVERKILL` → `PURGE` → `AUDIT`
7. DXF olarak kaydet (AutoCAD 2013+, ASCII)
8. Panelde **Projeler** → dosyayı yükle → **Keşif & Maliyet** → *Projeden oku*

Okuma penceresinde **"Tanınmayan, ölçüsü olan katmanlar"** listesi çıkarsa o
katmanların ölçüleri keşfe girmemiştir; adlarını standarda çevirip yeniden
yükleyin.

---

## 6. Şablon dosya

`docs/sablon/metraj-sablon.dxf` — standarttaki bütün katmanları tanımlı, içi boş
bir DXF. AutoCAD'de açıp projenizi içine kopyalayarak başlayabilir ya da
`INSERT` ile mevcut dosyanıza katman tanımlarını aktarabilirsiniz.

---

## 7. Doğruluk beklentisi

Standarda uygun bir kat planında panelin okuduğu değerler, elle metrajla
karşılaştırıldığında şu sapma aralığındadır:

| Ölçü | Beklenen sapma |
|---|---|
| Mahal / döşeme alanı | %1'in altında |
| Duvar uzunluğu (tek çizgi) | %2'nin altında |
| Duvar uzunluğu (çift çizgi ÷2) | %3–5 |
| Kapı / pencere adedi | Blok kullanıldıysa tam |
| Pencere alanı (adetten tahmin) | %15–20 — elle düzeltilmesi önerilir |

Beton, kalıp, donatı gibi kalemler plandan değil, **parametrelerden** (kat
sayısı, kat yüksekliği, beton oranı) hesaplanır; bunların doğruluğu statik
projeden girilen oranlara bağlıdır. Keşif sonucu yaklaşık keşiftir, onaylı
uygulama projesi metrajının yerine geçmez.
