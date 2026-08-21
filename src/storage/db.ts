import Dexie, { Table } from 'dexie';
import { DayRecord, WorkLogEntry, Holiday, Settings, DayType } from '../models/types';

export class WorkLogDatabase extends Dexie {
  dayRecords!: Table<DayRecord, string>;
  workEntries!: Table<WorkLogEntry, string>;
  holidays!: Table<Holiday, string>;
  settingsTable!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('WorkLogDatabase');

    this.version(1).stores({
      dayRecords: 'date, type',
      workEntries: 'id, date, *tickets, createdAt',
      holidays: 'id, date, name',
      settingsTable: 'key',
    });
  }
}

export const db = new WorkLogDatabase();
