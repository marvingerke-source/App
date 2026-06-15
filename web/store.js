// App-Zustand inkl. Persistenz (localStorage). Eine zentrale Quelle der Wahrheit.
const STORAGE_KEY = "smartEinkauf.v2";

const defaults = () => ({
  // Wochenplan: Tag -> Array von { rezeptId, portionen }
  plan: {
    "Mo": [{ rezeptId: "bolognese", portionen: 2 }],
    "Di": [{ rezeptId: "salat", portionen: 2 }],
    "Do": [{ rezeptId: "haehnchen", portionen: 2 }],
    "Fr": [{ rezeptId: "pasta_pesto", portionen: 2 }],
    "Sa": [{ rezeptId: "curry", portionen: 4 }],
  },
  vorratAbgehakt: [],
  einkaufAbgehakt: [],
  vorgaben: { budget: 45, bioGewuenscht: false, maxLaeden: 2 },
  aktiveMaerkte: ["aldi", "rewe", "lidl", "edeka"],
  importierteAngebote: [],
  eigeneRezepte: [],     // vom Nutzer angelegte Rezepte (mit Foto)
  bewertungen: {},       // rezeptId -> Sterne (1–5) des Nutzers
  bildCache: {},         // rezeptId -> echte Foto-URL (Pexels), gecacht
  bildVersion: 0,        // zum Auffrischen des Foto-Caches bei besseren Stichwörtern
  vorrat: [],            // Zutaten, die der Nutzer zu Hause hat (Kühlschrank)
  onboardingGesehen: false,
});

let state = lade();

function lade() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return defaults();
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

function reset() { state = defaults(); persist(); }

// --- Abgeleitete Werte ------------------------------------------------------
function alleRezepte() { return [...state.eigeneRezepte, ...REZEPTE]; }
function angebotePool() { return [...ANGEBOTE, ...state.importierteAngebote]; }
function bedarfKey(b) { return `${b.name.toLowerCase()}|${b.einheit}`; }
function gesamterBedarf() { return bedarfBerechnen(state.plan, alleRezepte()); }
function offenerBedarf() { return gesamterBedarf().filter((b) => !state.vorratAbgehakt.includes(bedarfKey(b))); }
function aktuellerPlan() {
  return einkaufsplanBerechnen(offenerBedarf(), state.vorgaben, angebotePool(), state.aktiveMaerkte);
}
function rezept(id) { return alleRezepte().find((r) => r.id === id); }

// Eigene Rezepte & Bewertungen
function eigenesRezeptSpeichern(obj) {
  state.eigeneRezepte.unshift(obj); persist();
}
function rezeptLoeschen(id) {
  state.eigeneRezepte = state.eigeneRezepte.filter((r) => r.id !== id);
  for (const tag of Object.keys(state.plan)) {
    const arr = planEintraege(tag).filter((e) => e.rezeptId !== id);
    if (arr.length) state.plan[tag] = arr; else delete state.plan[tag];
  }
  delete state.bewertungen[id]; persist();
}
function bewertungSetzen(id, sterne) { state.bewertungen[id] = sterne; persist(); }

// --- Kühlschrank / „Was kann ich kochen?" -----------------------------------
function normTxt(s) { return String(s).toLowerCase().trim(); }
function vorratToggle(name) {
  const n = normTxt(name); if (!n) return;
  const i = state.vorrat.indexOf(n);
  if (i >= 0) state.vorrat.splice(i, 1); else state.vorrat.push(n);
  persist();
}
function vorratHat(name) { return state.vorrat.includes(normTxt(name)); }

// Ist eine Rezeptzutat durch den Vorrat gedeckt? (unscharf, wie das KI-Matching)
function zutatGedeckt(zutatName) {
  const n = normTxt(zutatName);
  const stich = MATCH_STICHWOERTER[n] || [n];
  return state.vorrat.some((v) =>
    n.includes(v) || v.includes(n) || stich.some((s) => s.includes(v) || v.includes(s)));
}

// Rezepte nach Deckungsgrad durch den Vorrat.
function kochbareRezepte() {
  return alleRezepte().map((r) => {
    const fehlend = r.zutaten.filter((z) => !zutatGedeckt(z.name)).map((z) => z.name);
    const total = r.zutaten.length, have = total - fehlend.length;
    return { r, have, total, fehlend, quote: total ? have / total : 0 };
  }).filter((x) => x.have > 0)
    .sort((a, b) => b.quote - a.quote || (b.r.rating || 0) - (a.r.rating || 0));
}

// Automatische Empfehlungen (saisonal + beliebt + Bewertung), ohne bereits Geplantes.
function empfehlungen(n = 10) {
  const saison = (() => { const m = new Date().getMonth() + 1; return m <= 2 || m === 12 ? "Winter" : m <= 5 ? "Frühling" : m <= 8 ? "Sommer" : "Herbst"; })();
  const geplant = new Set(Object.values(state.plan).flat().map((e) => e.rezeptId));
  const score = (r) => (r.saison || []).includes(saison) * 2 + (r.beliebt ? 1.5 : 0) + (r.rating || 0) / 2;
  return alleRezepte().filter((r) => !geplant.has(r.id)).sort((a, b) => score(b) - score(a)).slice(0, n);
}

// Leere Wochentage automatisch mit abwechslungsreichen Vorschlägen füllen.
function wochePlanenAuto() {
  const vorschlaege = empfehlungen(20);
  let i = 0;
  for (const tag of WOCHENTAGE) {
    if (planEintraege(tag).length) continue;
    const r = vorschlaege[i++];
    if (!r) break;
    state.plan[tag] = [{ rezeptId: r.id, portionen: r.portionen }];
  }
  persist();
}

// Effektive Bewertung inkl. eigener Stimme.
function effektiveBewertung(r) {
  const meine = state.bewertungen[r.id] ?? null;
  const basisR = r.rating || 0, basisN = r.bewertungen || 0;
  if (meine == null) return { rating: basisR, anzahl: basisN, meine: null };
  const anzahl = basisN + 1;
  return { rating: (basisR * basisN + meine) / anzahl, anzahl, meine };
}
function geplanteGerichte() {
  return Object.values(state.plan).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : (arr ? 1 : 0)), 0);
}

// --- Mutationen -------------------------------------------------------------
function planEintraege(tag) {
  const v = state.plan[tag];
  return Array.isArray(v) ? v : (v ? [v] : []);
}
function rezeptHinzufuegen(tag, rezeptId, portionen) {
  const r = rezept(rezeptId); if (!r) return;
  const arr = planEintraege(tag);
  arr.push({ rezeptId, portionen: portionen || r.portionen });
  state.plan[tag] = arr; persist();
}
function rezeptEntfernen(tag, index) {
  const arr = planEintraege(tag);
  arr.splice(index, 1);
  if (arr.length) state.plan[tag] = arr; else delete state.plan[tag];
  persist();
}
function portionenAendern(tag, index, delta) {
  const arr = planEintraege(tag);
  if (arr[index]) { arr[index].portionen = Math.max(1, arr[index].portionen + delta); state.plan[tag] = arr; persist(); }
}
function toggle(listName, id) {
  const set = new Set(state[listName]);
  set.has(id) ? set.delete(id) : set.add(id);
  state[listName] = [...set]; persist();
}
function toggleMarkt(id) { toggle("aktiveMaerkte", id); }
function setVorgabe(key, val) { state.vorgaben[key] = val; persist(); }
function prospektUebernehmen(prospekt) {
  const vorhanden = new Set(state.importierteAngebote.map((a) => a.id));
  for (const a of prospekt.angebote) if (!vorhanden.has(a.id)) state.importierteAngebote.push(a);
  if (!state.aktiveMaerkte.includes(prospekt.markt)) state.aktiveMaerkte.push(prospekt.markt);
  persist();
}
function prospektImportiert(prospekt) {
  const ids = new Set(state.importierteAngebote.map((a) => a.id));
  return prospekt.angebote.every((a) => ids.has(a.id));
}
