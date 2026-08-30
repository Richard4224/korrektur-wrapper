import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { copyFileName, loadDocxFromBytes, pickDocxFile } from "./loadDocx";
import { blockIndexAtOffset, parseDocumentXml, plainText } from "./parseDocument";

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

    const fenserAt = text.indexOf("Fenser");
    expect(blockIndexAtOffset(doc.blocks, fenserAt)).not.toBeNull();
    expect(
      doc.blocks[blockIndexAtOffset(doc.blocks, fenserAt) ?? -1].runs.some(
        (run) => run.text.includes("Fenser"),
      ),
    ).toBe(true);
  });

  it("speichert unter einem neuen Dateinamen, Original bleibt", () => {
    expect(copyFileName("Novemberlicht.docx")).toBe("Novemberlicht_kopie.docx");
  });

  it("nimmt aus mehreren Dateien die Word-Datei", () => {
    const files = [
      new File(["x"], "notiz.txt"),
      new File(["x"], "Novemberlicht.docx"),
    ];
    expect(pickDocxFile(files)?.name).toBe("Novemberlicht.docx");
    expect(pickDocxFile([new File(["x"], "foto.png")])).toBeUndefined();
  });

  it("lehnt kaputtes XML ab", () => {
    expect(() => parseDocumentXml("<not-xml")).toThrow(/nicht gelesen/);
  });
});
