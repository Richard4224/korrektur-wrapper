import { useState } from "react";
import { saveApiKey } from "./proofread/apiKey";

export function ApiKeyPanel({
  apiKey,
  onSaved,
}: {
  apiKey: string;
  onSaved: (value: string) => void;
}) {
  const hasKey = apiKey.trim().length > 0;
  const [editing, setEditing] = useState(!hasKey);
  const [draft, setDraft] = useState("");

  function save() {
    const value = draft.trim();
    if (!value) return;
    saveApiKey(value);
    onSaved(value);
    setDraft("");
    setEditing(false);
  }

  if (hasKey && !editing) {
    return (
      <div className="api-key">
        <p className="api-status">API-Schlüssel ist gespeichert.</p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setDraft("");
            setEditing(true);
          }}
        >
          Bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="api-key">
      <label className="api-key-label">
        API-Schlüssel
        <input
          className="api-key-input"
          value={draft}
          autoComplete="off"
          spellCheck={false}
          placeholder="neuen Schlüssel einfügen"
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <p className="hint">
        Eigenen OpenAI-Schlüssel verwenden. Kosten entstehen bei OpenAI. Die KI
        kann Fehler machen.{" "}
        <a href="#nutzung">Nutzung und Kosten</a>
      </p>
      <div className="actions">
        <button
          type="button"
          className="btn primary"
          disabled={!draft.trim()}
          onClick={save}
        >
          Speichern
        </button>
        {hasKey && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setDraft("");
              setEditing(false);
            }}
          >
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );
}
