# Unsere Keto-Küche

Gemeinsame Einkaufs- und Ernährungsplanung für zwei Personen: zuerst ketogen,
später OMAD bzw. karnivor.

**Geteilte Live-Version (claude.ai):** https://claude.ai/artifact/ThAy1uhKDtpb2mjjKatSjc
Beide Personen sehen denselben Stand. Wer mitplanen soll, braucht ein
claude.ai-Konto und eine Freigabe mit Bearbeiten-Recht (Teilen-Menü der Seite).

## Funktionen

Aufbau im iPhone-Stil mit vier Bereichen:

| Bereich | Was                                                                                          |
|---------|----------------------------------------------------------------------------------------------|
| Einkauf | Eingabe mit Mengenerkennung („500 g Rinderhack“) und Autovervollständigung, „Häufig gekauft“ lernt aus euren Einkäufen und blendet aus, was schon auf der Liste steht. Kategorien merken sich Korrekturen, Filter nach Laden, „Neu“-Markierung für Einträge der anderen Person, Wischen zum Löschen mit Rückgängig, „Einkauf abschließen“ mit Budget und Vorrat. Budget und Preise über die Zeile unter dem Titel. **Angebote** (Aldi/Lidl/REWE Seesen, Edeka Bad Gandersheim): Prospekt-Screenshots von Claude auslesen lassen oder die Recherche vom Mac einfügen (siehe `docs/angebote-recherche.md`). Angebote erscheinen an passenden Artikeln, „Liste nach günstigstem Laden aufteilen“ ordnet alles zu, Angebotspreise fließen in die Rezeptkosten ein. **Kassenbon** fotografieren: Summe, Laden und echte Preise werden übernommen (das Foto wird nicht gespeichert). |
| Woche   | Tagesleiste, Carb-Ring pro Tag, Woche automatisch füllen, Zutaten der Woche auf die Liste, Merkliste. Rezepte (37) mit Filtern, Portionen-Umrechnung, Kochmodus (Bildschirm bleibt an), Meal-Prep, Kosten pro Portion, Rezeptvorschlag aus dem Vorrat durch Claude. |
| Vorrat  | Kühlschrank / Tiefkühler / Schrank, MHD-Warnung, Nachkaufen.                                  |
| Ich     | Fasten-Ring je Person, Carbs heute, Supplemente zum Abhaken mit Bestand, Gewicht und Ketone, Einstellungen. |

## Aufbau

- `src/keto-kueche.html` – Quelle (einzelne Datei, ohne Abhängigkeiten außer Google Fonts).
  Auf claude.ai speichert sie in der geteilten Datenbank, sonst im `localStorage`.
- `web/index.html` – eigenständige Version, erzeugt mit `scripts/build-web.sh`.
  Speichert nur auf dem jeweiligen Gerät.

```bash
./scripts/build-web.sh
cd web && python3 -m http.server 8000
```

Makroangaben der Rezepte sind Richtwerte pro Portion.
