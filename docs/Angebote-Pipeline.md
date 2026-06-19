# Ortsbezogene Angebote – eigene Prospekte + KI (wöchentlich)

Ziel: Nutzer meldet sich an, gibt seinen **Ort/PLZ** ein und sieht die **aktuellen
Prospekt-Angebote der Märkte in der Nähe**. Die Angebote werden **1× pro Woche**
aus eigenen Prospekten per **KI** extrahiert und aktualisiert.

---

## 1. Großes Bild (Datenfluss)

```
Prospekte (PDF/Bilder)
      │  (wöchentlich gesammelt/hochgeladen)
      ▼
Objekt-Speicher (Storage)
      │
      ▼
KI-Extraktion (Claude Vision)  ──►  strukturierte Angebote (JSON)
      │                                   (Produkt, Preis, normalpreis, Bio,
      ▼                                    Einheit, gültig von/bis, Markt, Region)
Datenbank (Postgres + Geo)
      │
      ▼
API:  PLZ → Geocoding → Filialen im Umkreis → aktuelle Angebote
      │
      ▼
App (nach Anmeldung + Ort)  ──►  Matching mit Rezepten  ──►  „Bestes Paket"
```

---

## 2. Empfohlener Stack (pragmatisch)

**Supabase** als Backend – passt fast 1:1 auf die Anforderungen:
- **Auth** (Anmeldung/Login per E-Mail, Apple, Google) – fertig eingebaut.
- **Postgres + PostGIS** – Geo-Umkreissuche (Filialen im Radius um die PLZ).
- **Storage** – Ablage der Prospekt-PDFs/Bilder.
- **Edge Functions + Cron (pg_cron / Scheduled Functions)** – der wöchentliche Job.
- **Row Level Security** – Datenschutz pro Nutzer.

(Alternative: Firebase + eigener Cloud-Run-Job. Supabase ist wegen PostGIS für die
Ortssuche hier die natürlichere Wahl.)

---

## 3. Datenmodell (Kern)

```sql
-- Filialen / Standorte
create table markt (
  id uuid primary key default gen_random_uuid(),
  kette text not null,            -- "Rewe", "Aldi Süd", ...
  name text,                      -- "Rewe City Hauptstr."
  adresse text,
  plz text,
  geo geography(point) not null,  -- lat/lng für Umkreissuche (PostGIS)
  region text                     -- optional: Prospekt-Region (Angebote oft regional)
);

-- Angebote (aus Prospekten extrahiert)
create table angebot (
  id uuid primary key default gen_random_uuid(),
  markt_id uuid references markt(id),  -- oder region-basiert (s.u.)
  region text,                          -- falls regionweit gültig
  produktname text not null,
  kategorie text,
  preis numeric(8,2) not null,
  normalpreis numeric(8,2),
  einheit text,
  ist_bio boolean default false,
  gueltig_von date,
  gueltig_bis date,
  quelle_prospekt uuid,                 -- Verweis auf das Prospekt
  konfidenz numeric                     -- KI-Sicherheit (für Review)
);
create index on angebot (gueltig_bis);

-- Prospekte (Rohdaten)
create table prospekt (
  id uuid primary key default gen_random_uuid(),
  kette text, region text,
  zeitraum_von date, zeitraum_bis date,
  datei_pfad text,                      -- Storage-Pfad
  status text default 'neu',            -- neu | extrahiert | geprueft
  erstellt_at timestamptz default now()
);

-- Nutzerprofil (Ort)
create table profil (
  user_id uuid primary key references auth.users(id),
  plz text, geo geography(point), radius_km int default 8
);
```

**Wichtig:** Prospekt-Angebote gelten oft **regional**, nicht pro Einzelfiliale.
Deshalb `region` an `markt` und `angebot` – Angebote werden über die Region
(oder Umkreis) zugeordnet.

---

## 4. Der wöchentliche Pipeline-Job

Ein Cron (z. B. **jeden Montag 04:00**) macht:

1. **Sammeln/Bereitstellen** der neuen Prospekte je Kette/Region → in Storage,
   `prospekt`-Eintrag anlegen (Phase 1: du lädst sie hoch; später automatisiert).
2. **Seiten aufbereiten**: PDF → einzelne Seitenbilder (eine Seite = ein Bild).
3. **KI-Extraktion** je Seite (siehe §5) → JSON-Angebote.
4. **Normalisieren & Validieren**: Preise plausibel, Einheiten vereinheitlichen,
   Duplikate zusammenführen, Kategorie zuordnen.
5. **Upsert** in `angebot` mit `gueltig_von/bis`; **alte/abgelaufene Angebote
   markieren** (oder löschen).
6. (Optional) **Review-Queue**: Angebote mit niedriger `konfidenz` zur kurzen
   manuellen Kontrolle.

Damit ist der Datenbestand jede Woche frisch.

---

## 5. KI-Extraktion (Claude Vision)

Pro Prospektseite ein Vision-Aufruf mit **strukturierter Ausgabe** (Tool-Use),
der ein Array von Angeboten zurückgibt:

- Felder: `produktname, kategorie, preis, normalpreis, einheit, ist_bio,
  gueltig_von, gueltig_bis, konfidenz`.
- **Server-seitig** (Job), daher bleibt der API-Key geheim.
- **Modellwahl:** ein leistungsfähiges Modell für saubere Extraktion (z. B.
  `claude-opus-4-8`); für Kostenersparnis bei großem Volumen `claude-sonnet-4-6`
  testen. Da der Job nicht zeitkritisch ist, halbiert die **Batch-API** die Kosten.
- **Kosten (grobe Hausnummer):** je Seite wenige Cent. Beispiel: 10 Ketten ×
  ~12 Seiten = 120 Seiten/Woche → im niedrigen einstelligen €-Bereich pro Woche.
  (Genau hängt's von Modell/Seitengröße ab – vor dem Skalieren messen.)

---

## 6. Ort → Angebote (Serving)

API-Ablauf bei „Angebote anzeigen":
1. PLZ/Ort des Profils → **Geocoding** (einmalig bei Eingabe gespeichert).
2. **PostGIS-Umkreissuche**: `ST_DWithin(markt.geo, profil.geo, radius)` →
   Filialen + zugehörige Regionen im Umkreis.
3. **Aktuelle Angebote** dieser Märkte/Regionen (`gueltig_bis >= heute`).
4. Rückgabe an die App → unser bestehendes **Matching + Optimierung** läuft
   unverändert darauf.

---

## 7. Änderungen in der App

- Neuer **Anmelde-/Login-Screen** (Supabase Auth).
- **Onboarding-Schritt „Ort/PLZ"** → ans Profil.
- Statt der lokalen `ANGEBOTE`-Liste: **`angebote = await api.angeboteFuerOrt()`**.
  Die Stelle ist schon sauber gekapselt (`angebotePool()`), d. h. der Umbau ist klein.
- Rest (Plan, Liste, Sparen, Tracking) bleibt wie er ist.

---

## 8. Recht & Datenschutz (ehrlich)

- **Prospekt-Inhalte unterliegen Urheberrecht.** Eigene Erfassung/Anzeige bitte
  rechtlich prüfen (Markenlogos, Bildmaterial, AGB der Ketten). Sauberer Start:
  Ketten/Regionen, deren Prospekte zur Weiterverarbeitung zulässig sind, ggf.
  Kooperationen, oder rein textliche Angebotsdaten ohne Originalgrafik.
- **DSGVO:** Konto + Standort sind personenbezogen → Datenschutzerklärung,
  Einwilligung, Löschkonzept.
- **Kein Scraping** der Shop-Seiten (im Konzept bewusst ausgeschlossen).

---

## 9. Stufenplan

| Stufe | Inhalt | Ergebnis |
|------|--------|----------|
| **0** | Backend (Supabase) + Auth + Profil/Ort; Angebote noch manuell für 1–2 lokale Märkte gepflegt | Anmeldung + Ort + echte (manuelle) Angebote |
| **1** | Wöchentliche **KI-Pipeline** für diese Märkte (du lädst Prospekte hoch) | Angebote aktualisieren sich automatisch |
| **2** | Mehr Ketten/Regionen, Review-Queue, Beschaffung automatisieren | Flächendeckung |
| **3** | Skalierung, Monitoring, Qualitätsmetriken | Marktreife |

---

## 10. Was ich als Nächstes als Code-Gerüst liefern kann
- **SQL-Schema** (oben) als Migration.
- **Edge Function** „extrahiere-prospekt" (Claude Vision, Tool-Use → JSON → Upsert).
- **Cron-Definition** (wöchentlich).
- **App-Anbindung**: `angebotePool()` auf API-Abruf umstellen (mit lokalem Fallback).
- **Auth- + Ort-Onboarding** in der App.

Das wäre echtes, deploybares Gerüst – die laufende Beschaffung/Prüfung der
Prospekte bleibt dein operativer Teil.
