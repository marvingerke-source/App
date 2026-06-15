// UI-Steuerung des Prototyps. Reiner Vanilla-JS-State, kein Framework.

const state = {
  tab: "plan",
  // Wochenplan: tag -> { rezeptId, portionen }
  plan: {
    "Mo": { rezeptId: "bolognese", portionen: 2 },
    "Di": { rezeptId: "salat", portionen: 2 },
    "Do": { rezeptId: "haehnchen", portionen: 2 },
    "Sa": { rezeptId: "curry", portionen: 4 },
  },
  vorratAbgehakt: {},   // bedarf-key -> true (habe ich schon)
  vorgaben: { budget: 40, bioGewuenscht: false, maxLaeden: 2 },
  einkaufAbgehakt: {},  // angebot-id -> true
  sheetTag: null,
};

const app = document.getElementById("app");

function bedarfKey(b) { return `${b.name.toLowerCase()}|${b.einheit}`; }

function aktuellerBedarf() {
  return bedarfBerechnen(state.plan).filter((b) => !state.vorratAbgehakt[bedarfKey(b)]);
}

// --------------------------- Render-Einstieg --------------------------------
function render() {
  app.innerHTML = `
    <div class="statusbar">
      <span>9:41</span>
      <span class="dots">●●● 📶 100%</span>
    </div>
    ${renderScreen()}
    ${renderTabbar()}
    ${renderSheet()}
  `;
  bindEvents();
  const scroll = app.querySelector(".scroll");
  if (scroll) scroll.scrollTop = state._scrollTop || 0;
}

function renderScreen() {
  switch (state.tab) {
    case "plan": return screenPlan();
    case "liste": return screenListe();
    case "vorgaben": return screenVorgaben();
    case "ergebnis": return screenErgebnis();
    case "einkaufen": return screenEinkaufen();
  }
}

// --------------------------- Screen: Wochenplan -----------------------------
function screenPlan() {
  const belegt = Object.values(state.plan).filter(Boolean).length;
  const tage = WOCHENTAGE.map((tag) => {
    const eintrag = state.plan[tag];
    const rezept = eintrag && REZEPTE.find((r) => r.id === eintrag.rezeptId);
    return `
      <div class="card tappable day-card" data-tag="${tag}">
        <div class="day-badge">${tag}</div>
        <div class="day-main">
          ${rezept
            ? `<div class="meal">${rezept.emoji} ${rezept.name}</div>
               <div class="meta">${eintrag.portionen} Portionen · ${rezept.dauerMin} min</div>`
            : `<div class="meal empty">Kein Gericht – tippen zum Planen</div>`}
        </div>
        <div class="chev">${rezept ? "›" : "+"}</div>
      </div>`;
  }).join("");

  return `
    <div class="header">
      <h1>Wochenplan</h1>
      <div class="sub">${belegt} von 7 Tagen geplant</div>
    </div>
    <div class="scroll">
      ${tage}
      <button class="ghost-btn" id="clear-plan">Woche zurücksetzen</button>
    </div>`;
}

// --------------------------- Screen: Liste ----------------------------------
function screenListe() {
  const alle = bedarfBerechnen(state.plan);
  if (alle.length === 0) {
    return `
      <div class="header"><h1>Einkaufsliste</h1></div>
      <div class="scroll">
        <div class="empty-state">
          <div class="big">🧺</div>
          Noch keine Gerichte geplant.<br>Lege im Wochenplan los.
        </div>
      </div>`;
  }
  const offen = alle.filter((b) => !state.vorratAbgehakt[bedarfKey(b)]);
  const rows = alle.map((b) => {
    const k = bedarfKey(b);
    const checked = !!state.vorratAbgehakt[k];
    return `
      <div class="row">
        <div class="check ${checked ? "on" : ""}" data-vorrat="${k}">${checked ? "✓" : ""}</div>
        <div class="grow">
          <div class="title ${checked ? "checked" : ""}">${b.name}</div>
          <div class="subtitle">${formatMenge(b)} · für ${b.ausRezepten.join(", ")}</div>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="header">
      <h1>Einkaufsliste</h1>
      <div class="sub">${offen.length} zu kaufen · ${alle.length - offen.length} im Vorrat</div>
    </div>
    <div class="scroll">
      <div class="section-label">Automatisch aus dem Plan erzeugt</div>
      <div class="card">${rows}</div>
      <p class="store-meta" style="padding:0 4px">Tippe links, um Vorräte abzuhaken – sie fallen dann aus dem Vergleich.</p>
    </div>`;
}

// --------------------------- Screen: Vorgaben -------------------------------
function screenVorgaben() {
  const v = state.vorgaben;
  return `
    <div class="header">
      <h1>Vorgaben</h1>
      <div class="sub">Worauf es dir beim Einkauf ankommt</div>
    </div>
    <div class="scroll">
      <div class="card">
        <div class="field">
          <div class="flabel"><span class="name">Wochenbudget</span><span class="val">${euro(v.budget)}</span></div>
          <input type="range" id="budget" min="10" max="100" step="5" value="${v.budget}">
        </div>
        <div class="toggle-row">
          <div><div class="row-title" style="font-size:17px;font-weight:600">Bio bevorzugen</div>
          <div class="store-meta">Wählt Bio-Angebote, wo verfügbar</div></div>
          <label class="switch"><input type="checkbox" id="bio" ${v.bioGewuenscht ? "checked" : ""}><span class="slider"></span></label>
        </div>
      </div>

      <div class="section-label">Wie viele Läden willst du anfahren?</div>
      <div class="card">
        <div class="toggle-row">
          <div><div style="font-size:17px;font-weight:600">Maximale Anzahl Läden</div>
          <div class="store-meta">Mehr Läden = mehr Sparpotenzial, mehr Fahrten</div></div>
          <div class="stepper">
            <button id="laden-minus">−</button>
            <span class="num">${v.maxLaeden}</span>
            <button id="laden-plus">+</button>
          </div>
        </div>
      </div>

      <button class="primary-btn" id="go-ergebnis">Bestes Paket berechnen</button>
    </div>`;
}

// --------------------------- Screen: Ergebnis -------------------------------
function screenErgebnis() {
  const bedarf = aktuellerBedarf();
  if (bedarf.length === 0) {
    return `
      <div class="header"><h1>Ergebnis</h1></div>
      <div class="scroll"><div class="empty-state"><div class="big">🛒</div>
      Plane erst Gerichte, dann zeige ich dir das beste Angebots-Paket.</div></div>`;
  }
  const plan = einkaufsplanBerechnen(bedarf, state.vorgaben);

  const gruppen = plan.gruppen.map((g) => {
    const items = g.items.map((z) => {
      const a = z.angebot;
      const save = a.normalpreis - a.preis;
      return `
        <div class="row">
          <div class="grow">
            <div class="title">${z.bedarf.name}
              ${a.istBio ? `<span class="tag">BIO</span>` : ``}
              ${z.bioErsatz ? `<span class="tag muted">kein Bio</span>` : ``}
            </div>
            <div class="subtitle">${a.produktname}</div>
          </div>
          <div style="text-align:right">
            <div class="price">${euro(a.preis)}</div>
            ${save > 0 ? `<div class="subtitle price save">−${euro(save)}</div>` : ``}
          </div>
        </div>`;
    }).join("");
    return `
      <div class="card">
        <div class="store-head"><span class="sname">${g.markt.name}</span><span class="ssum">${euro(g.summe)}</span></div>
        <div class="store-meta">${g.markt.entfernungKm} km entfernt · ${g.items.length} Artikel</div>
        ${items}
      </div>`;
  }).join("");

  const ohne = plan.ohneAngebot.length ? `
    <div class="section-label">Kein Angebot – regulär kaufen</div>
    <div class="card">${plan.ohneAngebot.map((b) => `
      <div class="row"><div class="grow"><div class="title">${b.name}</div>
      <div class="subtitle">${formatMenge(b)} · diese Woche kein Prospekt-Treffer</div></div></div>`).join("")}</div>` : ``;

  return `
    <div class="header"><h1>Bestes Paket</h1></div>
    <div class="scroll">
      <div class="hero">
        <div class="total">${euro(plan.summe)}</div>
        <div class="savings">Du sparst ${euro(plan.ersparnis)} gegenüber Normalpreis</div>
        <div class="meta">${plan.anzahlLaeden} ${plan.anzahlLaeden === 1 ? "Laden" : "Läden"} · ${bedarf.length} Positionen
        ${plan.ueberBudget ? ` · ⚠︎ über Budget (${euro(state.vorgaben.budget)})` : ` · im Budget`}</div>
      </div>
      ${plan.hinweis ? `<div class="card" style="background:var(--accent-soft);color:var(--text)">💡 ${plan.hinweis}</div>` : ``}
      ${gruppen}
      ${ohne}
      <button class="primary-btn" id="go-einkaufen">Einkauf starten →</button>
    </div>`;
}

// --------------------------- Screen: Einkaufen ------------------------------
function screenEinkaufen() {
  const bedarf = aktuellerBedarf();
  if (bedarf.length === 0) {
    return `<div class="header"><h1>Einkaufen</h1></div>
      <div class="scroll"><div class="empty-state"><div class="big">✅</div>Nichts einzukaufen.</div></div>`;
  }
  const plan = einkaufsplanBerechnen(bedarf, state.vorgaben);
  const alleItems = plan.gruppen.flatMap((g) => g.items);
  const erledigt = alleItems.filter((z) => state.einkaufAbgehakt[z.angebot.id]).length;
  const total = alleItems.length;
  const pct = total ? Math.round((erledigt / total) * 100) : 0;

  const gruppen = plan.gruppen.map((g) => {
    const rows = g.items.map((z) => {
      const on = !!state.einkaufAbgehakt[z.angebot.id];
      return `
        <div class="row">
          <div class="check ${on ? "on" : ""}" data-einkauf="${z.angebot.id}">${on ? "✓" : ""}</div>
          <div class="grow"><div class="title ${on ? "checked" : ""}">${z.bedarf.name}</div>
          <div class="subtitle">${z.angebot.produktname}</div></div>
          <div class="price">${euro(z.angebot.preis)}</div>
        </div>`;
    }).join("");
    return `<div class="card"><div class="store-head"><span class="sname">${g.markt.name}</span>
      <span class="ssum">${euro(g.summe)}</span></div>
      <div class="store-meta">${g.markt.entfernungKm} km</div>${rows}</div>`;
  }).join("");

  return `
    <div class="header">
      <h1>Einkaufen</h1>
      <div class="sub">${erledigt} von ${total} erledigt</div>
    </div>
    <div class="scroll">
      <div class="progressbar"><div style="width:${pct}%"></div></div>
      ${gruppen}
      ${erledigt === total ? `<div class="empty-state" style="padding:24px">🎉 Alles erledigt!</div>` : ``}
    </div>`;
}

// --------------------------- Tab Bar ----------------------------------------
function renderTabbar() {
  const tabs = [
    { id: "plan",      ic: "📅", label: "Plan" },
    { id: "liste",     ic: "📝", label: "Liste" },
    { id: "vorgaben",  ic: "⚙️", label: "Vorgaben" },
    { id: "ergebnis",  ic: "🏷️", label: "Ergebnis" },
    { id: "einkaufen", ic: "🛒", label: "Einkaufen" },
  ];
  return `<div class="tabbar">${tabs.map((t) => `
    <button class="tab ${state.tab === t.id ? "active" : ""}" data-tab="${t.id}">
      <span class="ic">${t.ic}</span><span>${t.label}</span>
    </button>`).join("")}</div>`;
}

// --------------------------- Sheet: Rezept wählen ---------------------------
function renderSheet() {
  if (!state.sheetTag) return `<div class="sheet-backdrop" id="backdrop"></div>`;
  const tag = state.sheetTag;
  const aktuell = state.plan[tag];
  const liste = REZEPTE.map((r) => `
    <div class="card tappable recipe-pick" data-pick="${r.id}">
      <span class="emoji">${r.emoji}</span>
      <div class="grow"><div class="title">${r.name}</div>
      <div class="subtitle">${r.portionen} Portionen · ${r.dauerMin} min · ${r.zutaten.length} Zutaten</div></div>
      ${aktuell && aktuell.rezeptId === r.id ? `<div class="chev" style="color:var(--accent)">✓</div>` : ``}
    </div>`).join("");
  return `
    <div class="sheet-backdrop open" id="backdrop">
      <div class="sheet" id="sheet">
        <div class="sheet-head">
          <h2>${tag}: Gericht wählen</h2>
          <button class="x" id="sheet-close">✕</button>
        </div>
        <div class="sheet-body">
          ${aktuell ? `<button class="ghost-btn" data-pick="__remove">Gericht entfernen</button>` : ``}
          ${liste}
        </div>
      </div>
    </div>`;
}

// --------------------------- Events -----------------------------------------
function bindEvents() {
  const scroll = app.querySelector(".scroll");
  if (scroll) scroll.addEventListener("scroll", () => { state._scrollTop = scroll.scrollTop; });

  app.querySelectorAll("[data-tab]").forEach((el) =>
    el.onclick = () => { state.tab = el.dataset.tab; state._scrollTop = 0; render(); });

  app.querySelectorAll("[data-tag]").forEach((el) =>
    el.onclick = () => { state.sheetTag = el.dataset.tag; render(); });

  const close = () => { state.sheetTag = null; render(); };
  const bd = document.getElementById("backdrop");
  if (bd) bd.onclick = (e) => { if (e.target.id === "backdrop") close(); };
  const sc = document.getElementById("sheet-close");
  if (sc) sc.onclick = close;

  app.querySelectorAll("[data-pick]").forEach((el) =>
    el.onclick = () => {
      const id = el.dataset.pick;
      if (id === "__remove") delete state.plan[state.sheetTag];
      else {
        const r = REZEPTE.find((x) => x.id === id);
        state.plan[state.sheetTag] = { rezeptId: id, portionen: r.portionen };
      }
      state.sheetTag = null; render();
    });

  app.querySelectorAll("[data-vorrat]").forEach((el) =>
    el.onclick = () => {
      const k = el.dataset.vorrat;
      if (state.vorratAbgehakt[k]) delete state.vorratAbgehakt[k];
      else state.vorratAbgehakt[k] = true;
      render();
    });

  app.querySelectorAll("[data-einkauf]").forEach((el) =>
    el.onclick = () => {
      const id = el.dataset.einkauf;
      if (state.einkaufAbgehakt[id]) delete state.einkaufAbgehakt[id];
      else state.einkaufAbgehakt[id] = true;
      render();
    });

  bindIf("budget", "input", (el) => { state.vorgaben.budget = +el.value; render(); });
  bindIf("bio", "change", (el) => { state.vorgaben.bioGewuenscht = el.checked; render(); });
  bindIf("laden-minus", "click", () => { state.vorgaben.maxLaeden = Math.max(1, state.vorgaben.maxLaeden - 1); render(); });
  bindIf("laden-plus", "click", () => { state.vorgaben.maxLaeden = Math.min(4, state.vorgaben.maxLaeden + 1); render(); });
  bindIf("go-ergebnis", "click", () => { state.tab = "ergebnis"; state._scrollTop = 0; render(); });
  bindIf("go-einkaufen", "click", () => { state.tab = "einkaufen"; state._scrollTop = 0; render(); });
  bindIf("clear-plan", "click", () => { state.plan = {}; render(); });
}

function bindIf(id, ev, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(ev, () => fn(el));
}

// --------------------------- Helfer -----------------------------------------
function formatMenge(b) {
  const m = Number.isInteger(b.menge) ? b.menge : b.menge.toFixed(1);
  return `${m} ${b.einheit}`;
}

render();
