// Seçilen metriklere göre kurulum SQL'ini üretir.
// İki blok var: ÇEKİRDEK (her gerçek kurulumda) ve GEÇMİŞ (aktiflik/cihaz/
// oturum/akış metriklerinden biri seçiliyse: login_history + pg_cron arşivi).
// Üretilen script tekrar çalıştırmaya dayanıklıdır (if not exists / or replace).

import { lang } from './i18n';
import type { MetricKey } from './prefs';

const HISTORY_METRICS: MetricKey[] = ['active', 'devices', 'sessions', 'activity'];

export function needsHistory(metrics: MetricKey[]): boolean {
  return metrics.some((m) => HISTORY_METRICS.includes(m));
}

// Kısa, dile göre yorum satırı.
function c(tr: string, en: string): string {
  return `-- ${lang === 'tr' ? tr : en}`;
}

const HEADER = () =>
  `${c('supalytics · kurulum — Supabase SQL Editor’de çalıştırın', 'supalytics · setup — run in the Supabase SQL Editor')}
${c(
  'Güvenlik: veri yalnızca security definer RPC’lerden çıkar; her RPC önce admin kontrolü yapar.',
  'Security: data only leaves through security definer RPCs; every RPC checks admin first.',
)}
${c(
  'service_role hiçbir yerde kullanılmaz. Bu script’i tekrar çalıştırmak güvenlidir.',
  'service_role is never used anywhere. Re-running this script is safe.',
)}`;

const CORE_SCHEMA = () =>
  `${c('1) Şema + admin listesi (API’ye kapalı)', '1) Schema + admin list (not exposed to the API)')}
create schema if not exists analytics;
revoke all on schema analytics from public, anon, authenticated;

create table if not exists analytics.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

alter table analytics.admins enable row level security;
revoke all on table analytics.admins from public, anon, authenticated;

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
$$;`;

const HISTORY_SCHEMA = () =>
  `${c(
  '2) Giriş arşivi — Supabase audit logu kalıcı değildir; gecelik kopya şart',
  '2) Sign-in archive — Supabase audit log is not permanent; nightly copy required',
)}
create table if not exists analytics.login_history (
  id         uuid primary key,
  user_id    uuid,
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

alter table analytics.login_history enable row level security;
revoke all on table analytics.login_history from public, anon, authenticated;

create or replace function analytics.device_of(ua text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when ua is null or ua = ''             then 'Unknown'
    when ua ~* 'iphone|ipad|ipod|ios'      then 'iOS'
    when ua ~* 'android'                   then 'Android'
    when ua ~* 'mac os x|macintosh|darwin' then 'macOS'
    when ua ~* 'windows'                   then 'Windows'
    when ua ~* 'linux|x11'                 then 'Linux'
    else 'Other'
  end;
$$;

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
$$;`;

// totals her iki kurulumda da aynı metin: login_history yoksa aktiflik
// sütunları 0 döner (to_regclass koruması).
const RPC_TOTALS = () =>
  `create or replace function public.supalytics_totals()
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

revoke all on function public.supalytics_totals() from public, anon;
grant execute on function public.supalytics_totals() to authenticated;`;

// Teşhis amaçlı: hangi rolle/kimlikle bağlandığını gösterir. Kasıtlı olarak
// anon'a da açık — hassas veri döndürmez (yalnızca çağıranın kendi rolü/uid'i/
// admin durumu), "permission denied" hatalarında uygulamanın gerçek durumu
// göstermesini sağlar.
const RPC_WHOAMI = () =>
  `${c(
    'Teşhis: bu bağlantının veritabanına hangi rolle/kimlikle ulaştığını gösterir.',
    'Diagnostic: shows which role/identity this connection actually reaches the database as.',
  )}
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

revoke all on function public.supalytics_whoami() from public;
grant execute on function public.supalytics_whoami() to anon, authenticated;`;

const RPC_SIGNUP_SERIES = () =>
  `create or replace function public.supalytics_signup_series(days int default 30)
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

revoke all on function public.supalytics_signup_series(int) from public, anon;
grant execute on function public.supalytics_signup_series(int) to authenticated;`;

const RPC_PROVIDERS = () =>
  `create or replace function public.supalytics_provider_breakdown()
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

revoke all on function public.supalytics_provider_breakdown() from public, anon;
grant execute on function public.supalytics_provider_breakdown() to authenticated;`;

const RPC_USER_LIST = () =>
  `create or replace function public.supalytics_user_list(
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

revoke all on function public.supalytics_user_list(text, int, int) from public, anon;
grant execute on function public.supalytics_user_list(text, int, int) to authenticated;`;

const RPC_DAU_SERIES = () =>
  `create or replace function public.supalytics_dau_series(days int default 30)
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

revoke all on function public.supalytics_dau_series(int) from public, anon;
grant execute on function public.supalytics_dau_series(int) to authenticated;`;

const RPC_DEVICES = () =>
  `create or replace function public.supalytics_device_breakdown(days int default 30)
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

revoke all on function public.supalytics_device_breakdown(int) from public, anon;
grant execute on function public.supalytics_device_breakdown(int) to authenticated;`;

const RPC_USER_DETAIL = () =>
  `create or replace function public.supalytics_user_detail(
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

revoke all on function public.supalytics_user_detail(uuid, int) from public, anon;
grant execute on function public.supalytics_user_detail(uuid, int) to authenticated;`;

const RPC_ACTIVITY = () =>
  `create or replace function public.supalytics_recent_activity(max_events int default 50)
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

revoke all on function public.supalytics_recent_activity(int) from public, anon;
grant execute on function public.supalytics_recent_activity(int) to authenticated;`;

const CRON = () =>
  `${c(
  'Gecelik arşiv (03:10) + ilk backfill. pg_cron yoksa kurulum yine tamamlanır.',
  'Nightly archive (03:10) + initial backfill. Setup still completes without pg_cron.',
)}
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron: %', sqlerrm;
  end;
  begin
    perform cron.schedule(
      'supalytics-archive-nightly',
      '10 3 * * *',
      'select analytics.archive_auth_events()'
    );
  exception when others then
    raise notice 'pg_cron schedule: %', sqlerrm;
  end;
end;
$$;

select analytics.archive_auth_events() as archived_rows;`;

// API katmanı (PostgREST) fonksiyon/izin bilgisini önbellekte tutar; yeni
// grant bazen birkaç dakika gecikmeyle yansır. Bunu tetiklemek "forbidden"
// yerine "permission denied for function" gibi görünür — script'i yeniden
// çalıştırmak yardımcı olmaz, önbellek elle tazelenmeli.
const RELOAD_SCHEMA = () =>
  `${c(
    'API şema önbelleğini hemen tazele: yeni grant’lar anında yansısın (yoksa birkaç dakika sürebilir).',
    'Refresh the API schema cache immediately so new grants apply right away (otherwise it can take a few minutes).',
  )}
notify pgrst, 'reload schema';`;

const FOOTER = () =>
  `${c(
  '>>> EDIT ME — admin ekleyin (bunsuz panel her istekte "forbidden" görür).',
  '>>> EDIT ME — add your admin (without this the panel gets "forbidden" on every request).',
)}
${c(
  'Authentication → Users’tan kendi user ID’nizi kopyalayın, "-- " işaretlerini kaldırıp çalıştırın:',
  'Copy your user ID from Authentication → Users, remove the leading "-- " and run:',
)}
--
-- insert into analytics.admins (user_id, note)
-- values ('PASTE-YOUR-USER-ID-HERE', 'me')
-- on conflict (user_id) do nothing;`;

export function buildSetupSql(metrics: MetricKey[]): string {
  const history = needsHistory(metrics);
  const parts = [HEADER(), CORE_SCHEMA()];
  if (history) parts.push(HISTORY_SCHEMA());
  parts.push(
    c('3) RPC’ler — uygulamanın çağırdığı tek yüzey', '3) RPCs — the only surface the app calls'),
    RPC_TOTALS(),
    RPC_SIGNUP_SERIES(),
    RPC_PROVIDERS(),
    RPC_USER_LIST(),
    RPC_WHOAMI(),
  );
  if (history) {
    parts.push(RPC_DAU_SERIES(), RPC_DEVICES(), RPC_USER_DETAIL(), RPC_ACTIVITY(), CRON());
  }
  parts.push(RELOAD_SCHEMA(), FOOTER());
  return parts.join('\n\n') + '\n';
}
