import JSZip from "jszip";
import { parseDocumentXml, type Block } from "./parseDocument";

export type LoadedDoc = {
  fileName: string;
  bytes: Uint8Array;
  blocks: Block[];
};

export async function loadDocxFromBytes(
  bytes: Uint8Array,
  fileName: string,
): Promise<LoadedDoc> {
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("Das ist keine gültige Word-Datei (.docx).");
  }
  const xml = await documentFile.async("string");
  return {
    fileName,
    bytes,
    blocks: parseDocumentXml(xml),
  };
}

export async function loadDocxFile(file: File): Promise<LoadedDoc> {
  if (!file.name.toLowerCase().endsWith(".docx")) {
    throw new Error("Bitte eine Word-Datei mit der Endung .docx öffnen.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return loadDocxFromBytes(bytes, file.name);
}

export function copyFileName(fileName: string): string {
  return fileName.replace(/\.docx$/i, "") + "_kopie.docx";
}

export function downloadUnchangedCopy(doc: LoadedDoc): void {
  const copy = Uint8Array.from(doc.bytes);
  const blob = new Blob([copy], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = copyFileName(doc.fileName);
  link.click();
  URL.revokeObjectURL(url);
}

export async function documentXmlFromBytes(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("Das ist keine gültige Word-Datei (.docx).");
  }
  return documentFile.async("string");
}
