// ============================================================================
// UI-Steuerung: Router, Screens, Sheets, Animationen. Vanilla JS, kein Framework.
// ============================================================================
const app = document.getElementById("app");
const ui = { tab: "home", sheet: null, sheetArg: null, scan: null, scrollTops: {} };

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
      <button class="qa" data-act="tab" data-arg="plan">
        <div class="ic">${ICON.calendar}</div><div class="t">Woche planen</div><div class="d">Gerichte zuweisen</div></button>
      <button class="qa" data-act="openSheet" data-arg="import">
        <div class="ic">${ICON.scan}</div><div class="t">Prospekt scannen</div><div class="d">Angebote per KI</div></button>
      <button class="qa" data-act="openSheet" data-arg="maerkte">
        <div class="ic">${ICON.pin}</div><div class="t">Märkte</div><div class="d">${state.aktiveMaerkte.length} aktiv</div></button>
      <button class="qa" data-act="openSheet" data-arg="vorgaben">
        <div class="ic">${ICON.sliders}</div><div class="t">Vorgaben</div><div class="d">Budget · Bio · Läden</div></button>
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

// --------------------------- Screen: Wochenplan -----------------------------
function screenPlan() {
  const gerichte = geplanteGerichte();
  const tage = WOCHENTAGE.map((tag, i) => {
    const eintraege = planEintraege(tag);
    const meals = eintraege.map((e, idx) => {
      const r = rezept(e.rezeptId);
      if (!r) return "";
      return `<div class="meal-pill">
        <span class="emoji">${r.emoji}</span>
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
        <button class="add-meal" data-act="openSheet" data-arg="rezept:${tag}">${ICON.plus} Gericht hinzufügen</button>
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
  if (ui.sheet === "rezept") body = sheetRezept(ui.sheetArg);
  else if (ui.sheet === "vorgaben") body = sheetVorgaben();
  else if (ui.sheet === "maerkte") body = sheetMaerkte();
  else if (ui.sheet === "import") body = sheetImport();
  return `<div class="backdrop open" data-act="closeSheetBg">
    <div class="sheet" data-stop><div class="grabber"></div>${body}</div></div>`;
}

function sheetHead(title) {
  return `<div class="sheet-head"><h2>${title}</h2><button class="x" data-act="closeSheet">${ICON.x}</button></div>`;
}

function sheetRezept(tag) {
  const list = REZEPTE.map((r) => `<div class="recipe-row" data-act="pickRecipe" data-arg="${tag}|${r.id}">
    <div class="emoji">${r.emoji}</div>
    <div class="info"><div class="t">${r.name} ${r.veggie ? `<span class="tag bio">veggie</span>` : ""}</div>
      <div class="m">${r.portionen} Portionen · ${r.dauerMin} min · ${r.zutaten.length} Zutaten</div></div>
    <span style="color:var(--accent-2)">${ICON.plus}</span></div>`).join("");
  return `${sheetHead(tag + ": Gericht wählen")}<div class="sheet-body">${list}</div>`;
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
    case "openSheet": {
      if (arg.startsWith("rezept:")) { ui.sheet = "rezept"; ui.sheetArg = arg.slice(7); }
      else { ui.sheet = arg; ui.sheetArg = null; }
      ui.scan = null; render(); break;
    }
    case "closeSheet": ui.sheet = null; ui.scan = null; render(); break;
    case "closeSheetBg": if (e.target.classList.contains("backdrop")) { ui.sheet = null; ui.scan = null; render(); } break;
    case "pickRecipe": { const [t, rid] = arg.split("|"); rezeptHinzufuegen(t, rid); ui.sheet = null; render(); break; }
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
