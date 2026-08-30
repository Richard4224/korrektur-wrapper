export type TextRun = {
  text: string;
  italic: boolean;
  bold: boolean;
};

export type Block = {
  kind: "heading" | "paragraph";
  runs: TextRun[];
};

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function isWordElement(node: Element, localName: string): boolean {
  return (
    node.localName === localName &&
    (node.namespaceURI === W_NS ||
      node.namespaceURI === null ||
      node.tagName === `w:${localName}`)
  );
}

function children(el: Element, localName: string): Element[] {
  return [...el.children].filter((child) => isWordElement(child, localName));
}

function descendant(el: Element, localName: string): Element | undefined {
  const direct = children(el, localName)[0];
  if (direct) return direct;
  for (const child of el.children) {
    const found = descendant(child, localName);
    if (found) return found;
  }
  return undefined;
}

function wordAttr(el: Element, name: string): string | null {
  return el.getAttribute(`w:${name}`) ?? el.getAttributeNS(W_NS, name);
}

function flagOn(rPr: Element | undefined, name: "i" | "b"): boolean {
  if (!rPr) return false;
  const flag = children(rPr, name)[0];
  if (!flag) return false;
  const val = wordAttr(flag, "val");
  return val !== "false" && val !== "0";
}

function parseRun(run: Element): TextRun | null {
  const textNodes = [...run.getElementsByTagName("*")].filter(
    (el) => el.localName === "t",
  );
  const text = textNodes.map((node) => node.textContent ?? "").join("");
  if (!text) return null;
  const rPr = children(run, "rPr")[0];
  return {
    text,
    italic: flagOn(rPr, "i"),
    bold: flagOn(rPr, "b"),
  };
}

function isHeading(paragraph: Element): boolean {
  const pPr = children(paragraph, "pPr")[0];
  if (!pPr) return false;
  const style = descendant(pPr, "pStyle");
  const val = style ? (wordAttr(style, "val") ?? "") : "";
  return /^Heading\d+$/i.test(val) || val === "Title";
}

export function parseDocumentXml(xml: string): Block[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Die Word-Datei konnte nicht gelesen werden.");
  }

  const body =
    [...doc.getElementsByTagName("*")].find((el) => el.localName === "body") ??
    null;
  if (!body) {
    throw new Error("In der Datei wurde kein Text gefunden.");
  }

  const blocks: Block[] = [];
  for (const child of body.children) {
    if (!isWordElement(child, "p")) continue;
    const directRuns = children(child, "r")
      .map(parseRun)
      .filter((run): run is TextRun => run !== null);
    const runs =
      directRuns.length > 0
        ? directRuns
        : [...child.getElementsByTagName("*")]
            .filter((el) => el.localName === "r")
            .map(parseRun)
            .filter((run): run is TextRun => run !== null);

    if (runs.length === 0) continue;
    blocks.push({
      kind: isHeading(child) ? "heading" : "paragraph",
      runs,
    });
  }
  return blocks;
}

export function plainText(blocks: Block[]): string {
  return blocks
    .map((block) => block.runs.map((run) => run.text).join(""))
    .join("\n");
}

export function blockIndexAtOffset(
  blocks: Block[],
  offset: number,
): number | null {
  let cursor = 0;
  for (let index = 0; index < blocks.length; index += 1) {
    const length = blocks[index].runs.map((run) => run.text).join("").length;
    if (offset >= cursor && offset < cursor + length) return index;
    cursor += length + 1;
  }
  return null;
}
