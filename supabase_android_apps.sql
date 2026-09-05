-- JS Tech / Controle particular
-- Estrutura do catálogo de aplicativos Android e múltiplos aplicativos por cliente.

create table if not exists public.android_apps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  platform text not null default 'Android',
  active boolean not null default true,
  download_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint android_apps_name_check check (char_length(trim(name)) between 2 and 80)
);

create unique index if not exists android_apps_owner_name_unique
  on public.android_apps (owner_id, lower(trim(name)));

alter table public.android_apps enable row level security;

create table if not exists public.client_apps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  app_name text not null,
  plan text not null default '30d',
  screens integer not null default 1,
  lifetime boolean not null default false,
  amount numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_apps_name_check check (char_length(trim(app_name)) between 2 and 80),
  constraint client_apps_plan_check check (plan in ('30d','3m','6m','1y','lifetime')),
  constraint client_apps_screens_check check (screens between 1 and 99)
);

create unique index if not exists client_apps_client_name_unique
  on public.client_apps (client_id, lower(trim(app_name)));

alter table public.client_apps enable row level security;

insert into public.android_apps (name)
select name from (values ('Magic Player'),('Brasil IPTV'),('Box Player'),('Vizzion Play'),('Powerplay'),('Epicplay'),('Assist+'),('Playsim'),('Mult Apps'),('JJ Player'),('Duo TV'),('Mult Box'),('Sync21 Player'),('UP Play'),('Max21'),('XCIPTV Player'),('Smarters Play'),('Duna XTP'),('Touro Box MOD'),('Touro Box T7 V5'),('WP Entretenimento'),('XPlus 7.0'),('YouCine MOD'),('Touro Box V2'),('Uni Revenda'),('GPC Pro'),('Blessed Player'),('Fun Play'),('Lazer Play'),('Power Play'),('Super Play'),('XCloud TV')) as apps(name)
where not exists (
  select 1 from public.android_apps a
  where a.owner_id=auth.uid() and lower(trim(a.name))=lower(trim(apps.name))
);