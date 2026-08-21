/**
 * Cleans and extracts the core work description from raw text.
 * Strips metadata lines (Status, PR, Branch, Header/User names, separators)
 * and trailing/leading ticket suffixes while preserving internal hyphens and wording.
 */
export function extractDescription(
  text: string,
  tickets: string[] = []
): string {
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const cleanedLines: string[] = [];

  // Identify lines that are purely metadata, headers, or separators
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // 1. Skip separator lines: e.g. "========", "--------", "________", "*******"
    if (/^[=\-_*#]{2,}$/.test(line)) {
      continue;
    }

    // 2. Skip likely single-word username header if followed by separator line
    // e.g. "YOOSUF" or "ALICE" on line 0
    if (i === 0 && /^[A-Z0-9_-]{2,20}$/i.test(line) && lines.length > 1 && /^[=\-_*]{2,}$/.test(lines[1].trim())) {
      continue;
    }

    // 3. Skip standalone Status header or "Status - ..." / "Status: ..."
    if (/^(?:status)\s*[-:]?\s*.*$/i.test(line)) {
      // If line is just "Status" and next line is the status value, skip next line too
      if (/^(?:status)\s*:?$/i.test(line) && i + 1 < lines.length) {
        i++;
      }
      continue;
    }

    // 4. Skip standalone PR line or "PR - ..." / "Pull Request: ..."
    if (/^(?:pr|pull request)\s*[-:]?\s*.*$/i.test(line)) {
      // If line is just "PR" / "Pull Request" and next line is URL or #number, skip next line too
      if (/^(?:pr|pull request)\s*:?$/i.test(line) && i + 1 < lines.length) {
        i++;
      }
      continue;
    }

    // 5. Skip standalone Branch line or "Branch - ..." / "branch: ..."
    if (/^(?:branch)\s*[-:]?\s*.*$/i.test(line)) {
      // If line is just "Branch" and next line is branch name, skip next line too
      if (/^(?:branch)\s*:?$/i.test(line) && i + 1 < lines.length) {
        i++;
      }
      continue;
    }

    // 6. Skip standalone URL lines (e.g. GitHub PR URLs that were on their own line)
    if (/^https?:\/\/[^\s]+$/i.test(line)) {
      continue;
    }

    // 7. Strip ticket identifiers attached at end or beginning of line
    // Examples:
    // "Updated pagination support - ARIA-3728" -> "Updated pagination support"
    // "ARIA-5854: Fixed permission issue" -> "Fixed permission issue"
    // "[ARIA-5854] Added button" -> "Added button"
    // "Fixed permission issue (ARIA-3728)" -> "Fixed permission issue"
    // "Added reanalyzing status support to My Work - Aria-5854" -> "Added reanalyzing status support to My Work"

    // Remove leading [TICKET-123] or TICKET-123: or TICKET-123 -
    line = line.replace(/^\s*\[?[A-Za-z][A-Za-z0-9_]*-\d+\]?\s*[-:]\s*/i, '');

    // Remove trailing - TICKET-123 or : TICKET-123 or (TICKET-123) or [TICKET-123]
    line = line.replace(/\s*[-:]\s*\[?[A-Za-z][A-Za-z0-9_]*-\d+\]?\s*$/i, '');
    line = line.replace(/\s*\([A-Za-z][A-Za-z0-9_]*-\d+\)\s*$/i, '');

    // Remove trailing multiple tickets if listed like "- ARIA-3728, ARIA-3810"
    line = line.replace(/\s*[-:]\s*(?:[A-Za-z][A-Za-z0-9_]*-\d+(?:\s*[,/&]\s*|\s+)?)+$/i, '');

    // Remove list bullet prefixes if present
    line = line.replace(/^[\*\-•]\s+/, '');

    const trimmed = line.trim();
    if (trimmed && !isKnownMetadataWord(trimmed)) {
      cleanedLines.push(trimmed);
    }
  }

  let result = cleanedLines.join('\n').trim();

  // If result ended up empty because all lines looked like metadata, fallback to full text trimmed
  if (!result && text.trim()) {
    result = text.trim();
  }

  return result;
}

function isKnownMetadataWord(word: string): boolean {
  const lower = word.toLowerCase();
  return (
    lower === 'status' ||
    lower === 'pr' ||
    lower === 'pull request' ||
    lower === 'branch' ||
    lower === 'done' ||
    lower === 'in review' ||
    lower === 'in progress'
  );
}
