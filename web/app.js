// ============================================================================
// UI-Steuerung: Router, Screens, Sheets, Animationen. Vanilla JS, kein Framework.
// ============================================================================
const app = document.getElementById("app");
const ui = { tab: "home", sheet: null, sheetArg: null, scan: null, scrollTops: {},
  prevTab: "home", zielTag: null, rezeptFilter: "Alle", rezeptSuche: "", detailPortionen: 2 };

// --------------------------- Render-Einstieg --------------------------------
function render() {
  app.innerHTML = `
    ${statusbar()}
    <div class="screen">${screenContent()}</div>
    ${tabbar()}
    ${sheetMarkup()}
    ${!state.onboardingGesehen ? onboarding() : ""}
  `;
  const sc = app.querySelector(".scroll");
  if (sc) sc.scrollTop = ui.scrollTops[ui.tab] || 0;
  runEntryAnimations();
}

function screenContent() {
  switch (ui.tab) {
    case "home": return screenHome();
    case "rezepte": return screenRezepte();
    case "plan": return screenPlan();
    case "liste": return screenListe();
    case "ergebnis": return screenErgebnis();
    case "einkaufen": return screenEinkaufen();
  }
}

function statusbar() {
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, "0"), mm = String(t.getMinutes()).padStart(2, "0");
  return `<div class="statusbar"><span>${hh}:${mm}</span>
    <span class="right">${ICON.signal}${ICON.wifi}${ICON.battery}</span></div>`;
}

// --------------------------- Screen: Home -----------------------------------
function screenHome() {
  const plan = aktuellerPlan();
  const gerichte = geplanteGerichte();
  const h = new Date().getHours();
  const gruss = h < 11 ? "Guten Morgen" : h < 17 ? "Hallo" : "Guten Abend";
  const deals = topAngebote(angebotePool(), state.aktiveMaerkte, 6);

  return `<div class="scroll fade-in">
    <div class="header" style="padding-top:14px">
      <div><div class="eyebrow">Smarter Einkauf</div><h1>${gruss} 👋</h1></div>
      <button class="icon-btn" data-act="openSheet" data-arg="vorgaben">${ICON.settings}</button>
    </div>

    <div class="greeting-hero">
      <div class="label">Diese Woche geplant</div>
      <div class="big">${gerichte} ${gerichte === 1 ? "Gericht" : "Gerichte"}</div>
      <div class="row">
        <div class="stat"><div class="n">${euro(plan.summe)}</div><div class="t">Geschätzte Kosten</div></div>
        <div class="divider"></div>
        <div class="stat"><div class="n">${euro(plan.ersparnis)}</div><div class="t">Ersparnis</div></div>
        <div class="divider"></div>
        <div class="stat"><div class="n">${plan.anzahlLaeden}</div><div class="t">${plan.anzahlLaeden === 1 ? "Laden" : "Läden"}</div></div>
      </div>
    </div>

    <div class="section-label">Schnellzugriff</div>
    <div class="qa-grid">
      <button class="qa" data-act="openRezepte" data-arg="">
        <div class="ic">${ICON.book}</div><div class="t">Rezepte entdecken</div><div class="d">${REZEPTE.length} Ideen</div></button>
      <button class="qa" data-act="tab" data-arg="plan">
        <div class="ic">${ICON.calendar}</div><div class="t">Woche planen</div><div class="d">Gerichte zuweisen</div></button>
      <button class="qa" data-act="openSheet" data-arg="import">
        <div class="ic">${ICON.scan}</div><div class="t">Prospekt scannen</div><div class="d">Angebote per KI</div></button>
      <button class="qa" data-act="openSheet" data-arg="maerkte">
        <div class="ic">${ICON.pin}</div><div class="t">Märkte</div><div class="d">${state.aktiveMaerkte.length} aktiv</div></button>
    </div>

    <div class="section-label">Angebote der Woche <a data-act="openSheet" data-arg="import">Mehr</a></div>
    <div class="h-scroll">
      ${deals.map((a) => {
        const m = MAERKTE.find((x) => x.id === a.markt);
        const save = a.normalpreis - a.preis;
        return `<div class="deal-card">
          <div class="save-badge">−${euro(save)}</div>
          <div class="market" style="color:${m.farbe}">${m.name}</div>
          <div class="name">${a.produktname}</div>
          <div><span class="price">${euro(a.preis)}</span><span class="was">${euro(a.normalpreis)}</span></div>
        </div>`;
      }).join("")}
    </div>

    <button class="btn btn-primary" style="margin-top:18px" data-act="tab" data-arg="ergebnis">
      ${ICON.sparkle} Bestes Paket ansehen</button>
    <button class="btn-text" data-act="resetApp">Demo zurücksetzen</button>
  </div>`;
}

// --------------------------- Screen: Rezeptbuch -----------------------------
function aktuelleSaison() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "Frühling";
  if (m >= 6 && m <= 8) return "Sommer";
  if (m >= 9 && m <= 11) return "Herbst";
  return "Winter";
}

function rezeptMatchtFilter(r, k) {
  switch (k) {
    case "Alle": return true;
    case "Beliebt": return !!r.beliebt;
    case "Saisonal": return (r.saison || []).includes(aktuelleSaison());
    case "Schnell": return r.dauerMin <= 20;
    case "Vegetarisch": return !!r.veggie;
    case "Vegan": return (r.diaet || []).includes("vegan");
    case "Keto": return (r.diaet || []).includes("keto");
    case "LowCarb": return (r.diaet || []).includes("low-carb");
    case "HighProtein": return (r.diaet || []).includes("high-protein");
    case "Budget": return !!r.budget;
    default: return r.kategorie === k;
  }
}

function rezepteGefiltert() {
  const q = ui.rezeptSuche.trim().toLowerCase();
  return REZEPTE.filter((r) => {
    if (!rezeptMatchtFilter(r, ui.rezeptFilter)) return false;
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.zutaten.some((z) => z.name.toLowerCase().includes(q));
  });
}

function dietBadge(r) {
  if ((r.diaet || []).includes("vegan")) return `<span class="vtag" style="color:#15803d">vegan</span>`;
  if ((r.diaet || []).includes("keto")) return `<span class="vtag" style="color:#0369a1">keto</span>`;
  if (r.veggie) return `<span class="vtag">veggie</span>`;
  if ((r.diaet || []).includes("high-protein")) return `<span class="vtag" style="color:#6d28d9">protein</span>`;
  return "";
}

function rezeptKarten() {
  const liste = rezepteGefiltert();
  if (!liste.length) return `<div class="empty" style="grid-column:1/-1"><div class="ic">${ICON.search}</div><h3>Nichts gefunden</h3><p>Probiere einen anderen Suchbegriff oder Filter.</p></div>`;
  return liste.map((r) => `<div class="rcard" data-act="${ui.zielTag ? "quickAdd" : "openDetail"}" data-arg="${ui.zielTag ? ui.zielTag + "|" + r.id : r.id}">
    <div class="cover" style="background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}bb)">
      <span class="cover-emoji">${r.emoji}</span>
      ${coverImg(r, 600, 400)}
      ${dietBadge(r)}
      <span class="time">${ICON.clock} ${r.dauerMin}'</span>
    </div>
    <div class="body"><div class="t">${r.name}</div>
      <div class="m">⭐ ${r.rating.toFixed(1)} · ${r.kcal} kcal</div></div>
  </div>`).join("");
}

function screenRezepte() {
  const chips = REZEPT_KATEGORIEN.map((k) =>
    `<button class="cat-chip ${ui.rezeptFilter === k ? "active" : ""}" data-act="setFilter" data-arg="${k}">${k}</button>`).join("");
  const kollektionen = KOLLEKTIONEN.map((c) => `<button class="coll-card" style="background:linear-gradient(150deg, ${c.farbe}, ${c.farbe}cc)" data-act="setFilter" data-arg="${c.key}">
    <span class="ce">${c.emoji}</span><span class="ct">${c.titel}</span></button>`).join("");
  const anzahl = rezepteGefiltert().length;
  return `<div class="scroll fade-in">
    <div class="header">
      <button class="icon-btn" data-act="backFromRezepte">${ICON.back}</button>
      <div style="flex:1;margin-left:4px"><div class="eyebrow">Rezeptbuch · ${REZEPTE.length} Ideen</div><h1>Entdecken</h1></div>
    </div>
    ${ui.zielTag ? `<div class="zieltag-banner">${ICON.calendar} Für ${ui.zielTag} – tippe ein Rezept zum Hinzufügen</div>` : ""}
    <div class="searchbar">${ICON.search}<input id="rezept-suche" data-act="rezeptSuche" placeholder="Rezept oder Zutat suchen…" value="${ui.rezeptSuche}"></div>
    ${ui.rezeptSuche ? "" : `<div class="coll-scroll">${kollektionen}</div>`}
    <div class="cat-scroll">${chips}</div>
    <div class="section-label" style="margin-top:6px">${ui.rezeptFilter === "Alle" ? "Alle Rezepte" : ui.rezeptFilter} <span style="color:var(--text-3);font-weight:600;text-transform:none">${anzahl}</span></div>
    <div class="recipe-grid" id="rezept-results">${rezeptKarten()}</div>
  </div>`;
}

// --------------------------- Screen: Wochenplan -----------------------------
function screenPlan() {
  const gerichte = geplanteGerichte();
  const tage = WOCHENTAGE.map((tag, i) => {
    const eintraege = planEintraege(tag);
    const meals = eintraege.map((e, idx) => {
      const r = rezept(e.rezeptId);
      if (!r) return "";
      return `<div class="meal-pill">
        <span class="thumb" style="background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}bb)"><span class="te">${r.emoji}</span>${coverImg(r, 120, 120)}</span>
        <div class="info"><div class="t">${r.name}</div><div class="m">${e.portionen} Portionen · ${r.dauerMin} min</div></div>
        <div class="stepper">
          <button data-act="portion" data-arg="${tag}|${idx}|-1">−</button>
          <button data-act="portion" data-arg="${tag}|${idx}|1">+</button>
        </div>
        <button class="icon-btn" style="width:34px;height:34px;box-shadow:none;background:var(--card-2)" data-act="removeMeal" data-arg="${tag}|${idx}">${ICON.trash}</button>
      </div>`;
    }).join("");
    return `<div class="card day-card">
      <div class="day-badge ${i === HEUTE_INDEX ? "today" : ""}"><div class="d">${tag}</div><div class="n">${15 + i}</div></div>
      <div class="day-main">
        ${meals}
        <button class="add-meal" data-act="openRezepte" data-arg="${tag}">${ICON.plus} Gericht hinzufügen</button>
      </div>
    </div>`;
  }).join("");

  return `<div class="scroll fade-in">
    <div class="header"><div><div class="eyebrow">Schritt 1</div><h1>Wochenplan</h1>
      <div class="sub">${gerichte} ${gerichte === 1 ? "Gericht" : "Gerichte"} geplant</div></div></div>
    ${tage}
  </div>`;
}

// --------------------------- Screen: Liste ----------------------------------
function screenListe() {
  const alle = gesamterBedarf();
  if (!alle.length) return emptyScreen("Liste", "list", "Noch keine Gerichte geplant", "Weise im Wochenplan Gerichte zu – die Liste entsteht dann automatisch.");
  const offen = alle.filter((b) => !state.vorratAbgehakt.includes(bedarfKey(b)));
  const rows = alle.map((b) => {
    const k = bedarfKey(b), checked = state.vorratAbgehakt.includes(k);
    return `<div class="row" data-act="toggleVorrat" data-arg="${k}">
      <div class="check ${checked ? "on" : ""}">${ICON.check}</div>
      <div class="grow"><div class="title ${checked ? "done" : ""}">${b.name}</div>
        <div class="sub">${formatMenge(b)} · für ${b.ausRezepten.join(", ")}</div></div>
    </div>`;
  }).join("");
  return `<div class="scroll fade-in">
    <div class="header"><div><div class="eyebrow">Schritt 2</div><h1>Einkaufsliste</h1>
      <div class="sub">${offen.length} zu kaufen · ${alle.length - offen.length} im Vorrat</div></div></div>
    <div class="card">${rows}</div>
    <p style="color:var(--text-3);font-size:13px;text-align:center;margin-top:14px;padding:0 20px">Tippe Vorräte an, die du schon hast – sie fallen aus dem Vergleich.</p>
  </div>`;
}

// --------------------------- Screen: Ergebnis -------------------------------
function screenErgebnis() {
  if (!offenerBedarf().length) return emptyScreen("Sparen", "tag", "Noch nichts zu optimieren", "Plane Gerichte – dann zeige ich dir das günstigste Angebots-Paket.");
  const plan = aktuellerPlan();
  const v = state.vorgaben;
  const chips = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
    <span class="chip accent">${ICON.euro} ${euro(v.budget)} Budget</span>
    <span class="chip ${v.bioGewuenscht ? "accent" : ""}">${ICON.leaf} Bio ${v.bioGewuenscht ? "an" : "aus"}</span>
    <span class="chip">${ICON.route} max. ${v.maxLaeden} ${v.maxLaeden === 1 ? "Laden" : "Läden"}</span>
    <button class="chip" data-act="openSheet" data-arg="vorgaben" style="color:var(--accent-2)">Anpassen</button>
  </div>`;

  const gruppen = plan.gruppen.map((g) => `
    <div class="card store-card">
      <div class="head">
        <div class="store-dot" style="background:${g.markt.farbe}">${g.markt.kurz}</div>
        <div><div class="sname">${g.markt.name}</div><div class="smeta">${g.markt.entfernungKm} km · ${g.items.length} Artikel</div></div>
        <div class="ssum">${euro(g.summe)}</div>
      </div>
      ${g.items.map((z) => {
        const a = z.angebot, save = a.normalpreis - a.preis;
        return `<div class="row"><div class="grow">
          <div class="title">${z.bedarf.name} ${a.istBio ? `<span class="tag bio">BIO</span>` : ""} ${z.bioErsatz ? `<span class="tag muted">kein Bio</span>` : ""}</div>
          <div class="sub">${a.produktname}</div></div>
          <div style="text-align:right"><div class="price">${euro(a.preis)}</div>${save > 0 ? `<div class="save">−${euro(save)}</div>` : ""}</div>
        </div>`;
      }).join("")}
    </div>`).join("");

  const ohne = plan.ohneAngebot.length ? `<div class="section-label">Kein Angebot – regulär kaufen</div>
    <div class="card">${plan.ohneAngebot.map((b) => `<div class="row"><div class="grow">
      <div class="title">${b.name}</div><div class="sub">${formatMenge(b)} · diese Woche kein Prospekt-Treffer</div></div></div>`).join("")}</div>` : "";

  return `<div class="scroll fade-in">
    <div class="header"><div><div class="eyebrow">Schritt 3</div><h1>Bestes Paket</h1></div></div>
    ${chips}
    <div class="result-hero">
      <div class="cap">Gesamtkosten diese Woche</div>
      <div class="total" data-countup="${plan.summe}">${euro(plan.summe)}</div>
      <div class="save">${ICON.sparkle} Du sparst ${euro(plan.ersparnis)}</div>
      <div class="meta">
        <div class="x"><b>${plan.anzahlLaeden}</b>${plan.anzahlLaeden === 1 ? "Laden" : "Läden"}</div>
        <div class="x"><b>${plan.anzahlPositionen}</b>Positionen</div>
        <div class="x"><b>${plan.ueberBudget ? "⚠︎" : "✓"}</b>${plan.ueberBudget ? "über Budget" : "im Budget"}</div>
      </div>
    </div>
    ${plan.hinweis ? `<div class="note" style="margin-top:14px">${ICON.bolt}<div>${plan.hinweis}</div></div>` : ""}
    <div class="section-label">Deine Route <span style="color:var(--text-3);font-weight:600;text-transform:none">≈ ${plan.fahrtstrecke} km</span></div>
    ${gruppen}
    ${ohne}
    <button class="btn btn-primary sticky-cta" data-act="tab" data-arg="einkaufen">${ICON.cart} Einkauf starten</button>
  </div>`;
}

// --------------------------- Screen: Einkaufen ------------------------------
function screenEinkaufen() {
  if (!offenerBedarf().length) return emptyScreen("Einkauf", "cart", "Nichts einzukaufen", "Plane Gerichte und berechne das beste Paket.");
  const plan = aktuellerPlan();
  const alle = plan.gruppen.flatMap((g) => g.items.map((z) => z.angebot.id));
  const erledigt = alle.filter((id) => state.einkaufAbgehakt.includes(id)).length;
  const pct = alle.length ? Math.round((erledigt / alle.length) * 100) : 0;
  const fertig = erledigt === alle.length && alle.length > 0;

  const gruppen = plan.gruppen.map((g) => `
    <div class="card store-card">
      <div class="head"><div class="store-dot" style="background:${g.markt.farbe}">${g.markt.kurz}</div>
        <div><div class="sname">${g.markt.name}</div><div class="smeta">${g.markt.entfernungKm} km</div></div>
        <div class="ssum">${euro(g.summe)}</div></div>
      ${g.items.map((z) => {
        const on = state.einkaufAbgehakt.includes(z.angebot.id);
        return `<div class="row" data-act="toggleEinkauf" data-arg="${z.angebot.id}">
          <div class="check ${on ? "on" : ""}">${ICON.check}</div>
          <div class="grow"><div class="title ${on ? "done" : ""}">${z.bedarf.name}</div><div class="sub">${z.angebot.produktname}</div></div>
          <div class="price">${euro(z.angebot.preis)}</div></div>`;
      }).join("")}
    </div>`).join("");

  return `<div class="scroll fade-in">
    ${fertig ? confetti() : ""}
    <div class="header"><div><div class="eyebrow">Schritt 4</div><h1>Einkaufen</h1>
      <div class="sub">${erledigt} von ${alle.length} erledigt</div></div></div>
    <div class="progress-wrap"><div class="progressbar"><div style="width:${pct}%"></div></div><div class="progress-pct">${pct}%</div></div>
    ${gruppen}
    ${fertig ? `<div class="empty" style="padding:30px 24px"><div class="ic">${ICON.check}</div><h3>Alles erledigt! 🎉</h3><p>Du hast ${euro(plan.ersparnis)} gespart.</p></div>` : ""}
  </div>`;
}

// --------------------------- Tab Bar ----------------------------------------
function tabbar() {
  const tabs = [
    ["home", "Start", ICON.home], ["plan", "Plan", ICON.calendar],
    ["liste", "Liste", ICON.list], ["ergebnis", "Sparen", ICON.tag], ["einkaufen", "Einkauf", ICON.cart],
  ];
  return `<div class="tabbar">${tabs.map(([id, lbl, ic]) =>
    `<button class="tab ${ui.tab === id ? "active" : ""}" data-act="tab" data-arg="${id}">
      <span class="ic">${ic}</span><span class="lbl">${lbl}</span></button>`).join("")}</div>`;
}

// --------------------------- Sheets -----------------------------------------
function sheetMarkup() {
  if (!ui.sheet) return `<div class="backdrop" data-act="closeSheet"></div>`;
  let body = "";
  if (ui.sheet === "rezeptDetail") body = sheetRezeptDetail(ui.sheetArg);
  else if (ui.sheet === "vorgaben") body = sheetVorgaben();
  else if (ui.sheet === "maerkte") body = sheetMaerkte();
  else if (ui.sheet === "import") body = sheetImport();
  return `<div class="backdrop open" data-act="closeSheetBg">
    <div class="sheet" data-stop><div class="grabber"></div>${body}</div></div>`;
}

function sheetHead(title) {
  return `<div class="sheet-head"><h2>${title}</h2><button class="x" data-act="closeSheet">${ICON.x}</button></div>`;
}

function sheetRezeptDetail(id) {
  const r = rezept(id);
  if (!r) return sheetHead("Rezept");
  const p = ui.detailPortionen, faktor = p / r.portionen;
  const zutaten = r.zutaten.map((z) => {
    const m = z.menge * faktor;
    const mStr = Number.isInteger(m) ? m : m.toFixed(m < 10 ? 1 : 0);
    return `<div class="ing-row"><span class="dot"></span><span class="nm">${z.name}</span><span class="qt">${mStr} ${z.einheit}</span></div>`;
  }).join("");
  const schritte = r.schritte.map((s, i) => `<div class="step-row"><div class="num">${i + 1}</div><div class="txt">${s}</div></div>`).join("");
  const dayChips = WOCHENTAGE.map((tag) => {
    const hat = planEintraege(tag).some((e) => e.rezeptId === r.id);
    return `<button class="${hat ? "has" : ""}" data-act="addToDay" data-arg="${tag}|${r.id}">${tag}</button>`;
  }).join("");

  return `<div class="sheet-head" style="position:absolute;right:0;left:0;z-index:2;background:transparent">
      <span></span><button class="x" data-act="closeSheet" style="background:rgba(255,255,255,.85);color:#111">${ICON.x}</button></div>
    <div class="sheet-body" style="padding-top:0">
      <div class="detail-cover" style="background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}cc)">
        <span class="cover-emoji">${r.emoji}</span>
        ${coverImg(r, 800, 480)}
        <div class="badges">
          <span class="tag" style="background:rgba(255,255,255,.9);color:#333">${r.kategorie}</span>
          ${(r.diaet || []).map((d) => `<span class="tag" style="background:rgba(255,255,255,.9);color:#15803d">${d}</span>`).join("")}
        </div>
      </div>
      <h2 style="font-size:24px;font-weight:800;margin-top:14px">${r.name}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;color:var(--text-2);font-size:13.5px;font-weight:600">
        <span style="color:#f59e0b">★★★★★</span> ${r.rating.toFixed(1)} · ${r.bewertungen.toLocaleString("de-DE")} Bewertungen</div>
      <div class="detail-meta">
        <span class="meta-pill">${ICON.clock} ${r.dauerMin} min</span>
        <span class="meta-pill">${ICON.fire} ${r.kcal} kcal</span>
        <span class="meta-pill">${ICON.flame2} ${r.schwierigkeit}</span>
      </div>
      <p class="detail-desc">${r.beschreibung}</p>

      <div class="portion-bar"><span class="lbl">Portionen</span>
        <div class="stepper"><button data-act="detailPortion" data-arg="-1">−</button><span class="num">${p}</span><button data-act="detailPortion" data-arg="1">+</button></div></div>

      <div class="section-label" style="margin-top:8px">Zutaten</div>
      <div class="card">${zutaten}</div>

      <div class="section-label">Zubereitung</div>
      <div class="card">${schritte}</div>

      <div class="section-label">Zum Wochenplan hinzufügen</div>
      <div class="day-pick">${dayChips}</div>
      <p style="color:var(--text-3);font-size:12.5px;text-align:center;margin-top:10px">Tippe einen Tag – grün = bereits geplant.</p>
    </div>`;
}

function sheetVorgaben() {
  const v = state.vorgaben;
  return `${sheetHead("Vorgaben")}<div class="sheet-body">
    <div class="card">
      <div class="field"><div class="flabel"><span class="n">Wochenbudget</span><span class="v" id="budget-val">${euro(v.budget)}</span></div>
        <input type="range" id="budget" min="15" max="100" step="5" value="${v.budget}" data-act="budget"></div>
      <div class="field"><div class="toggle-row"><div><div class="flabel" style="margin:0"><span class="n">Bio bevorzugen</span></div>
        <div class="sub" style="color:var(--text-2);font-size:13px">Wählt Bio-Angebote, wo verfügbar</div></div>
        <label class="switch"><input type="checkbox" id="bio" ${v.bioGewuenscht ? "checked" : ""} data-act="bio"><span class="slider"></span></label></div></div>
      <div class="field"><div class="toggle-row"><div><div class="flabel" style="margin:0"><span class="n">Maximale Läden</span></div>
        <div class="sub" style="color:var(--text-2);font-size:13px">Mehr Läden = mehr Sparpotenzial, mehr Fahrten</div></div>
        <div class="stepper"><button data-act="laeden" data-arg="-1">−</button><span class="num">${v.maxLaeden}</span><button data-act="laeden" data-arg="1">+</button></div></div></div>
    </div>
    <button class="btn btn-ghost" data-act="openSheet" data-arg="maerkte" style="margin-top:14px">${ICON.pin} Märkte verwalten (${state.aktiveMaerkte.length} aktiv)</button>
  </div>`;
}

function sheetMaerkte() {
  const list = MAERKTE.map((m) => {
    const on = state.aktiveMaerkte.includes(m.id);
    return `<div class="card" style="display:flex;align-items:center;gap:14px;padding:14px">
      <div class="store-dot" style="background:${m.farbe}">${m.kurz}</div>
      <div class="grow" style="flex:1"><div class="sname" style="font-size:16px;font-weight:700">${m.name}</div>
        <div class="smeta" style="font-size:12.5px;color:var(--text-2)">${m.entfernungKm} km · ${m.adresse}</div></div>
      <label class="switch"><input type="checkbox" ${on ? "checked" : ""} data-act="markt" data-arg="${m.id}"><span class="slider"></span></label>
    </div>`;
  }).join("");
  return `${sheetHead("Märkte in der Nähe")}<div class="sheet-body">
    <p style="color:var(--text-2);font-size:14px;margin:0 4px 14px">Nur aktive Märkte fließen in den Angebotsvergleich ein.</p>${list}</div>`;
}

function sheetImport() {
  // Phase 1: Prospekt-Auswahl · Phase 2: Scan · Phase 3: erkannte Angebote
  if (ui.scan && ui.scan.phase) {
    const p = PROSPEKTE.find((x) => x.id === ui.scan.prospektId);
    if (ui.scan.phase === "scanning") {
      return `${sheetHead("Prospekt wird gelesen")}<div class="sheet-body">
        <div class="scanbox"><div class="scan-anim"><div class="doc">📄</div><div class="scan-line"></div></div>
        <div style="font-weight:700;font-size:16px">${p.titel}-Prospekt wird analysiert…</div>
        <div style="color:var(--text-2);font-size:13.5px;margin-top:4px">KI erkennt Produkt, Preis, Bio & Gültigkeit</div></div></div>`;
    }
    // done
    const rows = p.angebote.map((a, i) => `<div class="extract-row" style="animation-delay:${i * 0.08}s">
      <span class="ck">${ICON.check}</span>
      <div class="grow" style="flex:1"><div class="title" style="font-size:15px;font-weight:600">${a.produktname} ${a.istBio ? `<span class="tag bio">BIO</span>` : ""}</div>
        <div class="sub" style="font-size:12.5px;color:var(--text-2)">gültig bis ${formatDatum(a.gueltigBis)}</div></div>
      <div class="price" style="font-weight:800">${euro(a.preis)}</div></div>`).join("");
    return `${sheetHead(p.angebote.length + " Angebote erkannt")}<div class="sheet-body">
      <div class="note" style="margin-bottom:14px">${ICON.sparkle}<div>Aus dem ${p.titel}-Prospekt automatisch extrahiert. Übernehmen, um sie im Vergleich zu nutzen.</div></div>
      <div class="card">${rows}</div>
      <button class="btn btn-primary" style="margin-top:16px" data-act="uebernehmen" data-arg="${p.id}">${ICON.plus} Angebote übernehmen</button>
      <button class="btn-text" data-act="openSheet" data-arg="import">Anderen Prospekt wählen</button>
    </div>`;
  }
  const flyers = PROSPEKTE.map((p) => {
    const fertig = prospektImportiert(p);
    return `<div class="flyer ${fertig ? "sel" : ""}" style="background:linear-gradient(160deg, ${p.farbe}, ${p.farbe}cc)" data-act="scanFlyer" data-arg="${p.id}">
      <span class="fcount">${fertig ? "✓ importiert" : p.angebote.length + " Angebote"}</span>
      <div><div class="fm">${p.titel}</div><div class="fd">${p.zeitraum}</div></div></div>`;
  }).join("");
  return `${sheetHead("Prospekt importieren")}<div class="sheet-body">
    <div class="note" style="margin-bottom:14px">${ICON.scan}<div><b>Stufe 2 – KI-Import.</b> Wähle einen Prospekt. Die KI liest Produkte, Preise und Gültigkeit automatisch aus (hier simuliert).</div></div>
    <div class="flyer-grid">${flyers}</div></div>`;
}

// --------------------------- Onboarding -------------------------------------
function onboarding() {
  const feat = (ic, t, d) => `<div class="feat">${ic}<div><div class="t">${t}</div><div class="d">${d}</div></div></div>`;
  return `<div class="onb">
    <div class="top">
      <div class="logo">${ICON.cart}</div>
      <h1>Smarter<br>Wochen-Einkauf</h1>
      <p>Dein Wochenplan wird zur fertigen, nach Läden sortierten Einkaufsliste – nur mit den besten Prospekt-Angeboten.</p>
    </div>
    <div class="feats">
      ${feat(ICON.calendar, "Planen", "Gerichte wählen, Liste entsteht automatisch")}
      ${feat(ICON.tag, "Sparen", "Bestes Angebots-Paket über mehrere Läden")}
      ${feat(ICON.leaf, "Nach deinen Regeln", "Budget, Bio & Anzahl der Fahrten")}
    </div>
    <button class="start-btn" data-act="finishOnboarding">Los geht's</button>
  </div>`;
}

// --------------------------- Bausteine / Helfer -----------------------------
function emptyScreen(title, icon, h, p) {
  return `<div class="scroll fade-in"><div class="header"><h1>${title}</h1></div>
    <div class="empty"><div class="ic">${ICON[icon]}</div><h3>${h}</h3><p>${p}</p></div></div>`;
}
function confetti() {
  const cols = ["#34d399", "#10b981", "#f59e0b", "#60a5fa", "#f472b6"];
  let s = "";
  for (let i = 0; i < 40; i++) s += `<i style="left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-delay:${Math.random()}s"></i>`;
  return `<div class="confetti">${s}</div>`;
}
function formatMenge(b) {
  const m = Number.isInteger(b.menge) ? b.menge : b.menge.toFixed(1);
  return `${m} ${b.einheit}`;
}
function formatDatum(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

// Echte Fotos via LoremFlickr (stabil pro Rezept), Farbverlauf+Emoji als Fallback.
function lockId(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h % 100000; }
function bildUrl(r, w, h) { return `https://loremflickr.com/${w}/${h}/${BILDER[r.id] || "food"}?lock=${lockId(r.id)}`; }
function coverImg(r, w, h) { return `<img class="cover-img" src="${bildUrl(r, w, h)}" alt="" loading="lazy" onerror="this.classList.add('img-hide')">`; }

// Count-up-Animation für den Gesamtbetrag.
function runEntryAnimations() {
  const el = app.querySelector("[data-countup]");
  if (!el) return;
  const ziel = parseFloat(el.dataset.countup);
  const dauer = 700; const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / dauer);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = euro(ziel * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// --------------------------- Events (Delegation) ----------------------------
app.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act, arg = el.dataset.arg;
  const sc = app.querySelector(".scroll");
  if (sc) ui.scrollTops[ui.tab] = sc.scrollTop;

  switch (act) {
    case "tab": ui.tab = arg; ui.scrollTops[arg] = 0; render(); break;
    case "openSheet": ui.sheet = arg; ui.sheetArg = null; ui.scan = null; render(); break;
    case "closeSheet": ui.sheet = null; ui.scan = null; render(); break;
    case "closeSheetBg": if (e.target.classList.contains("backdrop")) { ui.sheet = null; ui.scan = null; render(); } break;
    case "pickRecipe": { const [t, rid] = arg.split("|"); rezeptHinzufuegen(t, rid); ui.sheet = null; render(); break; }
    case "openRezepte":
      if (ui.tab !== "rezepte") ui.prevTab = ui.tab;
      ui.tab = "rezepte"; ui.zielTag = arg || null; ui.scrollTops["rezepte"] = 0; render(); break;
    case "backFromRezepte": ui.tab = ui.zielTag ? "plan" : (ui.prevTab || "home"); ui.zielTag = null; render(); break;
    case "setFilter": ui.rezeptFilter = arg; render(); break;
    case "openDetail": { ui.detailPortionen = rezept(arg)?.portionen || 2; ui.sheet = "rezeptDetail"; ui.sheetArg = arg; render(); break; }
    case "detailPortion": ui.detailPortionen = Math.max(1, ui.detailPortionen + (+arg)); render(); break;
    case "addToDay": { const [t, rid] = arg.split("|"); rezeptHinzufuegen(t, rid, ui.detailPortionen); render(); toast(`Zu ${t} hinzugefügt ✓`); break; }
    case "quickAdd": { const [t, rid] = arg.split("|"); rezeptHinzufuegen(t, rid, rezept(rid)?.portionen); ui.tab = "plan"; ui.zielTag = null; render(); toast(`Zu ${t} hinzugefügt ✓`); break; }
    case "removeMeal": { const [t, i] = arg.split("|"); rezeptEntfernen(t, +i); render(); break; }
    case "portion": { const [t, i, d] = arg.split("|"); portionenAendern(t, +i, +d); render(); break; }
    case "toggleVorrat": toggle("vorratAbgehakt", arg); render(); break;
    case "toggleEinkauf": toggle("einkaufAbgehakt", arg); render(); break;
    case "markt": toggleMarkt(arg); render(); break;
    case "laeden": setVorgabe("maxLaeden", Math.min(5, Math.max(1, state.vorgaben.maxLaeden + (+arg)))); render(); break;
    case "scanFlyer":
      ui.scan = { prospektId: arg, phase: "scanning" }; render();
      setTimeout(() => { if (ui.scan) { ui.scan.phase = "done"; render(); } }, 1900); break;
    case "uebernehmen": {
      const p = PROSPEKTE.find((x) => x.id === arg); if (p) prospektUebernehmen(p);
      ui.sheet = null; ui.scan = null; render(); toast("Angebote übernommen ✓"); break;
    }
    case "finishOnboarding": state.onboardingGesehen = true; persist(); render(); break;
    case "resetApp": if (confirm("Demo wirklich zurücksetzen?")) { reset(); ui.tab = "home"; render(); } break;
  }
});

// Slider live ohne Re-Render (kein Fokusverlust beim Ziehen)
app.addEventListener("input", (e) => {
  if (e.target.dataset.act === "budget") {
    setVorgabe("budget", +e.target.value);
    const lbl = document.getElementById("budget-val");
    if (lbl) lbl.textContent = euro(+e.target.value);
  }
  if (e.target.dataset.act === "rezeptSuche") {
    ui.rezeptSuche = e.target.value;
    const box = document.getElementById("rezept-results");
    if (box) box.innerHTML = rezeptKarten();
  }
});
app.addEventListener("change", (e) => {
  if (e.target.dataset.act === "bio") { setVorgabe("bioGewuenscht", e.target.checked); }
});

// Mini-Toast
function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = "position:absolute;left:50%;bottom:110px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;z-index:70;box-shadow:var(--shadow-lg);animation:rise .3s var(--ease)";
  app.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

render();
