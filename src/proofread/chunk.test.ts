import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("hält Absätze zusammen und teilt lange Kapitel", () => {
    const chunks = chunkText("eins\nzwei\ndrei", 8);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("\n")).toContain("eins");
    expect(chunks.join("\n")).toContain("drei");
  });
});
