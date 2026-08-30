import type { XmlReplacement } from "../docx/applyReplacement";
import type { Finding } from "./types";

export type Decision = {
  findingId: string;
  kind: "replace" | "keep" | "skip";
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

export function correctionMarks(
  findings: Finding[],
  decisions: Decision[],
): Finding[] {
  const marks: Finding[] = [];
  for (const decision of decisions) {
    if (decision.kind !== "replace" || !decision.value) continue;
    const finding = findings.find((item) => item.id === decision.findingId);
    if (!finding) continue;
    marks.push({
      ...finding,
      id: `corrected-${finding.id}`,
      quote: decision.value,
    });
  }
  return marks;
}

export function skippedMarks(
  findings: Finding[],
  decisions: Decision[],
): Finding[] {
  const marks: Finding[] = [];
  for (const decision of decisions) {
    if (decision.kind !== "skip") continue;
    const finding = findings.find((item) => item.id === decision.findingId);
    if (!finding) continue;
    marks.push({
      ...finding,
      id: `skipped-${finding.id}`,
    });
  }
  return marks;
}
