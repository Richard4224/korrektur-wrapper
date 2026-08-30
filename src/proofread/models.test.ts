import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_MODEL, loadModel, modelAllowsTemperature, sanitizeModel, saveModel } from "./models";

describe("models", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("lässt nur einfache Modellnamen zu", () => {
    expect(sanitizeModel("gpt-4o")).toBe("gpt-4o");
    expect(sanitizeModel("gpt-4.1-mini")).toBe("gpt-4.1-mini");
    expect(sanitizeModel("evil model; drop")).toBe(DEFAULT_MODEL);
  });

  it("setzt temperature nur bei Modellen, die das erlauben", () => {
    expect(modelAllowsTemperature("gpt-4o")).toBe(true);
    expect(modelAllowsTemperature("gpt-5")).toBe(false);
    expect(modelAllowsTemperature("gpt-5-mini")).toBe(false);
    expect(modelAllowsTemperature("o4-mini")).toBe(false);
  });

  it("merkt die Auswahl lokal", () => {
    saveModel("gpt-4o-mini");
    expect(loadModel()).toBe("gpt-4o-mini");
  });
});
