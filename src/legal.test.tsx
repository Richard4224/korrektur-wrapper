import { describe, expect, it } from "vitest";
import {
  OPERATOR_EMAIL,
  OPERATOR_NAME,
  legalPageFromHash,
} from "./legal";
import { LegalPages } from "./LegalPages";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("legalPageFromHash", () => {
  it("erkennt die drei rechtlichen Seiten", () => {
    expect(legalPageFromHash("#impressum")).toBe("impressum");
    expect(legalPageFromHash("#/datenschutz")).toBe("datenschutz");
    expect(legalPageFromHash("#nutzung")).toBe("nutzung");
    expect(legalPageFromHash("")).toBeNull();
    expect(legalPageFromHash("#foo")).toBeNull();
  });
});

describe("LegalPages", () => {
  it("nennt Anbieter, eigenen Schlüssel, OpenAI-Kosten und KI-Fehler", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    act(() => {
      root.render(<LegalPages page="impressum" />);
    });
    expect(container.textContent).toContain(OPERATOR_NAME);
    expect(container.textContent).toContain(OPERATOR_EMAIL);

    act(() => {
      root.render(<LegalPages page="nutzung" />);
    });
    const nutzung = container.textContent ?? "";
    expect(nutzung).toMatch(/eigenen API-Schlüssel/i);
    expect(nutzung).toMatch(/OpenAI/);
    expect(nutzung).toMatch(/Kosten/);
    expect(nutzung).toMatch(/Fehler/);

    act(() => {
      root.render(<LegalPages page="datenschutz" />);
    });
    expect(container.textContent).toMatch(/OpenAI/);
    expect(container.textContent).toMatch(/localStorage|Browser/);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
