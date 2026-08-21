import { DayRecord, WorkLogEntry, DayType, BackupData } from '../models/types';
import { db } from './db';
import { getDateRangeArray, isWeekend } from '../utils/dates';
import { settingsRepository } from './settingsRepository';

export class WorkLogRepository {
  /**
   * Retrieves full day record with all its entries
   */
  async getDay(date: string): Promise<DayRecord | undefined> {
    try {
      const dayRecord = await db.dayRecords.get(date);
      const entries = await db.workEntries.where('date').equals(date).toArray();

      if (!dayRecord && entries.length === 0) {
        return undefined;
      }

      if (!dayRecord) {
        const settings = await settingsRepository.getSettings();
        return {
          date,
          type: isWeekend(date, settings.weekendDays) ? DayType.WEEKEND : DayType.WORKING,
          hoursMinutes: settings.defaultWorkingHoursMinutes,
          entries,
        };
      }

      return {
        ...dayRecord,
        entries,
      };
    } catch (e) {
      console.warn(`Failed to get day ${date}`, e);
      return undefined;
    }
  }

  /**
   * Saves a day record and its entries transactionally
   */
  async saveDay(dayRecord: DayRecord): Promise<void> {
    await db.transaction('rw', db.dayRecords, db.workEntries, async () => {
      // Save day metadata
      await db.dayRecords.put({
        date: dayRecord.date,
        type: dayRecord.type,
        hoursMinutes: dayRecord.hoursMinutes,
        notes: dayRecord.notes,
        entries: [], // keep table normalized
      });

      // Clear existing entries for this date
      await db.workEntries.where('date').equals(dayRecord.date).delete();

      // Insert new entries
      if (dayRecord.entries && dayRecord.entries.length > 0) {
        for (const entry of dayRecord.entries) {
          await db.workEntries.put({
            ...entry,
            date: dayRecord.date,
          });
        }
      }
    });
  }

  /**
   * Deletes a day record and its entries
   */
  async deleteDay(date: string): Promise<void> {
    await db.transaction('rw', db.dayRecords, db.workEntries, async () => {
      await db.dayRecords.delete(date);
      await db.workEntries.where('date').equals(date).delete();
    });
  }

  /**
   * Gets all day records for a specific month (year, month 0-indexed)
   */
  async getMonthDays(year: number, month: number): Promise<DayRecord[]> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    try {
      const allDays = await db.dayRecords.toArray();
      const allEntries = await db.workEntries.toArray();

      const monthDaysMap = new Map<string, DayRecord>();

      for (const day of allDays) {
        if (day.date.startsWith(prefix)) {
          monthDaysMap.set(day.date, { ...day, entries: [] });
        }
      }

      for (const entry of allEntries) {
        if (entry.date.startsWith(prefix)) {
          let day = monthDaysMap.get(entry.date);
          if (!day) {
            day = {
              date: entry.date,
              type: DayType.WORKING,
              hoursMinutes: 480,
              entries: [],
            };
            monthDaysMap.set(entry.date, day);
          }
          day.entries.push(entry);
        }
      }

      return Array.from(monthDaysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.warn('Failed to get month days', e);
      return [];
    }
  }

  /**
   * Adds or updates a single entry for a day
   */
  async saveDayEntry(date: string, entry: WorkLogEntry): Promise<void> {
    let day = await this.getDay(date);
    if (!day) {
      const settings = await settingsRepository.getSettings();
      day = {
        date,
        type: isWeekend(date, settings.weekendDays) ? DayType.WEEKEND : DayType.WORKING,
        hoursMinutes: settings.defaultWorkingHoursMinutes,
        entries: [entry],
      };
    } else {
      const existingIdx = day.entries.findIndex((e) => e.id === entry.id);
      if (existingIdx >= 0) {
        day.entries[existingIdx] = entry;
      } else {
        day.entries.push(entry);
      }
    }
    await this.saveDay(day);
  }

  /**
   * Deletes a single entry from a day
   */
  async deleteDayEntry(date: string, entryId: string): Promise<void> {
    const day = await this.getDay(date);
    if (!day) return;

    day.entries = day.entries.filter((e) => e.id !== entryId);
    await this.saveDay(day);
  }

  /**
   * Updates only day type and hours without deleting existing entries
   */
  async updateDayType(date: string, type: DayType, hoursMinutes?: number, notes?: string): Promise<void> {
    const existing = await this.getDay(date);
    const settings = await settingsRepository.getSettings();

    const hours =
      hoursMinutes !== undefined
        ? hoursMinutes
        : type === DayType.WORKING
        ? settings.defaultWorkingHoursMinutes
        : 0;

    const updatedDay: DayRecord = {
      date,
      type,
      hoursMinutes: hours,
      notes: notes !== undefined ? notes : existing?.notes,
      entries: existing?.entries || [],
    };

    await this.saveDay(updatedDay);
  }

  /**
   * Marks a contiguous range of dates with a specific day type
   */
  async updateDayRangeType(
    startDate: string,
    endDate: string,
    type: DayType,
    hoursMinutes?: number
  ): Promise<void> {
    const dates = getDateRangeArray(startDate, endDate);
    for (const date of dates) {
      await this.updateDayType(date, type, hoursMinutes);
    }
  }

  /**
   * Retrieves all saved day records in the entire database
   */
  async getAllDayRecords(): Promise<DayRecord[]> {
    const allDays = await db.dayRecords.toArray();
    const allEntries = await db.workEntries.toArray();

    const map = new Map<string, DayRecord>();

    for (const day of allDays) {
      map.set(day.date, { ...day, entries: [] });
    }

    for (const entry of allEntries) {
      let day = map.get(entry.date);
      if (!day) {
        day = {
          date: entry.date,
          type: DayType.WORKING,
          hoursMinutes: 480,
          entries: [],
        };
        map.set(entry.date, day);
      }
      day.entries.push(entry);
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Clears all tables in IndexedDB
   */
  async clearAll(): Promise<void> {
    await db.transaction('rw', db.dayRecords, db.workEntries, db.holidays, db.settingsTable, async () => {
      await db.dayRecords.clear();
      await db.workEntries.clear();
      await db.holidays.clear();
      await db.settingsTable.clear();
    });
  }

  /**
   * Imports backup data with 'merge' or 'replace' strategy
   */
  async importAll(backup: BackupData, strategy: 'merge' | 'replace'): Promise<void> {
    if (strategy === 'replace') {
      await this.clearAll();
    }

    if (backup.settings) {
      await settingsRepository.saveSettings(backup.settings);
    }

    if (backup.holidays && Array.isArray(backup.holidays)) {
      for (const h of backup.holidays) {
        await db.holidays.put(h);
      }
    }

    if (backup.dayRecords && Array.isArray(backup.dayRecords)) {
      for (const day of backup.dayRecords) {
        await this.saveDay(day);
      }
    }
  }
}

export const workLogRepository = new WorkLogRepository();
