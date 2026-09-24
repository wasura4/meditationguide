export interface MotivationQuote {
  id: string;
  textEn: string;
  textSi: string;
  author: string;
  order: number;
  status: 'draft' | 'published' | 'archived';
  version: number;
}

export const QUOTE_INTERVAL_MS = 4 * 60 * 60 * 1000;

export function sortQuotes(quotes: MotivationQuote[]) {
  return [...quotes].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// Fixed UTC slots keep the rotation consistent across reloads and time zones.
export function currentQuote(quotes: MotivationQuote[], now: number): MotivationQuote | undefined {
  const published = sortQuotes(quotes.filter(quote => quote.status === 'published'));
  if (!published.length || !Number.isFinite(now)) return undefined;
  const slot = Math.floor(now / QUOTE_INTERVAL_MS);
  return published[((slot % published.length) + published.length) % published.length];
}

export function nextQuoteDelay(now: number) {
  return QUOTE_INTERVAL_MS - ((now % QUOTE_INTERVAL_MS) + QUOTE_INTERVAL_MS) % QUOTE_INTERVAL_MS;
}
