export type QuoteLocation = {
  start: number;
  end: number;
};

export function locateQuote(
  haystack: string,
  quote: string,
  prefix: string,
  suffix: string,
): QuoteLocation | null {
  if (!quote) return null;

  if (prefix && suffix) {
    const combined = prefix + quote + suffix;
    const at = haystack.indexOf(combined);
    if (at >= 0) {
      const start = at + prefix.length;
      return { start, end: start + quote.length };
    }
  }
  if (prefix) {
    const at = haystack.indexOf(prefix + quote);
    if (at >= 0) {
      const start = at + prefix.length;
      return { start, end: start + quote.length };
    }
  }
  if (suffix) {
    const at = haystack.indexOf(quote + suffix);
    if (at >= 0) {
      return { start: at, end: at + quote.length };
    }
  }

  const hits: number[] = [];
  let from = 0;
  while (from < haystack.length) {
    const at = haystack.indexOf(quote, from);
    if (at < 0) break;
    hits.push(at);
    from = at + Math.max(quote.length, 1);
  }
  if (hits.length === 0) return null;
  return { start: hits[0], end: hits[0] + quote.length };
}
