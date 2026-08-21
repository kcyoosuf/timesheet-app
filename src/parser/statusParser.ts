/**
 * Extracts ticket or task status information
 * Examples:
 * - "Status - Done"
 * - "Status: In Review"
 * - "Status: In Progress"
 * - "Status\nDone"
 * - "Status - In QA"
 */
export function extractStatus(text: string): string | undefined {
  if (!text) return undefined;

  // 1. Same line: "Status - Done" or "status: In Review"
  const sameLineMatch = text.match(/(?:Status|status|STATUS)\s*[-:]\s*([^\n\r]+)/i);
  if (sameLineMatch && sameLineMatch[1]) {
    const status = sameLineMatch[1].trim();
    if (status && !/^https?:\/\//i.test(status)) {
      return status;
    }
  }

  // 2. Next line: "Status\nDone"
  const nextLineMatch = text.match(/(?:Status|status|STATUS)\s*\n\s*([^\n\r]+)/i);
  if (nextLineMatch && nextLineMatch[1]) {
    const status = nextLineMatch[1].trim();
    if (status && !/^(pr|pull request|branch|ticket|http)/i.test(status)) {
      return status;
    }
  }

  return undefined;
}
