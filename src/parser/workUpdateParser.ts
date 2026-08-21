import { ParsedWorkItem } from '../models/types';
import { extractTickets } from './ticketParser';
import { extractPrInfo } from './prParser';
import { extractBranch } from './branchParser';
import { extractStatus } from './statusParser';
import { extractDescription } from './descriptionParser';

/**
 * Splits raw pasted daily work update text into distinct work item blocks
 */
export function splitWorkItems(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();

  // Strip leading user header block if present e.g.
  // YOOSUF
  // ========
  let cleanedText = text;
  const headerMatch = cleanedText.match(/^[A-Z0-9_-]{2,20}\r?\n[=\-_*]{2,}\r?\n/i);
  if (headerMatch) {
    cleanedText = cleanedText.substring(headerMatch[0].length).trim();
  }

  // 1. Check if separated by explicit horizontal rules e.g. "---" or "==="
  if (/\n[=\-_*]{3,}\n/.test(cleanedText)) {
    const parts = cleanedText.split(/\n[=\-_*]{3,}\n/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }

  // 2. Check if separated by double or more newlines
  const doubleNewlineBlocks = cleanedText
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (doubleNewlineBlocks.length > 1) {
    // Check if these are independent work items
    return doubleNewlineBlocks;
  }

  // 3. Check for numbered items (e.g. "1. Task A...", "2. Task B...")
  const numberedSplit = cleanedText.split(/(?:^|\n)(?=\d+[\.\)]\s+)/).map((b) => b.trim()).filter(Boolean);
  if (numberedSplit.length > 1) {
    return numberedSplit;
  }

  // Fallback: single block
  return [cleanedText];
}

/**
 * Parses a single block of work update text into a structured ParsedWorkItem
 */
export function parseSingleWorkItem(blockText: string): ParsedWorkItem {
  const tickets = extractTickets(blockText);
  const prInfo = extractPrInfo(blockText);
  const branch = extractBranch(blockText);
  const status = extractStatus(blockText);
  const description = extractDescription(blockText, tickets);

  return {
    tickets,
    description: description || blockText.trim(),
    status,
    prNumber: prInfo.prNumber,
    prUrl: prInfo.prUrl,
    branch,
    rawUpdate: blockText.trim(),
  };
}

/**
 * Main parser entry point: parses raw pasted daily update into one or more ParsedWorkItems
 */
export function parseWorkUpdate(rawText: string): ParsedWorkItem[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const blocks = splitWorkItems(rawText);
  const results: ParsedWorkItem[] = [];

  for (const block of blocks) {
    const item = parseSingleWorkItem(block);
    // Ensure we don't output completely empty items
    if (item.description || item.tickets.length > 0 || item.prUrl || item.branch) {
      results.push(item);
    }
  }

  // If no items were identified, return at least one fallback item with the raw text as description
  if (results.length === 0 && rawText.trim()) {
    results.push({
      tickets: extractTickets(rawText),
      description: rawText.trim(),
      rawUpdate: rawText.trim(),
    });
  }

  return results;
}
