import type { XmlReplacement } from "../docx/applyReplacement";
import type { Finding } from "./types";

export type Decision = {
  findingId: string;
  kind: "replace" | "keep";
  value?: string;
};

export function replacementsFromDecisions(
  findings: Finding[],
  decisions: Decision[],
): XmlReplacement[] {
  return decisions
    .filter((decision) => decision.kind === "replace" && decision.value)
    .map((decision) => {
      const finding = findings.find((item) => item.id === decision.findingId);
      return {
        quote: finding?.quote ?? "",
        replacement: decision.value ?? "",
        prefix: finding?.prefix ?? "",
        suffix: finding?.suffix ?? "",
      };
    })
    .filter((item) => item.quote && item.replacement);
}

export function lastReplacementMark(
  findings: Finding[],
  decisions: Decision[],
): Finding | null {
  const last = [...decisions]
    .reverse()
    .find((decision) => decision.kind === "replace" && decision.value);
  if (!last?.value) return null;
  const finding = findings.find((item) => item.id === last.findingId);
  if (!finding) return null;
  return {
    ...finding,
    id: "corrected",
    quote: last.value,
  };
}
