/* Panel yapilandirmasi.
   Bulut (Supabase) bilgileri buraya yazilirsa panel cok kullanicili calisir:
   herkes ayni veriyi gorur, kayitlar aninda digerlerine yansir.

   Bos birakilirsa panel tek kullanicili yerel modda calisir; veri yalnizca
   o tarayicida saklanir.

   anonAnahtar herkese aciktir (tarayiciya iner) - guvenlik Supabase
   tarafindaki satir bazli guvenlik (RLS) kurallariyla saglanir.
   Kurulum adimlari: supabase/KURULUM.md */
window.YAPILANDIRMA = {
  supabaseUrl: 'https://hwtmgjixaciekallrbmo.supabase.co',
  supabaseAnonAnahtar: '',    // Supabase > Project Settings > API > anon public

  /* Kullanici kodlari e-postaya bu alan adiyla cevrilir (kod@alanAdi).
     Gercek bir posta kutusu gerekmez, yalnizca kimlik olarak kullanilir. */
  girisAlanAdi: 'panel.saggplus.com'
};
