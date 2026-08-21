import { describe, it, expect } from 'vitest';
import { generateTimesheetWorkbook } from '../excelExporter';
import { generateTimesheetCsvString } from '../csvExporter';
import { backupService } from '../backupService';
import { DayRecord, DayType, Settings, Holiday } from '../../models/types';

describe('Export & Timesheet Generation', () => {
  const mockSettings: Settings = {
    userName: 'Yoosuf',
    defaultWorkingHoursMinutes: 480,
    defaultClient: 'Evolver',
    defaultProject: 'ARIA',
    defaultJob: 'Development',
    weekendDays: [0, 6],
  };

  const mockDayRecordsMap = new Map<string, DayRecord>();
  // Aug 01: Working day with 2 entries
  mockDayRecordsMap.set('2026-08-01', {
    date: '2026-08-01',
    type: DayType.WORKING,
    hoursMinutes: 480,
    entries: [
      {
        id: '1',
        date: '2026-08-01',
        tickets: ['ARIA-5854'],
        description: 'Added reanalyzing status support to My Work',
        prNumber: 550,
        prUrl: 'https://github.com/EvolverHub/frontend/pull/550',
        branch: 'feature/aria-5854',
        status: 'Done',
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
    ],
  });

  // Aug 02: Weekend
  mockDayRecordsMap.set('2026-08-02', {
    date: '2026-08-02',
    type: DayType.WEEKEND,
    hoursMinutes: 0,
    entries: [],
  });

  // Aug 03: Personal Leave
  mockDayRecordsMap.set('2026-08-03', {
    date: '2026-08-03',
    type: DayType.PERSONAL_LEAVE,
    hoursMinutes: 0,
    entries: [],
  });

  const mockHolidaysMap = new Map<string, Holiday>();
  mockHolidaysMap.set('2026-08-15', {
    id: 'hol-1',
    date: '2026-08-15',
    name: 'Independence Day',
  });

  it('generates Excel workbook with correct worksheet name, columns, and total row formula', async () => {
    const workbook = await generateTimesheetWorkbook({
      year: 2026,
      month: 7, // August (0-indexed 7)
      settings: mockSettings,
      dayRecordsMap: mockDayRecordsMap,
      holidaysMap: mockHolidaysMap,
    });

    const worksheet = workbook.getWorksheet('August');
    expect(worksheet).toBeDefined();

    // Verify header row values
    const headerRow = worksheet!.getRow(1);
    expect(headerRow.getCell(1).value).toBe('Date');
    expect(headerRow.getCell(2).value).toBe('Client Name');
    expect(headerRow.getCell(3).value).toBe('Project Name');
    expect(headerRow.getCell(4).value).toBe('Job Name');
    expect(headerRow.getCell(5).value).toBe('Work Item');
    expect(headerRow.getCell(6).value).toBe('Hour(s)');
    expect(headerRow.getCell(7).value).toBe('Hours(HH:MM)');
    expect(headerRow.getCell(8).value).toBe('Description');

    // Verify column widths match specification
    expect(worksheet!.getColumn(1).width).toBe(17.7);
    expect(worksheet!.getColumn(5).width).toBe(29.8);
    expect(worksheet!.getColumn(8).width).toBe(79.2);

    // Verify Working Day (Row 2 = Day 1)
    const day1Row = worksheet!.getRow(2);
    expect(day1Row.getCell(2).value).toBe('Evolver');
    expect(day1Row.getCell(3).value).toBe('ARIA');
    expect(day1Row.getCell(4).value).toBe('Development');
    expect(day1Row.getCell(5).value).toBe('ARIA-5854');
    expect(day1Row.getCell(6).value).toBe(8);
    expect(day1Row.getCell(8).value).toBe('Added reanalyzing status support to My Work');

    // Total row for August (31 days -> Row 33)
    const totalRow = worksheet!.getRow(33);
    expect(totalRow.getCell(1).value).toBe('Total Hours Worked in Aug26');
    expect(totalRow.getCell(6).value).toEqual({
      formula: 'SUM(F2:F32)',
      result: 8,
    });
  });

  it('generates CSV string with proper columns and escaped fields', () => {
    const csv = generateTimesheetCsvString({
      year: 2026,
      month: 7,
      settings: mockSettings,
      dayRecordsMap: mockDayRecordsMap,
    });

    expect(csv).toContain('Date,Ticket numbers,Description,PR info,Branch info,Status');
    expect(csv).toContain('2026-08-01,ARIA-5854,Added reanalyzing status support to My Work,https://github.com/EvolverHub/frontend/pull/550,feature/aria-5854,Done');
    expect(csv).toContain('2026-08-02,,WEEKEND,,,');
  });

  it('validates backup data structure correctly', () => {
    const validJson = {
      version: 1,
      exportedAt: '2026-08-21T00:00:00.000Z',
      settings: mockSettings,
      holidays: [],
      dayRecords: [],
    };

    const validation = backupService.validateBackupData(validJson);
    expect(validation.isValid).toBe(true);
    expect(validation.backup?.version).toBe(1);

    const invalidJson = { foo: 'bar' };
    const invalidValidation = backupService.validateBackupData(invalidJson);
    expect(invalidValidation.isValid).toBe(false);
  });
});
