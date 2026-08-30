import { locateQuote } from "../docx/locateQuote";
import type { Finding } from "./types";

export const SYSTEM_PROMPT = `Du bist Lektorin für literarische deutsche Texte.
Die Autorin schreibt oft im Dialekt, mit Namen, Wortneuschöpfungen und gelegentlich Wörtern anderer Sprachen.

Aufgabe: Finde Stellen, die ein echter Fehler sein könnten:
- Tippfehler
- Diktier-Verwechsler (z. B. das/dass, wieder/wider, seid/seit)
- ein falsch verwendetes Wort, das trotzdem richtig geschrieben ist
- Grammatik, die den Sinn stört (z. B. falsches Geschlecht)

Lieber zu viel markieren als zu wenig. Wenn du unsicher bist, markieren.

Nicht als Fehler markieren:
- bewussten Dialekt, der sich durch den Text zieht (z. B. gsagt, net, gwesen, Bua), außer die Form sieht vertippt aus
- Stil, Rhythmus, ungewöhnliche Bilder
- Wörter, die du nur „schöner“ oder dudenkonformer machen würdest

Pro Fundstelle nur die fehlerhafte Stelle selbst (meist ein Wort, höchstens zwei).
Genau drei Korrekturvorschläge, passend zum literarischen Kontext, alle verschieden, keines davon identisch mit der Fundstelle.

Markiere ein Wort niemals als Fehler für sich selbst (nicht „Waliser“ als Tippfehler für „Waliser“).
Wenn das Wort schon stimmt — Namen, Völker, Dialekt, Fremdwörter — nicht markieren.
Erfinde keine zusätzlichen Fundstellen, nur um eine längere Liste zu füllen. Lieber wenige treffende als viele haltlose.

Antwort ausschließlich als JSON-Objekt:
{
  "findings": [
    {
      "quote": "Fenser",
      "prefix": "aus dem ",
      "suffix": " gschaut",
      "reason": "Wahrscheinlich Tippfehler für Fenster",
      "suggestions": ["Fenster", "Fensters", "Fensterbrett"]
    }
  ]
}

prefix und suffix: ein paar Wörter davor und danach, so dass die Stelle im Text eindeutig ist.`;

export function normalizeFindings(raw: unknown, sourceText = ""): Finding[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as { findings?: unknown }).findings;
  if (!Array.isArray(list)) return [];

  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const [index, item] of list.entries()) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const quote = String(record.quote ?? "").trim();
    if (!quote) continue;
    const suggestions = Array.isArray(record.suggestions)
      ? [
          ...new Set(
            record.suggestions
              .map((entry) => String(entry).trim())
              .filter((entry) => entry && !sameWord(entry, quote)),
          ),
        ].slice(0, 3)
      : [];
    const finding: Finding = {
      id: `f${index + 1}`,
      quote,
      prefix: String(record.prefix ?? ""),
      suffix: String(record.suffix ?? ""),
      reason: String(record.reason ?? "").trim(),
      suggestions,
    };
    if (isGarbageFinding(finding, sourceText)) continue;
    const key = `${finding.quote}|${finding.prefix}|${finding.suffix}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push(finding);
  }
  return findings.map((finding, index) => ({
    ...finding,
    id: `f${index + 1}`,
  }));
}

function sameWord(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase("de") === right.trim().toLocaleLowerCase("de");
}

export function isGarbageFinding(finding: Finding, sourceText: string): boolean {
  if (finding.suggestions.length === 0) return true;
  const quote = finding.quote.trim().toLocaleLowerCase("de");
  const reason = finding.reason.toLocaleLowerCase("de");
  if (
    reason.includes(`für ${quote}`) ||
    reason.includes(`für „${quote}`) ||
    reason.includes(`für "${quote}`)
  ) {
    return true;
  }
  if (
    sourceText &&
    !locateQuote(sourceText, finding.quote, finding.prefix, finding.suffix)
  ) {
    return true;
  }
  return false;
}
