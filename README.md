# Smarter Wochen-Einkauf

Übersetzt deinen Wochenplan in eine nach Läden sortierte Einkaufsliste – auf
Basis der aktuell beworbenen **Prospekt-Angebote** und unter Berücksichtigung
von **Budget**, **Bio-Wunsch** und einer **Obergrenze für die Anzahl der Läden**.

Dieses Repository enthält die Umsetzung von **Stufe 1** aus dem Konzeptpapier
(Rezepte → Wochenplan → automatische Liste → Vorgaben → bestes Angebots-Paket
→ Einkaufsliste). Angebote sind hier noch als Beispieldaten hinterlegt; der
KI-gestützte Prospekt-Import ist Stufe 2.

## Inhalt

| Ordner / Datei  | Was                                                                          |
|-----------------|------------------------------------------------------------------------------|
| `web/`          | **Die App** (HTML/CSS/JS) – Single Source of Truth, läuft im Browser & in der nativen Hülle. |
| `ios/`          | **Capacitor-iOS-Projekt** (store-fähige native App). Bauen: siehe `BUILD-iOS.md`. |
| `BUILD-iOS.md`  | Schritt-für-Schritt: store-fähige iOS-App auf dem Mac bauen.                  |
| `ios-legacy/`   | Frühere reine SwiftUI-/WebView-Gerüste (nur Referenz, nicht mehr aktiv).      |

Die App läuft als **Capacitor-Hybrid**: derselbe Web-Code als eingebettete native
iOS-App mit nativen Funktionen (Splash, Statusleiste, Haptik) – App-Store-tauglich.

## Web-Prototyp starten

```bash
cd web
python3 -m http.server 8000   # oder: npx serve
# Browser: http://localhost:8000
```

Am besten in der mobilen Geräteansicht der Entwicklertools (390×844). Der
Prototyp ist voll interaktiv: Gerichte planen, Vorräte abhaken, Budget/Bio/
Läden einstellen, optimiertes Paket berechnen und Einkauf abhaken.

## iOS-App

`ios/SmartEinkauf/` ist reiner SwiftUI-Quellcode. Auf einem Mac:

1. In Xcode ein neues iOS-App-Projekt „SmartEinkauf" anlegen.
2. Die Dateien aus `ios/SmartEinkauf/` in das Target ziehen (statt der
   generierten `ContentView`/`App`-Datei).
3. Build & Run – kein externes Paket nötig.

> Hinweis: Der Code wurde unter Linux geschrieben und konnte hier nicht
> kompiliert werden. Er folgt idiomatischem SwiftUI und ist als Startgerüst
> gedacht.

## Architektur (gemäß Konzept Abschnitt 3)

- **Baustein A – Plan & Bedarf:** Wochenplan mit Slots; gleiche Zutaten über
  die Woche werden zu einer Bedarfsliste zusammengeführt
  (`bedarfBerechnen` / `Einkaufsplaner.bedarf`).
- **Baustein C – Matching:** unscharfer Abgleich Zutat ↔ Prospekt-Angebot über
  Kategorie + Stichwörter. In der echten App übernimmt das ein KI-Modell; hier
  eine Stichwort-Heuristik (`MATCH_STICHWOERTER`).
- **Baustein D – Optimierung:** findet die Laden-Kombination (≤ max. Läden), die
  die meisten Positionen abdeckt und den Gesamtpreis minimiert, respektiert den
  Bio-Wunsch und meldet, wenn sich ein zusätzlicher Laden kaum lohnt.

## Datenmodell (Abschnitt 4)

`Rezept` (zutaten[]), `Angebot` (markt, preis, istBio, gültigBis …), `Markt`.
Der berechnete `Einkaufsplan` ist eine Zuordnung pro Markt inkl. Summe und
Ersparnis gegenüber Normalpreis.

## Live-Demo

Der Web-Prototyp ist die vollständige Referenz-Implementierung und läuft unter
**https://marvingerke-source.github.io/App/** (solange das Repo öffentlich ist).

## Funktionsumfang Web-App

- **Start/Dashboard** – Wochenüberblick (Kosten, Ersparnis, Läden), Schnellzugriff,
  „Angebote der Woche".
- **Wochenplan** – mehrere Gerichte pro Tag, Portionen anpassen, „heute"-Hervorhebung.
- **Liste** – automatisch zusammengeführt, Vorräte abhaken.
- **Sparen** – animiertes Gesamt-Total, Ersparnis, Route/Entfernung, Laden-Hinweis.
- **Einkaufen** – nach Läden gruppiert, Fortschrittsbalken, Abschluss-Animation.
- **Prospekt-Import (Stufe 2)** – simulierter KI-Scan, der Angebote erkennt & übernimmt.
- **Märkte (Stufe 4)** – Märkte mit Entfernung an-/abschalten.
- Onboarding, Dark Mode, Persistenz via `localStorage`.

Dateien: `index.html`, `styles.css` (Design-System), `data.js`, `logic.js`
(A/C/D), `icons.js`, `store.js` (State+Persistenz), `app.js` (UI/Router).

## Roadmap (Abschnitt 7)

- [x] **Stufe 1** – Rezepte, Wochenplan, automatische Liste, Budget/Bio-Filter,
      Optimierung über Läden.
- [x] **Stufe 2** – KI-gestützter Prospekt-Import (im Web-Prototyp simuliert).
- [x] **Stufe 3** – Mehr-Laden-Optimierung mit Fahrten-Obergrenze & „lohnt-sich"-Hinweis.
- [x] **Stufe 4** – Mehrere Märkte mit Entfernung, verwaltbar.
- [ ] Echte Daten: OCR/Sprachmodell-Pipeline & Backend statt Beispieldaten.
