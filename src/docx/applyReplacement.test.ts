import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  applyReplacement,
  applyReplacements,
  expandReplacementRange,
  plainTextFromDocumentXml,
} from "./applyReplacement";
import { documentXmlFromBytes } from "./loadDocx";
import { locateQuote } from "./locateQuote";
import { parseDocumentXml, plainText } from "./parseDocument";

const fixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../test_material/Novemberlicht.docx",
);

async function novemberlichtXml(): Promise<string> {
  const bytes = new Uint8Array(readFileSync(fixture));
  return documentXmlFromBytes(bytes);
}

describe("expandReplacementRange", () => {
  it("zieht den Artikel vor das Nomen, wenn der Vorschlag ihn schon enthält", () => {
    const haystack = "nur ein Spiel, ein Mutprobe, kein Romanze.";
    const start = haystack.indexOf("Mutprobe");
    expect(
      expandReplacementRange(
        haystack,
        { start, end: start + "Mutprobe".length },
        "Mutprobe",
        "eine Mutprobe",
      ),
    ).toEqual({
      start: haystack.indexOf("ein Mutprobe"),
      end: start + "Mutprobe".length,
    });
  });

  it("lässt normale Wort-für-Wort-Korrekturen unverändert", () => {
    const haystack = "aus dem Fenser gschaut";
    const start = haystack.indexOf("Fenser");
    const located = { start, end: start + "Fenser".length };
    expect(
      expandReplacementRange(haystack, located, "Fenser", "Fenster"),
    ).toEqual(located);
  });
});

describe("locateQuote", () => {
  it("findet Fenser über den Kontext", () => {
    const text = "aus dem Fenser gschaut. Die Wiesen";
    expect(locateQuote(text, "Fenser", "aus dem ", " gschaut")).toEqual({
      start: 8,
      end: 14,
    });
  });
});

describe("Novemberlicht ersetzen", () => {
  it("stimmt mit dem Parser-Klartext überein", async () => {
    const xml = await novemberlichtXml();
    const fromXml = plainTextFromDocumentXml(xml);
    const fromParser = plainText(parseDocumentXml(xml));
    expect(fromXml).toBe(fromParser);
  });

  it("ersetzt Fenser, lässt Kursiv bei Zniachtl unangetastet", async () => {
    const xml = await novemberlichtXml();
    const next = applyReplacement(
      xml,
      "Fenser",
      "Fenster",
      "aus dem ",
      " gschaut",
    );
    const text = plainTextFromDocumentXml(next);
    expect(text).toContain("aus dem Fenster gschaut");
    expect(text).not.toContain("Fenser");
    expect(next).toContain("Zniachtl");
    expect(next).toMatch(/<w:i\/>[\s\S]{0,180}Zniachtl/);
    expect(next).toContain('w:val="Heading1"');
  });

  it("nimmt das alte ein mit, wenn die Korrektur eine Mutprobe lautet", async () => {
    const xml = await novemberlichtXml();
    const next = applyReplacement(
      xml,
      "Mutprobe",
      "eine Mutprobe",
      "ein Spiel, ein ",
      ", kein",
    );
    const text = plainTextFromDocumentXml(next);
    expect(text).toContain("ein Spiel, eine Mutprobe");
    expect(text).not.toContain("ein eine Mutprobe");
    expect(text).not.toMatch(/ein Mutprobe/);
  });

  it("nimmt kein mit, wenn die Korrektur keine Romanze lautet", async () => {
    const xml = await novemberlichtXml();
    const next = applyReplacement(
      xml,
      "Romanze",
      "keine Romanze",
      "Mutprobe, kein ",
      ".",
    );
    const text = plainTextFromDocumentXml(next);
    expect(text).toContain("keine Romanze");
    expect(text).not.toContain("kein keine Romanze");
    expect(text).not.toMatch(/kein Romanze/);
  });

  it("unterscheidet zwei das-Stellen über den Kontext", async () => {
    const xml = await novemberlichtXml();
    const next = applyReplacements(xml, [
      {
        quote: "das",
        replacement: "dass",
        prefix: "gewusst, ",
        suffix: " es ein Fehler",
      },
      {
        quote: "das",
        replacement: "dass",
        prefix: "festgschnürt hab, ",
        suffix: " ich",
      },
    ]);
    const text = plainTextFromDocumentXml(next);
    expect(text).toContain("gewusst, dass es ein Fehler war");
    expect(text).toContain("festgschnürt hab, dass ich");
  });

  it("bleibt nach dem Packen als docx lesbar", async () => {
    const bytes = new Uint8Array(readFileSync(fixture));
    const xml = await documentXmlFromBytes(bytes);
    const nextXml = applyReplacement(
      xml,
      "Fenser",
      "Fenster",
      "aus dem ",
      " gschaut",
    );
    const zip = await JSZip.loadAsync(bytes);
    zip.file("word/document.xml", nextXml);
    const packed = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const roundTrip = await documentXmlFromBytes(packed);
    expect(plainTextFromDocumentXml(roundTrip)).toContain("Fenster");
  });
});
