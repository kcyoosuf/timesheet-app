export enum DayType {
  WORKING = 'WORKING',
  WEEKEND = 'WEEKEND',
  PERSONAL_LEAVE = 'PERSONAL_LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  COMPANY_HOLIDAY = 'COMPANY_HOLIDAY',
  OTHER = 'OTHER',
}

export interface WorkLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  tickets: string[];
  description: string;
  status?: string;
  prNumber?: number;
  prUrl?: string;
  branch?: string;
  client?: string;
  project?: string;
  job?: string;
  hoursMinutes?: number; // In minutes, e.g. 480 = 8h
  rawUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  type: DayType;
  hoursMinutes: number; // In minutes, e.g. 480 = 8h
  notes?: string;
  entries: WorkLogEntry[];
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  description?: string;
}

export interface Settings {
  userName: string;
  defaultWorkingHoursMinutes: number;
  defaultClient: string;
  defaultProject: string;
  defaultJob: string;
  weekendDays: number[]; // 0 = Sunday, 6 = Saturday
}

export interface ParsedWorkItem {
  tickets: string[];
  description: string;
  status?: string;
  prNumber?: number;
  prUrl?: string;
  branch?: string;
  rawUpdate?: string;
}

export interface ValidationIssue {
  date: string;
  type: 'error' | 'warning' | 'info';
  message: string;
}

export interface MonthlyStats {
  year: number;
  month: number; // 0-indexed (0 = Jan, 7 = Aug)
  monthName: string;
  totalCalendarDays: number;
  totalWorkingDays: number;
  loggedWorkingDays: number;
  missingWorkingDays: number;
  personalLeaveDays: number;
  sickLeaveDays: number;
  companyHolidayDays: number;
  otherLeaveDays: number;
  weekendDays: number;
  totalLoggedMinutes: number;
  totalLoggedHoursFormatted: string;
  totalEntriesCount: number;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  settings: Settings;
  holidays: Holiday[];
  dayRecords: DayRecord[];
}
