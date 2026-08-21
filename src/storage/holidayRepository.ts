import { Holiday } from '../models/types';
import { db } from './db';

export class HolidayRepository {
  async getHolidays(): Promise<Holiday[]> {
    try {
      return await db.holidays.orderBy('date').toArray();
    } catch (e) {
      console.warn('Failed to get holidays', e);
      return [];
    }
  }

  async getHolidayByDate(date: string): Promise<Holiday | undefined> {
    try {
      const results = await db.holidays.where('date').equals(date).toArray();
      return results[0];
    } catch (e) {
      console.warn('Failed to get holiday by date', e);
      return undefined;
    }
  }

  async saveHoliday(holiday: Holiday): Promise<void> {
    await db.holidays.put(holiday);
  }

  async deleteHoliday(id: string): Promise<void> {
    await db.holidays.delete(id);
  }

  async getHolidaysInMonth(year: number, month: number): Promise<Holiday[]> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    const all = await this.getHolidays();
    return all.filter((h) => h.date.startsWith(prefix));
  }
}

export const holidayRepository = new HolidayRepository();
