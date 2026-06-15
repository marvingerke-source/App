// ============================================================================
// UI-Steuerung: Router, Screens, Sheets, Animationen. Vanilla JS, kein Framework.
// ============================================================================
const app = document.getElementById("app");
const ui = { tab: "home", sheet: null, sheetArg: null, scan: null, scrollTops: {},
  prevTab: "home", zielTag: null, rezeptFilter: "Alle", rezeptSuche: "", detailPortionen: 2,
  trackDatum: heuteISO(), schnellDraft: null, trackSuche: "" };

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
  pexelsNachladen();
}

function screenContent() {
  switch (ui.tab) {
    case "home": return screenHome();
    case "rezepte": return screenRezepte();
    case "plan": return screenPlan();
    case "liste": return screenListe();
    case "ergebnis": return screenErgebnis();
    case "einkaufen": return screenEinkaufen();
    case "tracking": return screenTracking();
  }
}

function statusbar() {
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, "0"), mm = String(t.getMinutes()).padStart(2, "0");
  return `<div class="statusbar"><span>${hh}:${mm}</span>
    <span class="right">${ICON.signal}${ICON.wifi}${ICON.battery}</span></div>`;
}

// Kompakte Rezept-Karte für horizontale Listen (Vorschläge / Vorrat).
function favBtn(r) {
  const on = istFavorit(r.id);
  return `<button class="fav-btn ${on ? "on" : ""}" data-act="fav" data-arg="${r.id}">${on ? ICON.heartFill : ICON.heart}</button>`;
}
function recCard(r, badge) {
  const eb = effektiveBewertung(r);
  return `<div class="rec-card" data-act="openDetail" data-arg="${r.id}">
    <div class="rec-cover" style="background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}bb)">
      <span class="cover-emoji">${r.emoji}</span>${coverImg(r, 320, 220)}
      ${favBtn(r)}
      ${badge ? `<span class="rec-badge">${badge}</span>` : ""}</div>
    <div class="rec-body"><div class="rt">${r.name}</div>
      <div class="rm">★ ${eb.anzahl ? eb.rating.toFixed(1) : "neu"} · ${r.dauerMin}'</div></div>
  </div>`;
}

function vorratEmpfehlungSection() {
  if (!state.vorrat.length) return "";
  const liste = kochbareRezepte().slice(0, 8);
  if (!liste.length) return "";
  return `<div class="section-label">Aus deinem Vorrat kochbar <a data-act="openSheet" data-arg="kuehlschrank">Vorrat</a></div>
    <div class="h-scroll">${liste.map((x) => recCard(x.r, `${x.have}/${x.total}`)).join("")}</div>`;
}

const VORRAT_HAEUFIG = ["Nudeln", "Reis", "Eier", "Milch", "Tomaten", "Zwiebeln", "Knoblauch", "Paprika",
  "Hähnchenbrust", "Hackfleisch", "Käse", "Kartoffeln", "Brokkoli", "Parmesan", "Kokosmilch", "Tomaten (Dose)", "Olivenöl"];

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
      <button class="icon-btn" data-act="openSheet" data-arg="einstellungen">${ICON.settings}</button>
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
        <div class="ic">${ICON.book}</div><div class="t">Rezepte entdecken</div><div class="d">${alleRezepte().length} Ideen</div></button>
      <button class="qa" data-act="openSheet" data-arg="kuehlschrank">
        <div class="ic">${ICON.fridge}</div><div class="t">Was kochen?</div><div class="d">${state.vorrat.length ? state.vorrat.length + " Zutaten da" : "Vorrat eingeben"}</div></button>
      <button class="qa" data-act="tab" data-arg="plan">
        <div class="ic">${ICON.calendar}</div><div class="t">Woche planen</div><div class="d">Gerichte zuweisen</div></button>
      <button class="qa" data-act="openSheet" data-arg="import">
        <div class="ic">${ICON.scan}</div><div class="t">Prospekt scannen</div><div class="d">Angebote per KI</div></button>
    </div>

    ${vorratEmpfehlungSection()}

    ${state.favoriten.length ? `<div class="section-label">Deine Favoriten <a data-act="setFilterGo" data-arg="Favoriten">Alle</a></div>
      <div class="h-scroll">${favoritenRezepte().map((r) => recCard(r)).join("")}</div>` : ""}

    <div class="section-label">Vorschläge für dich <a data-act="openRezepte" data-arg="">Mehr</a></div>
    <div class="h-scroll">${empfehlungen(8).map((r) => recCard(r)).join("")}</div>

    <div class="section-label">Günstig diese Woche 🏷️</div>
    <div class="h-scroll">${angebotsRezepte(8).map((x) => recCard(x.r, `${x.treffer} Angebote`)).join("")}</div>

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
  return alleRezepte().filter((r) => {
    if (ui.rezeptFilter === "Eigene") { if (!r.eigen) return false; }
    else if (ui.rezeptFilter === "Favoriten") { if (!istFavorit(r.id)) return false; }
    else if (!rezeptMatchtFilter(r, ui.rezeptFilter)) return false;
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
  return liste.map((r) => {
    const b = effektiveBewertung(r);
    const note = b.anzahl ? `★ ${b.rating.toFixed(1)}` : "neu";
    return `<div class="rcard" data-act="${ui.zielTag ? "quickAdd" : "openDetail"}" data-arg="${ui.zielTag ? ui.zielTag + "|" + r.id : r.id}">
    <div class="cover" style="background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}bb)">
      <span class="cover-emoji">${r.emoji}</span>
      ${coverImg(r, 600, 400)}
      ${r.eigen ? `<span class="vtag" style="color:#b45309">★ eigenes</span>` : dietBadge(r)}
      ${favBtn(r)}
      <span class="time">${ICON.clock} ${r.dauerMin}'</span>
    </div>
    <div class="body"><div class="t">${r.name}</div>
      <div class="m" style="color:#f59e0b;font-weight:700">${note} <span style="color:var(--text-2);font-weight:500">· ${r.kcal || "–"} kcal</span></div></div>
  </div>`;
  }).join("");
}

function screenRezepte() {
  const cats = REZEPT_KATEGORIEN.slice();
  if (state.eigeneRezepte.length) cats.splice(1, 0, "Eigene");
  if (state.favoriten.length) cats.splice(1, 0, "Favoriten");
  const chips = cats.map((k) =>
    `<button class="cat-chip ${ui.rezeptFilter === k ? "active" : ""}" data-act="setFilter" data-arg="${k}">${k}</button>`).join("");
  const kollektionen = KOLLEKTIONEN.map((c) => `<button class="coll-card" style="background:linear-gradient(150deg, ${c.farbe}, ${c.farbe}cc)" data-act="setFilter" data-arg="${c.key}">
    <span class="ce">${c.emoji}</span><span class="ct">${c.titel}</span></button>`).join("");
  const anzahl = rezepteGefiltert().length;
  return `<div class="scroll fade-in">
    <div class="header">
      <button class="icon-btn" data-act="backFromRezepte">${ICON.back}</button>
      <div style="flex:1;margin-left:4px"><div class="eyebrow">Rezeptbuch · ${alleRezepte().length} Ideen</div><h1>Entdecken</h1></div>
      <button class="icon-btn" data-act="openCreate" style="background:var(--accent-grad);color:#fff">${ICON.plus}</button>
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
  const heuteD = new Date();
  const montag = new Date(heuteD); montag.setDate(heuteD.getDate() - ((heuteD.getDay() + 6) % 7));
  const tage = WOCHENTAGE.map((tag, i) => {
    const tagDatum = new Date(montag); tagDatum.setDate(montag.getDate() + i);
    const istHeute = tagDatum.toDateString() === heuteD.toDateString();
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
      <div class="day-badge ${istHeute ? "today" : ""}"><div class="d">${tag}</div><div class="n">${tagDatum.getDate()}</div></div>
      <div class="day-main">
        ${meals}
        <button class="add-meal" data-act="openRezepte" data-arg="${tag}">${ICON.plus} Gericht hinzufügen</button>
      </div>
    </div>`;
  }).join("");

  const leereTage = WOCHENTAGE.some((t) => !planEintraege(t).length);
  const w = wochenWerte();
  const p = gerichte ? aktuellerPlan() : null;
  const uebersicht = gerichte ? `<div class="card week-stats">
      <div class="ws"><div class="n">${w.portionen}</div><div class="t">Portionen</div></div>
      <div class="ws"><div class="n">${(w.kcal / 1000).toFixed(1)}k</div><div class="t">kcal gesamt</div></div>
      <div class="ws"><div class="n">${w.kcalProPortion}</div><div class="t">kcal/Portion</div></div>
      <div class="ws"><div class="n">${euro(p.summe)}</div><div class="t">Kosten</div></div>
    </div>` : "";
  return `<div class="scroll fade-in">
    <div class="header"><div><div class="eyebrow">Schritt 1</div><h1>Wochenplan</h1>
      <div class="sub">${gerichte} ${gerichte === 1 ? "Gericht" : "Gerichte"} geplant</div></div></div>
    ${uebersicht}
    ${leereTage ? `<button class="btn btn-ghost" style="margin-bottom:14px" data-act="autoPlan">${ICON.wand} Leere Tage automatisch füllen</button>` : ""}
    ${tage}
  </div>`;
}

// --------------------------- Screen: Liste ----------------------------------
function screenListe() {
  const alle = bedarfMitStatus();
  if (!alle.length) return emptyScreen("Liste", "list", "Noch keine Gerichte geplant", "Weise im Wochenplan Gerichte zu – die Liste entsteht dann automatisch.");
  const zuKaufen = alle.filter((b) => b.kaufMenge > 0).length;
  const gedeckt = alle.length - zuKaufen;
  const rows = alle.map((b) => {
    const k = bedarfKey(b), erledigt = b.kaufMenge === 0;
    let tag = "";
    if (b.status === "vorrat") tag = ` <span class="tag bio">im Vorrat</span>`;
    else if (b.status === "teilweise") tag = ` <span class="tag deal">Rest</span>`;
    const mengeText = b.status === "teilweise"
      ? `${formatMenge({ menge: b.kaufMenge, einheit: b.einheit })} kaufen (von ${formatMenge(b)})`
      : formatMenge(b);
    return `<div class="row" data-act="toggleVorrat" data-arg="${k}">
      <div class="check ${erledigt ? "on" : ""}">${ICON.check}</div>
      <div class="grow"><div class="title ${erledigt ? "done" : ""}">${b.name}${tag}</div>
        <div class="sub">${mengeText} · für ${b.ausRezepten.join(", ")}</div></div>
    </div>`;
  }).join("");
  return `<div class="scroll fade-in">
    <div class="header"><div><div class="eyebrow">Schritt 2</div><h1>Einkaufsliste</h1>
      <div class="sub">${zuKaufen} zu kaufen · ${gedeckt} gedeckt</div></div></div>
    <div class="card">${rows}</div>
    <p style="color:var(--text-3);font-size:13px;text-align:center;margin-top:14px;padding:0 20px">Tippe an, was du schon hast. Vorrat wird automatisch abgezogen (in den Vorgaben umstellbar).</p>
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
        const a = z.angebot, anzahl = z.anzahl || 1, save = (a.normalpreis - a.preis) * anzahl;
        return `<div class="row"><div class="grow">
          <div class="title">${z.bedarf.name} ${a.istBio ? `<span class="tag bio">BIO</span>` : ""} ${z.bioErsatz ? `<span class="tag muted">kein Bio</span>` : ""}</div>
          <div class="sub">${a.produktname} · Bedarf ${formatMenge(z.bedarf)}${anzahl > 1 ? ` · ${anzahl}× ${a.einheit}` : ""}</div></div>
          <div style="text-align:right"><div class="price">${euro(z.zeilenpreis ?? a.preis)}</div>${save > 0 ? `<div class="save">−${euro(save)}</div>` : ""}</div>
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
        const on = state.einkaufAbgehakt.includes(z.angebot.id), anzahl = z.anzahl || 1;
        return `<div class="row" data-act="toggleEinkauf" data-arg="${z.angebot.id}">
          <div class="check ${on ? "on" : ""}">${ICON.check}</div>
          <div class="grow"><div class="title ${on ? "done" : ""}">${z.bedarf.name}${anzahl > 1 ? ` <span class="tag muted">${anzahl}×</span>` : ""}</div><div class="sub">${z.angebot.produktname}</div></div>
          <div class="price">${euro(z.zeilenpreis ?? z.angebot.preis)}</div></div>`;
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

// --------------------------- Screen: Tracking -------------------------------
function datumLabel(iso) {
  const heute = heuteISO();
  const g = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (iso === heute) return "Heute";
  if (iso === g) return "Gestern";
  return new Date(iso).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}
function kcalRing(ist, ziel) {
  const r = 52, c = 2 * Math.PI * r, pct = ziel ? Math.min(1, ist / ziel) : 0;
  return `<svg width="132" height="132" viewBox="0 0 132 132" style="transform:rotate(-90deg)">
    <circle cx="66" cy="66" r="${r}" fill="none" stroke="var(--separator)" stroke-width="12"/>
    <circle cx="66" cy="66" r="${r}" fill="none" stroke="url(#g1)" stroke-width="12" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" style="transition:stroke-dashoffset .5s var(--ease)"/>
    <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs>
  </svg>`;
}
function makroBar(label, ist, ziel, farbe) {
  const pct = ziel ? Math.min(100, Math.round(ist / ziel * 100)) : 0;
  return `<div class="mbar"><div class="mbar-top"><span>${label}</span><span><b>${Math.round(ist)}</b> / ${ziel} g</span></div>
    <div class="mbar-track"><div style="width:${pct}%;background:${farbe}"></div></div></div>`;
}
function screenTracking() {
  const d = ui.trackDatum, s = trackingSummen(d), z = state.ziele, eintraege = trackingTag(d);
  const liste = eintraege.length ? eintraege.map((e) => `<div class="row">
      <span class="thumb" style="flex:0 0 44px;width:44px;height:44px;border-radius:12px;position:relative;overflow:hidden;background:var(--card-2)">
        ${e.bildData ? `<img src="${e.bildData}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : `<span style="position:absolute;inset:0;display:grid;place-items:center;font-size:22px">${e.emoji || "🍽️"}</span>`}</span>
      <div class="grow"><div class="title">${e.name}</div>
        <div class="sub">${e.kcal} kcal · P ${e.protein || 0} · KH ${e.carbs || 0} · F ${e.fett || 0}</div></div>
      <button class="rm" data-act="trackDel" data-arg="${e.id}">${ICON.trash}</button></div>`).join("")
    : `<div class="empty" style="padding:30px 20px"><div class="ic">${ICON.activity}</div><h3>Noch nichts getrackt</h3><p>Füge Mahlzeiten, einen Schnell-Eintrag mit Foto oder Getränke hinzu.</p></div>`;

  return `<div class="scroll fade-in">
    <div class="header"><div><div class="eyebrow">Tracking</div><h1>Tagebuch</h1></div>
      <button class="icon-btn" data-act="openSheet" data-arg="ziele">${ICON.target}</button></div>

    <div class="date-nav">
      <button data-act="trackTag" data-arg="-1">${ICON.back}</button>
      <span>${datumLabel(d)}</span>
      <button data-act="trackTag" data-arg="1" ${d >= heuteISO() ? "disabled" : ""}>${ICON.chevron}</button>
    </div>

    <div class="card track-hero">
      <div class="ring-wrap">${kcalRing(s.kcal, z.kcal)}
        <div class="ring-c"><div class="rk">${Math.round(s.kcal)}</div><div class="rl">/ ${z.kcal} kcal</div></div></div>
      <div class="macros">
        ${makroBar("Protein", s.protein, z.protein, "#8b5cf6")}
        ${makroBar("Kohlenhydrate", s.carbs, z.carbs, "#f59e0b")}
        ${makroBar("Fett", s.fett, z.fett, "#ef4444")}
      </div>
    </div>

    <div class="track-add">
      <button data-act="openSheet" data-arg="trackRezept">${ICON.book}<span>Rezept</span></button>
      <button data-act="openSheet" data-arg="trackSchnell">${ICON.camera}<span>Schnell + Foto</span></button>
      <button data-act="openSheet" data-arg="trackGetraenk">${ICON.drink}<span>Getränk</span></button>
    </div>

    <div class="section-label">Einträge ${datumLabel(d)} <span style="color:var(--text-3);font-weight:600;text-transform:none">${Math.round(s.kcal)} kcal</span></div>
    <div class="card">${liste}</div>
  </div>`;
}

// --------------------------- Tab Bar ----------------------------------------
function tabbar() {
  const tabs = [
    ["home", "Start", ICON.home], ["plan", "Plan", ICON.calendar],
    ["liste", "Liste", ICON.list], ["ergebnis", "Sparen", ICON.tag],
    ["einkaufen", "Einkauf", ICON.cart], ["tracking", "Track", ICON.activity],
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
  else if (ui.sheet === "rezeptErstellen") body = sheetRezeptErstellen();
  else if (ui.sheet === "kuehlschrank") body = sheetKuehlschrank();
  else if (ui.sheet === "trackRezept") body = sheetTrackRezept();
  else if (ui.sheet === "trackSchnell") body = sheetTrackSchnell();
  else if (ui.sheet === "trackGetraenk") body = sheetTrackGetraenk();
  else if (ui.sheet === "ziele") body = sheetZiele();
  else if (ui.sheet === "einstellungen") body = sheetEinstellungen();
  else if (ui.sheet === "vorgaben") body = sheetVorgaben();
  else if (ui.sheet === "maerkte") body = sheetMaerkte();
  else if (ui.sheet === "import") body = sheetImport();
  return `<div class="backdrop open" data-act="closeSheetBg">
    <div class="sheet" data-stop><div class="grabber"></div>${body}</div></div>`;
}

function sheetHead(title) {
  return `<div class="sheet-head"><h2>${title}</h2><button class="x" data-act="closeSheet">${ICON.x}</button></div>`;
}

function vorratHinweisDetail(r) {
  if (!state.vorrat.length) return "";
  const fehlend = [], knapp = [];
  for (const z of r.zutaten) { const s = zutatStatus(z); if (s === "fehlt") fehlend.push(z.name); else if (s === "teilweise") knapp.push(z.name); }
  const have = r.zutaten.length - fehlend.length;
  if (!have) return "";
  let txt = `Du hast <b>${have} von ${r.zutaten.length}</b> Zutaten da`;
  if (!fehlend.length && !knapp.length) txt += " – alles da! 🎉";
  else { if (fehlend.length) txt += ` – es fehlt: ${fehlend.join(", ")}`; if (knapp.length) txt += `${fehlend.length ? "; " : " – "}knapp: ${knapp.join(", ")}`; }
  return `<div class="note" style="margin-top:6px">${ICON.fridge}<div>${txt}</div></div>`;
}

function sheetRezeptDetail(id) {
  const r = rezept(id);
  if (!r) return sheetHead("Rezept");
  const eb = effektiveBewertung(r);
  const meine = state.bewertungen[r.id] ?? 0;
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

  return `<div class="sheet-head" style="position:absolute;right:0;left:0;z-index:3;background:transparent">
      <button class="x ${istFavorit(r.id) ? "fav-on" : ""}" data-act="fav" data-arg="${r.id}" style="background:rgba(255,255,255,.9);color:${istFavorit(r.id) ? "#ef4444" : "#111"}">${istFavorit(r.id) ? ICON.heartFill : ICON.heart}</button>
      <button class="x" data-act="closeSheet" style="background:rgba(255,255,255,.9);color:#111">${ICON.x}</button></div>
    <div class="sheet-body" style="padding-top:0">
      <div class="detail-cover" style="background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}cc)">
        <span class="cover-emoji">${r.emoji}</span>
        ${coverImg(r, 800, 480)}
        <div class="badges">
          <span class="tag" style="background:rgba(255,255,255,.9);color:#333">${r.kategorie}</span>
          ${(r.diaet || []).map((d) => `<span class="tag" style="background:rgba(255,255,255,.9);color:#15803d">${d}</span>`).join("")}
        </div>
      </div>
      <h2 style="font-size:24px;font-weight:800;margin-top:14px">${r.name} ${r.eigen ? `<span class="tag" style="background:#fff4e0;color:#b45309">eigenes</span>` : ""}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;color:var(--text-2);font-size:13.5px;font-weight:600">
        ${sterne(eb.rating)} ${eb.anzahl ? `${eb.rating.toFixed(1)} · ${eb.anzahl.toLocaleString("de-DE")} Bewertungen` : "Noch keine Bewertung"}</div>
      <div class="detail-meta">
        <span class="meta-pill">${ICON.clock} ${r.dauerMin} min</span>
        <span class="meta-pill">${ICON.fire} ${r.kcal} kcal</span>
        <span class="meta-pill">${ICON.flame2} ${r.schwierigkeit}</span>
      </div>
      <p class="detail-desc">${r.beschreibung}</p>
      ${(() => { const m = makros(r); return `<div class="card macro-card">
        <div class="mc-head">Nährwerte <span>je Portion${m.exakt ? "" : " · ca."}</span></div>
        <div class="mc-row">
          <div class="mc"><div class="mv">${m.kcal}</div><div class="ml">kcal</div></div>
          <div class="mc"><div class="mv" style="color:#8b5cf6">${m.protein} g</div><div class="ml">Protein</div></div>
          <div class="mc"><div class="mv" style="color:#f59e0b">${m.carbs} g</div><div class="ml">Kohlenh.</div></div>
          <div class="mc"><div class="mv" style="color:#ef4444">${m.fett} g</div><div class="ml">Fett</div></div>
        </div>
        <button class="btn-text" style="padding:8px 0 0" data-act="logRezeptDetail" data-arg="${r.id}">${ICON.activity} Ins Tagebuch übernehmen</button>
      </div>`; })()}

      <div class="portion-bar"><span class="lbl">Portionen</span>
        <div class="stepper"><button data-act="detailPortion" data-arg="-1">−</button><span class="num">${p}</span><button data-act="detailPortion" data-arg="1">+</button></div></div>

      ${vorratHinweisDetail(r)}
      <div class="section-label" style="margin-top:8px">Zutaten</div>
      <div class="card">${r.zutaten.map((z) => {
        const m = z.menge * faktor, mStr = Number.isInteger(m) ? m : m.toFixed(m < 10 ? 1 : 0);
        const st = zutatStatus(z);
        const farbe = st === "voll" ? "var(--accent)" : st === "teilweise" ? "var(--gold)" : "var(--separator)";
        const mark = st === "voll" ? "✓" : st === "teilweise" ? "≈" : "";
        return `<div class="ing-row"><span class="dot" style="background:${farbe}"></span>
          <span class="nm" style="${st !== "fehlt" ? "color:var(--text-2)" : ""}">${z.name} ${mark}</span><span class="qt">${mStr} ${z.einheit}</span></div>`;
      }).join("")}</div>

      <div class="section-label">Zubereitung</div>
      <div class="card">${schritte}</div>

      <div class="section-label">Zum Wochenplan hinzufügen</div>
      <div class="day-pick">${dayChips}</div>
      <p style="color:var(--text-3);font-size:12.5px;text-align:center;margin-top:10px">Tippe einen Tag – grün = bereits geplant.</p>

      <div class="section-label">Deine Bewertung</div>
      <div class="card" style="text-align:center">
        <div class="rate-stars">${[1, 2, 3, 4, 5].map((n) =>
          `<button data-act="rate" data-arg="${r.id}|${n}" class="${n <= meine ? "on" : ""}">${ICON.star}</button>`).join("")}</div>
        <div style="font-size:13px;color:var(--text-2);margin-top:6px">${meine ? `Du hast ${meine} ${meine === 1 ? "Stern" : "Sterne"} vergeben` : "Tippe, um zu bewerten"}</div>
      </div>

      ${r.eigen ? `<button class="btn btn-ghost" style="color:var(--danger);margin-top:14px" data-act="deleteRezept" data-arg="${r.id}">${ICON.trash} Rezept löschen</button>` : ""}
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
      <div class="field"><div class="toggle-row"><div><div class="flabel" style="margin:0"><span class="n">Vorrat abziehen</span></div>
        <div class="sub" style="color:var(--text-2);font-size:13px">Zieht deinen Kühlschrank von der Einkaufsmenge ab</div></div>
        <label class="switch"><input type="checkbox" id="vorratAbziehen" ${v.vorratAbziehen ? "checked" : ""} data-act="vorratAbziehen"><span class="slider"></span></label></div></div>
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

// --------------------------- Sheet: Rezept erstellen ------------------------
const EMOJI_AUSWAHL = ["🍽️", "🍝", "🍲", "🥘", "🍛", "🥗", "🍕", "🍔", "🌮", "🍜", "🍳", "🥞", "🍰", "🥩", "🐟", "🍗"];
const DIAET_AUSWAHL = ["vegetarisch", "vegan", "keto", "low-carb", "high-protein"];
const KURS_AUSWAHL = ["Familie", "Klassiker", "Pasta", "Vegetarisch", "Fleisch", "Fisch", "Frühstück", "Salat", "Suppe"];

function leererDraft() {
  return { name: "", kategorie: "Familie", dauerMin: 30, portionen: 2, kcal: "", protein: "", carbs: "", fett: "", beschreibung: "",
    diaet: [], emoji: "🍽️", farbe: "#10b981", bildData: null,
    zutaten: [{ name: "", menge: "", einheit: "g" }], schritte: [""] };
}

function captureDraft() {
  const d = ui.draft, g = (id) => document.getElementById(id);
  if (g("f-name")) d.name = g("f-name").value;
  if (g("f-kat")) d.kategorie = g("f-kat").value;
  if (g("f-dauer")) d.dauerMin = +g("f-dauer").value || 0;
  if (g("f-portionen")) d.portionen = +g("f-portionen").value || 1;
  if (g("f-kcal")) d.kcal = g("f-kcal").value;
  if (g("f-protein")) d.protein = g("f-protein").value;
  if (g("f-carbs")) d.carbs = g("f-carbs").value;
  if (g("f-fett")) d.fett = g("f-fett").value;
  if (g("f-besch")) d.beschreibung = g("f-besch").value;
  d.zutaten.forEach((z, i) => {
    if (g(`z-name-${i}`)) z.name = g(`z-name-${i}`).value;
    if (g(`z-menge-${i}`)) z.menge = g(`z-menge-${i}`).value;
    if (g(`z-einheit-${i}`)) z.einheit = g(`z-einheit-${i}`).value;
  });
  d.schritte.forEach((s, i) => { if (g(`s-${i}`)) d.schritte[i] = g(`s-${i}`).value; });
}

function sheetRezeptErstellen() {
  const d = ui.draft;
  const emojis = EMOJI_AUSWAHL.map((e) => `<button class="emoji-opt ${d.emoji === e ? "on" : ""}" data-act="pickEmoji" data-arg="${e}">${e}</button>`).join("");
  const kurse = KURS_AUSWAHL.map((k) => `<option value="${k}" ${d.kategorie === k ? "selected" : ""}>${k}</option>`).join("");
  const diaet = DIAET_AUSWAHL.map((t) => `<button class="cat-chip ${d.diaet.includes(t) ? "active" : ""}" data-act="dietDraft" data-arg="${t}">${t}</button>`).join("");
  const zutaten = d.zutaten.map((z, i) => `<div class="z-row">
      <input id="z-name-${i}" placeholder="Zutat" value="${z.name}">
      <input id="z-menge-${i}" placeholder="Menge" value="${z.menge}" inputmode="decimal" style="max-width:74px">
      <input id="z-einheit-${i}" placeholder="Einh." value="${z.einheit}" style="max-width:64px">
      <button data-act="removeZutat" data-arg="${i}" class="rm">${ICON.x}</button></div>`).join("");
  const schritte = d.schritte.map((s, i) => `<div class="s-row"><span class="snum">${i + 1}</span>
      <textarea id="s-${i}" placeholder="Schritt beschreiben…" rows="2">${s}</textarea>
      <button data-act="removeSchritt" data-arg="${i}" class="rm">${ICON.x}</button></div>`).join("");

  return `${sheetHead("Eigenes Rezept")}<div class="sheet-body">
    <label class="photo-up" style="${d.bildData ? `background-image:url(${d.bildData})` : ""}">
      <input type="file" accept="image/*" data-act="photo" hidden>
      ${d.bildData ? `<span class="photo-edit">${ICON.camera} Foto ändern</span>` : `<span class="photo-empty">${ICON.camera}<b>Foto aufnehmen / wählen</b><i>wird automatisch verkleinert</i></span>`}
    </label>

    <div class="form-field"><label>Name</label><input id="f-name" placeholder="z. B. Omas Gulasch" value="${d.name}"></div>
    <div class="form-grid">
      <div class="form-field"><label>Kategorie</label><select id="f-kat">${kurse}</select></div>
      <div class="form-field"><label>Dauer (min)</label><input id="f-dauer" type="number" inputmode="numeric" value="${d.dauerMin}"></div>
      <div class="form-field"><label>Portionen</label><input id="f-portionen" type="number" inputmode="numeric" value="${d.portionen}"></div>
      <div class="form-field"><label>kcal/Portion</label><input id="f-kcal" type="number" inputmode="numeric" value="${d.kcal}"></div>
      <div class="form-field"><label>Protein (g, opt.)</label><input id="f-protein" type="number" inputmode="numeric" value="${d.protein}"></div>
      <div class="form-field"><label>Kohlenhydrate (g, opt.)</label><input id="f-carbs" type="number" inputmode="numeric" value="${d.carbs}"></div>
      <div class="form-field"><label>Fett (g, opt.)</label><input id="f-fett" type="number" inputmode="numeric" value="${d.fett}"></div>
    </div>
    <div class="form-field"><label>Kurzbeschreibung</label><textarea id="f-besch" rows="2" placeholder="Worum geht's?">${d.beschreibung}</textarea></div>

    <div class="form-field"><label>Symbol (Fallback ohne Foto)</label><div class="emoji-row">${emojis}</div></div>
    <div class="form-field"><label>Ernährung</label><div class="cat-scroll" style="margin:0;padding:0">${diaet}</div></div>

    <div class="section-label" style="margin-left:0">Zutaten</div>
    ${zutaten}
    <button class="btn-text" data-act="addZutat" style="text-align:left;padding:8px 2px">${ICON.plus} Zutat hinzufügen</button>

    <div class="section-label" style="margin-left:0">Zubereitung</div>
    ${schritte}
    <button class="btn-text" data-act="addSchritt" style="text-align:left;padding:8px 2px">${ICON.plus} Schritt hinzufügen</button>

    <button class="btn btn-primary" style="margin-top:18px" data-act="saveRezept">${ICON.check} Rezept speichern</button>
  </div>`;
}

function rezeptSpeichernAusDraft() {
  captureDraft();
  const d = ui.draft;
  if (!d.name.trim()) { toast("Bitte einen Namen eingeben"); return; }
  const zutaten = d.zutaten.filter((z) => z.name.trim()).map((z) => ({
    name: z.name.trim(), menge: parseFloat(String(z.menge).replace(",", ".")) || 1,
    einheit: z.einheit.trim() || "Stk", kategorie: guessKategorie(z.name),
  }));
  if (!zutaten.length) { toast("Mindestens eine Zutat angeben"); return; }
  const schritte = d.schritte.map((s) => s.trim()).filter(Boolean);
  const diaet = [...d.diaet];
  const veggie = diaet.includes("vegetarisch") || diaet.includes("vegan");
  const neu = {
    id: "u_" + Date.now(), eigen: true, name: d.name.trim(), emoji: d.emoji, farbe: d.farbe,
    kategorie: d.kategorie, dauerMin: +d.dauerMin || 20, portionen: +d.portionen || 2,
    kcal: +d.kcal || 0, schwierigkeit: "einfach", veggie, diaet,
    protein: d.protein !== "" ? +d.protein : null, carbs: d.carbs !== "" ? +d.carbs : null, fett: d.fett !== "" ? +d.fett : null,
    beliebt: false, budget: false, saison: ["ganzjährig"], rating: 0, bewertungen: 0,
    beschreibung: d.beschreibung.trim() || "Dein eigenes Rezept.",
    schritte: schritte.length ? schritte : ["Nach Belieben zubereiten."],
    bildData: d.bildData, zutaten,
  };
  eigenesRezeptSpeichern(neu);
  ui.sheet = "rezeptDetail"; ui.sheetArg = neu.id; ui.detailPortionen = neu.portionen;
  render(); toast("Rezept gespeichert ✓");
}

// Günstiges, schnelles Vision-Modell für die Nährwert-Schätzung aus dem Foto.
const VISION_MODEL = "claude-haiku-4-5";

// Schätzt Gericht + Nährwerte aus dem Foto via Claude (Schlüssel bleibt lokal).
function analysiereFoto(dataURL) {
  if (!state.anthropicKey) return;
  const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(dataURL || "");
  if (!m) { toast("Foto konnte nicht gelesen werden"); return; }
  ui.schnellDraft.analyzing = true; render();
  fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": state.anthropicKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 512,
      tools: [{
        name: "naehrwerte",
        description: "Trage die geschätzten Nährwerte des Gerichts auf dem Foto ein (für die abgebildete Portion).",
        input_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Kurzer Name des Gerichts" },
            kcal: { type: "integer" }, protein: { type: "integer" },
            carbs: { type: "integer" }, fett: { type: "integer" },
          },
          required: ["name", "kcal", "protein", "carbs", "fett"],
        },
      }],
      tool_choice: { type: "tool", name: "naehrwerte" },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
          { type: "text", text: "Erkenne das Gericht und schätze die Nährwerte für die abgebildete Portion. Antworte ausschließlich über das Tool." },
        ],
      }],
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      const tu = (d.content || []).find((b) => b.type === "tool_use");
      if (!tu || !tu.input) throw new Error(d.error ? d.error.message : "keine Antwort");
      captureSchnell();
      const i = tu.input, dr = ui.schnellDraft;
      if (i.name) dr.name = i.name;
      dr.kcal = i.kcal; dr.protein = i.protein; dr.carbs = i.carbs; dr.fett = i.fett;
      dr.analyzing = false; render(); toast("Nährwerte erkannt ✨");
    })
    .catch((e) => {
      ui.schnellDraft.analyzing = false; render();
      toast("KI-Erkennung fehlgeschlagen – bitte manuell");
    });
}

// Foto im Browser verkleinern (max 900px, JPEG) und via apply(dataURL) übernehmen.
function fotoVerarbeiten(file, apply) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 900, scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      try { apply(c.toDataURL("image/jpeg", 0.72)); } catch (e) { toast("Foto konnte nicht verarbeitet werden"); }
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function captureSchnell() {
  const d = ui.schnellDraft || (ui.schnellDraft = {}); const g = (id) => document.getElementById(id);
  if (g("sf-name")) d.name = g("sf-name").value;
  if (g("sf-kcal")) d.kcal = g("sf-kcal").value;
  if (g("sf-protein")) d.protein = g("sf-protein").value;
  if (g("sf-carbs")) d.carbs = g("sf-carbs").value;
  if (g("sf-fett")) d.fett = g("sf-fett").value;
}
function saveSchnellEintrag() {
  captureSchnell(); const d = ui.schnellDraft || {};
  if (!d.name || !d.name.trim()) { toast("Bitte einen Namen eingeben"); return; }
  trackingAdd(ui.trackDatum, { name: d.name.trim(), emoji: "🍽️", bildData: d.bildData || null,
    kcal: +d.kcal || 0, protein: +d.protein || 0, carbs: +d.carbs || 0, fett: +d.fett || 0, typ: "schnell" });
  ui.schnellDraft = null; ui.sheet = null; render(); toast("Eintrag gespeichert ✓");
}

// --------------------------- Sheet: Kühlschrank -----------------------------
function sheetKuehlschrank() {
  const meine = state.vorrat.map((v) =>
    `<button class="chip accent" data-act="vorratTog" data-arg="${v.name}">${v.name}${v.menge != null ? ` ${v.menge}${v.einheit || ""}` : ""} ${ICON.x}</button>`).join("");
  const quick = VORRAT_HAEUFIG.filter((n) => !vorratHat(n)).map((n) =>
    `<button class="cat-chip" data-act="vorratTog" data-arg="${n}">+ ${n}</button>`).join("");

  let ergebnis;
  if (!state.vorrat.length) {
    ergebnis = `<div class="empty" style="padding:30px 20px"><div class="ic">${ICON.fridge}</div>
      <h3>Was hast du da?</h3><p>Gib oben ein paar Zutaten ein – ich zeige dir, was du daraus kochen kannst.</p></div>`;
  } else {
    const liste = kochbareRezepte().slice(0, 20);
    ergebnis = liste.map((x) => {
      const teile = [];
      if (x.fehlend.length) teile.push(`fehlt: ${x.fehlend.join(", ")}`);
      if (x.knapp.length) teile.push(`knapp: ${x.knapp.join(", ")}`);
      const fehltTxt = teile.length ? teile.join(" · ") : "alles da! 🎉";
      return `<div class="row" data-act="openDetail" data-arg="${x.r.id}">
        <span class="thumb" style="flex:0 0 46px;width:46px;height:46px;border-radius:12px;position:relative;overflow:hidden;background:linear-gradient(150deg, ${x.r.farbe}, ${x.r.farbe}bb)">
          <span class="te" style="position:absolute;inset:0;display:grid;place-items:center;font-size:22px">${x.r.emoji}</span>${coverImg(x.r, 120, 120)}</span>
        <div class="grow"><div class="title">${x.r.name}</div>
          <div class="sub" style="color:${teile.length ? "var(--text-2)" : "var(--accent-2)"}">${x.have}/${x.total} Zutaten · ${fehltTxt}</div></div>
        <span class="chev">${ICON.chevron}</span></div>`;
    }).join("");
    ergebnis = `<div class="section-label" style="margin-left:0">Das kannst du kochen</div><div class="card">${ergebnis}</div>`;
  }

  return `${sheetHead("Mein Kühlschrank")}<div class="sheet-body">
    <p style="color:var(--text-2);font-size:14px;margin:0 2px 12px">Tippe an, was du da hast. Menge ist optional (für „etwas da" vs. „genug").</p>
    <div class="vorrat-add">
      <input id="vorrat-input" placeholder="Zutat…">
      <input id="vorrat-menge" placeholder="Menge" inputmode="decimal">
      <input id="vorrat-einheit" placeholder="Einh.">
      <button class="va-btn" data-act="vorratAdd">${ICON.plus}</button>
    </div>
    ${meine ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">${meine}</div>` : ""}
    <div class="cat-scroll" style="flex-wrap:wrap;margin:0 0 8px;padding:0;overflow:visible">${quick}</div>
    ${ergebnis}
  </div>`;
}

// --------------------------- Tracking-Sheets --------------------------------
function trackResultRows() {
  const q = ui.trackSuche.trim().toLowerCase();
  return alleRezepte().filter((r) => !q || r.name.toLowerCase().includes(q)).slice(0, 40).map((r) => {
    const m = makros(r);
    return `<div class="recipe-row" data-act="logRezept" data-arg="${r.id}">
      <span class="thumb" style="flex:0 0 52px;width:52px;height:52px;border-radius:14px;position:relative;overflow:hidden;background:linear-gradient(150deg, ${r.farbe}, ${r.farbe}bb)">
        <span class="te" style="position:absolute;inset:0;display:grid;place-items:center;font-size:26px">${r.emoji}</span>${coverImg(r, 120, 120)}</span>
      <div class="info"><div class="t">${r.name}</div><div class="m">${m.kcal} kcal · P ${m.protein} · KH ${m.carbs} · F ${m.fett} (je Portion)</div></div>
      <span style="color:var(--accent-2)">${ICON.plus}</span></div>`;
  }).join("");
}
function sheetTrackRezept() {
  return `${sheetHead("Mahlzeit tracken")}<div class="sheet-body">
    <div class="searchbar">${ICON.search}<input id="track-suche" data-act="trackSuche" placeholder="Rezept suchen…" value="${ui.trackSuche}"></div>
    <div id="track-results">${trackResultRows()}</div></div>`;
}

function sheetTrackGetraenk() {
  const rows = GETRAENKE.map((g, i) => `<div class="recipe-row" data-act="logGetraenk" data-arg="${i}">
    <span class="emoji">${g.emoji}</span>
    <div class="info"><div class="t">${g.name}</div><div class="m">${g.kcal} kcal · P ${g.protein} · KH ${g.carbs} · F ${g.fett}</div></div>
    <span style="color:var(--accent-2)">${ICON.plus}</span></div>`).join("");
  return `${sheetHead("Getränk tracken")}<div class="sheet-body">${rows}</div>`;
}

function sheetTrackSchnell() {
  const d = ui.schnellDraft || (ui.schnellDraft = { name: "", kcal: "", protein: "", carbs: "", fett: "", bildData: null });
  const kiStatus = state.anthropicKey
    ? `<div class="ki-bar"><span>${ICON.sparkle} KI-Nährwerterkennung aktiv</span><button class="btn-text" style="padding:0;width:auto" data-act="clearApiKey">Schlüssel entfernen</button></div>`
    : `<div class="card" style="margin-bottom:14px"><div class="mc-head" style="margin-bottom:8px">${ICON.sparkle} Automatische Erkennung</div>
        <p style="color:var(--text-2);font-size:13px;margin-bottom:10px">Foto aufnehmen → KI schätzt Gericht & Nährwerte automatisch. Dein Anthropic-API-Key bleibt <b>nur auf diesem Gerät</b>.</p>
        <div class="vorrat-add"><input id="sf-key" placeholder="Anthropic API-Key (sk-ant-…)" type="password">
        <button class="va-btn" data-act="setApiKey">${ICON.check}</button></div></div>`;
  return `${sheetHead("Schnell-Eintrag")}<div class="sheet-body">
    ${kiStatus}
    <label class="photo-up" style="${d.bildData ? `background-image:url(${d.bildData})` : ""}">
      <input type="file" accept="image/*" data-act="schnellFoto" hidden>
      ${d.bildData ? `<span class="photo-edit">${ICON.camera} Foto ändern</span>` : `<span class="photo-empty">${ICON.camera}<b>Foto vom Gericht</b><i>${state.anthropicKey ? "KI erkennt die Nährwerte" : "optional"}</i></span>`}
    </label>
    ${d.analyzing ? `<div class="ki-analyzing"><span class="spinner"></span> KI erkennt die Nährwerte…</div>`
      : (state.anthropicKey && d.bildData ? `<button class="btn btn-ghost" style="margin-bottom:14px" data-act="analyzeFoto">${ICON.sparkle} Foto erneut analysieren</button>` : "")}
    <div class="form-field"><label>Name</label><input id="sf-name" placeholder="z. B. Restaurant-Bowl" value="${d.name}"></div>
    <div class="form-grid">
      <div class="form-field"><label>kcal</label><input id="sf-kcal" type="number" inputmode="numeric" value="${d.kcal}"></div>
      <div class="form-field"><label>Protein (g)</label><input id="sf-protein" type="number" inputmode="numeric" value="${d.protein}"></div>
      <div class="form-field"><label>Kohlenhydrate (g)</label><input id="sf-carbs" type="number" inputmode="numeric" value="${d.carbs}"></div>
      <div class="form-field"><label>Fett (g)</label><input id="sf-fett" type="number" inputmode="numeric" value="${d.fett}"></div>
    </div>
    <p style="color:var(--text-3);font-size:12.5px;margin:0 2px 12px">Tipp: Foto + Werte eintragen. Automatische Nährwert-Erkennung aus dem Foto folgt mit Backend/KI.</p>
    <button class="btn btn-primary" data-act="saveSchnell">${ICON.check} Eintrag speichern</button>
  </div>`;
}

function sheetZiele() {
  const z = state.ziele;
  const f = (key, label, max, step) => `<div class="field"><div class="flabel"><span class="n">${label}</span><span class="v" id="z-${key}-val">${z[key]}${key === "kcal" ? " kcal" : " g"}</span></div>
    <input type="range" min="0" max="${max}" step="${step}" value="${z[key]}" data-act="ziel" data-zk="${key}"></div>`;
  return `${sheetHead("Tagesziele")}<div class="sheet-body"><div class="card">
    ${f("kcal", "Kalorien", 4000, 50)}
    ${f("protein", "Protein", 250, 5)}
    ${f("carbs", "Kohlenhydrate", 500, 5)}
    ${f("fett", "Fett", 200, 5)}
  </div><p style="color:var(--text-3);font-size:13px;text-align:center;margin-top:12px">Richtwerte – passe sie an dein Ziel an (z. B. Muskelaufbau, Abnehmen).</p></div>`;
}

// --------------------------- Sheet: Einstellungen ---------------------------
function setRow(icon, label, sub, act, arg, danger) {
  return `<div class="set-row" data-act="${act}" ${arg != null ? `data-arg="${arg}"` : ""}>
    <span class="set-ic ${danger ? "danger" : ""}">${icon}</span>
    <div class="grow"><div class="set-t ${danger ? "danger" : ""}">${label}</div>${sub ? `<div class="set-s">${sub}</div>` : ""}</div>
    ${danger ? "" : `<span class="set-chev">${ICON.chevron}</span>`}</div>`;
}
function sheetEinstellungen() {
  const v = state.vorgaben;
  return `${sheetHead("Einstellungen")}<div class="sheet-body">
    <div class="section-label" style="margin-left:4px">Einkauf</div>
    <div class="card set-card">
      ${setRow(ICON.sliders, "Budget, Bio & Läden", `${euro(v.budget)} · Bio ${v.bioGewuenscht ? "an" : "aus"} · max. ${v.maxLaeden}`, "openSheet", "vorgaben")}
      ${setRow(ICON.pin, "Märkte", `${state.aktiveMaerkte.length} aktiv`, "openSheet", "maerkte")}
      ${setRow(ICON.scan, "Prospekt importieren", "Angebote per KI", "openSheet", "import")}
    </div>
    <div class="section-label" style="margin-left:4px">Ernährung & Tracking</div>
    <div class="card set-card">
      ${setRow(ICON.target, "Tagesziele", `${state.ziele.kcal} kcal · ${state.ziele.protein} g Protein`, "openSheet", "ziele")}
      ${setRow(ICON.sparkle, "KI-Foto-Nährwerterkennung", state.anthropicKey ? "aktiv · Schlüssel lokal gespeichert" : "inaktiv – im Schnell-Eintrag aktivierbar", "openSheet", "trackSchnell")}
    </div>
    <div class="section-label" style="margin-left:4px">App</div>
    <div class="card set-card">
      ${setRow(ICON.sparkle, "Einführung erneut zeigen", "Onboarding-Screen", "replayOnboarding", null)}
      ${setRow(ICON.trash, "App zurücksetzen", "Alle lokalen Daten löschen", "resetApp", null, true)}
    </div>
    <p style="text-align:center;color:var(--text-3);font-size:12.5px;margin-top:16px">Smarter Wochen-Einkauf · Prototyp</p>
  </div>`;
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

// ---- Fotos ----------------------------------------------------------------
// Trage hier deinen kostenlosen Pexels-API-Key ein -> perfekt passende Fotos.
// Solange leer, werden echte Fotos via LoremFlickr (Stichwort) genutzt.
const PEXELS_KEY = "J2QR4daVOhxgVeDgnInIwhSVx8QGC34wtVOZlH6Px1Enkj3Aw9eeSypS";
const pexelsInflight = new Set();

const BILD_VERSION = 2; // erhöhen, um Foto-Cache mit besseren Stichwörtern neu zu laden
function lockId(id) { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return h % 100000; }
function loremUrl(r, w, h) {
  const kw = (BILDER[r.id] || "food").replace(/\s+/g, ",");
  return `https://loremflickr.com/${w}/${h}/${encodeURIComponent(kw)}?lock=${lockId(r.id)}`;
}
function rezeptBildSrc(r, w, h) {
  if (r.bildData) return r.bildData;                 // eigenes Foto (Upload)
  if (state.bildCache[r.id]) return state.bildCache[r.id]; // gecachtes Pexels-Foto
  return loremUrl(r, w, h);
}
function coverImg(r, w, h) {
  return `<img class="cover-img" src="${rezeptBildSrc(r, w, h)}" data-rk="${r.id}" alt="" loading="lazy" onerror="this.classList.add('img-hide')">`;
}
// Lädt – falls ein Pexels-Key gesetzt ist – passende Fotos nach und cached sie.
function pexelsNachladen() {
  if (!PEXELS_KEY) return;
  document.querySelectorAll("img.cover-img[data-rk]").forEach((el) => {
    const id = el.dataset.rk, r = rezept(id);
    if (!r || r.bildData || state.bildCache[id] || pexelsInflight.has(id)) return;
    const kw = BILDER[id] || r.name;
    pexelsInflight.add(id);
    fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(kw)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } })
      .then((res) => res.json())
      .then((d) => {
        const src = d.photos && d.photos[0] && d.photos[0].src && d.photos[0].src.large;
        if (src) { state.bildCache[id] = src; persist();
          document.querySelectorAll(`img.cover-img[data-rk="${id}"]`).forEach((e) => { e.src = src; e.classList.remove("img-hide"); });
        }
      }).catch(() => {}).finally(() => pexelsInflight.delete(id));
  });
}

// Sternebewertung als Markup.
function sterne(rating) {
  const voll = Math.round(rating);
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<span style="color:${i <= voll ? "#f59e0b" : "var(--separator)"}">${ICON.star}</span>`;
  return `<span class="stars-row">${s}</span>`;
}

// Kategorie einer (frei eingegebenen) Zutat schätzen – für das Angebots-Matching.
const ZUTAT_KAT = {};
REZEPTE.forEach((r) => r.zutaten.forEach((z) => { if (!ZUTAT_KAT[z.name.toLowerCase()]) ZUTAT_KAT[z.name.toLowerCase()] = z.kategorie; }));
function guessKategorie(name) {
  const n = name.toLowerCase().trim();
  if (ZUTAT_KAT[n]) return ZUTAT_KAT[n];
  for (const k in ZUTAT_KAT) if (n.includes(k) || k.includes(n)) return ZUTAT_KAT[k];
  return "sonstiges";
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
    case "rate": { const [rid, n] = arg.split("|"); bewertungSetzen(rid, +n); render(); toast("Danke für deine Bewertung ★"); break; }
    case "vorratTog": vorratToggle(arg); render(); break;
    case "vorratAdd": {
      const inp = document.getElementById("vorrat-input");
      const mg = document.getElementById("vorrat-menge"), eh = document.getElementById("vorrat-einheit");
      if (inp && inp.value.trim()) { vorratToggle(inp.value, mg ? mg.value : null, eh ? eh.value : null); render(); }
      break;
    }
    case "autoPlan": wochePlanenAuto(); render(); toast("Woche automatisch gefüllt ✓"); break;
    case "fav": favoritToggle(arg); render(); break;
    case "trackTag": { const dt = new Date(ui.trackDatum); dt.setDate(dt.getDate() + (+arg)); const iso = dt.toISOString().slice(0, 10); if (iso <= heuteISO()) { ui.trackDatum = iso; render(); } break; }
    case "logRezept": case "logRezeptDetail": {
      const r = rezept(arg); if (!r) break; const m = makros(r);
      trackingAdd(ui.trackDatum, { name: r.name, emoji: r.emoji, bildData: r.bildData || null, kcal: m.kcal, protein: m.protein, carbs: m.carbs, fett: m.fett, typ: "rezept" });
      if (act === "logRezept") ui.sheet = null;
      render(); toast(`${r.name} getrackt ✓`); break;
    }
    case "logGetraenk": { const g = GETRAENKE[+arg]; if (!g) break; trackingAdd(ui.trackDatum, { name: g.name, emoji: g.emoji, kcal: g.kcal, protein: g.protein, carbs: g.carbs, fett: g.fett, typ: "getraenk" }); ui.sheet = null; render(); toast(`${g.name} getrackt ✓`); break; }
    case "trackDel": trackingRemove(ui.trackDatum, arg); render(); break;
    case "saveSchnell": saveSchnellEintrag(); break;
    case "setApiKey": { captureSchnell(); const inp = document.getElementById("sf-key"); if (inp && inp.value.trim()) { apiKeySetzen(inp.value); render(); toast("KI aktiviert – Schlüssel bleibt lokal"); } break; }
    case "clearApiKey": apiKeySetzen(""); render(); break;
    case "analyzeFoto": if (ui.schnellDraft && ui.schnellDraft.bildData) analysiereFoto(ui.schnellDraft.bildData); break;
    case "setFilterGo": if (ui.tab !== "rezepte") ui.prevTab = ui.tab; ui.tab = "rezepte"; ui.zielTag = null; ui.rezeptFilter = arg; render(); break;
    case "openCreate": ui.draft = leererDraft(); ui.sheet = "rezeptErstellen"; ui.sheetArg = null; render(); break;
    case "addZutat": captureDraft(); ui.draft.zutaten.push({ name: "", menge: "", einheit: "g" }); render(); break;
    case "removeZutat": captureDraft(); ui.draft.zutaten.splice(+arg, 1); if (!ui.draft.zutaten.length) ui.draft.zutaten.push({ name: "", menge: "", einheit: "g" }); render(); break;
    case "addSchritt": captureDraft(); ui.draft.schritte.push(""); render(); break;
    case "removeSchritt": captureDraft(); ui.draft.schritte.splice(+arg, 1); if (!ui.draft.schritte.length) ui.draft.schritte.push(""); render(); break;
    case "dietDraft": { captureDraft(); const s = new Set(ui.draft.diaet); s.has(arg) ? s.delete(arg) : s.add(arg); ui.draft.diaet = [...s]; render(); break; }
    case "pickEmoji": captureDraft(); ui.draft.emoji = arg; render(); break;
    case "saveRezept": rezeptSpeichernAusDraft(); break;
    case "deleteRezept": if (confirm("Eigenes Rezept löschen?")) { rezeptLoeschen(arg); ui.sheet = null; render(); toast("Rezept gelöscht"); } break;
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
    case "replayOnboarding": state.onboardingGesehen = false; persist(); ui.sheet = null; render(); break;
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
    if (box) { box.innerHTML = rezeptKarten(); pexelsNachladen(); }
  }
  if (e.target.dataset.act === "trackSuche") {
    ui.trackSuche = e.target.value;
    const box = document.getElementById("track-results");
    if (box) { box.innerHTML = trackResultRows(); pexelsNachladen(); }
  }
  if (e.target.dataset.act === "ziel") {
    const k = e.target.dataset.zk; zielSetzen(k, +e.target.value);
    const lbl = document.getElementById(`z-${k}-val`); if (lbl) lbl.textContent = e.target.value + (k === "kcal" ? " kcal" : " g");
  }
});
app.addEventListener("change", (e) => {
  if (e.target.dataset.act === "bio") { setVorgabe("bioGewuenscht", e.target.checked); }
  if (e.target.dataset.act === "vorratAbziehen") { setVorgabe("vorratAbziehen", e.target.checked); render(); }
  if (e.target.dataset.act === "photo" && e.target.files && e.target.files[0]) {
    fotoVerarbeiten(e.target.files[0], (url) => { captureDraft(); ui.draft.bildData = url; });
  }
  if (e.target.dataset.act === "schnellFoto" && e.target.files && e.target.files[0]) {
    fotoVerarbeiten(e.target.files[0], (url) => {
      captureSchnell(); ui.schnellDraft.bildData = url;
      if (state.anthropicKey) analysiereFoto(url);  // automatische KI-Erkennung
    });
  }
});
app.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "vorrat-input" && e.target.value.trim()) {
    e.preventDefault();
    const mg = document.getElementById("vorrat-menge"), eh = document.getElementById("vorrat-einheit");
    vorratToggle(e.target.value, mg ? mg.value : null, eh ? eh.value : null); render();
  }
});

// Mini-Toast
function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = "position:absolute;left:50%;bottom:110px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;z-index:70;box-shadow:var(--shadow-lg);animation:rise .3s var(--ease)";
  app.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

// Foto-Cache auffrischen, wenn bessere Stichwörter ausgerollt wurden.
if (state.bildVersion !== BILD_VERSION) { state.bildCache = {}; state.bildVersion = BILD_VERSION; persist(); }

render();
