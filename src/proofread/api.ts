import type { Finding } from "./types";

export async function pruefenKapitel(text: string): Promise<Finding[]> {
  const response = await fetch("/api/pruefen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const payload = (await response.json()) as {
    error?: string;
    findings?: Finding[];
  };
  if (!response.ok) {
    throw new Error(payload.error || "Die Prüfung ist fehlgeschlagen.");
  }
  return payload.findings ?? [];
}
