import { parseProofreadBody, runProofread } from "../../server/runProofread";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  let parsed: unknown;
  try {
    parsed = await context.request.json();
  } catch {
    return json(400, { error: "Die Anfrage war unlesbar." });
  }
  const fields = parseProofreadBody(parsed);
  if (!fields) {
    return json(400, { error: "Die Anfrage war unlesbar." });
  }
  const result = await runProofread(fields.text, fields.apiKey, fields.model);
  return json(result.status, result.body);
}
