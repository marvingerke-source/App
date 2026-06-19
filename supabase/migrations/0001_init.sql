-- ============================================================================
-- Smarter Wochen-Einkauf – Backend-Schema (Supabase / Postgres + PostGIS)
-- Märkte, Angebote, Prospekte, Nutzerprofil + Umkreissuche.
-- ============================================================================

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- --- Märkte / Filialen ------------------------------------------------------
create table if not exists markt (
  id        uuid primary key default gen_random_uuid(),
  kette     text not null,                 -- "Rewe", "Aldi Süd", ...
  name      text,
  adresse   text,
  plz       text,
  region    text,                          -- Prospekt-Region (Angebote oft regional)
  geo       geography(point, 4326) not null,
  farbe     text,
  kurz      text
);
create index if not exists markt_geo_idx on markt using gist (geo);
create index if not exists markt_region_idx on markt (region);

-- --- Prospekte (Rohdaten) ---------------------------------------------------
create table if not exists prospekt (
  id           uuid primary key default gen_random_uuid(),
  kette        text,
  region       text,
  zeitraum_von date,
  zeitraum_bis date,
  datei_pfad   text,                        -- Storage-Pfad (Bucket "prospekte")
  status       text not null default 'neu', -- neu | extrahiert | geprueft
  erstellt_at  timestamptz default now()
);

-- --- Angebote (aus Prospekten extrahiert) -----------------------------------
create table if not exists angebot (
  id            uuid primary key default gen_random_uuid(),
  markt_id      uuid references markt(id) on delete cascade,
  region        text,                       -- falls regionweit gültig
  produktname   text not null,
  kategorie     text,
  preis         numeric(8,2) not null,
  normalpreis   numeric(8,2),
  einheit       text,
  ist_bio       boolean default false,
  gueltig_von   date,
  gueltig_bis   date,
  quelle_prospekt uuid references prospekt(id) on delete set null,
  konfidenz     numeric,
  erstellt_at   timestamptz default now()
);
create index if not exists angebot_gueltig_idx on angebot (gueltig_bis);
create index if not exists angebot_region_idx on angebot (region);
create index if not exists angebot_markt_idx on angebot (markt_id);

-- --- Nutzerprofil (Ort) -----------------------------------------------------
create table if not exists profil (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  plz       text,
  ort       text,
  geo       geography(point, 4326),
  radius_km int default 8,
  bearbeitet_at timestamptz default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table markt    enable row level security;
alter table angebot  enable row level security;
alter table prospekt enable row level security;
alter table profil   enable row level security;

-- Märkte & Angebote sind öffentlich lesbar (Schreiben nur via service_role/Job).
drop policy if exists markt_read on markt;
create policy markt_read on markt for select using (true);
drop policy if exists angebot_read on angebot;
create policy angebot_read on angebot for select using (true);

-- Profil: jeder nur sein eigenes.
drop policy if exists profil_self on profil;
create policy profil_self on profil
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prospekte: kein Client-Zugriff (nur service_role im Job). Keine Policy = gesperrt.

-- ============================================================================
-- RPC: Angebote im Umkreis eines Ortes
-- ============================================================================
create or replace function angebote_fuer_ort(
  p_lat float8, p_lng float8, p_radius_km int default 8
)
returns table (
  id uuid, markt_id uuid, kette text, markt_name text, entfernung_km numeric,
  produktname text, kategorie text, preis numeric, normalpreis numeric,
  einheit text, ist_bio boolean, gueltig_bis date
)
language sql
security definer
set search_path = public
as $$
  with nahe as (
    select m.*, st_distance(m.geo, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as dist
    from markt m
    where st_dwithin(m.geo, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
  )
  select a.id, n.id, n.kette, n.name,
         round((n.dist/1000.0)::numeric, 1) as entfernung_km,
         a.produktname, a.kategorie, a.preis, a.normalpreis, a.einheit, a.ist_bio, a.gueltig_bis
  from nahe n
  join angebot a
    on (a.markt_id = n.id or (a.markt_id is null and a.region = n.region))
  where a.gueltig_bis is null or a.gueltig_bis >= current_date
  order by n.dist, a.produktname;
$$;

grant execute on function angebote_fuer_ort(float8, float8, int) to anon, authenticated;
