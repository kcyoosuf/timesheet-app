/**
 * Extracts git branch information
 * Examples:
 * - "Branch - feature/aria-3728"
 * - "branch: bugfix/fix-login"
 * - "Branch\nfeature/aria-3728"
 */
export function extractBranch(text: string): string | undefined {
  if (!text) return undefined;

  // Match "Branch - ..." or "branch: ..." on same line
  const sameLineMatch = text.match(/(?:Branch|branch|BRANCH)\s*[-:]\s*([A-Za-z0-9_\-./]+)/i);
  if (sameLineMatch && sameLineMatch[1]) {
    return sameLineMatch[1].trim();
  }

  // Match "Branch\n<branch_name>"
  const nextLineMatch = text.match(/(?:Branch|branch|BRANCH)\s*\n\s*([A-Za-z0-9_\-./]+)/i);
  if (nextLineMatch && nextLineMatch[1]) {
    const candidate = nextLineMatch[1].trim();
    // Verify it looks like a branch name and not another keyword
    if (!/^(status|pr|pull request|http)/i.test(candidate)) {
      return candidate;
    }
  }

  return undefined;
}
