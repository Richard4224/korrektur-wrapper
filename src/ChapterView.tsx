import {
  memo,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Block, TextRun } from "./docx/parseDocument";
import { locateQuote } from "./docx/locateQuote";
import { normalizeEditableText } from "./docx/editableText";
import type { Finding } from "./proofread/types";

type Mark = {
  id: string;
  start: number;
  end: number;
  kind: "finding" | "corrected" | "skipped";
};

function marksInBlock(
  blockStart: number,
  blockLength: number,
  fullText: string,
  findings: Finding[],
  corrected: Finding[],
  skipped: Finding[],
): Mark[] {
  const blockEnd = blockStart + blockLength;
  const marks: Mark[] = [];
  const add = (finding: Finding, kind: Mark["kind"]) => {
    const located = locateQuote(
      fullText,
      finding.quote,
      finding.prefix,
      finding.suffix,
    );
    if (!located) return;
    if (located.end <= blockStart || located.start >= blockEnd) return;
    marks.push({
      id: finding.id,
      start: Math.max(0, located.start - blockStart),
      end: Math.min(blockLength, located.end - blockStart),
      kind,
    });
  };
  for (const item of skipped) add(item, "skipped");
  for (const item of corrected) add(item, "corrected");
  for (const finding of findings) add(finding, "finding");
  return marks;
}

function runSegments(
  run: TextRun,
  runStart: number,
  marks: Mark[],
): { text: string; mark: Mark | null }[] {
  const points = new Set([0, run.text.length]);
  for (const mark of marks) {
    const start = Math.max(0, mark.start - runStart);
    const end = Math.min(run.text.length, mark.end - runStart);
    if (start < end) {
      points.add(start);
      points.add(end);
    }
  }
  const cuts = [...points].sort((left, right) => left - right);
  const segments: { text: string; mark: Mark | null }[] = [];
  for (let index = 0; index < cuts.length - 1; index += 1) {
    const from = cuts[index];
    const to = cuts[index + 1];
    if (from === to) continue;
    const mark =
      marks.find(
        (item) => runStart + from >= item.start && runStart + from < item.end,
      ) ?? null;
    segments.push({
      text: run.text.slice(from, to),
      mark,
    });
  }
  return segments;
}

type BlockViewProps = {
  block: Block;
  blockStart: number;
  index: number;
  fullText: string;
  findings: Finding[];
  corrected: Finding[];
  skipped: Finding[];
  currentId: string | null;
  editable: boolean;
  isFrozen: boolean;
  onEditingChange: (index: number | null) => void;
  onCommit: (index: number, text: string) => void;
};

const BlockView = memo(function BlockView({
  block,
  blockStart,
  index,
  fullText,
  findings,
  corrected,
  skipped,
  currentId,
  editable,
  onEditingChange,
  onCommit,
}: BlockViewProps) {
  const Tag = block.kind === "heading" ? "h2" : "p";
  const blockText = block.runs.map((run) => run.text).join("");
  const marks = marksInBlock(
    blockStart,
    blockText.length,
    fullText,
    findings,
    corrected,
    skipped,
  );
  let runStart = 0;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter") event.preventDefault();
  }

  function onBeforeInput(event: FormEvent<HTMLElement>) {
    const type = (event.nativeEvent as InputEvent).inputType;
    if (type === "insertParagraph" || type === "insertLineBreak") {
      event.preventDefault();
    }
    if (type.startsWith("format")) event.preventDefault();
  }

  function onPaste(event: ClipboardEvent<HTMLElement>) {
    event.preventDefault();
    const pasted = normalizeEditableText(
      event.clipboardData.getData("text/plain"),
    );
    if (pasted) document.execCommand("insertText", false, pasted);
  }

  return (
    <Tag
      className={block.kind === "heading" ? "chapter-heading" : "chapter-p"}
      data-block-index={index}
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={editable}
      lang="de"
      aria-label={
        block.kind === "heading" ? "Überschrift ändern" : "Absatz ändern"
      }
      onFocus={() => onEditingChange(index)}
      onBlur={(event) => {
        onEditingChange(null);
        onCommit(
          index,
          normalizeEditableText(event.currentTarget.textContent ?? ""),
        );
      }}
      onKeyDown={onKeyDown}
      onBeforeInput={onBeforeInput}
      onPaste={onPaste}
    >
      {block.runs.map((run, runIndex) => {
        const segments = runSegments(run, runStart, marks);
        runStart += run.text.length;
        return segments.map((segment, segmentIndex) => {
          let node: ReactNode = segment.text;
          if (run.italic) node = <em>{node}</em>;
          if (run.bold) node = <strong>{node}</strong>;
          if (segment.mark?.kind === "corrected") {
            node = <mark className="corrected">{node}</mark>;
          } else if (segment.mark?.kind === "skipped") {
            node = <mark className="skipped">{node}</mark>;
          } else if (segment.mark) {
            const isCurrent = segment.mark.id === currentId;
            node = (
              <mark
                id={isCurrent ? "finding-current" : undefined}
                className={isCurrent ? "finding current" : "finding"}
              >
                {node}
              </mark>
            );
          }
          return (
            <span key={`${runIndex}-${segmentIndex}`}>{node}</span>
          );
        });
      })}
    </Tag>
  );
}, (prev, next) => {
  if (next.isFrozen) return true;
  return (
    prev.block === next.block &&
    prev.blockStart === next.blockStart &&
    prev.fullText === next.fullText &&
    prev.currentId === next.currentId &&
    prev.editable === next.editable &&
    prev.findings === next.findings &&
    prev.corrected === next.corrected &&
    prev.skipped === next.skipped
  );
});

export function ChapterView({
  blocks,
  fullText,
  findings,
  corrected,
  skipped,
  currentId,
  editable,
  editingIndex,
  onEditingChange,
  onCommit,
}: {
  blocks: Block[];
  fullText: string;
  findings: Finding[];
  corrected: Finding[];
  skipped: Finding[];
  currentId: string | null;
  editable: boolean;
  editingIndex: number | null;
  onEditingChange: (index: number | null) => void;
  onCommit: (index: number, text: string) => void;
}) {
  let offset = 0;
  return (
    <>
      {blocks.map((block, index) => {
        const start = offset;
        offset += block.runs.map((run) => run.text).join("").length;
        if (index < blocks.length - 1) offset += 1;
        return (
          <BlockView
            key={index}
            block={block}
            blockStart={start}
            index={index}
            fullText={fullText}
            findings={findings}
            corrected={corrected}
            skipped={skipped}
            currentId={currentId}
            editable={editable}
            isFrozen={editingIndex === index}
            onEditingChange={onEditingChange}
            onCommit={onCommit}
          />
        );
      })}
    </>
  );
}
