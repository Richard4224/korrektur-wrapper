import { useRef, useState, type ReactNode } from "react";
import {
  downloadUnchangedCopy,
  loadDocxFile,
  type LoadedDoc,
} from "./docx/loadDocx";
import type { Block } from "./docx/parseDocument";
import "./App.css";

function BlockView({ block }: { block: Block }) {
  const Tag = block.kind === "heading" ? "h2" : "p";
  return (
    <Tag className={block.kind === "heading" ? "chapter-heading" : "chapter-p"}>
      {block.runs.map((run, index) => {
        let node: ReactNode = run.text;
        if (run.italic) node = <em>{node}</em>;
        if (run.bold) node = <strong>{node}</strong>;
        return <span key={index}>{node}</span>;
      })}
    </Tag>
  );
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<LoadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setDoc(await loadDocxFile(file));
    } catch (caught) {
      setDoc(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Die Datei konnte nicht geöffnet werden.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="page">
      <header className="top">
        <h1>Korrektur Wrapper</h1>
        <p className="lead">
          Kapitel als Word-Datei öffnen, durchlesen, später korrigieren.
        </p>
        <div className="actions">
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Datei öffnen
          </button>
          <button
            type="button"
            className="btn"
            disabled={!doc || busy}
            onClick={() => doc && downloadUnchangedCopy(doc)}
          >
            Speichern unter
          </button>
        </div>
        <input
          ref={inputRef}
          className="file-hidden"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        {doc && (
          <p className="file-name">Geöffnet: {doc.fileName}</p>
        )}
        {error && <p className="error">{error}</p>}
      </header>

      <main className="paper" aria-live="polite">
        {!doc && (
          <p className="empty">
            Noch keine Datei. Über „Datei öffnen“ eine .docx wählen — zum
            Testen eignet sich Novemberlicht.
          </p>
        )}
        {doc?.blocks.map((block, index) => (
          <BlockView key={index} block={block} />
        ))}
      </main>
    </div>
  );
}
