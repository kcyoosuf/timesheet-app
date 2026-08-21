import { DayRecord, DayType, Settings } from '../models/types';
import { getMonthName, getAllDatesInMonth } from '../utils/dates';

export interface CsvExportOptions {
  year: number;
  month: number;
  settings: Settings;
  dayRecordsMap: Map<string, DayRecord>;
}

function escapeCsvField(field: string | number | undefined): string {
  if (field === undefined || field === null) return '';
  const str = String(field);
  // If field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateTimesheetCsvString(options: CsvExportOptions): string {
  const { year, month, dayRecordsMap } = options;
  const allDates = getAllDatesInMonth(year, month);

  const rows: string[][] = [
    ['Date', 'Ticket numbers', 'Description', 'PR info', 'Branch info', 'Status'],
  ];

  for (const date of allDates) {
    const dayRecord = dayRecordsMap.get(date);

    if (dayRecord && dayRecord.type === DayType.WORKING) {
      if (dayRecord.entries && dayRecord.entries.length > 0) {
        for (const entry of dayRecord.entries) {
          const ticketsStr = (entry.tickets || []).join(', ');
          const prStr = entry.prUrl || (entry.prNumber ? `#${entry.prNumber}` : '');
          rows.push([
            date,
            ticketsStr,
            entry.description || '',
            prStr,
            entry.branch || '',
            entry.status || '',
          ]);
        }
      } else {
        // Working day with no explicit sub-entries
        rows.push([date, '', dayRecord.notes || '', '', '', '']);
      }
    } else if (dayRecord) {
      // Non-working day
      rows.push([date, '', dayRecord.type, '', '', '']);
    } else {
      // Weekend / unclassified
      rows.push([date, '', 'Weekend', '', '', '']);
    }
  }

  return rows.map((r) => r.map(escapeCsvField).join(',')).join('\r\n');
}

export function downloadTimesheetCsv(options: CsvExportOptions): void {
  const csvContent = generateTimesheetCsvString(options);
  const monthName = getMonthName(options.month);
  const userName = options.settings.userName || 'Yoosuf';
  const filename = `Timesheet-${userName}-${monthName}-${options.year}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
