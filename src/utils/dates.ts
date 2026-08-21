const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function getTodayIso(): string {
  const now = new Date();
  return formatDateIso(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDateIso(year: number, month: number, day: number): string {
  const y = year.toString().padStart(4, '0');
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateIso(iso: string): { year: number; month: number; day: number } {
  const parts = iso.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }
  return {
    year: parts[0],
    month: parts[1] - 1, // 0-indexed month
    day: parts[2],
  };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getDayOfWeek(iso: string): number {
  const { year, month, day } = parseDateIso(iso);
  return new Date(year, month, day).getDay(); // 0 = Sunday, 6 = Saturday
}

export function isWeekend(iso: string, weekendDays: number[] = [0, 6]): boolean {
  const dayOfWeek = getDayOfWeek(iso);
  return weekendDays.includes(dayOfWeek);
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month] || '';
}

export function getMonthShortName(month: number): string {
  return MONTH_SHORT_NAMES[month] || '';
}

export function formatDisplayDate(iso: string): string {
  const { year, month, day } = parseDateIso(iso);
  const date = new Date(year, month, day);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayPadded = day.toString().padStart(2, '0');
  const monthName = getMonthShortName(month);
  return `${weekday}, ${dayPadded}-${monthName}-${year}`;
}

export function formatShortDate(iso: string): string {
  const { year, month, day } = parseDateIso(iso);
  const dayPadded = day.toString().padStart(2, '0');
  const monthName = getMonthShortName(month);
  return `${dayPadded}-${monthName}-${year}`;
}

/**
 * Formats date as dd/mmm/yyyy (e.g. 01/Aug/2026) for Excel
 */
export function formatExcelDate(iso: string): string {
  const { year, month, day } = parseDateIso(iso);
  const dayPadded = day.toString().padStart(2, '0');
  const monthName = getMonthShortName(month);
  return `${dayPadded}/${monthName}/${year}`;
}

/**
 * Creates Excel JS date object for native Excel date serial / date type
 */
export function createDateForExcel(iso: string): Date {
  const { year, month, day } = parseDateIso(iso);
  // Return UTC Date or standard date representing that day at noon to avoid timezone shift
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

/**
 * Generates an array of all ISO date strings between startDate and endDate inclusive
 */
export function getDateRangeArray(startDateIso: string, endDateIso: string): string[] {
  const start = parseDateIso(startDateIso);
  const end = parseDateIso(endDateIso);

  const startDate = new Date(start.year, start.month, start.day);
  const endDate = new Date(end.year, end.month, end.day);

  if (startDate > endDate) {
    return [startDateIso];
  }

  const result: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    result.push(formatDateIso(current.getFullYear(), current.getMonth(), current.getDate()));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Get all dates in a specific month
 */
export function getAllDatesInMonth(year: number, month: number): string[] {
  const daysCount = getDaysInMonth(year, month);
  const dates: string[] = [];
  for (let d = 1; d <= daysCount; d++) {
    dates.push(formatDateIso(year, month, d));
  }
  return dates;
}
