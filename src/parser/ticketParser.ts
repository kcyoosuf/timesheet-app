/**
 * Extracts and normalizes Jira / issue tracker tickets (e.g., ARIA-3728, Aria-3728, aria-3728)
 * Normalized to uppercase.
 * Supports patterns like [A-Za-z]+-\d+
 */
export function extractTickets(text: string): string[] {
  if (!text) return [];

  // Match all instances of [A-Za-z]+-\d+
  const ticketRegex = /\b([A-Za-z][A-Za-z0-9_]*-\d+)\b/g;
  const matches = text.match(ticketRegex);

  if (!matches) {
    return [];
  }

  // Normalize to uppercase and remove duplicates preserving order
  const uniqueTickets = new Set<string>();
  const results: string[] = [];

  for (const match of matches) {
    const normalized = match.toUpperCase();
    if (!uniqueTickets.has(normalized)) {
      uniqueTickets.add(normalized);
      results.push(normalized);
    }
  }

  return results;
}
