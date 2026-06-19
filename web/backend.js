// ============================================================================
// Backend-Anbindung (Supabase). Standardmäßig INAKTIV – die App läuft dann
// wie bisher mit lokalen Demo-Daten. Trage url + anonKey ein, um Login,
// Ort-Eingabe und echte ortsbezogene Angebote zu aktivieren.
// (Werte stehen im Supabase-Dashboard unter Project Settings ▸ API.)
// ============================================================================
const BACKEND = { url: "", anonKey: "" };

function backendAktiv() { return !!(BACKEND.url && BACKEND.anonKey); }

async function sbFetch(path, opts = {}) {
  const headers = Object.assign(
    { apikey: BACKEND.anonKey, "content-type": "application/json" },
    opts.headers || {},
  );
  if (state.session && state.session.access_token) headers.authorization = "Bearer " + state.session.access_token;
  const res = await fetch(BACKEND.url.replace(/\/$/, "") + path, { ...opts, headers });
  const txt = await res.text();
  let body; try { body = txt ? JSON.parse(txt) : null; } catch (e) { body = txt; }
  if (!res.ok) throw new Error((body && (body.msg || body.error_description || body.message)) || ("HTTP " + res.status));
  return body;
}

async function backendRegistrieren(email, pw) {
  await sbFetch("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password: pw }) });
  return backendAnmelden(email, pw); // direkt einloggen (sofern keine E-Mail-Bestätigung erzwungen)
}
async function backendAnmelden(email, pw) {
  const d = await sbFetch("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password: pw }) });
  state.session = { access_token: d.access_token, refresh_token: d.refresh_token, user: d.user };
  persist();
  return d;
}
function backendAbmelden() { state.session = null; state.remoteAngebote = null; persist(); }

// PLZ -> Koordinaten (Zippopotam, kostenlos, ohne Key, DE)
async function geocodePlz(plz) {
  const res = await fetch("https://api.zippopotam.us/de/" + encodeURIComponent(String(plz).trim()));
  if (!res.ok) throw new Error("PLZ nicht gefunden");
  const d = await res.json();
  const p = d.places && d.places[0];
  if (!p) throw new Error("PLZ nicht gefunden");
  return { ort: p["place name"], lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) };
}

async function ortSpeichern(plz, radius) {
  const g = await geocodePlz(plz);
  state.profil = { plz: String(plz).trim(), ort: g.ort, lat: g.lat, lng: g.lng, radius: radius || 8 };
  persist();
  if (state.session) {
    try {
      await sbFetch("/rest/v1/profil", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          user_id: state.session.user.id, plz: state.profil.plz, ort: g.ort,
          geo: `SRID=4326;POINT(${g.lng} ${g.lat})`, radius_km: state.profil.radius,
        }),
      });
    } catch (e) { /* Profil-Sync optional */ }
  }
  return state.profil;
}

// Angebote im Umkreis laden (RPC angebote_fuer_ort)
async function angeboteLaden() {
  if (!backendAktiv() || !state.profil) return [];
  const p = state.profil;
  const rows = await sbFetch("/rest/v1/rpc/angebote_fuer_ort", {
    method: "POST",
    body: JSON.stringify({ p_lat: p.lat, p_lng: p.lng, p_radius_km: p.radius || 8 }),
  });
  state.remoteAngebote = (rows || []).map((r) => ({
    id: r.id, markt: r.markt_id || r.kette, kette: r.kette, marktName: r.markt_name,
    entfernungKm: r.entfernung_km, produktname: r.produktname, kategorie: r.kategorie || "sonstiges",
    preis: Number(r.preis), normalpreis: Number(r.normalpreis || r.preis),
    einheit: r.einheit || "", istBio: !!r.ist_bio, gueltigBis: r.gueltig_bis,
  }));
  persist();
  return state.remoteAngebote;
}
