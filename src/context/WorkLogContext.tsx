import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  DayRecord,
  WorkLogEntry,
  DayType,
  Holiday,
  Settings,
  MonthlyStats,
  ValidationIssue,
  BackupData,
} from '../models/types';
import { workLogRepository } from '../storage/workLogRepository';
import { holidayRepository } from '../storage/holidayRepository';
import { settingsRepository, DEFAULT_SETTINGS } from '../storage/settingsRepository';
import {
  getTodayIso,
  parseDateIso,
  formatDateIso,
  getDaysInMonth,
  getMonthName,
  getMonthShortName,
  isWeekend,
  getAllDatesInMonth,
} from '../utils/dates';
import { formatMinutesToHhMm, formatMinutesToDecimalHours } from '../utils/formatting';
import { validateMonthData } from '../utils/validation';
import { downloadTimesheetExcel } from '../export/excelExporter';
import { downloadTimesheetCsv } from '../export/csvExporter';
import { backupService } from '../export/backupService';
import { supabaseService, SyncResult } from '../services/supabaseService';
import { useAuth } from './AuthContext';

export type CloudSyncStatus = 'idle' | 'saving' | 'synced' | 'error' | 'offline';

interface WorkLogContextType {
  // State
  selectedDate: string;
  currentYear: number;
  currentMonth: number; // 0-indexed
  settings: Settings;
  holidays: Holiday[];
  monthDaysMap: Map<string, DayRecord>;
  holidaysMap: Map<string, Holiday>;
  currentDayRecord: DayRecord;
  monthlyStats: MonthlyStats;
  validationIssues: ValidationIssue[];
  isLoading: boolean;
  syncStatus: CloudSyncStatus;
  lastSyncTime: string | null;
  isOnline: boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  setCurrentMonthYear: (year: number, month: number) => void;
  setMonthAndYear: (month: number, year: number) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  saveCurrentDayRecord: (dayRecord: DayRecord) => Promise<void>;
  updateDayType: (date: string, type: DayType, hoursMinutes?: number, notes?: string) => Promise<void>;
  updateDateRangeType: (startDate: string, endDate: string, type: DayType, hoursMinutes?: number) => Promise<void>;
  saveHoliday: (holiday: Holiday) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  refreshAppData: () => Promise<void>;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  pushToSupabase: (userId?: string) => Promise<SyncResult>;
  pullFromSupabase: (userId?: string) => Promise<{ success: boolean; message: string; error?: string }>;
  exportExcel: () => Promise<void>;
  exportCsv: () => void;
  exportBackup: () => Promise<void>;
  importBackup: (backup: BackupData, strategy: 'merge' | 'replace') => Promise<void>;
  loadSampleAugust2026Data: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const WorkLogContext = createContext<WorkLogContextType | undefined>(undefined);

export const WorkLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isConfigured, isAuthenticated } = useAuth();

  const initialToday = getTodayIso();
  const parsedInitial = parseDateIso(initialToday);

  const [selectedDate, setSelectedDateState] = useState<string>(initialToday);
  const [currentYear, setCurrentYear] = useState<number>(parsedInitial.year);
  const [currentMonth, setCurrentMonth] = useState<number>(parsedInitial.month);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [dbMonthDays, setDbMonthDays] = useState<DayRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cloud On-the-Go Sync State
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(supabaseService.getLastSyncTime());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Track the previous user ID to handle user switching cleanly
  const prevUserIdRef = useRef<string | null>(null);
  const isInitialSyncDoneRef = useRef<boolean>(false);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncStatus === 'offline') setSyncStatus('idle');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);

  // Load initial settings, holidays, and month days from local IndexedDB
  const refreshAppData = useCallback(async () => {
    try {
      const loadedSettings = await settingsRepository.getSettings();
      setSettings(loadedSettings);

      const loadedHolidays = await holidayRepository.getHolidays();
      setHolidays(loadedHolidays);

      const monthDays = await workLogRepository.getMonthDays(currentYear, currentMonth);
      setDbMonthDays(monthDays);
    } catch (e) {
      console.error('Failed to load application data from IndexedDB', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    refreshAppData();
  }, [refreshAppData]);

  // Cloud Sync: Pull from Supabase on the fly
  const pullFromSupabase = useCallback(
    async (userId?: string): Promise<{ success: boolean; message: string; error?: string }> => {
      if (!isConfigured) {
        return { success: false, message: 'Supabase is not configured.' };
      }

      setSyncStatus('saving');
      try {
        const effectiveId = userId || user?.id;
        const result = await supabaseService.pullFromCloud(effectiveId);

        if (!result.success || !result.data) {
          setSyncStatus('error');
          return {
            success: false,
            message: result.message,
            error: result.error,
          };
        }

        // If user has records in cloud, restore/merge them into IndexedDB
        if (
          result.data.dayRecords.length > 0 ||
          result.data.holidays.length > 0 ||
          result.data.settings
        ) {
          await backupService.restoreBackup(result.data, 'replace');
          await refreshAppData();
        }

        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);
        setSyncStatus('synced');

        return {
          success: true,
          message: result.message,
        };
      } catch (err: any) {
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        return {
          success: false,
          message: err?.message || 'Failed to pull data from Supabase',
          error: err?.message,
        };
      }
    },
    [isConfigured, user?.id, refreshAppData]
  );

  // Cloud Sync: Push full local state to Supabase
  const pushToSupabase = useCallback(
    async (userId?: string): Promise<SyncResult> => {
      if (!isConfigured) {
        return { success: false, message: 'Supabase is not configured.' };
      }

      setSyncStatus('saving');
      try {
        const allDays = await workLogRepository.getAllDayRecords();
        const currentHolidays = await holidayRepository.getHolidays();
        const currentSettings = await settingsRepository.getSettings();

        const effectiveId = userId || user?.id;
        const result = await supabaseService.pushToCloud(
          {
            dayRecords: allDays,
            holidays: currentHolidays,
            settings: currentSettings,
          },
          effectiveId
        );

        if (result.success) {
          const nowIso = new Date().toISOString();
          setLastSyncTime(nowIso);
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
        return result;
      } catch (err: any) {
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        return {
          success: false,
          message: err?.message || 'Failed to sync with Supabase',
          error: err?.message,
        };
      }
    },
    [isConfigured, user?.id]
  );

  // Instant Manual Sync Trigger
  const syncNow = useCallback(async () => {
    if (!isConfigured || !user) {
      return { success: false, message: 'User or Supabase not connected.' };
    }
    return pullFromSupabase(user.id);
  }, [isConfigured, user, pullFromSupabase]);

  // ON-THE-FLY AUTOMATIC SYNC ON AUTHENTICATION / USER SWITCH:
  // When a user signs in or the app loads with an active user, immediately retrieve latest data from Supabase
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isConfigured) {
      isInitialSyncDoneRef.current = false;
      prevUserIdRef.current = null;
      return;
    }

    // If user changed or first sync
    if (prevUserIdRef.current !== user.id || !isInitialSyncDoneRef.current) {
      prevUserIdRef.current = user.id;
      isInitialSyncDoneRef.current = true;

      // Silent background fetch on the go
      (async () => {
        try {
          const res = await supabaseService.pullFromCloud(user.id);
          if (res.success && res.data) {
            if (
              res.data.dayRecords.length > 0 ||
              res.data.holidays.length > 0
            ) {
              await backupService.restoreBackup(res.data, 'replace');
              await refreshAppData();
              setSyncStatus('synced');
              setLastSyncTime(new Date().toISOString());
            } else {
              // Cloud has 0 records; push any initial local records up to cloud
              const localDays = await workLogRepository.getAllDayRecords();
              if (localDays.length > 0) {
                await pushToSupabase(user.id);
              } else {
                setSyncStatus('synced');
              }
            }
          }
        } catch (err) {
          console.warn('Initial cloud sync notice:', err);
        }
      })();
    }
  }, [isAuthenticated, user?.id, isConfigured, refreshAppData, pushToSupabase]);

  // Auto-sync when user returns to window / tab (on the go refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user?.id && isConfigured) {
        pullFromSupabase(user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user?.id, isConfigured, pullFromSupabase]);

  // Holidays lookup map
  const holidaysMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    for (const h of holidays) {
      map.set(h.date, h);
    }
    return map;
  }, [holidays]);

  // Build the complete month map for every calendar day in the month
  const monthDaysMap = useMemo(() => {
    const map = new Map<string, DayRecord>();
    const allDates = getAllDatesInMonth(currentYear, currentMonth);

    // Populate existing DB records first
    for (const record of dbMonthDays) {
      map.set(record.date, record);
    }

    // Ensure every calendar day has a resolved record
    for (const date of allDates) {
      if (!map.has(date)) {
        const holiday = holidaysMap.get(date);
        let defaultType = DayType.WORKING;
        let defaultHours = settings.defaultWorkingHoursMinutes;

        if (holiday) {
          defaultType = DayType.COMPANY_HOLIDAY;
          defaultHours = 0;
        } else if (isWeekend(date, settings.weekendDays)) {
          defaultType = DayType.WEEKEND;
          defaultHours = 0;
        }

        map.set(date, {
          date,
          type: defaultType,
          hoursMinutes: defaultHours,
          entries: [],
        });
      } else {
        const existing = map.get(date)!;
        const holiday = holidaysMap.get(date);
        if (holiday && existing.type === DayType.WORKING && existing.entries.length === 0) {
          existing.type = DayType.COMPANY_HOLIDAY;
          existing.hoursMinutes = 0;
        }
      }
    }

    return map;
  }, [currentYear, currentMonth, dbMonthDays, holidaysMap, settings]);

  // Current day record for the selected date
  const currentDayRecord = useMemo((): DayRecord => {
    const existing = monthDaysMap.get(selectedDate);
    if (existing) return existing;

    const holiday = holidaysMap.get(selectedDate);
    if (holiday) {
      return {
        date: selectedDate,
        type: DayType.COMPANY_HOLIDAY,
        hoursMinutes: 0,
        entries: [],
      };
    }

    const isWknd = isWeekend(selectedDate, settings.weekendDays);
    return {
      date: selectedDate,
      type: isWknd ? DayType.WEEKEND : DayType.WORKING,
      hoursMinutes: isWknd ? 0 : settings.defaultWorkingHoursMinutes,
      entries: [],
    };
  }, [monthDaysMap, selectedDate, holidaysMap, settings]);

  // Compute dynamic monthly statistics
  const monthlyStats = useMemo((): MonthlyStats => {
    const daysCount = getDaysInMonth(currentYear, currentMonth);
    let totalWorkingDays = 0;
    let loggedWorkingDays = 0;
    let personalLeaveDays = 0;
    let sickLeaveDays = 0;
    let companyHolidayDays = 0;
    let otherLeaveDays = 0;
    let weekendDays = 0;
    let totalLoggedMinutes = 0;
    let totalEntriesCount = 0;

    monthDaysMap.forEach((record) => {
      switch (record.type) {
        case DayType.WORKING:
          totalWorkingDays++;
          if (record.entries && record.entries.length > 0) {
            loggedWorkingDays++;
            totalEntriesCount += record.entries.length;
          }
          totalLoggedMinutes += record.hoursMinutes || 0;
          break;
        case DayType.PERSONAL_LEAVE:
          personalLeaveDays++;
          break;
        case DayType.SICK_LEAVE:
          sickLeaveDays++;
          break;
        case DayType.COMPANY_HOLIDAY:
          companyHolidayDays++;
          break;
        case DayType.OTHER:
          otherLeaveDays++;
          break;
        case DayType.WEEKEND:
          weekendDays++;
          break;
      }
    });

    const missingWorkingDays = Math.max(0, totalWorkingDays - loggedWorkingDays);

    return {
      year: currentYear,
      month: currentMonth,
      monthName: getMonthName(currentMonth),
      totalCalendarDays: daysCount,
      totalWorkingDays,
      loggedWorkingDays,
      missingWorkingDays,
      personalLeaveDays,
      sickLeaveDays,
      companyHolidayDays,
      otherLeaveDays,
      weekendDays,
      totalLoggedMinutes,
      totalLoggedHoursFormatted: formatMinutesToHhMm(totalLoggedMinutes),
      totalEntriesCount,
    };
  }, [currentYear, currentMonth, monthDaysMap]);

  // Validation issues
  const validationIssues = useMemo(() => {
    return validateMonthData(currentYear, currentMonth, monthDaysMap);
  }, [currentYear, currentMonth, monthDaysMap]);

  // Navigation handlers
  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    const parsed = parseDateIso(date);
    if (parsed.year !== currentYear || parsed.month !== currentMonth) {
      setCurrentYear(parsed.year);
      setCurrentMonth(parsed.month);
    }
  }, [currentYear, currentMonth]);

  const setCurrentMonthYear = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedDateState((prev) => {
      const parsed = parseDateIso(prev);
      const maxDays = getDaysInMonth(year, month);
      const targetDay = Math.min(parsed.day, maxDays);
      return formatDateIso(year, month, targetDay);
    });
  }, []);

  const setMonthAndYear = useCallback(
    (month: number, year: number) => {
      setCurrentMonthYear(year, month);
    },
    [setCurrentMonthYear]
  );

  const goToPreviousMonth = useCallback(() => {
    let newYear = currentYear;
    let newMonth = currentMonth - 1;
    if (newMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDateState((prev) => {
      const parsed = parseDateIso(prev);
      const maxDays = getDaysInMonth(newYear, newMonth);
      const targetDay = Math.min(parsed.day, maxDays);
      return formatDateIso(newYear, newMonth, targetDay);
    });
  }, [currentYear, currentMonth]);

  const goToNextMonth = useCallback(() => {
    let newYear = currentYear;
    let newMonth = currentMonth + 1;
    if (newMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDateState((prev) => {
      const parsed = parseDateIso(prev);
      const maxDays = getDaysInMonth(newYear, newMonth);
      const targetDay = Math.min(parsed.day, maxDays);
      return formatDateIso(newYear, newMonth, targetDay);
    });
  }, [currentYear, currentMonth]);

  const goToToday = useCallback(() => {
    const today = getTodayIso();
    const parsed = parseDateIso(today);
    setCurrentYear(parsed.year);
    setCurrentMonth(parsed.month);
    setSelectedDateState(today);
  }, []);

  // ================= ON-THE-GO MUTATIONS (IndexedDB + Supabase) =================

  /**
   * 1. Save Day Record: writes instantly to IndexedDB, then triggers on-the-fly Supabase cloud save
   */
  const saveCurrentDayRecord = useCallback(
    async (dayRecord: DayRecord) => {
      // 1. Instant local IndexedDB write
      await workLogRepository.saveDay(dayRecord);
      const updated = await workLogRepository.getMonthDays(currentYear, currentMonth);
      setDbMonthDays(updated);

      // 2. On-the-go background cloud write to Supabase
      if (isConfigured && user?.id) {
        setSyncStatus('saving');
        supabaseService
          .saveDayToCloud(dayRecord, user.id)
          .then((res) => {
            if (res.success) {
              setSyncStatus('synced');
              setLastSyncTime(new Date().toISOString());
            } else {
              setSyncStatus(navigator.onLine ? 'error' : 'offline');
            }
          })
          .catch(() => {
            setSyncStatus(navigator.onLine ? 'error' : 'offline');
          });
      }
    },
    [currentYear, currentMonth, isConfigured, user?.id]
  );

  /**
   * 2. Update Day Type: writes instantly to IndexedDB, then syncs day to Supabase on the fly
   */
  const updateDayType = useCallback(
    async (date: string, type: DayType, hoursMinutes?: number, notes?: string) => {
      // 1. Instant local IndexedDB write
      await workLogRepository.updateDayType(date, type, hoursMinutes, notes);
      const updated = await workLogRepository.getMonthDays(currentYear, currentMonth);
      setDbMonthDays(updated);

      // 2. On-the-go background cloud write to Supabase
      if (isConfigured && user?.id) {
        setSyncStatus('saving');
        workLogRepository.getDay(date).then((fullDay) => {
          if (fullDay) {
            supabaseService
              .saveDayToCloud(fullDay, user.id)
              .then((res) => {
                if (res.success) {
                  setSyncStatus('synced');
                  setLastSyncTime(new Date().toISOString());
                } else {
                  setSyncStatus(navigator.onLine ? 'error' : 'offline');
                }
              })
              .catch(() => {
                setSyncStatus(navigator.onLine ? 'error' : 'offline');
              });
          }
        });
      }
    },
    [currentYear, currentMonth, isConfigured, user?.id]
  );

  /**
   * 3. Update Date Range Type: writes range to IndexedDB, then batch pushes to Supabase on the fly
   */
  const updateDateRangeType = useCallback(
    async (startDate: string, endDate: string, type: DayType, hoursMinutes?: number) => {
      // 1. Instant local IndexedDB write
      await workLogRepository.updateDayRangeType(startDate, endDate, type, hoursMinutes);
      const updated = await workLogRepository.getMonthDays(currentYear, currentMonth);
      setDbMonthDays(updated);

      // 2. On-the-go background cloud write to Supabase
      if (isConfigured && user?.id) {
        setSyncStatus('saving');
        workLogRepository.getAllDayRecords().then((allDays) => {
          const rangeDays = allDays.filter((d) => d.date >= startDate && d.date <= endDate);
          supabaseService
            .saveDaysBatchToCloud(rangeDays, user.id)
            .then((res) => {
              if (res.success) {
                setSyncStatus('synced');
                setLastSyncTime(new Date().toISOString());
              } else {
                setSyncStatus(navigator.onLine ? 'error' : 'offline');
              }
            })
            .catch(() => {
              setSyncStatus(navigator.onLine ? 'error' : 'offline');
            });
        });
      }
    },
    [currentYear, currentMonth, isConfigured, user?.id]
  );

  /**
   * 4. Save Holiday: writes to IndexedDB, then saves to Supabase on the fly
   */
  const saveHoliday = useCallback(
    async (holiday: Holiday) => {
      // 1. Instant local IndexedDB write
      await holidayRepository.saveHoliday(holiday);
      const updatedHolidays = await holidayRepository.getHolidays();
      setHolidays(updatedHolidays);

      // 2. On-the-go background cloud write to Supabase
      if (isConfigured && user?.id) {
        setSyncStatus('saving');
        supabaseService
          .saveHolidayToCloud(holiday, user.id)
          .then((res) => {
            if (res.success) {
              setSyncStatus('synced');
              setLastSyncTime(new Date().toISOString());
            } else {
              setSyncStatus(navigator.onLine ? 'error' : 'offline');
            }
          })
          .catch(() => {
            setSyncStatus(navigator.onLine ? 'error' : 'offline');
          });
      }
    },
    [isConfigured, user?.id]
  );

  /**
   * 5. Delete Holiday: deletes from IndexedDB, then deletes from Supabase on the fly
   */
  const deleteHoliday = useCallback(
    async (id: string) => {
      // 1. Instant local IndexedDB write
      await holidayRepository.deleteHoliday(id);
      const updatedHolidays = await holidayRepository.getHolidays();
      setHolidays(updatedHolidays);

      // 2. On-the-go background cloud deletion in Supabase
      if (isConfigured && user?.id) {
        setSyncStatus('saving');
        supabaseService
          .deleteHolidayFromCloud(id, user.id)
          .then((res) => {
            if (res.success) {
              setSyncStatus('synced');
              setLastSyncTime(new Date().toISOString());
            } else {
              setSyncStatus(navigator.onLine ? 'error' : 'offline');
            }
          })
          .catch(() => {
            setSyncStatus(navigator.onLine ? 'error' : 'offline');
          });
      }
    },
    [isConfigured, user?.id]
  );

  /**
   * 6. Save Settings: writes to IndexedDB, then saves to Supabase on the fly
   */
  const saveSettings = useCallback(
    async (newSettings: Settings) => {
      // 1. Instant local IndexedDB write
      await settingsRepository.saveSettings(newSettings);
      setSettings(newSettings);
      refreshAppData();

      // 2. On-the-go background cloud write to Supabase
      if (isConfigured && user?.id) {
        setSyncStatus('saving');
        supabaseService
          .saveSettingsToCloud(newSettings, user.id)
          .then((res) => {
            if (res.success) {
              setSyncStatus('synced');
              setLastSyncTime(new Date().toISOString());
            } else {
              setSyncStatus(navigator.onLine ? 'error' : 'offline');
            }
          })
          .catch(() => {
            setSyncStatus(navigator.onLine ? 'error' : 'offline');
          });
      }
    },
    [refreshAppData, isConfigured, user?.id]
  );

  /**
   * 7. Clear All Data: clears IndexedDB and clears user's Supabase rows
   */
  const clearAllData = useCallback(async () => {
    await workLogRepository.clearAll();
    await refreshAppData();

    if (isConfigured && user?.id) {
      setSyncStatus('saving');
      await supabaseService.clearUserDataFromCloud(user.id);
      setSyncStatus('synced');
      setLastSyncTime(new Date().toISOString());
    }
  }, [refreshAppData, isConfigured, user?.id]);

  // Exports
  const exportExcel = useCallback(async () => {
    await downloadTimesheetExcel({
      year: currentYear,
      month: currentMonth,
      settings,
      dayRecordsMap: monthDaysMap,
      holidaysMap,
    });
  }, [currentYear, currentMonth, settings, monthDaysMap, holidaysMap]);

  const exportCsv = useCallback(() => {
    downloadTimesheetCsv({
      year: currentYear,
      month: currentMonth,
      settings,
      dayRecordsMap: monthDaysMap,
    });
  }, [currentYear, currentMonth, settings, monthDaysMap]);

  const exportBackup = useCallback(async () => {
    await backupService.exportBackupFile();
  }, []);

  const importBackup = useCallback(
    async (backup: BackupData, strategy: 'merge' | 'replace') => {
      await backupService.restoreBackup(backup, strategy);
      await refreshAppData();

      // Push restored backup to Supabase on the go
      if (isConfigured && user?.id) {
        await pushToSupabase(user.id);
      }
    },
    [refreshAppData, isConfigured, user?.id, pushToSupabase]
  );

  // Seed sample August 2026 data for instant showcase
  const loadSampleAugust2026Data = useCallback(async () => {
    const year = 2026;
    const month = 7; // August

    // Add Independence day holiday
    const indepHoliday: Holiday = {
      id: 'hol-aug-15',
      date: '2026-08-15',
      name: 'Independence Day',
      description: 'National holiday',
    };
    await holidayRepository.saveHoliday(indepHoliday);

    // Sample work items
    const sampleWorkData: { day: number; tickets: string[]; desc: string; pr?: string; branch?: string; status?: string }[] = [
      {
        day: 3,
        tickets: ['ARIA-5501'],
        desc: 'Implemented pagination and server-side filtering for My Work items',
        pr: 'https://github.com/EvolverHub/frontend/pull/542',
        branch: 'feature/aria-5501-pagination',
        status: 'Done',
      },
      {
        day: 4,
        tickets: ['ARIA-5520'],
        desc: 'Fixed dropdown positioning bug on high-DPI displays',
        pr: 'https://github.com/EvolverHub/frontend/pull/544',
        branch: 'bugfix/aria-5520-dropdown',
        status: 'Done',
      },
      {
        day: 5,
        tickets: ['ARIA-5545', 'ARIA-5546'],
        desc: 'Refactored state caching layer and added debounced search',
        pr: 'https://github.com/EvolverHub/frontend/pull/548',
        branch: 'feature/aria-5545-cache',
        status: 'Done',
      },
      {
        day: 6,
        tickets: ['ARIA-5580'],
        desc: 'Added unit and integration test coverage for timesheet export',
        branch: 'test/aria-5580-export',
        status: 'In Review',
      },
      {
        day: 7,
        tickets: ['ARIA-5610'],
        desc: 'Reviewed PR #549 and conducted sprint planning meeting',
        status: 'Done',
      },
      {
        day: 10,
        tickets: ['ARIA-5640'],
        desc: 'Migrated legacy date-fns helpers to native high-performance utilities',
        pr: 'https://github.com/EvolverHub/frontend/pull/552',
        branch: 'refactor/aria-5640-dates',
        status: 'Done',
      },
      {
        day: 11,
        tickets: ['ARIA-5680'],
        desc: 'Implemented custom tooltip styling and keyboard accessibility',
        status: 'Done',
      },
      {
        day: 12,
        tickets: ['ARIA-5712'],
        desc: 'Fixed memory leak in WebSocket connection retry backoff',
        pr: 'https://github.com/EvolverHub/frontend/pull/556',
        branch: 'bugfix/aria-5712-ws-leak',
        status: 'Done',
      },
      {
        day: 13,
        tickets: ['ARIA-5750'],
        desc: 'Built batch action bar for bulk ticket status transitions',
        branch: 'feature/aria-5750-bulk',
        status: 'In Progress',
      },
      {
        day: 14,
        tickets: ['ARIA-5785'],
        desc: 'Completed performance benchmarking and reduced bundle size by 18%',
        status: 'Done',
      },
      {
        day: 17,
        tickets: ['ARIA-5810'],
        desc: 'Added CSV and Excel custom column formatter options',
        pr: 'https://github.com/EvolverHub/frontend/pull/560',
        branch: 'feature/aria-5810-formatters',
        status: 'Done',
      },
      {
        day: 18,
        tickets: ['ARIA-5830'],
        desc: 'Resolved race condition in async Dexie transaction lifecycle',
        status: 'Done',
      },
      {
        day: 19,
        tickets: ['ARIA-5854'],
        desc: 'Added reanalyzing status support to My Work with responsive live feedback',
        pr: 'https://github.com/EvolverHub/frontend/pull/550',
        branch: 'feature/aria-5854',
        status: 'Done',
      },
      {
        day: 20,
        tickets: ['ARIA-5890'],
        desc: 'Updated API error boundary to display helpful fallback banners',
        status: 'Done',
      },
      {
        day: 21,
        tickets: ['ARIA-5920'],
        desc: 'Configured Vitest test runner and verified all 18 test suites',
        branch: 'test/aria-5920-vitest',
        status: 'Done',
      },
    ];

    for (const item of sampleWorkData) {
      const dateIso = formatDateIso(year, month, item.day);
      const entry: WorkLogEntry = {
        id: `sample-${dateIso}-1`,
        date: dateIso,
        tickets: item.tickets,
        description: item.desc,
        prUrl: item.pr,
        prNumber: item.pr ? parseInt(item.pr.split('/').pop() || '0', 10) : undefined,
        branch: item.branch,
        status: item.status,
        client: 'Evolver',
        project: 'ARIA',
        job: 'Development',
        hoursMinutes: 480,
        createdAt: `${dateIso}T09:00:00Z`,
        updatedAt: `${dateIso}T18:00:00Z`,
      };

      await workLogRepository.saveDay({
        date: dateIso,
        type: DayType.WORKING,
        hoursMinutes: 480,
        entries: [entry],
      });
    }

    // Set Personal leave for Aug 24-26
    await workLogRepository.updateDayRangeType('2026-08-24', '2026-08-26', DayType.PERSONAL_LEAVE, 0);

    // Switch view to August 2026
    setCurrentYear(2026);
    setCurrentMonth(7);
    setSelectedDateState('2026-08-21');

    await refreshAppData();

    // Push all sample data to Supabase on the go
    if (isConfigured && user?.id) {
      await pushToSupabase(user.id);
    }
  }, [refreshAppData, isConfigured, user?.id, pushToSupabase]);

  return (
    <WorkLogContext.Provider
      value={{
        selectedDate,
        currentYear,
        currentMonth,
        settings,
        holidays,
        monthDaysMap,
        holidaysMap,
        currentDayRecord,
        monthlyStats,
        validationIssues,
        isLoading,
        syncStatus,
        lastSyncTime,
        isOnline,
        setSelectedDate,
        setCurrentMonthYear,
        setMonthAndYear,
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
        saveCurrentDayRecord,
        updateDayType,
        updateDateRangeType,
        saveHoliday,
        deleteHoliday,
        saveSettings,
        refreshAppData,
        syncNow,
        pushToSupabase,
        pullFromSupabase,
        exportExcel,
        exportCsv,
        exportBackup,
        importBackup,
        loadSampleAugust2026Data,
        clearAllData,
      }}
    >
      {children}
    </WorkLogContext.Provider>
  );
};

export function useWorkLog() {
  const context = useContext(WorkLogContext);
  if (!context) {
    throw new Error('useWorkLog must be used within a WorkLogProvider');
  }
  return context;
}

