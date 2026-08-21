import { Settings } from '../models/types';
import { db } from './db';

export const DEFAULT_SETTINGS: Settings = {
  userName: 'Yoosuf',
  defaultWorkingHoursMinutes: 480, // 8 hours
  defaultClient: 'Evolver',
  defaultProject: 'ARIA',
  defaultJob: 'Development',
  weekendDays: [0, 6], // 0 = Sunday, 6 = Saturday
};

export class SettingsRepository {
  private readonly SETTINGS_KEY = 'user_settings';

  async getSettings(): Promise<Settings> {
    try {
      const record = await db.settingsTable.get(this.SETTINGS_KEY);
      if (record && record.value) {
        return {
          ...DEFAULT_SETTINGS,
          ...record.value,
        };
      }
    } catch (e) {
      console.warn('Failed to load settings from DB, using defaults', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings: Settings): Promise<void> {
    await db.settingsTable.put({
      key: this.SETTINGS_KEY,
      value: settings,
    });
  }

  async resetSettings(): Promise<Settings> {
    await this.saveSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
}

export const settingsRepository = new SettingsRepository();
