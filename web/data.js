// Beispieldaten für den Stufe-1-Prototyp.
// In der echten App stammen Angebote aus Prospekt-Import (KI/OCR) oder manueller Pflege.

// --- Märkte -----------------------------------------------------------------
const MAERKTE = [
  { id: "aldi",  name: "Aldi Süd",  entfernungKm: 0.8 },
  { id: "rewe",  name: "Rewe",      entfernungKm: 1.4 },
  { id: "lidl",  name: "Lidl",      entfernungKm: 2.1 },
  { id: "edeka", name: "Edeka",     entfernungKm: 3.0 },
];

// --- Rezepte ----------------------------------------------------------------
// menge in Basiseinheit der Zutat; kategorie hilft beim Matching.
const REZEPTE = [
  {
    id: "bolognese",
    name: "Spaghetti Bolognese",
    portionen: 2,
    dauerMin: 30,
    emoji: "🍝",
    zutaten: [
      { name: "Hackfleisch",     menge: 400, einheit: "g",     kategorie: "fleisch" },
      { name: "Spaghetti",       menge: 500, einheit: "g",     kategorie: "nudeln" },
      { name: "Zwiebeln",        menge: 2,   einheit: "Stk",   kategorie: "gemuese" },
      { name: "Tomaten (Dose)",  menge: 400, einheit: "g",     kategorie: "konserven" },
      { name: "Knoblauch",       menge: 2,   einheit: "Zehen", kategorie: "gemuese" },
      { name: "Parmesan",        menge: 100, einheit: "g",     kategorie: "kaese" },
    ],
  },
  {
    id: "curry",
    name: "Gemüse-Kokos-Curry",
    portionen: 2,
    dauerMin: 25,
    emoji: "🍛",
    zutaten: [
      { name: "Kokosmilch",  menge: 400, einheit: "ml",  kategorie: "konserven" },
      { name: "Paprika",     menge: 2,   einheit: "Stk", kategorie: "gemuese" },
      { name: "Zwiebeln",    menge: 1,   einheit: "Stk", kategorie: "gemuese" },
      { name: "Reis",        menge: 250, einheit: "g",   kategorie: "reis" },
      { name: "Currypaste",  menge: 50,  einheit: "g",   kategorie: "gewuerze" },
    ],
  },
  {
    id: "haehnchen",
    name: "Hähnchen mit Brokkoli & Reis",
    portionen: 2,
    dauerMin: 35,
    emoji: "🍗",
    zutaten: [
      { name: "Hähnchenbrust", menge: 600, einheit: "g",   kategorie: "fleisch" },
      { name: "Brokkoli",      menge: 1,   einheit: "Stk", kategorie: "gemuese" },
      { name: "Reis",          menge: 250, einheit: "g",   kategorie: "reis" },
    ],
  },
  {
    id: "omelette",
    name: "Käse-Omelette",
    portionen: 2,
    dauerMin: 15,
    emoji: "🍳",
    zutaten: [
      { name: "Eier",  menge: 6,   einheit: "Stk", kategorie: "eier" },
      { name: "Milch", menge: 100, einheit: "ml",  kategorie: "milch" },
      { name: "Käse",  menge: 150, einheit: "g",   kategorie: "kaese" },
    ],
  },
  {
    id: "salat",
    name: "Großer Hirtensalat",
    portionen: 2,
    dauerMin: 15,
    emoji: "🥗",
    zutaten: [
      { name: "Tomaten",  menge: 4,   einheit: "Stk", kategorie: "gemuese" },
      { name: "Gurke",    menge: 1,   einheit: "Stk", kategorie: "gemuese" },
      { name: "Feta",     menge: 200, einheit: "g",   kategorie: "kaese" },
      { name: "Olivenöl", menge: 50,  einheit: "ml",  kategorie: "oel" },
    ],
  },
  {
    id: "pasta_pesto",
    name: "Pasta mit Pesto",
    portionen: 2,
    dauerMin: 15,
    emoji: "🌿",
    zutaten: [
      { name: "Spaghetti", menge: 500, einheit: "g", kategorie: "nudeln" },
      { name: "Pesto",     menge: 190, einheit: "g", kategorie: "konserven" },
      { name: "Parmesan",  menge: 80,  einheit: "g", kategorie: "kaese" },
    ],
  },
];

// --- Angebote aus den Wochenprospekten -------------------------------------
// preis = Aktionspreis, normalpreis = unverbindliche Vergleichsbasis.
const ANGEBOTE = [
  // Fleisch
  { id: "a1",  markt: "aldi",  produktname: "Frisches Hackfleisch gemischt 500g", kategorie: "fleisch", preis: 3.49, normalpreis: 4.49, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a2",  markt: "rewe",  produktname: "Bio-Hackfleisch Rind 400g",          kategorie: "fleisch", preis: 4.99, normalpreis: 5.99, einheit: "400g", istBio: true,  gueltigBis: "2026-06-21" },
  { id: "a3",  markt: "lidl",  produktname: "Hähnchenbrustfilet 1kg",             kategorie: "fleisch", preis: 6.99, normalpreis: 8.49, einheit: "1kg",  istBio: false, gueltigBis: "2026-06-21" },
  { id: "a4",  markt: "edeka", produktname: "Bio-Hähnchenbrust 600g",             kategorie: "fleisch", preis: 7.49, normalpreis: 8.99, einheit: "600g", istBio: true,  gueltigBis: "2026-06-21" },

  // Nudeln / Reis
  { id: "a5",  markt: "aldi",  produktname: "Spaghetti 500g",          kategorie: "nudeln", preis: 0.79, normalpreis: 1.09, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a6",  markt: "rewe",  produktname: "Bio-Spaghetti 500g",      kategorie: "nudeln", preis: 1.29, normalpreis: 1.69, einheit: "500g", istBio: true,  gueltigBis: "2026-06-21" },
  { id: "a7",  markt: "lidl",  produktname: "Basmatireis 1kg",         kategorie: "reis",   preis: 1.99, normalpreis: 2.79, einheit: "1kg",  istBio: false, gueltigBis: "2026-06-21" },
  { id: "a8",  markt: "edeka", produktname: "Bio-Basmatireis 500g",    kategorie: "reis",   preis: 2.49, normalpreis: 2.99, einheit: "500g", istBio: true,  gueltigBis: "2026-06-21" },

  // Gemüse
  { id: "a9",  markt: "aldi",  produktname: "Zwiebeln 2kg Netz",        kategorie: "gemuese", preis: 1.49, normalpreis: 1.99, einheit: "2kg", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a10", markt: "lidl",  produktname: "Paprika rot 500g",         kategorie: "gemuese", preis: 1.79, normalpreis: 2.49, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a11", markt: "rewe",  produktname: "Bio-Paprika Mix 500g",     kategorie: "gemuese", preis: 2.49, normalpreis: 2.99, einheit: "500g", istBio: true,  gueltigBis: "2026-06-21" },
  { id: "a12", markt: "edeka", produktname: "Brokkoli Stück",           kategorie: "gemuese", preis: 0.99, normalpreis: 1.49, einheit: "Stk", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a13", markt: "aldi",  produktname: "Rispentomaten 500g",       kategorie: "gemuese", preis: 1.29, normalpreis: 1.99, einheit: "500g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a14", markt: "lidl",  produktname: "Salatgurke",               kategorie: "gemuese", preis: 0.59, normalpreis: 0.89, einheit: "Stk", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a15", markt: "rewe",  produktname: "Knoblauch 200g",           kategorie: "gemuese", preis: 0.89, normalpreis: 1.19, einheit: "200g", istBio: false, gueltigBis: "2026-06-21" },

  // Konserven / Saucen
  { id: "a16", markt: "aldi",  produktname: "Gehackte Tomaten 400g Dose", kategorie: "konserven", preis: 0.49, normalpreis: 0.79, einheit: "400g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a17", markt: "edeka", produktname: "Bio-Kokosmilch 400ml",       kategorie: "konserven", preis: 1.19, normalpreis: 1.59, einheit: "400ml", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a18", markt: "lidl",  produktname: "Kokosmilch 400ml",           kategorie: "konserven", preis: 0.89, normalpreis: 1.29, einheit: "400ml", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a19", markt: "rewe",  produktname: "Pesto Genovese 190g",        kategorie: "konserven", preis: 1.79, normalpreis: 2.29, einheit: "190g", istBio: false, gueltigBis: "2026-06-21" },

  // Milchprodukte / Käse / Eier
  { id: "a20", markt: "aldi",  produktname: "Frische Vollmilch 3,8% 1L", kategorie: "milch", preis: 0.99, normalpreis: 1.19, einheit: "1L", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a21", markt: "rewe",  produktname: "Bio-Vollmilch 3,8% 1L",     kategorie: "milch", preis: 1.39, normalpreis: 1.59, einheit: "1L", istBio: true,  gueltigBis: "2026-06-21" },
  { id: "a22", markt: "lidl",  produktname: "Eier Bodenhaltung 10er",    kategorie: "eier",  preis: 1.79, normalpreis: 2.29, einheit: "10 Stk", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a23", markt: "edeka", produktname: "Bio-Eier 6er",              kategorie: "eier",  preis: 2.49, normalpreis: 2.99, einheit: "6 Stk", istBio: true, gueltigBis: "2026-06-21" },
  { id: "a24", markt: "aldi",  produktname: "Gouda jung 400g",           kategorie: "kaese", preis: 2.99, normalpreis: 3.79, einheit: "400g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a25", markt: "rewe",  produktname: "Parmigiano Reggiano 150g",  kategorie: "kaese", preis: 2.99, normalpreis: 3.49, einheit: "150g", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a26", markt: "lidl",  produktname: "Feta 200g",                 kategorie: "kaese", preis: 1.49, normalpreis: 1.99, einheit: "200g", istBio: false, gueltigBis: "2026-06-21" },

  // Öl / Gewürze
  { id: "a27", markt: "edeka", produktname: "Olivenöl nativ extra 500ml", kategorie: "oel",      preis: 4.99, normalpreis: 6.49, einheit: "500ml", istBio: false, gueltigBis: "2026-06-21" },
  { id: "a28", markt: "rewe",  produktname: "Rote Currypaste 195g",       kategorie: "gewuerze", preis: 1.99, normalpreis: 2.49, einheit: "195g",  istBio: false, gueltigBis: "2026-06-21" },
];

// Synonyme/Stichwörter für das unscharfe Matching (in der echten App: KI).
// Schlüssel = Rezeptzutat (lowercase), Werte = Stichwörter, die im Angebot vorkommen dürfen.
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
};

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
