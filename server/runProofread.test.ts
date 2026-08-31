import { describe, expect, it } from "vitest";
import { parseProofreadBody, runProofread } from "./runProofread";

describe("parseProofreadBody", () => {
  it("nimmt nur den mitgebrachten Schlüssel, keinen stillen Fallback", () => {
    expect(parseProofreadBody({ text: "Hallo", apiKey: " sk-test ", model: "gpt-4.1" })).toEqual({
      text: "Hallo",
      apiKey: "sk-test",
      model: "gpt-4.1",
    });
    expect(parseProofreadBody({ text: "Hallo" })).toEqual({
      text: "Hallo",
      apiKey: "",
      model: "",
    });
  });
});

describe("runProofread", () => {
  it("lehnt eine Prüfung ohne Schlüssel ab", async () => {
    const result = await runProofread("Ein Satz.", "", "gpt-4.1");
    expect(result.status).toBe(503);
    expect(result.body.error).toMatch(/API-Schlüssel/);
  });
});
