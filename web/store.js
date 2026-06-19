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
  vorgaben: { budget: 45, bioGewuenscht: false, maxLaeden: 2, vorratAbziehen: true },
  aktiveMaerkte: ["aldi", "rewe", "lidl", "edeka"],
  importierteAngebote: [],
  eigeneRezepte: [],     // vom Nutzer angelegte Rezepte (mit Foto)
  bewertungen: {},       // rezeptId -> Sterne (1–5) des Nutzers
  bildCache: {},         // rezeptId -> echte Foto-URL (Pexels), gecacht
  bildVersion: 0,        // zum Auffrischen des Foto-Caches bei besseren Stichwörtern
  vorrat: [],            // Kühlschrank: [{ name, menge|null, einheit|null }]
  favoriten: [],         // gemerkte Rezept-IDs
  tracking: {},          // datum(ISO) -> [{ id, name, kcal, protein, carbs, fett, bildData?, typ }]
  ziele: { kcal: 2200, protein: 130, carbs: 250, fett: 70 },
  anthropicKey: "",      // bleibt NUR lokal auf dem Gerät (nicht im Code/Repo)
  session: null,         // Backend-Login (Supabase) – optional
  profil: null,          // { plz, ort, lat, lng, radius }
  remoteAngebote: null,  // vom Backend geladene ortsbezogene Angebote
  onboardingGesehen: false,
});

let state = lade();

function lade() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = { ...defaults(), ...JSON.parse(raw) };
      // Migration: alter Vorrat war ein String-Array
      s.vorrat = (s.vorrat || []).map((v) => typeof v === "string" ? { name: v, menge: null, einheit: null } : v);
      return s;
    }
  } catch (e) { /* ignore */ }
  return defaults();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Speicher voll (oft durch Fotos): Bilddaten auslagern statt Daten zu verlieren.
    try {
      state.bildCache = {};
      for (const arr of Object.values(state.tracking)) for (const it of arr) it.bildData = null;
      for (const r of state.eigeneRezepte) r.bildData = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e2) { /* aufgeben */ }
  }
}

function reset() { state = defaults(); persist(); }

// --- Abgeleitete Werte ------------------------------------------------------
function alleRezepte() { return [...state.eigeneRezepte, ...REZEPTE]; }
function angebotePool() { return [...ANGEBOTE, ...state.importierteAngebote]; }
function bedarfKey(b) { return `${b.name.toLowerCase()}|${b.einheit}`; }
function gesamterBedarf() { return bedarfBerechnen(state.plan, alleRezepte()); }

// Bedarf inkl. Status: manuell abgehakt, durch Vorrat gedeckt, zu kaufende Restmenge.
function bedarfMitStatus() {
  return gesamterBedarf().map((b) => {
    const manuell = state.vorratAbgehakt.includes(bedarfKey(b));
    let status = "kaufen", kaufMenge = b.menge;
    if (manuell) { status = "manuell"; kaufMenge = 0; }
    else if (state.vorgaben.vorratAbziehen) {
      const e = vorratEintrag(b.name);
      if (e) {
        if (e.menge != null && e.einheit && normTxt(e.einheit) === normTxt(b.einheit)) {
          if (e.menge >= b.menge) { status = "vorrat"; kaufMenge = 0; }
          else { status = "teilweise"; kaufMenge = +(b.menge - e.menge).toFixed(2); }
        } else { status = "vorrat"; kaufMenge = 0; }
      }
    }
    return { ...b, manuell, status, kaufMenge };
  });
}

function offenerBedarf() {
  return bedarfMitStatus().filter((b) => b.kaufMenge > 0)
    .map((b) => ({ name: b.name, einheit: b.einheit, kategorie: b.kategorie, menge: b.kaufMenge, ausRezepten: b.ausRezepten }));
}
function aktuellerPlan() {
  return einkaufsplanBerechnen(offenerBedarf(), state.vorgaben, angebotePool(), state.aktiveMaerkte);
}
function rezept(id) { return alleRezepte().find((r) => r.id === id); }

// Wochen-Nährwerte/-Übersicht (kcal als Wert pro Portion).
function wochenWerte() {
  let portionen = 0, kcal = 0, gerichte = 0;
  for (const eintraege of Object.values(state.plan)) {
    const liste = Array.isArray(eintraege) ? eintraege : (eintraege ? [eintraege] : []);
    for (const e of liste) {
      const r = rezept(e.rezeptId); if (!r) continue;
      gerichte++; portionen += e.portionen; kcal += (r.kcal || 0) * e.portionen;
    }
  }
  return { gerichte, portionen, kcal, kcalProPortion: portionen ? Math.round(kcal / portionen) : 0 };
}

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
function vorratToggle(name, menge, einheit) {
  const n = normTxt(name); if (!n) return;
  const i = state.vorrat.findIndex((v) => v.name === n);
  if (i >= 0) state.vorrat.splice(i, 1);
  else state.vorrat.push({ name: n, menge: menge != null && menge !== "" ? parseFloat(String(menge).replace(",", ".")) : null, einheit: einheit ? einheit.trim() : null });
  persist();
}
function vorratHat(name) { return state.vorrat.some((v) => v.name === normTxt(name)); }

// Findet den passenden Vorrats-Eintrag zu einer Rezeptzutat (unscharf).
function vorratEintrag(zutatName) {
  const n = normTxt(zutatName);
  const stich = MATCH_STICHWOERTER[n] || [n];
  return state.vorrat.find((v) =>
    n.includes(v.name) || v.name.includes(n) || stich.some((s) => s.includes(v.name) || v.name.includes(s)));
}
function zutatGedeckt(zutatName) { return !!vorratEintrag(zutatName); }

// Status einer Zutat: 'voll' | 'teilweise' | 'fehlt' (Menge wird berücksichtigt).
function zutatStatus(zutat) {
  const e = vorratEintrag(zutat.name);
  if (!e) return "fehlt";
  if (e.menge != null && e.einheit && normTxt(e.einheit) === normTxt(zutat.einheit) && e.menge < zutat.menge) return "teilweise";
  return "voll";
}

// Rezepte nach Deckungsgrad durch den Vorrat.
function kochbareRezepte() {
  return alleRezepte().map((r) => {
    let voll = 0, teilweise = 0; const fehlend = [], knapp = [];
    for (const z of r.zutaten) {
      const st = zutatStatus(z);
      if (st === "voll") voll++;
      else if (st === "teilweise") { teilweise++; knapp.push(z.name); }
      else fehlend.push(z.name);
    }
    const total = r.zutaten.length, have = voll + teilweise;
    return { r, have, voll, teilweise, total, fehlend, knapp, quote: total ? (voll + 0.5 * teilweise) / total : 0 };
  }).filter((x) => x.have > 0)
    .sort((a, b) => b.quote - a.quote || (b.r.rating || 0) - (a.r.rating || 0));
}

// --- Favoriten --------------------------------------------------------------
function favoritToggle(id) {
  const i = state.favoriten.indexOf(id);
  if (i >= 0) state.favoriten.splice(i, 1); else state.favoriten.unshift(id);
  persist();
}
function istFavorit(id) { return state.favoriten.includes(id); }
function favoritenRezepte() { return state.favoriten.map((id) => rezept(id)).filter(Boolean); }

// --- Nährwerte / Makros -----------------------------------------------------
// Makros je Portion: explizit (falls am Rezept hinterlegt) oder aus kcal geschätzt.
function makros(r) {
  const kcal = r.kcal || 0;
  if (r.protein != null) return { kcal, protein: r.protein, carbs: r.carbs || 0, fett: r.fett || 0, exakt: true };
  const d = r.diaet || [];
  let pP, pC, pF; // Energieanteile
  if (d.includes("keto") || d.includes("low-carb")) { pP = 0.30; pC = 0.12; pF = 0.58; }
  else if (d.includes("high-protein")) { pP = 0.37; pC = 0.40; pF = 0.23; }
  else if (d.includes("vegan") || d.includes("vegetarisch")) { pP = 0.18; pC = 0.55; pF = 0.27; }
  else { pP = 0.25; pC = 0.45; pF = 0.30; }
  return { kcal, protein: Math.round(kcal * pP / 4), carbs: Math.round(kcal * pC / 4), fett: Math.round(kcal * pF / 9), exakt: false };
}

// --- Tracking / Tagebuch ----------------------------------------------------
function heuteISO() { return new Date().toISOString().slice(0, 10); }
function trackingTag(datum) { return state.tracking[datum] || []; }
function trackingAdd(datum, eintrag) {
  (state.tracking[datum] ||= []).push({ id: "t" + Date.now() + Math.floor(Math.random() * 1000), ...eintrag });
  persist();
}
function trackingRemove(datum, id) {
  state.tracking[datum] = trackingTag(datum).filter((e) => e.id !== id);
  if (!state.tracking[datum].length) delete state.tracking[datum];
  persist();
}
function trackingSummen(datum) {
  return trackingTag(datum).reduce((s, e) => ({
    kcal: s.kcal + (e.kcal || 0), protein: s.protein + (e.protein || 0),
    carbs: s.carbs + (e.carbs || 0), fett: s.fett + (e.fett || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fett: 0 });
}
function zielSetzen(key, wert) { state.ziele[key] = Math.max(0, wert); persist(); }
function apiKeySetzen(k) { state.anthropicKey = (k || "").trim(); persist(); }

// --- Vorschläge nach aktuellen Angeboten ------------------------------------
function angebotsTreffer(r) {
  const pool = angebotePool();
  let n = 0;
  for (const z of r.zutaten) if (angebotePassen(z.name, z.kategorie, pool).some((a) => state.aktiveMaerkte.includes(a.markt))) n++;
  return n;
}
function angebotsRezepte(n = 8) {
  return alleRezepte().map((r) => ({ r, treffer: angebotsTreffer(r) }))
    .filter((x) => x.treffer >= 2)
    .sort((a, b) => b.treffer - a.treffer || (b.r.rating || 0) - (a.r.rating || 0))
    .slice(0, n);
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
