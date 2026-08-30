import type { IncomingMessage, ServerResponse } from "node:http";
import { normalizeFindings, SYSTEM_PROMPT } from "../src/proofread/normalize";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export async function handleProofread(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
): Promise<void> {
  const apiKey = env.OPENAI_API_KEY ?? "";
  if (!apiKey) {
    sendJson(res, 503, {
      error:
        "Es fehlt der API-Schlüssel. In der Datei .env OPENAI_API_KEY eintragen und die App neu starten.",
    });
    return;
  }

  let text = "";
  try {
    const parsed = JSON.parse(await readBody(req)) as { text?: unknown };
    text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  } catch {
    sendJson(res, 400, { error: "Die Anfrage war unlesbar." });
    return;
  }
  if (!text) {
    sendJson(res, 400, { error: "Es wurde kein Text zum Prüfen geschickt." });
    return;
  }

  const model = env.OPENAI_MODEL || "gpt-4o";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = (await response.json()) as {
      error?: { message?: string };
      choices?: { message?: { content?: string } }[];
    };
    if (!response.ok) {
      sendJson(res, 502, {
        error:
          payload.error?.message ||
          "Die KI hat nicht geantwortet. Bitte später noch einmal versuchen.",
      });
      return;
    }
    const content = payload.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as unknown;
    sendJson(res, 200, { findings: normalizeFindings(parsed) });
  } catch {
    sendJson(res, 502, {
      error: "Die KI ist gerade nicht erreichbar. Bitte später noch einmal versuchen.",
    });
  }
}
