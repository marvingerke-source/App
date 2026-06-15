// ============================================================================
// Beispieldaten. In der echten App stammen Angebote aus KI-Prospekt-Import
// (Stufe 2) oder manueller Pflege.
// ============================================================================

const MAERKTE = [
  { id: "aldi",  name: "Aldi Süd", kurz: "AL", farbe: "#00457c", adresse: "Hauptstr. 12", entfernungKm: 0.6 },
  { id: "rewe",  name: "Rewe",     kurz: "RE", farbe: "#cc0000", adresse: "Marktplatz 3",  entfernungKm: 1.2 },
  { id: "lidl",  name: "Lidl",     kurz: "LI", farbe: "#0050aa", adresse: "Bahnhofstr. 8",  entfernungKm: 1.9 },
  { id: "edeka", name: "Edeka",    kurz: "ED", farbe: "#f9c100", entfernungKm: 2.8, adresse: "Ringstr. 21" },
  { id: "penny", name: "Penny",    kurz: "PE", farbe: "#e2001a", entfernungKm: 3.4, adresse: "Feldweg 5" },
];

const REZEPTE = [
  { id: "bolognese", name: "Spaghetti Bolognese", portionen: 2, dauerMin: 30, emoji: "🍝", veggie: false, zutaten: [
    { name: "Hackfleisch", menge: 400, einheit: "g", kategorie: "fleisch" },
    { name: "Spaghetti", menge: 500, einheit: "g", kategorie: "nudeln" },
    { name: "Zwiebeln", menge: 2, einheit: "Stk", kategorie: "gemuese" },
    { name: "Tomaten (Dose)", menge: 400, einheit: "g", kategorie: "konserven" },
    { name: "Knoblauch", menge: 2, einheit: "Zehen", kategorie: "gemuese" },
    { name: "Parmesan", menge: 100, einheit: "g", kategorie: "kaese" },
  ]},
  { id: "curry", name: "Gemüse-Kokos-Curry", portionen: 2, dauerMin: 25, emoji: "🍛", veggie: true, zutaten: [
    { name: "Kokosmilch", menge: 400, einheit: "ml", kategorie: "konserven" },
    { name: "Paprika", menge: 2, einheit: "Stk", kategorie: "gemuese" },
    { name: "Zwiebeln", menge: 1, einheit: "Stk", kategorie: "gemuese" },
    { name: "Reis", menge: 250, einheit: "g", kategorie: "reis" },
    { name: "Currypaste", menge: 50, einheit: "g", kategorie: "gewuerze" },
  ]},
  { id: "haehnchen", name: "Hähnchen mit Brokkoli & Reis", portionen: 2, dauerMin: 35, emoji: "🍗", veggie: false, zutaten: [
    { name: "Hähnchenbrust", menge: 600, einheit: "g", kategorie: "fleisch" },
    { name: "Brokkoli", menge: 1, einheit: "Stk", kategorie: "gemuese" },
    { name: "Reis", menge: 250, einheit: "g", kategorie: "reis" },
  ]},
  { id: "omelette", name: "Käse-Omelette", portionen: 2, dauerMin: 15, emoji: "🍳", veggie: true, zutaten: [
    { name: "Eier", menge: 6, einheit: "Stk", kategorie: "eier" },
    { name: "Milch", menge: 100, einheit: "ml", kategorie: "milch" },
    { name: "Käse", menge: 150, einheit: "g", kategorie: "kaese" },
  ]},
  { id: "salat", name: "Großer Hirtensalat", portionen: 2, dauerMin: 15, emoji: "🥗", veggie: true, zutaten: [
    { name: "Tomaten", menge: 4, einheit: "Stk", kategorie: "gemuese" },
    { name: "Gurke", menge: 1, einheit: "Stk", kategorie: "gemuese" },
    { name: "Feta", menge: 200, einheit: "g", kategorie: "kaese" },
    { name: "Olivenöl", menge: 50, einheit: "ml", kategorie: "oel" },
  ]},
  { id: "pasta_pesto", name: "Pasta mit Pesto", portionen: 2, dauerMin: 15, emoji: "🌿", veggie: true, zutaten: [
    { name: "Spaghetti", menge: 500, einheit: "g", kategorie: "nudeln" },
    { name: "Pesto", menge: 190, einheit: "g", kategorie: "konserven" },
    { name: "Parmesan", menge: 80, einheit: "g", kategorie: "kaese" },
  ]},
  { id: "chili", name: "Chili sin Carne", portionen: 3, dauerMin: 30, emoji: "🌶️", veggie: true, zutaten: [
    { name: "Kidneybohnen", menge: 400, einheit: "g", kategorie: "konserven" },
    { name: "Mais", menge: 300, einheit: "g", kategorie: "konserven" },
    { name: "Tomaten (Dose)", menge: 400, einheit: "g", kategorie: "konserven" },
    { name: "Paprika", menge: 1, einheit: "Stk", kategorie: "gemuese" },
    { name: "Zwiebeln", menge: 1, einheit: "Stk", kategorie: "gemuese" },
    { name: "Reis", menge: 250, einheit: "g", kategorie: "reis" },
  ]},
  { id: "lachs", name: "Ofenlachs mit Kartoffeln", portionen: 2, dauerMin: 40, emoji: "🐟", veggie: false, zutaten: [
    { name: "Lachsfilet", menge: 300, einheit: "g", kategorie: "fisch" },
    { name: "Kartoffeln", menge: 600, einheit: "g", kategorie: "gemuese" },
    { name: "Zitrone", menge: 1, einheit: "Stk", kategorie: "gemuese" },
  ]},
  { id: "pancakes", name: "Pancakes", portionen: 2, dauerMin: 20, emoji: "🥞", veggie: true, zutaten: [
    { name: "Mehl", menge: 250, einheit: "g", kategorie: "backen" },
    { name: "Eier", menge: 2, einheit: "Stk", kategorie: "eier" },
    { name: "Milch", menge: 300, einheit: "ml", kategorie: "milch" },
  ]},
  { id: "wraps", name: "Hähnchen-Wraps", portionen: 2, dauerMin: 25, emoji: "🌯", veggie: false, zutaten: [
    { name: "Hähnchenbrust", menge: 400, einheit: "g", kategorie: "fleisch" },
    { name: "Tortillas", menge: 6, einheit: "Stk", kategorie: "backen" },
    { name: "Paprika", menge: 1, einheit: "Stk", kategorie: "gemuese" },
    { name: "Tomaten", menge: 2, einheit: "Stk", kategorie: "gemuese" },
  ]},
];

// Aktiv im System hinterlegte Angebote (gültige Woche).
const ANGEBOTE = [
  { id: "a1", markt: "aldi", produktname: "Frisches Hackfleisch gemischt 500g", kategorie: "fleisch", preis: 3.49, normalpreis: 4.49, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a2", markt: "rewe", produktname: "Bio-Hackfleisch Rind 400g", kategorie: "fleisch", preis: 4.99, normalpreis: 5.99, einheit: "400g", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a3", markt: "lidl", produktname: "Hähnchenbrustfilet 1kg", kategorie: "fleisch", preis: 6.99, normalpreis: 8.49, einheit: "1kg", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a4", markt: "edeka", produktname: "Bio-Hähnchenbrust 600g", kategorie: "fleisch", preis: 7.49, normalpreis: 8.99, einheit: "600g", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a5", markt: "aldi", produktname: "Spaghetti 500g", kategorie: "nudeln", preis: 0.79, normalpreis: 1.09, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a6", markt: "rewe", produktname: "Bio-Spaghetti 500g", kategorie: "nudeln", preis: 1.29, normalpreis: 1.69, einheit: "500g", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a7", markt: "lidl", produktname: "Basmatireis 1kg", kategorie: "reis", preis: 1.99, normalpreis: 2.79, einheit: "1kg", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a8", markt: "edeka", produktname: "Bio-Basmatireis 500g", kategorie: "reis", preis: 2.49, normalpreis: 2.99, einheit: "500g", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a9", markt: "aldi", produktname: "Zwiebeln 2kg Netz", kategorie: "gemuese", preis: 1.49, normalpreis: 1.99, einheit: "2kg", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a10", markt: "lidl", produktname: "Paprika rot 500g", kategorie: "gemuese", preis: 1.79, normalpreis: 2.49, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a11", markt: "rewe", produktname: "Bio-Paprika Mix 500g", kategorie: "gemuese", preis: 2.49, normalpreis: 2.99, einheit: "500g", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a12", markt: "edeka", produktname: "Brokkoli Stück", kategorie: "gemuese", preis: 0.99, normalpreis: 1.49, einheit: "Stk", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a13", markt: "aldi", produktname: "Rispentomaten 500g", kategorie: "gemuese", preis: 1.29, normalpreis: 1.99, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a14", markt: "lidl", produktname: "Salatgurke", kategorie: "gemuese", preis: 0.59, normalpreis: 0.89, einheit: "Stk", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a15", markt: "rewe", produktname: "Knoblauch 200g", kategorie: "gemuese", preis: 0.89, normalpreis: 1.19, einheit: "200g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a16", markt: "aldi", produktname: "Gehackte Tomaten 400g Dose", kategorie: "konserven", preis: 0.49, normalpreis: 0.79, einheit: "400g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a17", markt: "edeka", produktname: "Bio-Kokosmilch 400ml", kategorie: "konserven", preis: 1.19, normalpreis: 1.59, einheit: "400ml", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a18", markt: "lidl", produktname: "Kokosmilch 400ml", kategorie: "konserven", preis: 0.89, normalpreis: 1.29, einheit: "400ml", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a19", markt: "rewe", produktname: "Pesto Genovese 190g", kategorie: "konserven", preis: 1.79, normalpreis: 2.29, einheit: "190g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a20", markt: "aldi", produktname: "Frische Vollmilch 3,8% 1L", kategorie: "milch", preis: 0.99, normalpreis: 1.19, einheit: "1L", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a21", markt: "rewe", produktname: "Bio-Vollmilch 3,8% 1L", kategorie: "milch", preis: 1.39, normalpreis: 1.59, einheit: "1L", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a22", markt: "lidl", produktname: "Eier Bodenhaltung 10er", kategorie: "eier", preis: 1.79, normalpreis: 2.29, einheit: "10 Stk", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a23", markt: "edeka", produktname: "Bio-Eier 6er", kategorie: "eier", preis: 2.49, normalpreis: 2.99, einheit: "6 Stk", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a24", markt: "aldi", produktname: "Gouda jung 400g", kategorie: "kaese", preis: 2.99, normalpreis: 3.79, einheit: "400g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a25", markt: "rewe", produktname: "Parmigiano Reggiano 150g", kategorie: "kaese", preis: 2.99, normalpreis: 3.49, einheit: "150g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a26", markt: "lidl", produktname: "Feta 200g", kategorie: "kaese", preis: 1.49, normalpreis: 1.99, einheit: "200g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a27", markt: "edeka", produktname: "Olivenöl nativ extra 500ml", kategorie: "oel", preis: 4.99, normalpreis: 6.49, einheit: "500ml", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a28", markt: "rewe", produktname: "Rote Currypaste 195g", kategorie: "gewuerze", preis: 1.99, normalpreis: 2.49, einheit: "195g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a29", markt: "aldi", produktname: "Kidneybohnen 400g Dose", kategorie: "konserven", preis: 0.55, normalpreis: 0.85, einheit: "400g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a30", markt: "lidl", produktname: "Mais 300g Dose", kategorie: "konserven", preis: 0.69, normalpreis: 0.99, einheit: "300g", istBio: false, gueltigBis: "2026-06-21" },
];

// Prospekte für den KI-Import (Stufe 2): zusätzliche, noch nicht im System
// vorhandene Angebote, die "aus dem Prospekt erkannt" werden.
const PROSPEKTE = [
  { id: "p_penny", markt: "penny", titel: "Penny", zeitraum: "Mo–Sa diese Woche", farbe: "#e2001a", angebote: [
    { id: "p1", markt: "penny", produktname: "Hähnchenbrustfilet 500g", kategorie: "fleisch", preis: 3.33, normalpreis: 4.29, einheit: "500g", istBio: false, gueltigBis: "2026-06-20" },
    { id: "p2", markt: "penny", produktname: "Kartoffeln festkochend 2kg", kategorie: "gemuese", preis: 1.59, normalpreis: 2.29, einheit: "2kg", istBio: false, gueltigBis: "2026-06-20" },
    { id: "p3", markt: "penny", produktname: "Mehl Type 405 1kg", kategorie: "backen", preis: 0.59, normalpreis: 0.89, einheit: "1kg", istBio: false, gueltigBis: "2026-06-20" },
    { id: "p4", markt: "penny", produktname: "Weizentortillas 8 Stk", kategorie: "backen", preis: 1.29, normalpreis: 1.79, einheit: "8 Stk", istBio: false, gueltigBis: "2026-06-20" },
  ]},
  { id: "p_edeka", markt: "edeka", titel: "Edeka", zeitraum: "ganze Woche", farbe: "#005baa", angebote: [
    { id: "p5", markt: "edeka", produktname: "Frischer Lachs Filet 300g", kategorie: "fisch", preis: 4.99, normalpreis: 6.99, einheit: "300g", istBio: false, gueltigBis: "2026-06-21" },
    { id: "p6", markt: "edeka", produktname: "Bio-Zitronen 4 Stk", kategorie: "gemuese", preis: 1.49, normalpreis: 1.99, einheit: "4 Stk", istBio: true, gueltigBis: "2026-06-21" },
    { id: "p7", markt: "edeka", produktname: "Tortilla Wraps 6 Stk", kategorie: "backen", preis: 1.49, normalpreis: 1.99, einheit: "6 Stk", istBio: false, gueltigBis: "2026-06-21" },
  ]},
];

// Stichwörter fürs unscharfe Matching (Platzhalter für KI-Produktabgleich).
const MATCH_STICHWOERTER = {
  "hackfleisch": ["hackfleisch", "hack"],
  "spaghetti": ["spaghetti", "pasta", "nudeln"],
  "zwiebeln": ["zwiebel"],
  "tomaten (dose)": ["gehackte tomaten", "tomaten 400", "dose"],
  "knoblauch": ["knoblauch"],
  "parmesan": ["parmesan", "parmigiano"],
  "kokosmilch": ["kokosmilch"],
  "paprika": ["paprika"],
  "reis": ["reis", "basmati"],
  "currypaste": ["currypaste", "curry"],
  "hähnchenbrust": ["hähnchenbrust", "hähnchen", "huhn"],
  "brokkoli": ["brokkoli"],
  "eier": ["eier"],
  "milch": ["milch", "vollmilch"],
  "käse": ["gouda", "käse", "emmentaler"],
  "tomaten": ["rispentomaten", "tomaten 500", "tomaten"],
  "gurke": ["gurke"],
  "feta": ["feta"],
  "olivenöl": ["olivenöl", "olivenoel"],
  "pesto": ["pesto"],
  "kidneybohnen": ["kidneybohnen", "bohnen"],
  "mais": ["mais"],
  "lachsfilet": ["lachs"],
  "kartoffeln": ["kartoffeln", "kartoffel"],
  "zitrone": ["zitrone", "zitronen"],
  "mehl": ["mehl"],
  "tortillas": ["tortilla", "wraps"],
};

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const HEUTE_INDEX = 0; // Mo als "heute" für die Demo
