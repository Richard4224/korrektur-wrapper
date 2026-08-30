import { useRef, useState } from "react";
import { ChapterView } from "./ChapterView";
import { ReviewBar } from "./ReviewBar";
import { applyReplacements } from "./docx/applyReplacement";
import {
  bytesWithDocumentXml,
  documentXmlFromBytes,
  downloadDocx,
  loadDocxFile,
  type LoadedDoc,
} from "./docx/loadDocx";
import { plainText } from "./docx/parseDocument";
import { pruefenKapitel } from "./proofread/api";
import type { Finding } from "./proofread/types";
import "./App.css";

type Decision = {
  findingId: string;
  kind: "replace" | "keep";
  value?: string;
};

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<LoadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);

  const currentIndex = decisions.length;
  const currentFinding = findings[currentIndex] ?? null;
  const reviewDone = findings.length > 0 && currentIndex >= findings.length;
  const fullText = doc ? plainText(doc.blocks) : "";

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

  async function onPruefen() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    setStatus("Die KI liest das Kapitel. Das kann eine Weile dauern.");
    setFindings([]);
    setDecisions([]);
    try {
      const next = await pruefenKapitel(plainText(doc.blocks));
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
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      const xml = await documentXmlFromBytes(doc.bytes);
      const replaced = applyReplacements(
        xml,
        decisions
          .filter((decision) => decision.kind === "replace" && decision.value)
          .map((decision) => {
            const finding = findings.find(
              (item) => item.id === decision.findingId,
            );
            return {
              quote: finding?.quote ?? "",
              replacement: decision.value ?? "",
              prefix: finding?.prefix ?? "",
              suffix: finding?.suffix ?? "",
            };
          })
          .filter((item) => item.quote && item.replacement),
      );
      const bytes = await bytesWithDocumentXml(doc.bytes, replaced);
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
        </div>
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
          canGoBack={currentIndex > 0}
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
          onBack={() => setDecisions((prev) => prev.slice(0, -1))}
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
            Noch keine Datei. Über „Datei öffnen“ eine .docx wählen — zum
            Testen eignet sich Novemberlicht.
          </p>
        )}
        {doc && (
          <ChapterView
            blocks={doc.blocks}
            fullText={fullText}
            findings={findings}
            currentId={currentFinding?.id ?? null}
          />
        )}
      </main>
    </div>
  );
}
