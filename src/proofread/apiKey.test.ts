import { afterEach, describe, expect, it } from "vitest";
import { loadApiKey, saveApiKey } from "./apiKey";

describe("apiKey storage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("merkt und überschreibt den Schlüssel lokal", () => {
    saveApiKey("sk-old");
    expect(loadApiKey()).toBe("sk-old");
    saveApiKey("sk-new");
    expect(loadApiKey()).toBe("sk-new");
    saveApiKey("");
    expect(loadApiKey()).toBe("");
  });
});
