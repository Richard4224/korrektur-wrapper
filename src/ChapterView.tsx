import type { ReactNode } from "react";
import type { Block, TextRun } from "./docx/parseDocument";
import { locateQuote } from "./docx/locateQuote";
import type { Finding } from "./proofread/types";

type Mark = {
  id: string;
  start: number;
  end: number;
  kind: "finding" | "corrected";
};

function marksInBlock(
  blockStart: number,
  blockLength: number,
  fullText: string,
  findings: Finding[],
  corrected: Finding[],
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

function BlockView({
  block,
  blockStart,
  fullText,
  findings,
  corrected,
  currentId,
}: {
  block: Block;
  blockStart: number;
  fullText: string;
  findings: Finding[];
  corrected: Finding[];
  currentId: string | null;
}) {
  const Tag = block.kind === "heading" ? "h2" : "p";
  const blockText = block.runs.map((run) => run.text).join("");
  const marks = marksInBlock(
    blockStart,
    blockText.length,
    fullText,
    findings,
    corrected,
  );
  let runStart = 0;
  return (
    <Tag className={block.kind === "heading" ? "chapter-heading" : "chapter-p"}>
      {block.runs.map((run, runIndex) => {
        const segments = runSegments(run, runStart, marks);
        runStart += run.text.length;
        return segments.map((segment, segmentIndex) => {
          let node: ReactNode = segment.text;
          if (run.italic) node = <em>{node}</em>;
          if (run.bold) node = <strong>{node}</strong>;
          if (segment.mark?.kind === "corrected") {
            node = <mark className="corrected">{node}</mark>;
          } else if (segment.mark) {
            node = (
              <mark
                className={
                  segment.mark.id === currentId ? "finding current" : "finding"
                }
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
}

export function ChapterView({
  blocks,
  fullText,
  findings,
  corrected,
  currentId,
}: {
  blocks: Block[];
  fullText: string;
  findings: Finding[];
  corrected: Finding[];
  currentId: string | null;
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
            fullText={fullText}
            findings={findings}
            corrected={corrected}
            currentId={currentId}
          />
        );
      })}
    </>
  );
}
