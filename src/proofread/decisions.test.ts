import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyReplacements } from "../docx/applyReplacement";
import { documentXmlFromBytes } from "../docx/loadDocx";
import { parseDocumentXml, plainText } from "../docx/parseDocument";
import {
  lastReplacementMark,
  replacementsFromDecisions,
} from "./decisions";
import type { Finding } from "./types";

const fixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test_material/Novemberlicht.docx",
);

const findings: Finding[] = [
  {
    id: "f1",
    quote: "Fenser",
    prefix: "aus dem ",
    suffix: " gschaut",
    reason: "Tippfehler",
    suggestions: ["Fenster"],
  },
];

describe("replacementsFromDecisions", () => {
  it("übernimmt nur angenommene Korrekturen", () => {
    expect(
      replacementsFromDecisions(findings, [
        { findingId: "f1", kind: "replace", value: "Fenster" },
        { findingId: "f2", kind: "keep" },
      ]),
    ).toEqual([
      {
        quote: "Fenser",
        replacement: "Fenster",
        prefix: "aus dem ",
        suffix: " gschaut",
      },
    ]);
  });

  it("zeigt die letzte Korrektur in der Vorschau anstelle des Fehlers", async () => {
    const xml = await documentXmlFromBytes(new Uint8Array(readFileSync(fixture)));
    const preview = parseDocumentXml(
      applyReplacements(xml, replacementsFromDecisions(findings, [
        { findingId: "f1", kind: "replace", value: "Fenster" },
      ])),
    );
    const text = plainText(preview);
    expect(text).toContain("aus dem Fenster gschaut");
    expect(text).not.toContain("Fenser");
    expect(lastReplacementMark(findings, [
      { findingId: "f1", kind: "replace", value: "Fenster" },
    ])?.quote).toBe("Fenster");
  });
});
