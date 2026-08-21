import React, { useState, useMemo } from 'react';
import {
  formatDateIso,
  getDaysInMonth,
  getTodayIso,
  formatDisplayDate,
  formatShortDate,
  parseDateIso,
} from '../../utils/dates';
import { formatMinutesForBadge, formatMinutesToDecimalHours } from '../../utils/formatting';
import { useWorkLog } from '../../context/WorkLogContext';
import { DayType, DayRecord } from '../../models/types';
import {
  CheckCircle2,
  AlertCircle,
  Umbrella,
  Flag,
  Coffee,
  ArrowRight,
  LayoutGrid,
  List,
  CalendarRange,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Briefcase,
  Check,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface MonthCalendarProps {
  onSelectDayForEntry: (dateIso: string) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({ onSelectDayForEntry }) => {
  const {
    currentYear,
    currentMonth,
    selectedDate,
    setSelectedDate,
    monthDaysMap,
    holidaysMap,
    updateDayType,
    settings,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setCurrentMonthYear,
  } = useWorkLog();

  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'week' | 'list'>('grid');

  const todayIso = getTodayIso();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  // Day of week for 1st of month (0 = Sun, 1 = Mon, etc.)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Weekday labels (Sunday to Saturday)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const mobileWeekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Days list in current month
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Current selected date record & meta
  const selectedRecord = monthDaysMap.get(selectedDate);
  const selectedHoliday = holidaysMap.get(selectedDate);

  // Calculate current week dates for Week View
  const currentWeekDates = useMemo(() => {
    const parsed = parseDateIso(selectedDate);
    const dateObj = new Date(parsed.year, parsed.month, parsed.day);
    const dayOfWeek = dateObj.getDay(); // 0 is Sun

    const startOfWeek = new Date(dateObj);
    startOfWeek.setDate(dateObj.getDate() - dayOfWeek);

    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(formatDateIso(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return week;
  }, [selectedDate]);

  const handlePrevMonth = () => {
    if (calendarViewMode === 'week') {
      const parsed = parseDateIso(selectedDate);
      const prevWeekDate = new Date(parsed.year, parsed.month, parsed.day - 7);
      const newIso = formatDateIso(prevWeekDate.getFullYear(), prevWeekDate.getMonth(), prevWeekDate.getDate());
      setSelectedDate(newIso);
    } else {
      goToPreviousMonth();
    }
  };

  const handleNextMonth = () => {
    if (calendarViewMode === 'week') {
      const parsed = parseDateIso(selectedDate);
      const nextWeekDate = new Date(parsed.year, parsed.month, parsed.day + 7);
      const newIso = formatDateIso(nextWeekDate.getFullYear(), nextWeekDate.getMonth(), nextWeekDate.getDate());
      setSelectedDate(newIso);
    } else {
      goToNextMonth();
    }
  };

  const handleJumpToToday = () => {
    goToToday();
  };

  const getDayStatusMeta = (record: DayRecord | undefined, dateIso: string) => {
    const isSelected = dateIso === selectedDate;
    const holiday = holidaysMap.get(dateIso);

    if (!record) {
      return {
        label: 'Unset',
        bg: 'bg-muted/40 border-border text-muted-foreground',
        dotColor: 'bg-muted-foreground',
        badge: null,
      };
    }

    switch (record.type) {
      case DayType.WORKING: {
        const hasEntries = record.entries && record.entries.length > 0;
        if (hasEntries) {
          return {
            label: 'Working',
            bg: isSelected
              ? 'bg-card border-primary ring-1 ring-primary shadow-xs'
              : 'bg-card hover:bg-muted/40 border-border/80 text-card-foreground',
            badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
            dotColor: 'bg-emerald-500',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
            hours: formatMinutesForBadge(record.hoursMinutes),
            entriesCount: record.entries.length,
            tickets: record.entries.flatMap((e) => e.tickets || []).slice(0, 2),
          };
        } else {
          return {
            label: 'Missing Entry',
            bg: isSelected
              ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 shadow-xs'
              : 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 text-card-foreground',
            badgeBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
            dotColor: 'bg-amber-500',
            icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
            hours: formatMinutesForBadge(record.hoursMinutes),
            isMissing: true,
          };
        }
      }
      case DayType.WEEKEND:
        return {
          label: 'Weekend',
          bg: isSelected
            ? 'bg-muted/70 border-foreground/30 ring-1 ring-foreground/20'
            : 'bg-muted/25 hover:bg-muted/50 border-border/60 text-muted-foreground',
          badgeBg: 'bg-muted text-muted-foreground border-border',
          dotColor: 'bg-muted-foreground/50',
          icon: <Coffee className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />,
          isWeekend: true,
        };
      case DayType.PERSONAL_LEAVE:
        return {
          label: 'Personal Leave',
          bg: isSelected
            ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500 shadow-xs'
            : 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 text-card-foreground',
          badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
          dotColor: 'bg-indigo-500',
          icon: <Umbrella className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />,
        };
      case DayType.SICK_LEAVE:
        return {
          label: 'Sick Leave',
          bg: isSelected
            ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500 shadow-xs'
            : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-card-foreground',
          badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
          dotColor: 'bg-rose-500',
          icon: <Umbrella className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />,
        };
      case DayType.COMPANY_HOLIDAY:
        return {
          label: holiday ? holiday.name : 'Company Holiday',
          bg: isSelected
            ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500 shadow-xs'
            : 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-card-foreground',
          badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
          dotColor: 'bg-purple-500',
          icon: <Flag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />,
          holidayName: holiday?.name,
        };
      case DayType.OTHER:
        return {
          label: record.notes || 'Other Leave',
          bg: isSelected
            ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500 shadow-xs'
            : 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 text-card-foreground',
          badgeBg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
          dotColor: 'bg-orange-500',
          icon: <Umbrella className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />,
        };
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-xs">
        {/* Calendar Header with Navigation Controls */}
        <CardHeader className="p-3.5 sm:p-5 border-b border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Month / Week Title & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="iconSm"
                id="btn-calendar-prev-month"
                onClick={handlePrevMonth}
                title={calendarViewMode === 'week' ? 'Previous Week' : 'Previous Month'}
                aria-label={calendarViewMode === 'week' ? 'Previous Week' : 'Previous Month'}
                className="h-7 w-7 rounded-md shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground text-base sm:text-lg tracking-tight">
                  {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}{' '}
                  {currentYear}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  id="btn-calendar-today"
                  onClick={handleJumpToToday}
                  className="text-[11px] h-6 px-1.5 font-semibold text-primary hover:bg-primary/10 rounded-md shrink-0 cursor-pointer"
                >
                  Today
                </Button>
              </div>

              <Button
                variant="outline"
                size="iconSm"
                id="btn-calendar-next-month"
                onClick={handleNextMonth}
                title={calendarViewMode === 'week' ? 'Next Week' : 'Next Month'}
                aria-label={calendarViewMode === 'week' ? 'Next Week' : 'Next Month'}
                className="h-7 w-7 rounded-md shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* View Mode Toggle: Month Grid / Week View / Agenda */}
            <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setCalendarViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  calendarViewMode === 'grid'
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarViewMode('week')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  calendarViewMode === 'week'
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Week</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  calendarViewMode === 'list'
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>
          </div>

          {/* Status Indicators Legend */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
            <span className="font-medium text-foreground">Status:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Logged</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Missing Update</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 shrink-0" />
              <span>Weekend</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span>Leave</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span>Holiday</span>
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-2.5 sm:p-5">
          {/* 1. MONTH GRID VIEW (Clean mobile tiles & rich desktop cards) */}
          {calendarViewMode === 'grid' && (
            <div className="w-full">
              {/* Weekday Grid Header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5 sm:mb-2 text-center">
                {weekdays.map((w, idx) => (
                  <div
                    key={w}
                    className={`text-[11px] sm:text-xs font-bold py-1 sm:py-1.5 rounded-lg sm:rounded-xl select-none ${
                      idx === 0 || idx === 6
                        ? 'text-muted-foreground/70 bg-muted/40'
                        : 'text-foreground bg-muted/70'
                    }`}
                  >
                    <span className="hidden sm:inline">{w}</span>
                    <span className="sm:hidden">{mobileWeekdays[idx]}</span>
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Leading empty cells for month offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-12 sm:min-h-[105px] rounded-lg sm:rounded-xl bg-muted/15 border border-dashed border-border/40"
                  />
                ))}

                {/* Days of the month */}
                {days.map((dayNum) => {
                  const dateIso = formatDateIso(currentYear, currentMonth, dayNum);
                  const record = monthDaysMap.get(dateIso);
                  const meta = getDayStatusMeta(record, dateIso);
                  const isToday = dateIso === todayIso;
                  const isSelected = dateIso === selectedDate;
                  const isWorking = record?.type === DayType.WORKING;
                  const hasEntries = isWorking && record.entries && record.entries.length > 0;
                  const isMissing = isWorking && !hasEntries;

                  return (
                    <div
                      key={dateIso}
                      id={`cal-day-${dateIso}`}
                      onClick={() => setSelectedDate(dateIso)}
                      onDoubleClick={() => onSelectDayForEntry(dateIso)}
                      className={`h-13 sm:h-auto sm:min-h-[105px] p-1 sm:p-2.5 rounded-lg sm:rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-150 relative group select-none ${
                        meta.bg
                      } ${isSelected ? 'ring-2 ring-amber-500 dark:ring-amber-400 shadow-xs' : 'hover:shadow-2xs'}`}
                    >
                      {/* === MOBILE DAY VIEW (< sm) === */}
                      <div className="flex flex-col items-center justify-center h-full sm:hidden py-0.5">
                        {/* Day Number Circle */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${
                            isToday
                              ? 'bg-amber-500 text-white shadow-xs scale-105'
                              : isSelected
                              ? 'bg-foreground text-background scale-105'
                              : 'text-foreground'
                          }`}
                        >
                          {dayNum}
                        </div>

                        {/* Status Indicator Dot or Mini Pill */}
                        <div className="mt-1 flex items-center justify-center gap-1">
                          {isWorking ? (
                            hasEntries ? (
                              <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-300 leading-none">
                                {meta.hours}
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )
                          ) : record?.type === DayType.WEEKEND ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 opacity-60" />
                          ) : record?.type === DayType.COMPANY_HOLIDAY ? (
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                          ) : record?.type === DayType.PERSONAL_LEAVE ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          ) : record?.type === DayType.SICK_LEAVE ? (
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                        </div>
                      </div>

                      {/* === DESKTOP DAY VIEW (sm and up) === */}
                      <div className="hidden sm:flex flex-col justify-between h-full">
                        {/* Top: Day Number + Status Icon */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                isToday
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : isSelected
                                  ? 'bg-foreground text-background'
                                  : 'text-foreground'
                              }`}
                            >
                              {dayNum}
                            </span>
                            {isToday && (
                              <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider hidden lg:inline">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="shrink-0">{meta.icon}</div>
                        </div>

                        {/* Middle: Badges & Tasks preview */}
                        <div className="my-1">
                          {isWorking && (
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                                <span>{meta.hours}</span>
                                {meta.entriesCount !== undefined && meta.entriesCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    {meta.entriesCount} {meta.entriesCount === 1 ? 'task' : 'tasks'}
                                  </span>
                                )}
                              </div>

                              {meta.tickets && meta.tickets.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {meta.tickets.map((t) => (
                                    <span
                                      key={t}
                                      className="px-1 py-0.2 text-[9px] font-mono font-semibold bg-muted text-foreground border border-border rounded truncate max-w-full"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {isMissing && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-800">
                                  Missing
                                </span>
                              )}
                            </div>
                          )}

                          {record?.type === DayType.WEEKEND && (
                            <div className="text-[11px] text-muted-foreground/80 font-medium">
                              Weekend
                            </div>
                          )}

                          {record?.type === DayType.PERSONAL_LEAVE && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 rounded truncate max-w-full">
                              Leave
                            </span>
                          )}

                          {record?.type === DayType.SICK_LEAVE && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 rounded truncate max-w-full">
                              Sick
                            </span>
                          )}

                          {record?.type === DayType.COMPANY_HOLIDAY && (
                            <span
                              className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 rounded truncate max-w-full"
                              title={meta.holidayName}
                            >
                              {meta.holidayName || 'Holiday'}
                            </span>
                          )}

                          {record?.type === DayType.OTHER && (
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-300 rounded truncate max-w-full">
                              {record.notes || 'Other'}
                            </span>
                          )}
                        </div>

                        {/* Bottom: Action bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDayForEntry(dateIso);
                            }}
                            className="text-muted-foreground hover:text-foreground font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Edit</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>

                          {record?.type === DayType.WEEKEND && (
                            <button
                              type="button"
                              title="Change weekend to working day"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateDayType(dateIso, DayType.WORKING, settings.defaultWorkingHoursMinutes);
                              }}
                              className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 px-1 rounded transition-colors text-[9px] font-semibold cursor-pointer"
                            >
                              +Work
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW (Spacious horizontal cards for active week) */}
          {calendarViewMode === 'week' && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-muted-foreground px-1 pb-1 flex items-center justify-between">
                <span>Week of {formatDisplayDate(currentWeekDates[0])}</span>
                <span>7 Days</span>
              </div>

              {currentWeekDates.map((dateIso) => {
                const record = monthDaysMap.get(dateIso);
                const holiday = holidaysMap.get(dateIso);
                const meta = getDayStatusMeta(record, dateIso);
                const isToday = dateIso === todayIso;
                const isSelected = dateIso === selectedDate;
                const isWorking = record?.type === DayType.WORKING;
                const hasEntries = isWorking && record.entries && record.entries.length > 0;
                const isMissing = isWorking && !hasEntries;

                return (
                  <div
                    key={dateIso}
                    onClick={() => setSelectedDate(dateIso)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      meta.bg
                    } ${isSelected ? 'ring-2 ring-amber-500 shadow-xs' : 'hover:border-foreground/30'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isToday
                              ? 'bg-amber-500 text-white'
                              : isSelected
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {parseDateIso(dateIso).day}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {formatDisplayDate(dateIso).split(',')[0]} &bull; {formatShortDate(dateIso)}
                            </span>
                            {isToday && (
                              <Badge variant="amber" className="text-[10px] px-1.5 py-0 font-bold">
                                Today
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {holiday ? `Holiday: ${holiday.name}` : meta.label}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isWorking && (
                          <span className="font-mono font-bold text-xs text-foreground bg-muted/80 px-2 py-1 rounded-lg border border-border">
                            {meta.hours}
                          </span>
                        )}

                        <Button
                          size="sm"
                          variant={isMissing ? 'amber' : 'default'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDayForEntry(dateIso);
                          }}
                          className="gap-1.5 text-xs font-bold h-8"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isMissing ? 'Log Work' : 'Edit'}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Entries list if present */}
                    {hasEntries && (
                      <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1.5">
                        {record.entries.map((entry, idx) => (
                          <div
                            key={entry.id || idx}
                            className="text-xs flex items-start gap-2 bg-muted/40 p-2 rounded-lg"
                          >
                            <span className="font-mono font-bold text-foreground shrink-0">
                              {(entry.tickets || []).join(', ') || 'Task'}:
                            </span>
                            <span className="text-foreground flex-1 truncate">
                              {entry.description || 'Logged entry'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. AGENDA / LIST VIEW (Full month scrollable list) */}
          {calendarViewMode === 'list' && (
            <div className="space-y-2">
              {days.map((dayNum) => {
                const dateIso = formatDateIso(currentYear, currentMonth, dayNum);
                const record = monthDaysMap.get(dateIso);
                const holiday = holidaysMap.get(dateIso);
                const meta = getDayStatusMeta(record, dateIso);
                const isToday = dateIso === todayIso;
                const isSelected = dateIso === selectedDate;
                const isWorking = record?.type === DayType.WORKING;
                const hasEntries = isWorking && record.entries && record.entries.length > 0;
                const isMissing = isWorking && !hasEntries;

                return (
                  <div
                    key={dateIso}
                    onClick={() => setSelectedDate(dateIso)}
                    className={`p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      meta.bg
                    } ${isSelected ? 'ring-2 ring-amber-500 shadow-xs' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                          isToday
                            ? 'bg-amber-500 text-white'
                            : isSelected
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {dayNum}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {formatShortDate(dateIso)}
                          </span>
                          {isToday && (
                            <Badge variant="amber" className="text-[10px] px-1.5 py-0 font-bold">
                              Today
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground font-medium">
                            &bull; {holiday ? `Holiday: ${holiday.name}` : meta.label}
                          </span>
                        </div>

                        {hasEntries ? (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {record.entries.map((e) => e.description).filter(Boolean).join('; ') || 'Work entries logged'}
                          </p>
                        ) : isMissing ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                            Working day missing update
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-0.5">
                            {record?.type.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                      {isWorking && (
                        <span className="font-mono font-bold text-xs text-foreground bg-muted px-2 py-1 rounded-lg">
                          {meta.hours}
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant={isMissing ? 'amber' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDayForEntry(dateIso);
                        }}
                        className="gap-1 text-xs h-7 sm:h-8 font-semibold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isMissing ? 'Log Work' : 'Edit'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. DEDICATED SELECTED DAY INSPECTOR & QUICK ACTIONS CARD (Clean on Mobile & Desktop) */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-3.5 sm:p-5 pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  selectedDate === todayIso
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-primary/15 text-primary'
                }`}
              >
                {parseDateIso(selectedDate).day}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base sm:text-lg font-bold">
                    {formatDisplayDate(selectedDate)}
                  </CardTitle>
                  {selectedDate === todayIso && (
                    <Badge variant="amber" className="text-[10px] font-bold">
                      Today
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Status:{' '}
                  <span className="font-semibold text-foreground">
                    {selectedHoliday
                      ? `Company Holiday (${selectedHoliday.name})`
                      : selectedRecord?.type.replace('_', ' ') || 'Unset'}
                  </span>
                  {selectedRecord?.type === DayType.WORKING && (
                    <span> &bull; {formatMinutesToDecimalHours(selectedRecord.hoursMinutes)} hrs scheduled</span>
                  )}
                </p>
              </div>
            </div>

            {/* Primary Log / Edit Action Button */}
            <Button
              variant="default"
              size="sm"
              id="btn-inspect-log-work"
              onClick={() => onSelectDayForEntry(selectedDate)}
              className="gap-2 font-medium shrink-0 self-stretch sm:self-auto h-8 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>
                {selectedRecord?.type === DayType.WORKING && (!selectedRecord.entries || selectedRecord.entries.length === 0)
                  ? 'Log Work for this Day'
                  : 'Open Daily Log Editor'}
              </span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-5 space-y-4">
          {/* Quick 1-Tap Day Classification Switcher */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Quick Day Classification
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <Button
                type="button"
                variant={selectedRecord?.type === DayType.WORKING ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDayType(selectedDate, DayType.WORKING, settings.defaultWorkingHoursMinutes)}
                className="justify-start sm:justify-center text-xs h-8 gap-1.5 font-medium rounded-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Working</span>
              </Button>

              <Button
                type="button"
                variant={selectedRecord?.type === DayType.WEEKEND ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDayType(selectedDate, DayType.WEEKEND, 0)}
                className="justify-start sm:justify-center text-xs h-8 gap-1.5 font-medium rounded-md"
              >
                <Coffee className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Weekend</span>
              </Button>

              <Button
                type="button"
                variant={selectedRecord?.type === DayType.PERSONAL_LEAVE ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDayType(selectedDate, DayType.PERSONAL_LEAVE, 0)}
                className="justify-start sm:justify-center text-xs h-8 gap-1.5 font-medium rounded-md"
              >
                <Umbrella className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Personal Leave</span>
              </Button>

              <Button
                type="button"
                variant={selectedRecord?.type === DayType.SICK_LEAVE ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDayType(selectedDate, DayType.SICK_LEAVE, 0)}
                className="justify-start sm:justify-center text-xs h-8 gap-1.5 font-medium rounded-md"
              >
                <Umbrella className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Sick Leave</span>
              </Button>

              <Button
                type="button"
                variant={selectedRecord?.type === DayType.COMPANY_HOLIDAY ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateDayType(selectedDate, DayType.COMPANY_HOLIDAY, 0)}
                className="col-span-2 sm:col-span-1 justify-start sm:justify-center text-xs h-8 gap-1.5 font-medium rounded-md"
              >
                <Flag className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>Holiday</span>
              </Button>
            </div>
          </div>

          {/* Logged Tasks preview for Selected Day */}
          {selectedRecord?.type === DayType.WORKING && (
            <div className="pt-3 border-t border-border">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Work Updates on {formatShortDate(selectedDate)} ({selectedRecord.entries?.length || 0})
              </span>

              {selectedRecord.entries && selectedRecord.entries.length > 0 ? (
                <div className="space-y-2">
                  {selectedRecord.entries.map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="p-3 bg-muted/30 rounded-lg border border-border text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
                          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{(entry.tickets || []).join(', ') || 'General Work'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            {entry.client} / {entry.project}
                          </Badge>
                          <span className="font-mono font-semibold text-foreground">
                            {formatMinutesForBadge(entry.hoursMinutes)}
                          </span>
                        </div>
                      </div>

                      <p className="text-foreground leading-relaxed font-normal text-xs">
                        {entry.description || <span className="text-muted-foreground italic">No description</span>}
                      </p>

                      {entry.prUrl && (
                        <a
                          href={entry.prUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline pt-0.5"
                        >
                          <span>{entry.prNumber ? `PR #${entry.prNumber}` : 'PR Link'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>No work entries logged yet for this working day.</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectDayForEntry(selectedDate)}
                    className="text-xs font-semibold h-7 shrink-0 border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
                  >
                    Log Entry
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
