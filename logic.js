// ============================================================================
// Kernlogik: Bedarf zusammenführen (A), Matching (C), Optimierung (D).
// Bewusst einfach: ein Angebot = ein Packungs-Kauf zum Aktionspreis.
// ============================================================================

// --- Baustein A: gleiche Zutaten über die Woche zusammenführen ---------------
function bedarfBerechnen(plan, rezeptListe = REZEPTE) {
  const map = new Map();
  for (const eintraege of Object.values(plan)) {
    const liste = Array.isArray(eintraege) ? eintraege : (eintraege ? [eintraege] : []);
    for (const eintrag of liste) {
      const rezept = rezeptListe.find((r) => r.id === eintrag.rezeptId);
      if (!rezept) continue;
      const faktor = (eintrag.portionen || rezept.portionen) / rezept.portionen;
      for (const z of rezept.zutaten) {
        const key = `${z.name.toLowerCase()}|${z.einheit}`;
        const menge = +(z.menge * faktor).toFixed(2);
        const vorhanden = map.get(key);
        if (vorhanden) {
          vorhanden.menge += menge;
          if (!vorhanden.ausRezepten.includes(rezept.name)) vorhanden.ausRezepten.push(rezept.name);
        } else {
          map.set(key, { name: z.name, einheit: z.einheit, kategorie: z.kategorie, menge, ausRezepten: [rezept.name] });
        }
      }
    }
  }
  return [...map.values()].map((b) => ({ ...b, menge: +b.menge.toFixed(2) }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

// --- Baustein C: unscharfes Matching (Platzhalter für KI) --------------------
function angebotePassen(zutatName, kategorie, angebote) {
  const name = zutatName.toLowerCase();
  const stichworte = MATCH_STICHWOERTER[name] || [name];
  return angebote.filter((a) => {
    if (a.kategorie !== kategorie) return false;
    const p = a.produktname.toLowerCase();
    return stichworte.some((s) => p.includes(s));
  });
}

// --- Mengen & Packungen (portionsbasierte Einkaufsmengen) -------------------
function mengeZuBasis(menge, einheit) {
  const e = String(einheit || "").toLowerCase().trim();
  if (e === "kg") return { wert: menge * 1000, basis: "g" };
  if (e === "g" || e === "gramm") return { wert: menge, basis: "g" };
  if (e === "l" || e === "liter") return { wert: menge * 1000, basis: "ml" };
  if (e === "ml") return { wert: menge, basis: "ml" };
  return { wert: menge, basis: "stk" }; // Stk, Zehen, Scheiben …
}
// Packungsgröße aus Angebots-Einheit lesen ("500g", "1kg", "10 Stk", "3x80g").
function parsePackung(str) {
  const s = String(str).toLowerCase();
  let m = s.match(/(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)?/);
  if (m) return mengeZuBasis(parseFloat(m[1]) * parseFloat(m[2].replace(",", ".")), m[3] || "stk");
  m = s.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/);
  if (m) return mengeZuBasis(parseFloat(m[1].replace(",", ".")), m[2]);
  m = s.match(/(\d+)\s*(stk|stück|er)\b/);
  if (m) return { wert: parseFloat(m[1]), basis: "stk" };
  return null;
}
// Wie viele Packungen werden für den Bedarf benötigt?
function packungenNoetig(menge, einheit, angebotEinheit) {
  const need = mengeZuBasis(menge, einheit), pack = parsePackung(angebotEinheit);
  if (!pack || pack.basis !== need.basis || pack.wert <= 0) return null;
  return Math.max(1, Math.ceil(need.wert / pack.wert));
}

// --- Baustein D: Optimierung über (aktive) Läden -----------------------------
function einkaufsplanBerechnen(bedarf, vorgaben, angebotePool, aktiveMaerkte) {
  const { maxLaeden, bioGewuenscht } = vorgaben;
  const maerkte = MAERKTE.filter((m) => aktiveMaerkte.includes(m.id));
  const alleIds = maerkte.map((m) => m.id);

  const positionen = bedarf.map((b) => ({
    bedarf: b,
    kandidaten: angebotePassen(b.name, b.kategorie, angebotePool).filter((a) => aktiveMaerkte.includes(a.markt)),
  }));

  function bewerte(erlaubt) {
    let summe = 0, ersparnis = 0, treffer = 0;
    const zuordnung = [];
    const laeden = new Set();
    for (const pos of positionen) {
      const kand = pos.kandidaten.filter((a) => erlaubt.has(a.markt));
      if (kand.length === 0) { zuordnung.push({ bedarf: pos.bedarf, angebot: null }); continue; }
      let auswahl = kand, bioErsatz = false;
      if (bioGewuenscht) {
        const bio = kand.filter((a) => a.istBio);
        if (bio.length) auswahl = bio; else bioErsatz = true;
      }
      // Günstigstes Angebot nach Zeilenpreis (Aktionspreis × benötigte Packungen).
      let best = null, bestAnzahl = 1, bestKosten = Infinity;
      for (const a of auswahl) {
        const anzahl = packungenNoetig(pos.bedarf.menge, pos.bedarf.einheit, a.einheit) || 1;
        const kosten = a.preis * anzahl;
        if (kosten < bestKosten) { bestKosten = kosten; best = a; bestAnzahl = anzahl; }
      }
      const zeilenpreis = +(best.preis * bestAnzahl).toFixed(2);
      summe += zeilenpreis;
      ersparnis += Math.max(0, best.normalpreis - best.preis) * bestAnzahl;
      laeden.add(best.markt);
      treffer++;
      zuordnung.push({ bedarf: pos.bedarf, angebot: best, bioErsatz, anzahl: bestAnzahl, zeilenpreis });
    }
    return { summe: +summe.toFixed(2), ersparnis: +ersparnis.toFixed(2), treffer, zuordnung, laeden };
  }

  function besteFuer(maxK) {
    let beste = null;
    for (const sub of teilmengenBisGroesse(alleIds, Math.max(1, maxK))) {
      const e = bewerte(new Set(sub));
      if (!beste || e.treffer > beste.treffer || (e.treffer === beste.treffer && e.summe < beste.summe)) beste = e;
    }
    return beste;
  }

  const beste = besteFuer(maxLaeden) || { summe: 0, ersparnis: 0, treffer: 0, zuordnung: bedarf.map((b) => ({ bedarf: b, angebot: null })), laeden: new Set() };

  // Lohnt sich der letzte Laden?
  let hinweis = null;
  if (beste.laeden.size >= 2) {
    const weniger = besteFuer(beste.laeden.size - 1);
    if (weniger && weniger.treffer === beste.treffer) {
      const mehr = +(weniger.summe - beste.summe).toFixed(2);
      if (mehr >= 0 && mehr < 2.0) {
        hinweis = `Ein Laden weniger würde dich nur ${euro(mehr)} mehr kosten – die zusätzliche Fahrt lohnt sich kaum.`;
      }
    }
  }

  const proMarkt = {};
  for (const z of beste.zuordnung) if (z.angebot) (proMarkt[z.angebot.markt] ||= []).push(z);
  const gruppen = Object.entries(proMarkt).map(([id, items]) => ({
    markt: MAERKTE.find((m) => m.id === id),
    items,
    summe: +items.reduce((s, z) => s + (z.zeilenpreis ?? z.angebot.preis), 0).toFixed(2),
  })).sort((a, b) => a.markt.entfernungKm - b.markt.entfernungKm);

  const ohneAngebot = beste.zuordnung.filter((z) => !z.angebot).map((z) => z.bedarf);
  const fahrtstrecke = gruppen.length
    ? +(gruppen.reduce((s, g) => Math.max(s, g.markt.entfernungKm), 0) * 2).toFixed(1)
    : 0;

  return {
    gruppen, ohneAngebot,
    summe: beste.summe, ersparnis: beste.ersparnis,
    anzahlLaeden: beste.laeden.size, anzahlPositionen: beste.treffer,
    fahrtstrecke, hinweis, ueberBudget: beste.summe > vorgaben.budget,
  };
}

// Top-Angebote der Woche (höchste absolute Ersparnis) für das Dashboard.
function topAngebote(angebotePool, aktiveMaerkte, n = 6) {
  return [...angebotePool]
    .filter((a) => aktiveMaerkte.includes(a.markt))
    .sort((a, b) => (b.normalpreis - b.preis) - (a.normalpreis - a.preis))
    .slice(0, n);
}

function teilmengenBisGroesse(arr, maxK) {
  const res = [], n = arr.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const sub = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sub.push(arr[i]);
    if (sub.length <= maxK) res.push(sub);
  }
  return res;
}

function euro(n) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n || 0);
}
