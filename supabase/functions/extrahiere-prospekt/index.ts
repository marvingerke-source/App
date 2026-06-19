// ============================================================================
// Edge Function: extrahiere-prospekt
// Liest die Seitenbilder eines Prospekts aus dem Storage, lässt Claude die
// Angebote strukturiert extrahieren und schreibt sie in die Tabelle "angebot".
//
// Aufruf:  POST { "prospekt_id": "<uuid>" }
// Secrets: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Storage: Bucket "prospekte", Seitenbilder unter "<prospekt_id>/seite-*.jpg|png"
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODELL = "claude-opus-4-8"; // bei großem Volumen ggf. claude-sonnet-4-6 testen

const TOOL = {
  name: "angebote",
  description: "Trage alle Angebote dieser Prospektseite ein.",
  input_schema: {
    type: "object",
    properties: {
      angebote: {
        type: "array",
        items: {
          type: "object",
          properties: {
            produktname: { type: "string" },
            kategorie: { type: "string", description: "z. B. fleisch, gemuese, milch, nudeln …" },
            preis: { type: "number", description: "Aktionspreis in Euro" },
            normalpreis: { type: "number", description: "Vergleichs-/Streichpreis, falls genannt" },
            einheit: { type: "string", description: "z. B. 500g, 1kg, Stk, 1L" },
            ist_bio: { type: "boolean" },
            konfidenz: { type: "number", description: "0..1 wie sicher die Erkennung ist" },
          },
          required: ["produktname", "preis"],
        },
      },
    },
    required: ["angebote"],
  },
};

Deno.serve(async (req) => {
  try {
    const { prospekt_id } = await req.json();
    if (!prospekt_id) return json({ error: "prospekt_id fehlt" }, 400);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: prospekt, error: pErr } = await sb.from("prospekt").select("*").eq("id", prospekt_id).single();
    if (pErr || !prospekt) return json({ error: "Prospekt nicht gefunden" }, 404);

    // Seitenbilder des Prospekts auflisten (PDF→Bilder passiert im Ingestion-Schritt)
    const { data: dateien, error: lErr } = await sb.storage.from("prospekte").list(prospekt_id);
    if (lErr) return json({ error: lErr.message }, 500);
    const seiten = (dateien || []).filter((f) => /\.(jpe?g|png)$/i.test(f.name)).sort((a, b) => a.name.localeCompare(b.name));

    const key = Deno.env.get("ANTHROPIC_API_KEY")!;
    let gesamt = 0;

    for (const datei of seiten) {
      const pfad = `${prospekt_id}/${datei.name}`;
      const { data: signed } = await sb.storage.from("prospekte").createSignedUrl(pfad, 600);
      if (!signed?.signedUrl) continue;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODELL,
          max_tokens: 4096,
          tools: [TOOL],
          tool_choice: { type: "tool", name: "angebote" },
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: signed.signedUrl } },
              { type: "text", text: "Extrahiere alle Lebensmittel-Angebote dieser Prospektseite. Preise in Euro, Streichpreis als normalpreis. Antworte nur über das Tool." },
            ],
          }],
        }),
      });
      const out = await res.json();
      const tu = (out.content || []).find((b: any) => b.type === "tool_use");
      const liste = tu?.input?.angebote || [];

      if (liste.length) {
        const rows = liste.map((a: any) => ({
          markt_id: null,
          region: prospekt.region,
          produktname: a.produktname,
          kategorie: a.kategorie || null,
          preis: a.preis,
          normalpreis: a.normalpreis ?? null,
          einheit: a.einheit || null,
          ist_bio: !!a.ist_bio,
          gueltig_von: prospekt.zeitraum_von,
          gueltig_bis: prospekt.zeitraum_bis,
          quelle_prospekt: prospekt_id,
          konfidenz: a.konfidenz ?? null,
        }));
        const { error: iErr } = await sb.from("angebot").insert(rows);
        if (!iErr) gesamt += rows.length;
      }
    }

    await sb.from("prospekt").update({ status: "extrahiert" }).eq("id", prospekt_id);
    return json({ ok: true, seiten: seiten.length, angebote: gesamt });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}
