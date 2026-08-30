import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { copyFileName, loadDocxFromBytes } from "./loadDocx";
import { parseDocumentXml, plainText } from "./parseDocument";

const fixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test_material/Novemberlicht.docx",
);

describe("Novemberlicht.docx", () => {
  it("liest Titel, Dialekt, Kursiv und eingebaute Fehler", async () => {
    const bytes = new Uint8Array(readFileSync(fixture));
    const doc = await loadDocxFromBytes(bytes, "Novemberlicht.docx");
    const text = plainText(doc.blocks);

    expect(text).toContain("Novemberlicht");
    expect(text).toContain("Wartehäusl");
    expect(text).toContain("Fenser");
    expect(text).toContain("das es ein Fehler war");

    const italic = doc.blocks
      .flatMap((block) => block.runs)
      .filter((run) => run.italic)
      .map((run) => run.text.trim());

    expect(italic).toEqual(
      expect.arrayContaining([
        "Zniachtl",
        "saudade",
        "déjà-vu",
        "fensterln",
        "hiraeth",
        "dolce far niente",
      ]),
    );

    const headings = doc.blocks
      .filter((block) => block.kind === "heading")
      .map((block) => block.runs.map((run) => run.text).join(""));
    expect(headings).toContain("I. Ankunft");
    expect(headings).toContain("V. Abschied, oder vielleicht auch net");
  });

  it("speichert unter einem neuen Dateinamen, Original bleibt", () => {
    expect(copyFileName("Novemberlicht.docx")).toBe("Novemberlicht_kopie.docx");
  });

  it("lehnt kaputtes XML ab", () => {
    expect(() => parseDocumentXml("<not-xml")).toThrow(/nicht gelesen/);
  });
});
