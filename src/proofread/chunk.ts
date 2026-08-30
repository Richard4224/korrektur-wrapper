const CHUNK_CHARS = 1600;

export function chunkText(text: string, maxChars = CHUNK_CHARS): string[] {
  const paragraphs = text.split(/\n+/).filter((part) => part.trim());
  const chunks: string[] = [];
  let buffer = "";
  for (const paragraph of paragraphs) {
    if (buffer && buffer.length + paragraph.length + 1 > maxChars) {
      chunks.push(buffer);
      buffer = paragraph;
      continue;
    }
    buffer = buffer ? `${buffer}\n${paragraph}` : paragraph;
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}
