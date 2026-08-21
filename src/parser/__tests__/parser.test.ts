import { describe, it, expect } from 'vitest';
import { extractTickets } from '../ticketParser';
import { extractPrInfo } from '../prParser';
import { extractBranch } from '../branchParser';
import { extractStatus } from '../statusParser';
import { extractDescription } from '../descriptionParser';
import { parseWorkUpdate } from '../workUpdateParser';

describe('Deterministic Work Update Parser', () => {
  it('1. parses simple description + ticket', () => {
    const input = 'Added reanalyzing status support to My Work - ARIA-5854';
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].tickets).toEqual(['ARIA-5854']);
    expect(result[0].description).toBe('Added reanalyzing status support to My Work');
  });

  it('2. parses ticket + status', () => {
    const input = `Updated pagination support - ARIA-3728\nStatus - Done`;
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].tickets).toEqual(['ARIA-3728']);
    expect(result[0].status).toBe('Done');
    expect(result[0].description).toBe('Updated pagination support');
  });

  it('3. parses ticket + PR', () => {
    const input = `Updated pagination support - ARIA-3728\nPR - https://github.com/EvolverHub/frontend/pull/550`;
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].tickets).toEqual(['ARIA-3728']);
    expect(result[0].prNumber).toBe(550);
    expect(result[0].prUrl).toBe('https://github.com/EvolverHub/frontend/pull/550');
  });

  it('4. parses ticket + branch', () => {
    const input = `Updated pagination support - ARIA-3728\nBranch - feature/aria-3728`;
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].tickets).toEqual(['ARIA-3728']);
    expect(result[0].branch).toBe('feature/aria-3728');
  });

  it('5. parses full ticket + PR + branch + status', () => {
    const input = `Added reanalyzing status support to My Work - ARIA-5854\nStatus - Done\nPR - https://github.com/EvolverHub/frontend/pull/550\nBranch - feature/aria-5854`;
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].tickets).toEqual(['ARIA-5854']);
    expect(result[0].status).toBe('Done');
    expect(result[0].prNumber).toBe(550);
    expect(result[0].prUrl).toBe('https://github.com/EvolverHub/frontend/pull/550');
    expect(result[0].branch).toBe('feature/aria-5854');
    expect(result[0].description).toBe('Added reanalyzing status support to My Work');
  });

  it('6. parses multiple tickets in one work item', () => {
    const input = `Refactored sync engine - ARIA-3728, ARIA-3810\nStatus: In Progress`;
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].tickets).toEqual(['ARIA-3728', 'ARIA-3810']);
    expect(result[0].description).toBe('Refactored sync engine');
  });

  it('7. parses multiple work entries separated by blank lines', () => {
    const input = `Implemented pagination - ARIA-5501
Status - Done
PR - https://github.com/org/repo/pull/550

Fixed permission handling - ARIA-5567
Status - In Review
PR - https://github.com/org/repo/pull/551

Updated search - ARIA-5602
Status - In Progress
Branch - feature/aria-5602`;

    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(3);

    expect(result[0].tickets).toEqual(['ARIA-5501']);
    expect(result[0].description).toBe('Implemented pagination');
    expect(result[0].status).toBe('Done');
    expect(result[0].prNumber).toBe(550);

    expect(result[1].tickets).toEqual(['ARIA-5567']);
    expect(result[1].description).toBe('Fixed permission handling');
    expect(result[1].status).toBe('In Review');
    expect(result[1].prNumber).toBe(551);

    expect(result[2].tickets).toEqual(['ARIA-5602']);
    expect(result[2].description).toBe('Updated search');
    expect(result[2].status).toBe('In Progress');
    expect(result[2].branch).toBe('feature/aria-5602');
  });

  it('8. handles mixed ticket capitalization', () => {
    const tickets = extractTickets('Worked on aria-3728 and Aria-5501 and PROJ-999');
    expect(tickets).toEqual(['ARIA-3728', 'ARIA-5501', 'PROJ-999']);
  });

  it('9. extracts PR URL and derives PR number', () => {
    const prInfo = extractPrInfo('PR - https://github.com/EvolverHub/frontend/pull/550');
    expect(prInfo.prUrl).toBe('https://github.com/EvolverHub/frontend/pull/550');
    expect(prInfo.prNumber).toBe(550);
  });

  it('10. extracts PR number only when no URL given', () => {
    const prInfo = extractPrInfo('PR: #550');
    expect(prInfo.prNumber).toBe(550);
  });

  it('11. handles Branch on the next line', () => {
    const input = `Fixed race condition - ARIA-1234\nBranch\nfeature/fix-race`;
    const result = parseWorkUpdate(input);
    expect(result[0].branch).toBe('feature/fix-race');
    expect(result[0].description).toBe('Fixed race condition');
  });

  it('12. handles Status on the next line', () => {
    const input = `Created analytics component - ARIA-9000\nStatus\nIn Review`;
    const result = parseWorkUpdate(input);
    expect(result[0].status).toBe('In Review');
    expect(result[0].description).toBe('Created analytics component');
  });

  it('13. handles missing optional fields cleanly', () => {
    const input = `Only fixed the CSS layout`;
    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Only fixed the CSS layout');
    expect(result[0].tickets).toEqual([]);
    expect(result[0].status).toBeUndefined();
    expect(result[0].prUrl).toBeUndefined();
    expect(result[0].branch).toBeUndefined();
  });

  it('14. preserves internal hyphens in description text', () => {
    const input = `Added real-time re-analyzing status and cross-browser support - ARIA-5854`;
    const result = parseWorkUpdate(input);
    expect(result[0].description).toBe('Added real-time re-analyzing status and cross-browser support');
    expect(result[0].tickets).toEqual(['ARIA-5854']);
  });

  it('15. strips user header in full daily message', () => {
    const input = `YOOSUF
========

Update something in somewhere - Aria-3728
Status - Done
Pr - https://github.com/EvolverHub/frontend/pull/550
Branch - feature/test

Another update - ARIA-9999
Status - In Review
Pr - https://github.com/EvolverHub/frontend/pull/551
Branch - feature/other`;

    const result = parseWorkUpdate(input);
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('Update something in somewhere');
    expect(result[0].tickets).toEqual(['ARIA-3728']);
    expect(result[1].description).toBe('Another update');
    expect(result[1].tickets).toEqual(['ARIA-9999']);
  });
});
