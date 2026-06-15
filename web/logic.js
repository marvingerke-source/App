// Kernlogik: Bedarf zusammenführen (Baustein A), Matching (C), Optimierung (D).
// Bewusst einfach gehalten: ein Angebot = ein Packungs-Kauf zum Aktionspreis.

// --- Baustein A: gleiche Zutaten über die Woche zusammenführen ---------------
function bedarfBerechnen(plan) {
  const map = new Map(); // key = name|einheit
  for (const eintrag of Object.values(plan)) {
    if (!eintrag) continue;
    const rezept = REZEPTE.find((r) => r.id === eintrag.rezeptId);
    if (!rezept) continue;
    const faktor = (eintrag.portionen || rezept.portionen) / rezept.portionen;
    for (const z of rezept.zutaten) {
      const key = `${z.name.toLowerCase()}|${z.einheit}`;
      const vorhanden = map.get(key);
      const menge = +(z.menge * faktor).toFixed(2);
      if (vorhanden) {
        vorhanden.menge += menge;
        vorhanden.ausRezepten.add(rezept.name);
      } else {
        map.set(key, {
          name: z.name,
          einheit: z.einheit,
          kategorie: z.kategorie,
          menge,
          ausRezepten: new Set([rezept.name]),
        });
      }
    }
  }
  return [...map.values()].map((b) => ({
    ...b,
    menge: +b.menge.toFixed(2),
    ausRezepten: [...b.ausRezepten],
  }));
}

// --- Baustein C: unscharfes Matching Zutat -> Angebote -----------------------
// In der echten App übernimmt das ein KI-Modell. Hier: Stichwort-Heuristik.
function angebotePassen(zutatName, kategorie) {
  const name = zutatName.toLowerCase();
  const stichworte = MATCH_STICHWOERTER[name] || [name];
  return ANGEBOTE.filter((a) => {
    if (a.kategorie !== kategorie) return false;
    const p = a.produktname.toLowerCase();
    return stichworte.some((s) => p.includes(s));
  });
}

// --- Baustein D: Optimierung über Läden --------------------------------------
// Findet die Laden-Kombination (<= maxLaeden), die den Gesamtpreis minimiert,
// Bio-Wunsch respektiert und prüft, ob ein Extra-Laden sich überhaupt lohnt.
function einkaufsplanBerechnen(bedarf, vorgaben) {
  const { maxLaeden, bioGewuenscht } = vorgaben;

  // 1) Pro Zutat die Kandidaten-Angebote bestimmen.
  const positionen = bedarf.map((b) => ({
    bedarf: b,
    kandidaten: angebotePassen(b.name, b.kategorie),
  }));

  // 2) Beste Auswahl für eine erlaubte Laden-Teilmenge bestimmen.
  function bewerte(erlaubteLaeden) {
    let summe = 0;
    let ersparnis = 0;
    const zuordnung = [];
    const genutzteLaeden = new Set();
    for (const pos of positionen) {
      let kand = pos.kandidaten.filter((a) => erlaubteLaeden.has(a.markt));
      if (kand.length === 0) {
        zuordnung.push({ bedarf: pos.bedarf, angebot: null });
        continue;
      }
      // Bio bevorzugen, falls gewünscht und verfügbar.
      let auswahl = kand;
      let bioErsatz = false;
      if (bioGewuenscht) {
        const bio = kand.filter((a) => a.istBio);
        if (bio.length) auswahl = bio;
        else bioErsatz = true;
      }
      const best = auswahl.reduce((a, b) => (b.preis < a.preis ? b : a));
      summe += best.preis;
      ersparnis += Math.max(0, best.normalpreis - best.preis);
      genutzteLaeden.add(best.markt);
      zuordnung.push({ bedarf: pos.bedarf, angebot: best, bioErsatz });
    }
    return { summe: +summe.toFixed(2), ersparnis: +ersparnis.toFixed(2), zuordnung, laeden: genutzteLaeden };
  }

  // 3) Alle Laden-Teilmengen bis maxLaeden durchprobieren (wenige Läden -> ok).
  const alleLaeden = MAERKTE.map((m) => m.id);
  const subsets = teilmengenBisGroesse(alleLaeden, Math.max(1, maxLaeden));
  let beste = null;
  for (const sub of subsets) {
    const erg = bewerte(new Set(sub));
    const abgedeckt = erg.zuordnung.filter((z) => z.angebot).length;
    // Bewertung: zuerst möglichst viele Treffer, dann geringste Summe.
    if (!beste ||
        abgedeckt > beste._abgedeckt ||
        (abgedeckt === beste._abgedeckt && erg.summe < beste.summe)) {
      beste = { ...erg, _abgedeckt: abgedeckt };
    }
  }

  // 4) Lohnt sich der letzte Laden? Vergleich mit bester Lösung "ein Laden weniger".
  let hinweis = null;
  if (beste.laeden.size >= 2) {
    const subsetsWeniger = teilmengenBisGroesse(alleLaeden, beste.laeden.size - 1);
    let besteWeniger = null;
    for (const sub of subsetsWeniger) {
      const erg = bewerte(new Set(sub));
      const abgedeckt = erg.zuordnung.filter((z) => z.angebot).length;
      if (!besteWeniger ||
          abgedeckt > besteWeniger._abgedeckt ||
          (abgedeckt === besteWeniger._abgedeckt && erg.summe < besteWeniger.summe)) {
        besteWeniger = { ...erg, _abgedeckt: abgedeckt };
      }
    }
    if (besteWeniger && besteWeniger._abgedeckt === beste._abgedeckt) {
      const mehrErsparnis = +(besteWeniger.summe - beste.summe).toFixed(2);
      if (mehrErsparnis < 2.0) {
        hinweis = `Der zusätzliche Laden bringt nur ${euro(mehrErsparnis)} Ersparnis – ` +
                  `vielleicht nicht die extra Fahrt wert.`;
      }
    }
  }

  // 5) Nach Markt gruppieren.
  const proMarkt = {};
  for (const z of beste.zuordnung) {
    if (!z.angebot) continue;
    (proMarkt[z.angebot.markt] ||= []).push(z);
  }
  const gruppen = Object.entries(proMarkt).map(([marktId, items]) => ({
    markt: MAERKTE.find((m) => m.id === marktId),
    items,
    summe: +items.reduce((s, z) => s + z.angebot.preis, 0).toFixed(2),
  })).sort((a, b) => a.markt.entfernungKm - b.markt.entfernungKm);

  const ohneAngebot = beste.zuordnung.filter((z) => !z.angebot).map((z) => z.bedarf);

  return {
    gruppen,
    ohneAngebot,
    summe: beste.summe,
    ersparnis: beste.ersparnis,
    anzahlLaeden: beste.laeden.size,
    hinweis,
    ueberBudget: beste.summe > vorgaben.budget,
  };
}

function teilmengenBisGroesse(arr, maxK) {
  const res = [];
  const n = arr.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const sub = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sub.push(arr[i]);
    if (sub.length <= maxK) res.push(sub);
  }
  return res;
}

function euro(n) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}
