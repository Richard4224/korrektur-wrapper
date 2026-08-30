import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_MODEL, loadModel, sanitizeModel, saveModel } from "./models";

describe("models", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("lässt nur einfache Modellnamen zu", () => {
    expect(sanitizeModel("gpt-4o")).toBe("gpt-4o");
    expect(sanitizeModel("gpt-4.1-mini")).toBe("gpt-4.1-mini");
    expect(sanitizeModel("evil model; drop")).toBe(DEFAULT_MODEL);
  });

  it("merkt die Auswahl lokal", () => {
    saveModel("gpt-4o-mini");
    expect(loadModel()).toBe("gpt-4o-mini");
  });
});
