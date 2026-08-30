import { describe, expect, it } from "vitest";
import { normalizeFindings } from "./normalize";

describe("normalizeFindings", () => {
  it("nimmt drei verschiedene Vorschläge und verwirft die Fundstelle selbst", () => {
    const findings = normalizeFindings({
      findings: [
        {
          quote: " Fenser ",
          prefix: "aus dem ",
          suffix: " gschaut",
          reason: "Tippfehler",
          suggestions: ["Fenster", "Fenser", "Fensters", "Fensterbrett", "Haus"],
        },
      ],
    });
    expect(findings).toEqual([
      {
        id: "f1",
        quote: "Fenser",
        prefix: "aus dem ",
        suffix: " gschaut",
        reason: "Tippfehler",
        suggestions: ["Fenster", "Fensters", "Fensterbrett"],
      },
    ]);
  });

  it("wirft Selbsttreffer wie Waliser→Waliser weg", () => {
    const findings = normalizeFindings(
      {
        findings: [
          {
            quote: "Waliser",
            prefix: "Die ",
            suffix: " nennen",
            reason: "Wahrscheinlich Tippfehler für Waliser",
            suggestions: ["Walisischen", "Waleser"],
          },
        ],
      },
      "Die Waliser nennen das hiraeth.",
    );
    expect(findings).toEqual([]);
  });
});
