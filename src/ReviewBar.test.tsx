import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { clampReviewShift, ReviewFloat } from "./ReviewBar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("clampReviewShift", () => {
  it("lässt Platz zum Beiseiteschieben und hält das Fenster im Blatt", () => {
    expect(
      clampReviewShift(
        { x: 400, y: -20 },
        { width: 320, height: 200 },
        { width: 800, height: 600 },
        { left: 16, top: 80 },
      ),
    ).toEqual({ x: 400, y: -20 });

    expect(
      clampReviewShift(
        { x: 900, y: 900 },
        { width: 320, height: 200 },
        { width: 800, height: 600 },
        { left: 16, top: 80 },
      ),
    ).toEqual({ x: 456, y: 312 });
  });

  it("hält ein zu großes Fenster mittig im Blatt", () => {
    expect(
      clampReviewShift(
        { x: 50, y: 50 },
        { width: 900, height: 700 },
        { width: 800, height: 600 },
        { left: 0, top: 0 },
      ),
    ).toEqual({ x: -50, y: -50 });
  });
});

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

describe("ReviewFloat", () => {
  it("folgt der Maus, wenn man an der Leiste zieht", async () => {
    if (typeof PointerEvent === "undefined") {
      globalThis.PointerEvent = class PointerEvent extends MouseEvent {
        pointerId: number;
        constructor(
          type: string,
          init: MouseEventInit & { pointerId?: number } = {},
        ) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
        }
      } as typeof PointerEvent;
    }
    const proto = HTMLElement.prototype as HTMLElement & {
      setPointerCapture?: (id: number) => void;
      releasePointerCapture?: (id: number) => void;
      hasPointerCapture?: (id: number) => boolean;
    };
    proto.setPointerCapture ??= () => undefined;
    proto.releasePointerCapture ??= () => undefined;
    proto.hasPointerCapture ??= () => false;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ReviewFloat top={40}>
          <div className="review-drag">Zur Seite ziehen</div>
        </ReviewFloat>,
      );
    });

    const box = container.querySelector(".review-float") as HTMLElement;
    const handle = container.querySelector(".review-drag") as HTMLElement;
    expect(box.style.transform).toBe("translate(0px, 0px)");

    await act(async () => {
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          pointerId: 1,
          clientX: 100,
          clientY: 80,
        }),
      );
      box.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerId: 1,
          clientX: 160,
          clientY: 110,
        }),
      );
    });

    expect(box.style.transform).toBe("translate(60px, 30px)");
  });

  it("setzt die Verschiebung zurück, wenn die nächste Stelle kommt", async () => {
    if (typeof PointerEvent === "undefined") {
      globalThis.PointerEvent = class PointerEvent extends MouseEvent {
        pointerId: number;
        constructor(
          type: string,
          init: MouseEventInit & { pointerId?: number } = {},
        ) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
        }
      } as typeof PointerEvent;
    }
    const proto = HTMLElement.prototype as HTMLElement & {
      setPointerCapture?: (id: number) => void;
      releasePointerCapture?: (id: number) => void;
      hasPointerCapture?: (id: number) => boolean;
    };
    proto.setPointerCapture ??= () => undefined;
    proto.releasePointerCapture ??= () => undefined;
    proto.hasPointerCapture ??= () => false;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(
        <ReviewFloat top={40} resetKey="f1">
          <div className="review-drag">Zur Seite ziehen</div>
        </ReviewFloat>,
      );
    });

    const handle = container.querySelector(".review-drag") as HTMLElement;
    const box = () => container?.querySelector(".review-float") as HTMLElement;

    await act(async () => {
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          pointerId: 1,
          clientX: 100,
          clientY: 80,
        }),
      );
      box().dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerId: 1,
          clientX: 160,
          clientY: 110,
        }),
      );
    });
    expect(box().style.transform).toBe("translate(60px, 30px)");

    await act(async () => {
      root?.render(
        <ReviewFloat top={120} resetKey="f2">
          <div className="review-drag">Zur Seite ziehen</div>
        </ReviewFloat>,
      );
    });
    expect(box().style.transform).toBe("translate(0px, 0px)");
  });
});
