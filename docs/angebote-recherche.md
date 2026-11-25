# Arbeitsauftrag: Wochenangebote für „Unsere Keto-Küche“

Diesen Text komplett in eine neue Sitzung der **Claude-Desktop-App auf dem Mac** einfügen.
Voraussetzung: Die Erweiterung **Claude in Chrome** ist installiert und Chrome ist geöffnet.

---

Bitte recherchiere mit Claude in Chrome die aktuellen Angebote der Woche für diese vier Märkte:

1. **Aldi Nord, Seesen**: aldi-nord.de → Angebote, Filiale Seesen wählen
2. **Lidl, Seesen**: lidl.de → Angebote, Filiale Seesen wählen
3. **REWE, Seesen**: rewe.de → Angebote, Markt „REWE Seesen“ wählen
4. **Edeka, Bad Gandersheim**: edeka.de → Marktsuche „Bad Gandersheim“ → Angebote des Marktes

Regeln:
- Nutze bevorzugt die Angebotsseiten der Märkte selbst. Nur wenn ein Markt dort keine Filialangebote zeigt, darfst du ihn in kaufDA in Chrome ansehen.
- Nichts einloggen, nichts bestellen, keine Konten anlegen. Cookie-Banner nur mit „Nur notwendige“ oder „Ablehnen“ schließen.
- Erfasse **nur Artikel, die zu ketogener oder karnivorer Ernährung passen**: Fleisch, Wurst, Fisch, Eier, Butter, Sahne, Käse, Quark, Joghurt natur, Öle und Fette, Avocado, Gemüse mit wenig Kohlenhydraten, Beeren, Nüsse, Mineralwasser, Kaffee, Tee. Keine Süßwaren, Backwaren, Nudeln, Reis, Kartoffeln, Säfte und keine Fertiggerichte mit Zucker.
- Pro Angebot: Name wie im Prospekt, Angebotspreis, Packungsgröße, Grundpreis pro kg, l oder Stück (selbst ausrechnen, wenn er fehlt), gültig von/bis (JJJJ-MM-TT) und Bedingungen wie „nur mit Lidl Plus“, „mit REWE Bonus“ oder „Payback“.
- Feld `match`: 1–3 passende Begriffe aus dieser Liste, damit die App das Angebot den Einkaufsartikeln zuordnen kann:
  Avocado, Bacon, Blattspinat, Blumenkohl, Bratwurst, Brokkoli, Butter, Butterschmalz, Cheddar, Currypaste, Eier, Emmentaler, Feldsalat, Feta, Garnelen, Gouda, Grüne Bohnen, Hähnchenbrust, Hähnchenflügel, Hähnchenschenkel, Himbeeren, Knoblauch, Knochenbrühe, Kochschinken, Kokosmilch, Lachsfilet, Lammkoteletts, Leberkäse, Magnesium, Makrele, Markknochen, Mascarpone, Mayonnaise, Meersalz, Mineralwasser, Mozzarella, Olivenöl, Paprika, Parmesan, Passierte Tomaten, Ribeye-Steak, Rindergulasch, Rinderhack, Rumpsteak, Sahne, Salami, Salatgurke, Sauerkraut, Schmand, Schweinebauch, Schweinenacken, Schweineschmalz, Schweineschnitzel, Senf, Spitzkohl, Thunfisch (naturell), Tomatenmark, Zucchini, Zwiebel.
  Passt nichts, nimm einen schlichten deutschen Oberbegriff (z. B. „Quark“).

Ausgabe:
Gib am Ende **genau einen Codeblock** mit diesem JSON aus, ohne weiteren Text darin:

```json
{"offers":[
  {"shop":"Aldi Seesen","name":"Rinder-Hackfleisch","match":["Rinderhack"],"price":4.49,"size":"500 g","base":8.98,"baseUnit":"kg","from":"2026-11-30","to":"2026-12-05","cond":""}
]}
```

`shop` ist immer genau einer dieser Namen: `Aldi Seesen`, `Lidl Seesen`, `REWE Seesen`, `Edeka Bad Gandersheim`.
`baseUnit` ist `kg`, `l` oder `Stk`.

Schreib unter den Codeblock in zwei Sätzen, welche Märkte geklappt haben und wo es Probleme gab.

---

## In die App übernehmen

1. Den JSON-Codeblock kopieren.
2. In der App: **Einkauf → Angebote → „Recherche vom Mac einfügen“** → einfügen → **Übernehmen**.

Angebote derselben Märkte werden dabei ersetzt, abgelaufene verschwinden automatisch.

## Jede Woche automatisch

In der Claude-Desktop-App kann diese Aufgabe als **geplante Aufgabe** angelegt werden, z. B. jeden Montag um 7 Uhr. Der Mac muss dann an sein und Chrome geöffnet. Das Einfügen in die App bleibt ein Handgriff.
