import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ChapterView } from "./ChapterView";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("ChapterView tippen", () => {
  it("gibt den geänderten Absatz beim Verlassen weiter", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const commits: { index: number; text: string }[] = [];

    await act(async () => {
      root?.render(
        <ChapterView
          blocks={[
            {
              kind: "paragraph",
              runs: [{ text: "Hallo Welt", italic: false, bold: false }],
            },
          ]}
          fullText="Hallo Welt"
          findings={[]}
          corrected={[]}
          skipped={[]}
          currentId={null}
          editable
          editingIndex={null}
          onEditingChange={() => undefined}
          onCommit={(index, text) => {
            commits.push({ index, text });
          }}
        />,
      );
    });

    const paragraph = container.querySelector(
      "[data-block-index='0']",
    ) as HTMLElement;
    expect(paragraph.getAttribute("contenteditable")).toBe("true");

    await act(async () => {
      paragraph.focus();
      paragraph.textContent = "Hallo Wält";
      paragraph.blur();
    });

    expect(commits).toEqual([{ index: 0, text: "Hallo Wält" }]);
  });
});
