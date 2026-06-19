# Backend einrichten (Supabase) – Login, Ort & wöchentliche KI-Angebote

Solange kein Backend hinterlegt ist, läuft die App normal mit lokalen Demo-Daten.
Mit Supabase schaltest du **Login**, **Ort-Eingabe** und **echte ortsbezogene
Angebote** frei, die wöchentlich per KI aus deinen Prospekten aktualisiert werden.

## 1. Projekt anlegen
1. Auf **supabase.com** ein kostenloses Projekt erstellen.
2. **Project Settings ▸ API** öffnen → **Project URL** und **anon public key** kopieren.
3. In **`web/backend.js`** eintragen:
   ```js
   const BACKEND = { url: "https://DEINPROJEKT.supabase.co", anonKey: "DEIN_ANON_KEY" };
   ```

## 2. Datenbank-Schema einspielen
Supabase ▸ **SQL Editor** → Inhalt von `supabase/migrations/0001_init.sql` ausführen.
(Erstellt Tabellen, PostGIS-Umkreissuche und die RPC `angebote_fuer_ort`.)

## 3. Storage-Bucket
Supabase ▸ **Storage** → Bucket **`prospekte`** anlegen (privat).
Prospekt-Seiten als Bilder dort ablegen: `<prospekt_id>/seite-01.jpg`, `seite-02.jpg`, …
(PDF → Seitenbilder im Ingestion-Schritt; z. B. lokal mit `pdftoppm`/ImageMagick.)

## 4. KI-Extraktion (Edge Function)
1. Supabase CLI installieren, dann:
   ```bash
   supabase functions deploy extrahiere-prospekt
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   (`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` setzt Supabase automatisch.)
2. Test: in Tabelle `prospekt` einen Eintrag anlegen (kette/region/zeitraum + Bilder im Bucket),
   dann die Function aufrufen mit `{ "prospekt_id": "<uuid>" }`.

## 5. Wöchentlicher Cron
`supabase/migrations/0002_cron.sql` ausführen. Davor:
- `<PROJECT_REF>` durch deine Projekt-Referenz ersetzen.
- Den **service_role key** sicher bereitstellen (Supabase **Vault**), nicht im Klartext.

Danach läuft jeden Montag 04:00 die Extraktion für alle Prospekte mit Status `neu`
und räumt abgelaufene Angebote auf.

## 6. In der App nutzen
- App neu laden → **Einstellungen ▸ Konto & Ort** → registrieren/anmelden →
  **PLZ + Umkreis** speichern → Angebote aus der Nähe werden geladen.

## Sicherheit & Recht
- Der **Anthropic-Key** liegt serverseitig (Edge Function) – nie im Client.
- Prospekt-Inhalte sind urheberrechtlich geschützt → zulässige Quellen/Regionen klären.
- Konto + Standort = personenbezogen → Datenschutzerklärung, Einwilligung, Löschkonzept.

## Nächster Integrationsschritt (offen)
Aktuell werden die ortsbezogenen Angebote in **Einstellungen ▸ Konto & Ort**
angezeigt. Sie in den Mehr-Laden-Optimierer („Bestes Paket") einzuspeisen,
erfordert zusätzlich, die gefundenen **Märkte dynamisch** in die Optimierung zu
übernehmen – das ist der nächste Schritt und in `docs/Angebote-Pipeline.md` skizziert.
