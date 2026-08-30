import { useEffect, useState } from "react";
import type { Finding } from "./proofread/types";

export function ReviewBar({
  finding,
  index,
  total,
  onReplace,
  onKeep,
  onSkip,
}: {
  finding: Finding;
  index: number;
  total: number;
  onReplace: (value: string) => void;
  onKeep: () => void;
  onSkip: () => void;
}) {
  const [custom, setCustom] = useState("");

  useEffect(() => {
    setCustom("");
  }, [finding.id]);

  return (
    <section className="review" aria-live="polite">
      <p className="review-progress">
        Stelle {index + 1} von {total}
      </p>
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
