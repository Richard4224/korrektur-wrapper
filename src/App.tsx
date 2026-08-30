import { useEffect, useMemo, useRef, useState } from "react";
import { ChapterView } from "./ChapterView";
import { ReviewBar } from "./ReviewBar";
import { applyReplacements } from "./docx/applyReplacement";
import {
  bytesWithDocumentXml,
  downloadDocx,
  loadDocxFile,
  pickDocxFile,
  type LoadedDoc,
} from "./docx/loadDocx";
import { parseDocumentXml, plainText } from "./docx/parseDocument";
import { pruefenKapitel } from "./proofread/api";
import { loadApiKey, saveApiKey } from "./proofread/apiKey";
import {
  correctionMarks,
  replacementsFromDecisions,
  type Decision,
} from "./proofread/decisions";
import type { Finding } from "./proofread/types";
import "./App.css";

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<LoadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [dragging, setDragging] = useState(false);
  const [apiKey, setApiKey] = useState(() => loadApiKey());

  const currentIndex = decisions.length;
  const currentFinding = findings[currentIndex] ?? null;
  const reviewDone = findings.length > 0 && currentIndex >= findings.length;
  const remainingFindings = findings.slice(currentIndex);

  const preview = useMemo(() => {
    if (!doc) return null;
    const xml = applyReplacements(
      doc.xml,
      replacementsFromDecisions(findings, decisions),
    );
    const blocks = parseDocumentXml(xml);
    return { xml, blocks, text: plainText(blocks) };
  }, [doc, findings, decisions]);

  const corrected = correctionMarks(findings, decisions);

  function resetReview() {
    setFindings([]);
    setDecisions([]);
    setStatus(null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    resetReview();
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

  const onFileRef = useRef(onFile);
  onFileRef.current = onFile;

  useEffect(() => {
    let depth = 0;
    function hasFiles(event: DragEvent): boolean {
      return event.dataTransfer?.types.includes("Files") ?? false;
    }
    function onDragEnter(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    }
    function onDragOver(event: DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }
    function onDragLeave(event: DragEvent) {
      if (!hasFiles(event)) return;
      depth -= 1;
      if (depth <= 0) {
        depth = 0;
        setDragging(false);
      }
    }
    function onDrop(event: DragEvent) {
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const file = pickDocxFile(event.dataTransfer?.files);
      if (file) {
        void onFileRef.current(file);
        return;
      }
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        setError("Bitte eine Word-Datei mit der Endung .docx ablegen.");
      }
    }
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  async function onPruefen() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    setStatus("Die KI liest das Kapitel. Das kann eine Weile dauern.");
    setFindings([]);
    setDecisions([]);
    try {
      const next = await pruefenKapitel(plainText(doc.blocks), apiKey);
      setFindings(next);
      setStatus(
        next.length === 0
          ? "Keine möglichen Fehler gefunden."
          : `${next.length} mögliche Stellen gefunden.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Die Prüfung ist fehlgeschlagen.",
      );
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!doc || !preview) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await bytesWithDocumentXml(doc.bytes, preview.xml);
      downloadDocx(doc.fileName, bytes);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Die Datei konnte nicht gespeichert werden.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      {dragging && (
        <div className="drop-overlay">Datei hier ablegen</div>
      )}
      <header className="top">
        <h1>Korrektur Wrapper</h1>
        <p className="lead">
          Kapitel öffnen, prüfen, Stelle für Stelle entscheiden, dann speichern.
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
            className="btn primary"
            disabled={!doc || busy}
            onClick={() => void onPruefen()}
          >
            Kapitel prüfen
          </button>
          <button
            type="button"
            className="btn"
            disabled={!doc || busy}
            onClick={() => void onSave()}
          >
            Speichern unter
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy || decisions.length === 0}
            onClick={() => setDecisions((prev) => prev.slice(0, -1))}
          >
            Zurück
          </button>
        </div>
        <label className="api-key">
          API-Schlüssel
          <input
            className="api-key-input"
            value={apiKey}
            autoComplete="off"
            spellCheck={false}
            placeholder="einfügen oder austauschen"
            onChange={(event) => {
              const value = event.target.value;
              setApiKey(value);
              saveApiKey(value.trim());
            }}
          />
        </label>
        <p className="api-hint">
          Zum Austauschen einfach überschreiben. Bleibt nur auf diesem Rechner.
        </p>
        <input
          ref={inputRef}
          className="file-hidden"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        {doc && <p className="file-name">Geöffnet: {doc.fileName}</p>}
        {status && <p className="status">{status}</p>}
        {error && <p className="error">{error}</p>}
      </header>

      {currentFinding && (
        <ReviewBar
          finding={currentFinding}
          index={currentIndex}
          total={findings.length}
          onReplace={(value) =>
            setDecisions((prev) => [
              ...prev,
              { findingId: currentFinding.id, kind: "replace", value },
            ])
          }
          onKeep={() =>
            setDecisions((prev) => [
              ...prev,
              { findingId: currentFinding.id, kind: "keep" },
            ])
          }
        />
      )}

      {reviewDone && (
        <p className="done">
          Alle Stellen sind durch. Über „Speichern unter“ die korrigierte Datei
          lokal ablegen — das Original bleibt.
        </p>
      )}

      <main className="paper" aria-live="polite">
        {!doc && (
          <p className="empty">
            Noch keine Datei. Über „Datei öffnen“ eine .docx wählen oder die
            Datei ins Fenster ziehen — zum Testen eignet sich Novemberlicht.
          </p>
        )}
        {doc && preview && (
          <ChapterView
            blocks={preview.blocks}
            fullText={preview.text}
            findings={remainingFindings}
            corrected={corrected}
            currentId={currentFinding?.id ?? null}
          />
        )}
      </main>
    </div>
  );
}
