import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChapterView } from "./ChapterView";
import { ReviewBar, ReviewFloat, UndoButton } from "./ReviewBar";
import { ApiKeyPanel } from "./ApiKeyPanel";
import { ModelSelect } from "./ModelSelect";
import { applyParagraphTexts, applyReplacements } from "./docx/applyReplacement";
import { normalizeEditableText } from "./docx/editableText";
import {
  bytesWithDocumentXml,
  downloadDocx,
  loadDocxFile,
  pickDocxFile,
  type LoadedDoc,
} from "./docx/loadDocx";
import {
  blockIndexAtOffset,
  parseDocumentXml,
  plainText,
} from "./docx/parseDocument";
import { locateQuote } from "./docx/locateQuote";
import { pruefenKapitel } from "./proofread/api";
import { loadApiKey } from "./proofread/apiKey";
import { loadModel, saveModel } from "./proofread/models";
import {
  correctionMarks,
  replacementsFromDecisions,
  skippedMarks,
  type Decision,
} from "./proofread/decisions";
import type { Finding } from "./proofread/types";
import { LegalPages, SiteFooter, useLegalPage } from "./LegalPages";
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
  const [model, setModel] = useState(() => loadModel());
  const paperRef = useRef<HTMLElement>(null);
  const legalPage = useLegalPage();
  const [reviewTop, setReviewTop] = useState(0);
  const [reviewLeft, setReviewLeft] = useState(16);
  const [paragraphEdits, setParagraphEdits] = useState<Record<number, string>>(
    {},
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const paragraphEditsRef = useRef(paragraphEdits);
  paragraphEditsRef.current = paragraphEdits;
  const editingIndexRef = useRef(editingIndex);
  editingIndexRef.current = editingIndex;

  const currentIndex = decisions.length;
  const currentFinding = findings[currentIndex] ?? null;
  const reviewDone = findings.length > 0 && currentIndex >= findings.length;
  const remainingFindings = findings.slice(currentIndex);

  const preview = useMemo(() => {
    if (!doc) return null;
    const xml = applyParagraphTexts(
      applyReplacements(
        doc.xml,
        replacementsFromDecisions(findings, decisions),
      ),
      paragraphEdits,
    );
    const blocks = parseDocumentXml(xml);
    return { xml, blocks, text: plainText(blocks) };
  }, [doc, findings, decisions, paragraphEdits]);

  const corrected = correctionMarks(findings, decisions);
  const skipped = skippedMarks(findings, decisions);

  function resetReview() {
    setFindings([]);
    setDecisions([]);
    setStatus(null);
  }

  function readLiveParagraphEdits(): Record<number, string> {
    const next = { ...paragraphEditsRef.current };
    const index = editingIndexRef.current;
    if (index === null) return next;
    const element = document.querySelector(`[data-block-index="${index}"]`);
    if (!(element instanceof HTMLElement)) return next;
    const text = normalizeEditableText(element.textContent ?? "");
    if (text) next[index] = text;
    else delete next[index];
    return next;
  }

  function commitParagraph(index: number, text: string) {
    setParagraphEdits((prev) => {
      if (!text) {
        if (!(index in prev)) return prev;
        const cleared = { ...prev };
        delete cleared[index];
        return cleared;
      }
      if (prev[index] === text) return prev;
      return { ...prev, [index]: text };
    });
  }

  function clearEditForFinding(finding: Finding) {
    if (!preview) return;
    const located = locateQuote(
      preview.text,
      finding.quote,
      finding.prefix,
      finding.suffix,
    );
    if (!located) return;
    const blockIndex = blockIndexAtOffset(preview.blocks, located.start);
    if (blockIndex === null) return;
    setParagraphEdits((prev) => {
      if (!(blockIndex in prev)) return prev;
      const next = { ...prev };
      delete next[blockIndex];
      return next;
    });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    resetReview();
    setParagraphEdits({});
    setEditingIndex(null);
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

  useLayoutEffect(() => {
    if (!currentFinding) return;
    const mark = document.getElementById("finding-current");
    if (mark) mark.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentFinding]);

  useLayoutEffect(() => {
    if (!currentFinding) return;
    function placeCard() {
      const mark = document.getElementById("finding-current");
      const paper = paperRef.current;
      if (!mark || !paper) return;
      const markRect = mark.getBoundingClientRect();
      const paperRect = paper.getBoundingClientRect();
      setReviewTop(markRect.bottom + 10);
      setReviewLeft(Math.max(8, paperRect.left + 16));
    }
    placeCard();
    window.addEventListener("scroll", placeCard, true);
    window.addEventListener("resize", placeCard);
    return () => {
      window.removeEventListener("scroll", placeCard, true);
      window.removeEventListener("resize", placeCard);
    };
  }, [currentFinding, preview?.text]);

  async function onPruefen() {
    if (!doc) return;
    setBusy(true);
    setError(null);
    setStatus("Die KI liest das Kapitel. Das kann eine Weile dauern.");
    setFindings([]);
    setDecisions([]);
    try {
      const edits = readLiveParagraphEdits();
      setParagraphEdits(edits);
      const xml = applyParagraphTexts(doc.xml, edits);
      const next = await pruefenKapitel(
        plainText(parseDocumentXml(xml)),
        apiKey,
        model,
      );
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
      const edits = readLiveParagraphEdits();
      setParagraphEdits(edits);
      const xml = applyParagraphTexts(
        applyReplacements(
          doc.xml,
          replacementsFromDecisions(findings, decisions),
        ),
        edits,
      );
      const bytes = await bytesWithDocumentXml(doc.bytes, xml);
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

  if (legalPage) {
    return (
      <div className="page">
        <LegalPages page={legalPage} />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="page">
      {dragging && (
        <div className="drop-overlay">Datei hier ablegen</div>
      )}
      <header className="top">
        <h1>Korrektur Wrapper</h1>
        <p className="lead">
          Kapitel öffnen, prüfen, Stelle für Stelle entscheiden. Vor dem
          Speichern kannst du den Text noch anklicken und selbst tippen.
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
        <ApiKeyPanel apiKey={apiKey} onSaved={setApiKey} />
        <ModelSelect
          model={model}
          onChange={(value) => {
            saveModel(value);
            setModel(value);
          }}
        />
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

      {reviewDone && (
        <p className="done">
          <span>
            Alle Stellen sind durch. Du kannst den Text noch selbst ändern,
            dann über „Speichern unter“ ablegen — das Original bleibt.
          </span>
          <UndoButton
            disabled={busy || decisions.length === 0}
            onClick={() => setDecisions((prev) => prev.slice(0, -1))}
          />
        </p>
      )}

      <main
        className={currentFinding ? "paper paper-reviewing" : "paper"}
        ref={paperRef}
        lang="de"
        aria-live="polite"
      >
        {!doc && (
          <p className="empty">
            Noch keine Datei. Über „Datei öffnen“ eine .docx wählen oder die
            Datei ins Fenster ziehen.
          </p>
        )}
        {doc && preview && (
          <ChapterView
            blocks={preview.blocks}
            fullText={preview.text}
            findings={remainingFindings}
            corrected={corrected}
            skipped={skipped}
            currentId={currentFinding?.id ?? null}
            editable={!busy}
            editingIndex={editingIndex}
            onEditingChange={setEditingIndex}
            onCommit={commitParagraph}
          />
        )}
        {currentFinding && (
          <ReviewFloat top={reviewTop} left={reviewLeft} resetKey={currentFinding.id}>
            <ReviewBar
              finding={currentFinding}
              index={currentIndex}
              total={findings.length}
              canGoBack={decisions.length > 0}
              onBack={() => setDecisions((prev) => prev.slice(0, -1))}
              onReplace={(value) => {
                clearEditForFinding(currentFinding);
                setDecisions((prev) => [
                  ...prev,
                  { findingId: currentFinding.id, kind: "replace", value },
                ]);
              }}
              onKeep={() => {
                clearEditForFinding(currentFinding);
                setDecisions((prev) => [
                  ...prev,
                  { findingId: currentFinding.id, kind: "keep" },
                ]);
              }}
              onSkip={() => {
                clearEditForFinding(currentFinding);
                setDecisions((prev) => [
                  ...prev,
                  { findingId: currentFinding.id, kind: "skip" },
                ]);
              }}
            />
          </ReviewFloat>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
