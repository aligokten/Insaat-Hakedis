-- ============================================================================
--  Proje Hakediş Paneli — Supabase şeması
--  Supabase → SQL Editor → New query → bu dosyanın tamamını çalıştırın.
--  Tekrar çalıştırmak güvenlidir (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------- tablo ---
-- Panelin tüm kayıtları tek tabloda tutulur: koleksiyon + kayıt kimliği + veri.
create table if not exists public.kayitlar (
  id          uuid primary key default gen_random_uuid(),
  koleksiyon  text        not null,
  kayit_id    text        not null,
  veri        jsonb       not null default '{}'::jsonb,
  silindi     boolean     not null default false,
  guncelleyen uuid        default auth.uid(),
  guncelleme  timestamptz not null default now(),
  unique (koleksiyon, kayit_id)
);

alter table public.kayitlar add column if not exists silindi boolean not null default false;

create index if not exists kayitlar_koleksiyon_idx on public.kayitlar (koleksiyon);
create index if not exists kayitlar_guncelleme_idx on public.kayitlar (guncelleme);

-- Silme olaylarının anlık yayında hangi kayıt olduğu görünsün
alter table public.kayitlar replica identity full;

-- Silme "yumuşak"tır: satır silinmez, silindi=true olur. Böylece değişiklik hem
-- anlık yayında hem de yoklama ile çalışan istemcilere ulaşır.
-- İsterseniz eski işaretli satırları arada temizleyebilirsiniz:
--   delete from public.kayitlar where silindi and guncelleme < now() - interval '90 days';

-- Her yazmada güncelleme damgası ve yazan kullanıcı tazelensin
create or replace function public.kayit_damgala()
returns trigger language plpgsql as $$
begin
  new.guncelleme  := now();
  new.guncelleyen := auth.uid();
  return new;
end $$;

drop trigger if exists kayit_damgala_t on public.kayitlar;
create trigger kayit_damgala_t before insert or update on public.kayitlar
  for each row execute function public.kayit_damgala();

-- ------------------------------------------------------------- yetkiler ---
-- Giriş yapan kullanıcının panel kaydı (RLS özyinelemesini önlemek için
-- security definer: bu fonksiyon RLS'i atlayarak okur).
create or replace function public.aktif_kullanici()
returns jsonb language sql stable security definer set search_path = public as $$
  select k.veri
    from public.kayitlar k
   where k.koleksiyon = 'kullanicilar'
     and k.veri->>'authId' = auth.uid()::text
     and coalesce(k.veri->>'durum', 'Aktif') = 'Aktif'
   limit 1
$$;

-- Panel hiç kurulmamış mı (ilk yöneticinin kendini yazabilmesi için)
create or replace function public.panel_bos()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.kayitlar where koleksiyon = 'kullanicilar')
$$;

-- Rol şablonları — assets/js/yetki.js içindeki ROLLER ile aynı olmalıdır.
create or replace function public.rol_izinleri()
returns jsonb language sql immutable as $$
  select '{
    "Sistem Yöneticisi": {"ozet":"onayla","paftalar":"onayla","metraj":"onayla","isler":"onayla","taseron":"onayla","personel":"onayla","kalite":"onayla","hakedis":"onayla","stok":"onayla","tedarik":"onayla","rapor":"onayla","kullanici":"onayla"},
    "Proje Müdürü":      {"ozet":"onayla","paftalar":"onayla","metraj":"onayla","isler":"onayla","taseron":"onayla","personel":"onayla","kalite":"onayla","hakedis":"onayla","stok":"onayla","tedarik":"onayla","rapor":"onayla","kullanici":"goruntule"},
    "Şantiye Şefi":      {"ozet":"duzenle","paftalar":"duzenle","metraj":"duzenle","isler":"duzenle","taseron":"duzenle","personel":"duzenle","kalite":"duzenle","hakedis":"duzenle","stok":"duzenle","tedarik":"goruntule","rapor":"duzenle","kullanici":"yok"},
    "Kontrol Şefi":      {"ozet":"goruntule","paftalar":"goruntule","metraj":"duzenle","isler":"goruntule","taseron":"goruntule","personel":"goruntule","kalite":"onayla","hakedis":"duzenle","stok":"goruntule","tedarik":"goruntule","rapor":"goruntule","kullanici":"yok"},
    "Satın Alma":        {"ozet":"goruntule","paftalar":"goruntule","metraj":"goruntule","isler":"goruntule","taseron":"goruntule","personel":"yok","kalite":"goruntule","hakedis":"goruntule","stok":"onayla","tedarik":"onayla","rapor":"goruntule","kullanici":"yok"},
    "Taşeron":           {"ozet":"goruntule","paftalar":"goruntule","metraj":"goruntule","isler":"goruntule","taseron":"yok","personel":"goruntule","kalite":"duzenle","hakedis":"duzenle","stok":"yok","tedarik":"yok","rapor":"goruntule","kullanici":"yok"},
    "İzleyici":          {"ozet":"goruntule","paftalar":"goruntule","metraj":"goruntule","isler":"goruntule","taseron":"goruntule","personel":"goruntule","kalite":"goruntule","hakedis":"goruntule","stok":"goruntule","tedarik":"goruntule","rapor":"goruntule","kullanici":"yok"}
  }'::jsonb
$$;

-- Koleksiyon → modül eşlemesi
create or replace function public.koleksiyon_modul(kol text)
returns text language sql immutable as $$
  select case kol
    when 'projeler'      then 'paftalar'
    when 'paftalar'      then 'paftalar'
    when 'metraj'        then 'metraj'
    when 'isler'         then 'isler'
    when 'taseronlar'    then 'taseron'
    when 'ayarlar'       then 'taseron'
    when 'personel'      then 'personel'
    when 'puantaj'       then 'personel'
    when 'kaliteKontrol' then 'kalite'
    when 'hakedisler'    then 'hakedis'
    when 'stok'          then 'stok'
    when 'hareketler'    then 'stok'
    when 'siparisler'    then 'tedarik'
    when 'raporlar'      then 'rapor'
    when 'kullanicilar'  then 'kullanici'
    when 'gunluk'        then 'gunluk'
    else 'yok'
  end
$$;

-- Seviye sırası: yok < goruntule < duzenle < onayla
create or replace function public.seviye_sirasi(s text)
returns int language sql immutable as $$
  select case s when 'onayla' then 3 when 'duzenle' then 2 when 'goruntule' then 1 else 0 end
$$;

-- Giriş yapan kullanıcının bir koleksiyonda yazma yetkisi var mı
create or replace function public.yazabilir(kol text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  k      jsonb := public.aktif_kullanici();
  modul  text  := public.koleksiyon_modul(kol);
  duzey  text;
begin
  -- Panel hiç kurulmamışsa ilk yönetici kendini yazabilsin
  if k is null then
    return kol = 'kullanicilar' and public.panel_bos();
  end if;
  -- İşlem günlüğü: panele girebilen herkes kendi hareketini yazabilir
  if modul = 'gunluk' then
    return true;
  end if;
  duzey := coalesce(
    k->'izinler'->>modul,
    public.rol_izinleri()->(k->>'rol')->>modul,
    'yok');
  return public.seviye_sirasi(duzey) >= 2;   -- en az 'duzenle'
end $$;

-- ------------------------------------------------------------------ RLS ---
alter table public.kayitlar enable row level security;

drop policy if exists kayitlar_oku   on public.kayitlar;
drop policy if exists kayitlar_ekle  on public.kayitlar;
drop policy if exists kayitlar_guncelle on public.kayitlar;
drop policy if exists kayitlar_sil   on public.kayitlar;

-- Okuma: yalnızca panelde tanımlı ve aktif kullanıcılar (kurulum anı hariç).
-- Böylece kendiliğinden kayıt olan biri hiçbir veriyi göremez.
create policy kayitlar_oku on public.kayitlar
  for select to authenticated
  using (public.aktif_kullanici() is not null or public.panel_bos());

create policy kayitlar_ekle on public.kayitlar
  for insert to authenticated
  with check (public.yazabilir(koleksiyon));

create policy kayitlar_guncelle on public.kayitlar
  for update to authenticated
  using (public.yazabilir(koleksiyon))
  with check (public.yazabilir(koleksiyon));

create policy kayitlar_sil on public.kayitlar
  for delete to authenticated
  using (public.yazabilir(koleksiyon));

-- ------------------------------------------------------------ realtime ---
-- Değişikliklerin abonelere anlık yayınlanması
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kayitlar'
  ) then
    alter publication supabase_realtime add table public.kayitlar;
  end if;
end $$;
