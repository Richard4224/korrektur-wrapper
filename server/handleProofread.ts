import type { IncomingMessage, ServerResponse } from "node:http";
import { chunkText } from "../src/proofread/chunk";
import { modelAllowsTemperature, sanitizeModel } from "../src/proofread/models";
import { normalizeFindings, SYSTEM_PROMPT } from "../src/proofread/normalize";
import type { Finding } from "../src/proofread/types";

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

async function proofreadChunk(
  chunk: string,
  fullText: string,
  apiKey: string,
  model: string,
): Promise<Finding[]> {
  const requestBody: Record<string, unknown> = {
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content:
          "Neue, unabhängige Prüfung. Nur dieser Abschnitt, ohne Bezug zu anderen Teilen:\n\n" +
          chunk,
      },
    ],
  };
  if (modelAllowsTemperature(model)) {
    requestBody.temperature = 0.1;
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!response.ok) {
    throw new Error(
      payload.error?.message || "Die KI hat nicht geantwortet.",
    );
  }
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  return normalizeFindings(JSON.parse(content) as unknown, fullText);
}

export async function handleProofread(
  req: IncomingMessage,
  res: ServerResponse,
  env: Record<string, string>,
): Promise<void> {
  let text = "";
  let apiKey = env.OPENAI_API_KEY ?? "";
  let requestedModel = "";
  try {
    const parsed = JSON.parse(await readBody(req)) as {
      text?: unknown;
      apiKey?: unknown;
      model?: unknown;
    };
    text = typeof parsed.text === "string" ? parsed.text.trim() : "";
    if (typeof parsed.apiKey === "string" && parsed.apiKey.trim()) {
      apiKey = parsed.apiKey.trim();
    }
    if (typeof parsed.model === "string" && parsed.model.trim()) {
      requestedModel = parsed.model;
    }
  } catch {
    sendJson(res, 400, { error: "Die Anfrage war unlesbar." });
    return;
  }
  if (!apiKey) {
    sendJson(res, 503, {
      error: "Bitte oben einen API-Schlüssel einfügen.",
    });
    return;
  }
  if (!text) {
    sendJson(res, 400, { error: "Es wurde kein Text zum Prüfen geschickt." });
    return;
  }

  const model = sanitizeModel(requestedModel || env.OPENAI_MODEL || "gpt-4o");
  try {
    const chunks = chunkText(text);
    const merged: Finding[] = [];
    const seen = new Set<string>();
    for (const chunk of chunks) {
      const part = await proofreadChunk(chunk, text, apiKey, model);
      for (const finding of part) {
        const key = `${finding.quote}|${finding.prefix}|${finding.suffix}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(finding);
      }
    }
    sendJson(res, 200, {
      findings: merged.map((finding, index) => ({
        ...finding,
        id: `f${index + 1}`,
      })),
    });
  } catch (caught) {
    const message =
      caught instanceof Error && caught.message
        ? caught.message
        : "Die KI ist gerade nicht erreichbar. Bitte später noch einmal versuchen.";
    sendJson(res, 502, { error: message });
  }
}
