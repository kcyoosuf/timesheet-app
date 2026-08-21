import { DayRecord, DayType, ValidationIssue } from '../models/types';
import { getAllDatesInMonth, formatDisplayDate } from './dates';

/**
 * Validates all days of a month and returns a list of warnings or issues
 */
export function validateMonthData(
  year: number,
  month: number,
  dayRecordsMap: Map<string, DayRecord>
): ValidationIssue[] {
  const allDates = getAllDatesInMonth(year, month);
  const issues: ValidationIssue[] = [];

  for (const date of allDates) {
    const record = dayRecordsMap.get(date);

    if (!record) {
      continue;
    }

    if (record.type === DayType.WORKING) {
      // 1. Working day with zero hours
      if (!record.hoursMinutes || record.hoursMinutes <= 0) {
        issues.push({
          date,
          type: 'warning',
          message: `${formatDisplayDate(date)}: Marked as working day but has 0 hours logged.`,
        });
      }

      // 2. Working day with no entries
      if (!record.entries || record.entries.length === 0) {
        issues.push({
          date,
          type: 'warning',
          message: `${formatDisplayDate(date)}: Working day has no work update entries recorded.`,
        });
      } else {
        // 3. Inspect individual entries
        for (let i = 0; i < record.entries.length; i++) {
          const entry = record.entries[i];

          // Entry without description
          if (!entry.description || !entry.description.trim()) {
            issues.push({
              date,
              type: 'error',
              message: `${formatDisplayDate(date)} (Entry #${i + 1}): Missing work description.`,
            });
          }

          // Ticket format check (optional but helpful warning)
          if (entry.tickets && entry.tickets.length > 0) {
            for (const ticket of entry.tickets) {
              if (!/^[A-Za-z0-9_]+-\d+$/.test(ticket)) {
                issues.push({
                  date,
                  type: 'info',
                  message: `${formatDisplayDate(date)}: Ticket '${ticket}' may have an unusual format.`,
                });
              }
            }
          }
        }
      }
    }
  }

  return issues;
}
