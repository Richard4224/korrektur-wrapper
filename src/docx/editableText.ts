export function normalizeEditableText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .replace(/[\r\n]+/g, "");
}
