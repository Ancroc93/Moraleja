// subscribe — Supabase Edge Function: registra el contacto en Mailchimp.
//
// DESPLIEGUE (una vez):
//   1. supabase functions new subscribe   (o copia este archivo a supabase/functions/subscribe/index.ts)
//   2. supabase secrets set MAILCHIMP_API_KEY="..." MAILCHIMP_AUDIENCE_ID="..." MAILCHIMP_TAG="autodiagnóstico"
//   3. supabase functions deploy subscribe
// La llave privada de Mailchimp vive SOLO como secreto del servidor. Nunca en la página web.
//
// Entrada:  { nombre, email, consent_version }
// Efecto:   crea o actualiza el miembro como "subscribed" + etiqueta MAILCHIMP_TAG.
//           La evidencia del consentimiento (versión + fecha) queda en la tabla `resultados`.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { Md5 } from "https://deno.land/std@0.208.0/hash/md5.ts";

const API_KEY = Deno.env.get("MAILCHIMP_API_KEY") ?? "";
const AUDIENCE_ID = Deno.env.get("MAILCHIMP_AUDIENCE_ID") ?? "";
const TAG = Deno.env.get("MAILCHIMP_TAG") ?? "autodiagnóstico";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!API_KEY || !AUDIENCE_ID) return json({ error: "not-configured" }, 500);

  let payload: { nombre?: string; email?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  const email = (payload.email || "").trim().toLowerCase();
  const nombre = (payload.nombre || "").trim().slice(0, 50);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "email" }, 400);

  const dc = API_KEY.split("-").pop() || "us20";
  const hash = new Md5().update(email).toString();
  const base = `https://${dc}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members/${hash}`;
  const headers = { Authorization: `apikey ${API_KEY}`, "Content-Type": "application/json" };

  // PUT = crea o actualiza (idempotente: reintentos seguros)
  const upsert = await fetch(base, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: { FNAME: nombre },
    }),
  });
  if (!upsert.ok) return json({ error: "mailchimp", detail: await upsert.text() }, 502);

  // Etiqueta para segmentar ("autodiagnóstico")
  await fetch(`${base}/tags`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tags: [{ name: TAG, status: "active" }] }),
  }).catch(() => {});

  return json({ ok: true });
});
