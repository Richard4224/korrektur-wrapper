import { locateQuote } from "./locateQuote";

type TextPiece = {
  xmlInnerStart: number;
  xmlInnerEnd: number;
  raw: string;
  text: string;
};

type Piece = TextPiece | { kind: "break" };

function isBreak(piece: Piece): piece is { kind: "break" } {
  return "kind" in piece;
}

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&amp;/g, "&");
}

function encodeXmlEntities(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function collectPieces(xml: string): Piece[] {
  const pieces: Piece[] = [];
  const paragraphRe = /<w:p\b[\s\S]*?<\/w:p>/g;
  let firstParagraph = true;
  let paragraphMatch: RegExpExecArray | null;
  while ((paragraphMatch = paragraphRe.exec(xml)) !== null) {
    const paragraphXml = paragraphMatch[0];
    const paragraphStart = paragraphMatch.index;
    const textNodes: TextPiece[] = [];
    const textRe = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textRe.exec(paragraphXml)) !== null) {
      const raw = textMatch[1];
      const openEnd = textMatch[0].indexOf(">") + 1;
      const xmlInnerStart = paragraphStart + textMatch.index + openEnd;
      textNodes.push({
        xmlInnerStart,
        xmlInnerEnd: xmlInnerStart + raw.length,
        raw,
        text: decodeXmlEntities(raw),
      });
    }
    if (!textNodes.some((node) => node.text.length > 0)) continue;
    if (!firstParagraph) pieces.push({ kind: "break" });
    firstParagraph = false;
    pieces.push(...textNodes);
  }
  return pieces;
}

export function plainTextFromDocumentXml(xml: string): string {
  return collectPieces(xml)
    .map((piece) => (isBreak(piece) ? "\n" : piece.text))
    .join("");
}

function haystackFrom(pieces: Piece[]): string {
  return pieces.map((piece) => (isBreak(piece) ? "\n" : piece.text)).join("");
}

function isWordChar(character: string): boolean {
  return /[\p{L}\p{N}'’\-]/u.test(character);
}

function previousWordStart(text: string, index: number): number {
  let cursor = index;
  while (cursor > 0 && /\s/.test(text[cursor - 1] ?? "")) cursor -= 1;
  while (cursor > 0 && isWordChar(text[cursor - 1] ?? "")) cursor -= 1;
  return cursor;
}

export function expandReplacementRange(
  haystack: string,
  located: { start: number; end: number },
  quote: string,
  replacement: string,
): { start: number; end: number } {
  if (!quote || !replacement.endsWith(quote)) return located;
  const extra = replacement.slice(0, -quote.length);
  if (!/^\S+\s+$/u.test(extra)) return located;
  const start = previousWordStart(haystack, located.start);
  if (start >= located.start) return located;
  return { start, end: located.end };
}

export function applyReplacement(
  xml: string,
  quote: string,
  replacement: string,
  prefix: string,
  suffix: string,
): string {
  const pieces = collectPieces(xml);
  const haystack = haystackFrom(pieces);
  const found = locateQuote(haystack, quote, prefix, suffix);
  if (!found) return xml;
  const located = expandReplacementRange(
    haystack,
    found,
    quote,
    replacement,
  );

  type Change = {
    pieceIndex: number;
    decodedStart: number;
    decodedEnd: number;
    insert: string;
  };
  const changes: Change[] = [];
  let cursor = 0;
  for (let index = 0; index < pieces.length; index += 1) {
    const piece = pieces[index];
    if (isBreak(piece)) {
      cursor += 1;
      continue;
    }
    const pieceStart = cursor;
    const pieceEnd = cursor + piece.text.length;
    cursor = pieceEnd;
    const overlapStart = Math.max(located.start, pieceStart);
    const overlapEnd = Math.min(located.end, pieceEnd);
    if (overlapStart >= overlapEnd) continue;
    changes.push({
      pieceIndex: index,
      decodedStart: overlapStart - pieceStart,
      decodedEnd: overlapEnd - pieceStart,
      insert: changes.length === 0 ? replacement : "",
    });
  }

  let result = xml;
  const descending = [...changes].sort((left, right) => {
    const leftPiece = pieces[left.pieceIndex];
    const rightPiece = pieces[right.pieceIndex];
    if (isBreak(leftPiece) || isBreak(rightPiece)) return 0;
    return rightPiece.xmlInnerStart - leftPiece.xmlInnerStart;
  });

  for (const change of descending) {
    const piece = pieces[change.pieceIndex];
    if (isBreak(piece)) continue;
    const nextText =
      piece.text.slice(0, change.decodedStart) +
      change.insert +
      piece.text.slice(change.decodedEnd);
    const encoded = encodeXmlEntities(nextText);
    result =
      result.slice(0, piece.xmlInnerStart) +
      encoded +
      result.slice(piece.xmlInnerEnd);
  }
  return result;
}

export type XmlReplacement = {
  quote: string;
  replacement: string;
  prefix: string;
  suffix: string;
};

export function applyReplacements(
  xml: string,
  replacements: XmlReplacement[],
): string {
  const haystack = plainTextFromDocumentXml(xml);
  const ordered = replacements
    .map((item) => ({
      item,
      located: locateQuote(haystack, item.quote, item.prefix, item.suffix),
    }))
    .filter(
      (entry): entry is { item: XmlReplacement; located: { start: number; end: number } } =>
        entry.located !== null,
    )
    .sort((left, right) => right.located.start - left.located.start);

  let result = xml;
  for (const entry of ordered) {
    result = applyReplacement(
      result,
      entry.item.quote,
      entry.item.replacement,
      entry.item.prefix,
      entry.item.suffix,
    );
  }
  return result;
}
