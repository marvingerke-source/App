-- ============================================================================
-- Wöchentlicher Job: neue Prospekte automatisch extrahieren.
-- Nutzt pg_cron (Zeitplan) + pg_net (HTTP-Aufruf der Edge Function).
--
-- VORHER in Supabase setzen (Dashboard ▸ SQL oder Vault):
--   - <PROJECT_REF>           = deine Projekt-Referenz (…​.supabase.co)
--   - service_role key        = sicher in Supabase Vault ablegen (NICHT hier hartcodieren)
-- Empfehlung: den Key über Vault lesen statt im Klartext.
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Verarbeitet alle Prospekte mit Status 'neu' (ruft die Edge Function je Prospekt auf).
create or replace function verarbeite_neue_prospekte()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  fn_url text := 'https://<PROJECT_REF>.supabase.co/functions/v1/extrahiere-prospekt';
  service_key text := current_setting('app.service_role_key', true); -- via Vault/Setting bereitstellen
begin
  for r in select id from prospekt where status = 'neu' loop
    perform net.http_post(
      url     := fn_url,
      headers := jsonb_build_object(
        'content-type', 'application/json',
        'authorization', 'Bearer ' || service_key
      ),
      body    := jsonb_build_object('prospekt_id', r.id)
    );
  end loop;
  -- Abgelaufene Angebote aufräumen
  delete from angebot where gueltig_bis is not null and gueltig_bis < current_date;
end;
$$;

-- Jeden Montag 04:00 (UTC) ausführen.
select cron.schedule(
  'prospekte-woechentlich',
  '0 4 * * 1',
  $$ select verarbeite_neue_prospekte(); $$
);
