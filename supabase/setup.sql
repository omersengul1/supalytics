-- ============================================================================
-- supalytics · setup.sql
-- Supabase SQL Editor'de BİR KEZ çalıştırın.
--
-- GÜVENLİK MODELİ
--   · Uygulama yalnızca herkese açık `anon` anahtar + sizin Supabase Auth
--     hesabınızla çalışır. service_role hiçbir yerde istenmez ve kullanılmaz.
--   · Tüm veri, aşağıdaki `security definer` RPC'lerden gelir; her RPC ilk
--     satırda analytics.is_admin() kontrolü yapar. Admin olmayan herkes
--     (anon dahil) "forbidden" alır.
--   · `analytics` şemasına API'den erişim yoktur (usage verilmez, RLS açık);
--     dışarıya yalnızca public şemadaki supalytics_* fonksiyonları açılır ve
--     bunlar da sadece `authenticated` role'e grant edilir.
--   · Supabase'in auth.audit_log_entries tablosu kalıcı değildir; bu yüzden
--     gecelik pg_cron işi kayıtları analytics.login_history'ye arşivler.
--
-- KURULUMDAN SONRA
--   1) En alttaki ">>> EDIT ME" bloğunu kendi user_id'nizle açın (admin'siz
--      panel her istekte "forbidden" görür).
--   2) Uygulamada proje URL'si + anon anahtar + bu hesabın e-posta/şifresiyle
--      giriş yapın.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Şema ve tablolar
-- ----------------------------------------------------------------------------
create schema if not exists analytics;

-- API rolleri şemayı hiç göremesin (PostgREST bu şemayı zaten expose etmez;
-- bu satırlar savunmayı katmanlar).
revoke all on schema analytics from public, anon, authenticated;

create table if not exists analytics.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists analytics.login_history (
  id         uuid primary key,            -- auth.audit_log_entries.id (doğal dedup)
  user_id    uuid,                        -- bilerek FK yok: silinen kullanıcının geçmişi kalır
  email      text,
  action     text not null,
  ip         text,
  user_agent text,
  created_at timestamptz not null
);

create index if not exists login_history_created_at_idx
  on analytics.login_history (created_at desc);
create index if not exists login_history_user_created_idx
  on analytics.login_history (user_id, created_at desc);

alter table analytics.admins enable row level security;
alter table analytics.login_history enable row level security;
revoke all on all tables in schema analytics from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2) Yardımcı fonksiyonlar (analytics şeması — API'den erişilemez)
-- ----------------------------------------------------------------------------

create or replace function analytics.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from analytics.admins a where a.user_id = auth.uid()
  );
$$;

-- User agent'tan kaba cihaz sınıfı. Sıra önemli: Android UA'ları "Linux",
-- modern iPad UA'ları "Macintosh" içerir.
create or replace function analytics.device_of(ua text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when ua is null or ua = ''                       then 'Unknown'
    when ua ~* 'iphone|ipad|ipod|ios'                then 'iOS'
    when ua ~* 'android'                             then 'Android'
    when ua ~* 'mac os x|macintosh|darwin'           then 'macOS'
    when ua ~* 'windows'                             then 'Windows'
    when ua ~* 'linux|x11'                           then 'Linux'
    else 'Other'
  end;
$$;

-- auth.audit_log_entries → analytics.login_history arşivi.
-- Son arşivlenen created_at'ten (1 dakikalık örtüşmeyle) devam eder; kimlik
-- çakışmaları "on conflict do nothing" ile düşer. user_agent, giriş anına en
-- yakın (±5 dk) auth.sessions kaydından alınır — oturum silinmişse null kalır.
create or replace function analytics.archive_auth_events()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_ts  timestamptz;
  inserted bigint;
begin
  select coalesce(max(h.created_at), 'epoch'::timestamptz)
    into last_ts
    from analytics.login_history h;

  insert into analytics.login_history (id, user_id, email, action, ip, user_agent, created_at)
  select
    e.id,
    nullif(e.payload ->> 'actor_id', '')::uuid,
    e.payload ->> 'actor_username',
    coalesce(e.payload ->> 'action', 'unknown'),
    nullif(e.ip_address, ''),
    (
      select s.user_agent
      from auth.sessions s
      where s.user_id = nullif(e.payload ->> 'actor_id', '')::uuid
        and s.created_at between e.created_at - interval '5 minutes'
                             and e.created_at + interval '5 minutes'
      order by abs(extract(epoch from (s.created_at - e.created_at)))
      limit 1
    ),
    e.created_at
  from auth.audit_log_entries e
  where e.created_at > last_ts - interval '1 minute'
  on conflict (id) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3) RPC'ler (public şema — uygulamanın çağırdığı tek yüzey)
--    Hepsi: security definer + boş search_path + ilk satırda admin kontrolü.
--    "Aktif" tanımı: action in ('login','token_refreshed').
-- ----------------------------------------------------------------------------

-- Not: uygulama, seçilen metriklere göre bu script'in daraltılmış bir halini de
-- üretebilir (arşivsiz "çekirdek" kurulum). totals bu yüzden login_history'nin
-- varlığını kontrol eder; tablo yoksa aktiflik sütunları 0 döner.
create or replace function public.supalytics_totals()
returns table (
  total_users bigint,
  new_today   bigint,
  new_week    bigint,
  dau         bigint,
  wau         bigint,
  mau         bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  has_history boolean := to_regclass('analytics.login_history') is not null;
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  if has_history then
    return query
    select
      (select count(*) from auth.users),
      (select count(*) from auth.users u where u.created_at >= date_trunc('day', now())),
      (select count(*) from auth.users u where u.created_at >= now() - interval '7 days'),
      (select count(distinct h.user_id) from analytics.login_history h
        where h.action in ('login', 'token_refreshed')
          and h.created_at >= date_trunc('day', now())),
      (select count(distinct h.user_id) from analytics.login_history h
        where h.action in ('login', 'token_refreshed')
          and h.created_at >= now() - interval '7 days'),
      (select count(distinct h.user_id) from analytics.login_history h
        where h.action in ('login', 'token_refreshed')
          and h.created_at >= now() - interval '30 days');
  else
    return query
    select
      (select count(*) from auth.users),
      (select count(*) from auth.users u where u.created_at >= date_trunc('day', now())),
      (select count(*) from auth.users u where u.created_at >= now() - interval '7 days'),
      0::bigint, 0::bigint, 0::bigint;
  end if;
end;
$$;

create or replace function public.supalytics_dau_series(days int default 30)
returns table (day date, users bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select
    d.day::date,
    coalesce(count(distinct h.user_id), 0)::bigint
  from generate_series(
         current_date - (least(greatest(days, 1), 365) - 1),
         current_date,
         interval '1 day'
       ) as d(day)
  left join analytics.login_history h
    on h.created_at >= d.day
   and h.created_at <  d.day + interval '1 day'
   and h.action in ('login', 'token_refreshed')
  group by d.day
  order by d.day;
end;
$$;

create or replace function public.supalytics_signup_series(days int default 30)
returns table (day date, users bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select
    d.day::date,
    coalesce(count(u.id), 0)::bigint
  from generate_series(
         current_date - (least(greatest(days, 1), 365) - 1),
         current_date,
         interval '1 day'
       ) as d(day)
  left join auth.users u
    on u.created_at >= d.day
   and u.created_at <  d.day + interval '1 day'
  group by d.day
  order by d.day;
end;
$$;

-- Teşhis amaçlı: bu bağlantının veritabanına hangi rolle/kimlikle ulaştığını
-- gösterir. Kasıtlı olarak anon'a da açık — hassas veri döndürmez (yalnızca
-- çağıranın kendi rolü/uid'i/admin durumu); "permission denied" hatalarında
-- gerçek durumu görmek için kullanılır.
create or replace function public.supalytics_whoami()
returns table (jwt_role text, uid uuid, is_admin boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query select auth.role(), auth.uid(), coalesce(analytics.is_admin(), false);
end;
$$;

create or replace function public.supalytics_provider_breakdown()
returns table (provider text, users bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select i.provider::text, count(distinct i.user_id)::bigint
  from auth.identities i
  group by i.provider
  order by count(distinct i.user_id) desc;
end;
$$;

create or replace function public.supalytics_device_breakdown(days int default 30)
returns table (device text, sessions bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select analytics.device_of(h.user_agent), count(*)::bigint
  from analytics.login_history h
  where h.action = 'login'
    and h.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1
  order by 2 desc;
end;
$$;

create or replace function public.supalytics_user_list(
  q           text default '',
  page_size   int  default 50,
  page_offset int  default 0
)
returns table (
  id              uuid,
  email           text,
  providers       text[],
  created_at      timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select
    u.id,
    u.email::text,
    coalesce(
      (select array_agg(distinct i.provider::text) from auth.identities i where i.user_id = u.id),
      '{}'::text[]
    ),
    u.created_at,
    u.last_sign_in_at
  from auth.users u
  where q = '' or u.email ilike '%' || q || '%'
  order by u.last_sign_in_at desc nulls last, u.created_at desc
  limit least(greatest(page_size, 1), 200)
  offset greatest(page_offset, 0);
end;
$$;

create or replace function public.supalytics_user_detail(
  uid        uuid,
  max_events int default 50
)
returns table (
  action     text,
  ip         text,
  device     text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select h.action, h.ip, analytics.device_of(h.user_agent), h.created_at
  from analytics.login_history h
  where h.user_id = uid
  order by h.created_at desc
  limit least(greatest(max_events, 1), 200);
end;
$$;

create or replace function public.supalytics_recent_activity(max_events int default 50)
returns table (
  email      text,
  action     text,
  device     text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not analytics.is_admin() then raise exception 'forbidden'; end if;
  return query
  select
    coalesce(h.email, u.email::text),
    h.action,
    analytics.device_of(h.user_agent),
    h.created_at
  from analytics.login_history h
  left join auth.users u on u.id = h.user_id
  order by h.created_at desc
  limit least(greatest(max_events, 1), 200);
end;
$$;

-- ----------------------------------------------------------------------------
-- 4) Kapanış: yetkiler
--    Fonksiyonlar varsayılan olarak PUBLIC'e execute verir; hepsini kapatıp
--    yalnızca authenticated'a açıyoruz (admin kontrolü yine de her çağrıda).
--    supalytics_whoami istisna: teşhis amaçlı, hem anon hem authenticated'a açık.
-- ----------------------------------------------------------------------------
revoke all on function public.supalytics_totals()                     from public, anon;
revoke all on function public.supalytics_dau_series(int)              from public, anon;
revoke all on function public.supalytics_signup_series(int)           from public, anon;
revoke all on function public.supalytics_provider_breakdown()         from public, anon;
revoke all on function public.supalytics_device_breakdown(int)        from public, anon;
revoke all on function public.supalytics_user_list(text, int, int)    from public, anon;
revoke all on function public.supalytics_user_detail(uuid, int)       from public, anon;
revoke all on function public.supalytics_recent_activity(int)         from public, anon;
revoke all on function public.supalytics_whoami()                     from public;

grant execute on function public.supalytics_totals()                  to authenticated;
grant execute on function public.supalytics_dau_series(int)           to authenticated;
grant execute on function public.supalytics_signup_series(int)        to authenticated;
grant execute on function public.supalytics_provider_breakdown()      to authenticated;
grant execute on function public.supalytics_device_breakdown(int)     to authenticated;
grant execute on function public.supalytics_user_list(text, int, int) to authenticated;
grant execute on function public.supalytics_whoami()                  to anon, authenticated;
grant execute on function public.supalytics_user_detail(uuid, int)    to authenticated;
grant execute on function public.supalytics_recent_activity(int)      to authenticated;

-- ----------------------------------------------------------------------------
-- 5) Gecelik arşiv (pg_cron) + ilk backfill
--    pg_cron yoksa kurulum yine tamamlanır; NOTICE ile uyarılır.
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron kurulamadı: %', sqlerrm;
  end;
  begin
    perform cron.schedule(
      'supalytics-archive-nightly',
      '10 3 * * *',
      'select analytics.archive_auth_events()'
    );
  exception when others then
    raise notice 'pg_cron zamanlaması kurulamadı (%). Arşivi elle çalıştırın: select analytics.archive_auth_events();', sqlerrm;
  end;
end;
$$;

-- İlk backfill: mevcut audit log ne kadar geriye gidiyorsa onu arşivler.
select analytics.archive_auth_events() as archived_rows;

-- ----------------------------------------------------------------------------
-- 6) API şema önbelleğini tazele
--    PostgREST fonksiyon/izin bilgisini önbellekte tutar; yeni grant bazen
--    birkaç dakika gecikmeyle yansır ve bu sırada RPC çağrısı "forbidden"
--    değil, çıplak bir Postgres hatası olan "permission denied for function"
--    döner. Script'i tekrar çalıştırmak bunu düzeltmez — önbellek elle
--    tazelenmeli. Bu satır tam olarak onu yapar.
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- >>> EDIT ME — admin ekleyin (bunsuz panel her istekte "forbidden" görür).
-- Authentication → Users sayfasından kendi user ID'nizi kopyalayın, satırların
-- başındaki "-- " işaretlerini kaldırıp çalıştırın:
--
-- insert into analytics.admins (user_id, note)
-- values ('BURAYA-KENDI-USER-ID-NIZ', 'ben')
-- on conflict (user_id) do nothing;
-- ----------------------------------------------------------------------------
