import type { IncomingMessage, ServerResponse } from "node:http";
import { parseProofreadBody, runProofread } from "./runProofread";

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
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "Die Anfrage war unlesbar." });
    return;
  }
  const fields = parseProofreadBody(parsed);
  if (!fields) {
    sendJson(res, 400, { error: "Die Anfrage war unlesbar." });
    return;
  }
  const apiKey = fields.apiKey || env.OPENAI_API_KEY || "";
  const result = await runProofread(fields.text, apiKey, fields.model);
  sendJson(res, result.status, result.body);
}
