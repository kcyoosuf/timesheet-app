export interface ExtractedPrInfo {
  prNumber?: number;
  prUrl?: string;
}

/**
 * Extracts Pull Request information (URL and/or PR Number)
 * Examples:
 * - "PR - https://github.com/EvolverHub/frontend/pull/550"
 * - "Pr: #550"
 * - "Pull Request: https://github.com/org/repo/pull/123"
 * - "PR - 550"
 * - "PR\nhttps://github.com/..."
 */
export function extractPrInfo(text: string): ExtractedPrInfo {
  if (!text) return {};

  let prUrl: string | undefined;
  let prNumber: number | undefined;

  // 1. Check for full GitHub / GitLab / Bitbucket PR URLs
  const urlMatch = text.match(/https?:\/\/[^\s<>"']+(?:\/pull\/|\/merge_requests\/|\/pull-requests\/)(\d+)[^\s<>"']*/i);
  if (urlMatch) {
    prUrl = urlMatch[0];
    const parsedNum = parseInt(urlMatch[1], 10);
    if (!isNaN(parsedNum)) {
      prNumber = parsedNum;
    }
  }

  // 2. Check for explicit PR label patterns e.g. "PR - 550", "PR: #550", "Pr - #550", "PR: 550"
  if (!prNumber) {
    const prNumMatch = text.match(/(?:PR|Pr|pr|Pull Request)\s*[-:]?\s*#?(\d+)\b/i);
    if (prNumMatch) {
      const parsed = parseInt(prNumMatch[1], 10);
      if (!isNaN(parsed)) {
        prNumber = parsed;
      }
    }
  }

  // 3. Fallback: PR followed by a generic URL on next line or same line
  if (!prUrl) {
    const genericUrlMatch = text.match(/(?:PR|Pr|pr|Pull Request)[^\n]*\n?\s*(https?:\/\/[^\s<>"']+)/i);
    if (genericUrlMatch) {
      prUrl = genericUrlMatch[1];
      const derivedNumMatch = prUrl.match(/\/(\d+)(?:[/?#]|$)/);
      if (derivedNumMatch && !prNumber) {
        const num = parseInt(derivedNumMatch[1], 10);
        if (!isNaN(num)) {
          prNumber = num;
        }
      }
    }
  }

  return {
    prNumber,
    prUrl,
  };
}
