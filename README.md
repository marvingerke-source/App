# Unsere Keto-Küche

Gemeinsame Einkaufs- und Ernährungsplanung für zwei Personen: zuerst ketogen,
später OMAD bzw. karnivor.

**Geteilte Live-Version (claude.ai):** https://claude.ai/artifact/ThAy1uhKDtpb2mjjKatSjc
Beide Personen sehen denselben Stand. Wer mitplanen soll, braucht ein
claude.ai-Konto und eine Freigabe mit Bearbeiten-Recht (Teilen-Menü der Seite).

## Funktionen

| Bereich  | Was                                                                                          |
|----------|----------------------------------------------------------------------------------------------|
| Liste    | Einkaufsliste nach Kategorien, Keto-Basics per Tipp, Warnung bei kohlenhydratreichen Artikeln, „Einkauf abschließen“ trägt Betrag ins Budget ein und übernimmt Artikel in den Vorrat. |
| Plan     | Wochenplan (KW), Gerichte pro Tag, Makros pro Person mit Carb-Ampel, Zutaten der Woche auf die Liste (Vorrat wird abgezogen). |
| Rezepte  | 15 Keto-/Karnivor-/OMAD-Rezepte für 2 Portionen, eigene Rezepte anlegen.                     |
| Vorrat   | Kühlschrank / Tiefkühler / Vorratsschrank mit MHD-Warnung, „Nachkaufen“ setzt auf die Liste.  |
| Fasten   | Fasten-Timer je Person, Ziel nach Phase (12 h / 16 h / 23 h), Serie, Verlauf, Elektrolyt-Check. |
| Budget   | Monatsbudget, Ausgaben je Laden, Hochrechnung zum Monatsende.                                |

Phase (Keto → 16:8 → OMAD → Karnivor + OMAD), Namen, Carb-Grenze und Budget
werden über das Zahnrad eingestellt.

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
