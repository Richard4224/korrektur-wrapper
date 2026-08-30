import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Finding } from "./proofread/types";

export function clampReviewShift(
  shift: { x: number; y: number },
  card: { width: number; height: number },
  paper: { width: number; height: number },
  base: { left: number; top: number },
  margin = 8,
): { x: number; y: number } {
  const minX = margin - base.left;
  const maxX = paper.width - margin - card.width - base.left;
  const minY = margin - base.top;
  const maxY = paper.height - margin - card.height - base.top;
  return {
    x: clampNumber(shift.x, minX, maxX),
    y: clampNumber(shift.y, minY, maxY),
  };
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

export function ReviewFloat({
  top,
  resetKey,
  children,
}: {
  top: number;
  resetKey?: string;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    dragRef.current = null;
    setDragging(false);
    setShift({ x: 0, y: 0 });
  }, [resetKey]);

  function clamped(next: { x: number; y: number }) {
    const box = boxRef.current;
    const paper = box?.offsetParent;
    if (!(box instanceof HTMLElement) || !(paper instanceof HTMLElement)) {
      return next;
    }
    return clampReviewShift(
      next,
      { width: box.offsetWidth, height: box.offsetHeight },
      { width: paper.clientWidth, height: paper.clientHeight },
      { left: box.offsetLeft, top: box.offsetTop },
    );
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest(".review-drag")) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: shift.x,
      originY: shift.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    setShift(
      clamped({
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      }),
    );
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      ref={boxRef}
      className={dragging ? "review-float is-dragging" : "review-float"}
      style={{
        top,
        transform: `translate(${shift.x}px, ${shift.y}px)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(event) => {
        if (!(event.target instanceof Element)) return;
        if (!event.target.closest(".review-drag")) return;
        setShift({ x: 0, y: 0 });
      }}
    >
      {children}
    </div>
  );
}

export function UndoButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="undo-btn"
      disabled={disabled}
      onClick={onClick}
      aria-label="Letzte Entscheidung rückgängig machen"
      title="Zurück"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9.2 5.15A8.1 8.1 0 1 1 4.9 9.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.35"
          strokeLinecap="round"
        />
        <path
          d="M9.35 2.7 5.4 5.35l3.7 3.05"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function ReviewBar({
  finding,
  index,
  total,
  onReplace,
  onKeep,
  onSkip,
  onBack,
  canGoBack,
}: {
  finding: Finding;
  index: number;
  total: number;
  onReplace: (value: string) => void;
  onKeep: () => void;
  onSkip: () => void;
  onBack: () => void;
  canGoBack: boolean;
}) {
  const [custom, setCustom] = useState("");

  useEffect(() => {
    setCustom("");
  }, [finding.id]);

  return (
    <section className="review" aria-live="polite">
      <div
        className="review-drag"
        role="group"
        aria-label="Zur Seite ziehen"
        title="Anfassen und zur Seite ziehen. Doppelklick setzt es zurück."
      >
        <span className="review-drag-grip" aria-hidden="true" />
        Zur Seite ziehen
      </div>
      <div className="review-head">
        <p className="review-progress">
          Stelle {index + 1} von {total}
        </p>
        <UndoButton disabled={!canGoBack} onClick={onBack} />
      </div>
      <p className="review-quote">„{finding.quote}“</p>
      {finding.reason && <p className="review-reason">{finding.reason}</p>}
      <div className="actions">
        {finding.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="btn primary"
            onClick={() => onReplace(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div className="custom-row">
        <input
          className="custom-input"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Eigenes Wort"
          aria-label="Eigenes Wort"
        />
        <button
          type="button"
          className="btn"
          disabled={!custom.trim()}
          onClick={() => {
            onReplace(custom.trim());
            setCustom("");
          }}
        >
          Übernehmen
        </button>
      </div>
      <div className="actions">
        <button type="button" className="btn keep" onClick={onKeep}>
          Kein Fehler
        </button>
        <button type="button" className="btn skip" onClick={onSkip}>
          Überspringen
        </button>
      </div>
    </section>
  );
}
