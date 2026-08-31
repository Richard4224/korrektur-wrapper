import { chunkText } from "../src/proofread/chunk";
import {
  DEFAULT_MODEL,
  modelAllowsTemperature,
  sanitizeModel,
} from "../src/proofread/models";
import { normalizeFindings, SYSTEM_PROMPT } from "../src/proofread/normalize";
import type { Finding } from "../src/proofread/types";

export type ProofreadJson = {
  error?: string;
  findings?: Finding[];
};

export type ProofreadResult = {
  status: number;
  body: ProofreadJson;
};

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

export async function runProofread(
  text: string,
  apiKey: string,
  requestedModel = "",
): Promise<ProofreadResult> {
  if (!apiKey.trim()) {
    return {
      status: 503,
      body: { error: "Bitte oben einen API-Schlüssel einfügen." },
    };
  }
  if (!text.trim()) {
    return {
      status: 400,
      body: { error: "Es wurde kein Text zum Prüfen geschickt." },
    };
  }

  const model = sanitizeModel(requestedModel || DEFAULT_MODEL);
  try {
    const chunks = chunkText(text);
    const merged: Finding[] = [];
    const seen = new Set<string>();
    for (const chunk of chunks) {
      const part = await proofreadChunk(chunk, text, apiKey.trim(), model);
      for (const finding of part) {
        const key = `${finding.quote}|${finding.prefix}|${finding.suffix}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(finding);
      }
    }
    return {
      status: 200,
      body: {
        findings: merged.map((finding, index) => ({
          ...finding,
          id: `f${index + 1}`,
        })),
      },
    };
  } catch (caught) {
    const message =
      caught instanceof Error && caught.message
        ? caught.message
        : "Die KI ist gerade nicht erreichbar. Bitte später noch einmal versuchen.";
    return { status: 502, body: { error: message } };
  }
}

export function parseProofreadBody(raw: unknown): {
  text: string;
  apiKey: string;
  model: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  return {
    text: typeof record.text === "string" ? record.text.trim() : "",
    apiKey: typeof record.apiKey === "string" ? record.apiKey.trim() : "",
    model: typeof record.model === "string" ? record.model.trim() : "",
  };
}
