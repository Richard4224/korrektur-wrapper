import { useEffect, useState } from "react";
import type { Finding } from "./proofread/types";

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
