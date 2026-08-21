import React, { useState } from 'react';
import { useWorkLog } from '../../context/WorkLogContext';
import { DayType, Holiday } from '../../models/types';
import {
  formatDateIso,
  formatDisplayDate,
  getTodayIso,
} from '../../utils/dates';
import {
  Umbrella,
  Flag,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';

export const HolidayLeaveManager: React.FC = () => {
  const {
    currentYear,
    currentMonth,
    holidays,
    saveHoliday,
    deleteHoliday,
    updateDateRangeType,
  } = useWorkLog();

  // Batch Range Leave State
  const [rangeStart, setRangeStart] = useState<string>(getTodayIso());
  const [rangeEnd, setRangeEnd] = useState<string>(getTodayIso());
  const [rangeType, setRangeType] = useState<DayType>(DayType.PERSONAL_LEAVE);
  const [rangeFeedback, setRangeFeedback] = useState<string | null>(null);
  const [isSubmittingRange, setIsSubmittingRange] = useState(false);

  // New Holiday State
  const [newHolidayDate, setNewHolidayDate] = useState<string>(
    formatDateIso(currentYear, currentMonth, 15)
  );
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [holidayFeedback, setHolidayFeedback] = useState<string | null>(null);
  const [isSubmittingHoliday, setIsSubmittingHoliday] = useState(false);

  // Apply Range Leave
  const handleApplyRangeLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd) return;

    setIsSubmittingRange(true);
    try {
      await updateDateRangeType(rangeStart, rangeEnd, rangeType, 0);
      const friendlyName = rangeType.replace(/_/g, ' ').toLowerCase();
      setRangeFeedback(`Marked ${rangeStart} to ${rangeEnd} as ${friendlyName}!`);
      setTimeout(() => setRangeFeedback(null), 3500);
    } finally {
      setIsSubmittingRange(false);
    }
  };

  // Quick Preset Handlers
  const handleSetPresetToday = () => {
    const today = getTodayIso();
    setRangeStart(today);
    setRangeEnd(today);
  };

  const handleSetPresetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = formatDateIso(d.getFullYear(), d.getMonth(), d.getDate());
    setRangeStart(tomorrow);
    setRangeEnd(tomorrow);
  };

  const handleSetPresetThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    setRangeStart(formatDateIso(monday.getFullYear(), monday.getMonth(), monday.getDate()));
    setRangeEnd(formatDateIso(friday.getFullYear(), friday.getMonth(), friday.getDate()));
  };

  // Add Company Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    setIsSubmittingHoliday(true);
    try {
      const holiday: Holiday = {
        id: `hol-${newHolidayDate}-${Date.now()}`,
        date: newHolidayDate,
        name: newHolidayName.trim(),
      };

      await saveHoliday(holiday);

      // Also mark that day as COMPANY_HOLIDAY in records
      await updateDateRangeType(newHolidayDate, newHolidayDate, DayType.COMPANY_HOLIDAY, 0);

      setNewHolidayName('');
      setHolidayFeedback(`Holiday "${holiday.name}" recorded for ${newHolidayDate}!`);
      setTimeout(() => setHolidayFeedback(null), 3500);
    } finally {
      setIsSubmittingHoliday(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full max-w-full">
      {/* 1. Date Range Leave Tool */}
      <Card className="border-border flex flex-col justify-between shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/80 text-foreground flex items-center justify-center shrink-0">
              <Umbrella className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Mark Leave or Absence Range
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apply leave or reset dates across multiple days
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          {rangeFeedback && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="flex-1 break-words">{rangeFeedback}</span>
            </div>
          )}

          <form onSubmit={handleApplyRangeLeave} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Quick Presets for Convenience */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetPresetToday}
                    className="h-7 text-xs px-2.5 rounded-md font-medium"
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetPresetTomorrow}
                    className="h-7 text-xs px-2.5 rounded-md font-medium"
                  >
                    Tomorrow
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetPresetThisWeek}
                    className="h-7 text-xs px-2.5 rounded-md font-medium"
                  >
                    Mon - Fri
                  </Button>
                </div>
              </div>

              {/* Start & End Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                <div className="w-full min-w-0">
                  <label htmlFor="input-range-start" className="block text-xs font-medium text-muted-foreground mb-1">
                    Start Date
                  </label>
                  <Input
                    id="input-range-start"
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    required
                    className="h-9 text-xs font-medium w-full"
                  />
                </div>

                <div className="w-full min-w-0">
                  <label htmlFor="input-range-end" className="block text-xs font-medium text-muted-foreground mb-1">
                    End Date
                  </label>
                  <Input
                    id="input-range-end"
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    required
                    className="h-9 text-xs font-medium w-full"
                  />
                </div>
              </div>

              {/* Classification Selector */}
              <div className="min-w-0">
                <label htmlFor="select-leave-type" className="block text-xs font-medium text-muted-foreground mb-1">
                  Leave Classification
                </label>
                <Select
                  value={rangeType}
                  onValueChange={(val) => setRangeType(val as DayType)}
                >
                  <SelectTrigger id="select-leave-type" className="w-full h-9 text-xs font-medium min-w-0">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DayType.PERSONAL_LEAVE}>Personal Leave (Vacation)</SelectItem>
                    <SelectItem value={DayType.SICK_LEAVE}>Sick Leave / Medical</SelectItem>
                    <SelectItem value={DayType.COMPANY_HOLIDAY}>Company / Public Holiday</SelectItem>
                    <SelectItem value={DayType.OTHER}>Other Non-Working Leave</SelectItem>
                    <SelectItem value={DayType.WORKING}>Working Day (Clear / Reset)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-2.5 bg-muted/30 rounded-lg text-xs text-muted-foreground leading-relaxed border border-border">
                <span className="font-medium text-foreground">Note:</span> Applying leave clears logged hours for the selected range and marks rows as non-working in your timesheet.
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                id="btn-apply-leave-range"
                variant="default"
                disabled={isSubmittingRange}
                className="w-full h-9 font-medium text-xs rounded-lg"
              >
                {isSubmittingRange ? 'Applying...' : 'Apply Leave Range'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 2. Company Holidays Manager */}
      <Card className="border-border flex flex-col justify-between shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/80 text-foreground flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                Company Holidays
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage recognized public holidays and closures
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          {holidayFeedback && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="flex-1 break-words">{holidayFeedback}</span>
            </div>
          )}

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border">
            <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Add Holiday</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
              <div className="w-full min-w-0">
                <label htmlFor="input-new-holiday-date" className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Date
                </label>
                <Input
                  id="input-new-holiday-date"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  required
                  className="h-8 text-xs font-medium w-full"
                />
              </div>

              <div className="w-full min-w-0">
                <label htmlFor="input-new-holiday-name" className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Name
                </label>
                <Input
                  id="input-new-holiday-name"
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="e.g. National Day"
                  required
                  className="h-8 text-xs font-medium w-full"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingHoliday}
              className="w-full h-8 font-medium text-xs rounded-md mt-1"
            >
              {isSubmittingHoliday ? 'Adding...' : 'Add Holiday'}
            </Button>
          </form>

          {/* Existing Holidays List */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Configured Holidays ({holidays.length})
              </h4>
            </div>

            {holidays.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-border text-center">
                <CalendarIcon className="w-4 h-4 mx-auto text-muted-foreground/50 mb-1" />
                <p className="text-xs text-muted-foreground">
                  No company holidays configured yet.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/20 border border-border text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground block truncate">{h.name}</span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5 font-mono">
                        {formatDisplayDate(h.date)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => deleteHoliday(h.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600 rounded shrink-0"
                      title="Delete holiday"
                      aria-label={`Delete holiday ${h.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

