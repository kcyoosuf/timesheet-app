/**
 * Converts total minutes to { hours, minutes }
 */
export function minutesToHoursMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const safeMinutes = Math.max(0, Math.round(totalMinutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return { hours, minutes };
}

/**
 * Formats minutes as HH:MM string (e.g. 480 -> "08:00")
 */
export function formatMinutesToHhMm(totalMinutes: number): string {
  const { hours, minutes } = minutesToHoursMinutes(totalMinutes);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats minutes as decimal hours for Excel (e.g. 480 -> 8, 450 -> 7.5)
 */
export function formatMinutesToDecimalHours(totalMinutes: number): number {
  if (!totalMinutes || totalMinutes <= 0) return 0;
  return Math.round((totalMinutes / 60) * 100) / 100;
}

/**
 * Parses user input string (e.g., "08:00", "8:00", "8", "7.5", "480m", "8h30m") into total minutes
 */
export function parseHoursInputToMinutes(input: string | number): number {
  if (typeof input === 'number') {
    // If integer and large (e.g. > 24), likely already minutes; if <= 24, likely hours
    if (input > 24) return Math.round(input);
    return Math.round(input * 60);
  }

  const str = (input || '').trim();
  if (!str) return 0;

  // Pattern: "HH:MM" or "H:MM"
  if (str.includes(':')) {
    const [hStr, mStr] = str.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    return Math.max(0, h * 60 + m);
  }

  // Pattern: "8h 30m" or "8h" or "30m"
  const hMatch = str.match(/(\d+(?:\.\d+)?)\s*h/i);
  const mMatch = str.match(/(\d+)\s*m/i);
  if (hMatch || mMatch) {
    let total = 0;
    if (hMatch) total += parseFloat(hMatch[1]) * 60;
    if (mMatch) total += parseInt(mMatch[1], 10);
    return Math.max(0, Math.round(total));
  }

  // Decimal number e.g. "7.5" or "8"
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num > 24) {
      // interpreted as minutes
      return Math.round(num);
    }
    return Math.round(num * 60);
  }

  return 0;
}

/**
 * Friendly label for badge (e.g. "8h" or "7h 30m")
 */
export function formatMinutesForBadge(totalMinutes: number): string {
  const { hours, minutes } = minutesToHoursMinutes(totalMinutes);
  if (hours === 0 && minutes === 0) return '0h';
  if (minutes === 0) return `${hours}h`;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
