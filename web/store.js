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
function angebotePool() { return [...ANGEBOTE, ...state.importierteAngebote]; }
function bedarfKey(b) { return `${b.name.toLowerCase()}|${b.einheit}`; }
function gesamterBedarf() { return bedarfBerechnen(state.plan); }
function offenerBedarf() { return gesamterBedarf().filter((b) => !state.vorratAbgehakt.includes(bedarfKey(b))); }
function aktuellerPlan() {
  return einkaufsplanBerechnen(offenerBedarf(), state.vorgaben, angebotePool(), state.aktiveMaerkte);
}
function rezept(id) { return REZEPTE.find((r) => r.id === id); }
function geplanteGerichte() {
  return Object.values(state.plan).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : (arr ? 1 : 0)), 0);
}

// --- Mutationen -------------------------------------------------------------
function planEintraege(tag) {
  const v = state.plan[tag];
  return Array.isArray(v) ? v : (v ? [v] : []);
}
function rezeptHinzufuegen(tag, rezeptId) {
  const r = rezept(rezeptId); if (!r) return;
  const arr = planEintraege(tag);
  arr.push({ rezeptId, portionen: r.portionen });
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
