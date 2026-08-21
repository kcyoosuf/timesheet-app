import { BackupData } from '../models/types';
import { workLogRepository } from '../storage/workLogRepository';
import { holidayRepository } from '../storage/holidayRepository';
import { settingsRepository } from '../storage/settingsRepository';
import { getTodayIso } from '../utils/dates';

export class BackupService {
  /**
   * Creates a full JSON backup of settings, holidays, and day records
   */
  async createBackup(): Promise<BackupData> {
    const settings = await settingsRepository.getSettings();
    const holidays = await holidayRepository.getHolidays();
    const dayRecords = await workLogRepository.getAllDayRecords();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      holidays,
      dayRecords,
    };
  }

  /**
   * Downloads the backup file as JSON
   */
  async exportBackupFile(): Promise<void> {
    const backup = await this.createBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const filename = `worklog-backup-${getTodayIso()}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  /**
   * Validates parsed JSON file content to confirm it's a valid backup
   */
  validateBackupData(data: any): { isValid: boolean; error?: string; backup?: BackupData } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'File does not contain valid JSON object.' };
    }

    if (!Array.isArray(data.dayRecords) && !data.settings && !Array.isArray(data.holidays)) {
      return {
        isValid: false,
        error: 'JSON structure does not match expected WorkLog backup format (missing records or settings).',
      };
    }

    const backup: BackupData = {
      version: data.version || 1,
      exportedAt: data.exportedAt || new Date().toISOString(),
      settings: data.settings || {},
      holidays: Array.isArray(data.holidays) ? data.holidays : [],
      dayRecords: Array.isArray(data.dayRecords) ? data.dayRecords : [],
    };

    return { isValid: true, backup };
  }

  /**
   * Restores data using chosen strategy ('merge' | 'replace')
   */
  async restoreBackup(backup: BackupData, strategy: 'merge' | 'replace'): Promise<void> {
    await workLogRepository.importAll(backup, strategy);
  }
}

export const backupService = new BackupService();
