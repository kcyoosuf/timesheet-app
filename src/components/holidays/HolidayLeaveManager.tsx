import React, { useState } from 'react';
import { useWorkLog } from '../../context/WorkLogContext';
import { DayType, Holiday } from '../../models/types';
import {
  formatDateIso,
  formatDisplayDate,
} from '../../utils/dates';
import {
  Umbrella,
  Flag,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  const [rangeStart, setRangeStart] = useState<string>(
    formatDateIso(currentYear, currentMonth, 1)
  );
  const [rangeEnd, setRangeEnd] = useState<string>(
    formatDateIso(currentYear, currentMonth, 1)
  );
  const [rangeType, setRangeType] = useState<DayType>(DayType.PERSONAL_LEAVE);
  const [rangeFeedback, setRangeFeedback] = useState<string | null>(null);

  // New Holiday State
  const [newHolidayDate, setNewHolidayDate] = useState<string>(
    formatDateIso(currentYear, currentMonth, 15)
  );
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [newHolidayDesc, setNewHolidayDesc] = useState<string>('');
  const [holidayFeedback, setHolidayFeedback] = useState<string | null>(null);

  // Apply Range Leave
  const handleApplyRangeLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangeStart || !rangeEnd) return;

    await updateDateRangeType(rangeStart, rangeEnd, rangeType, 0);

    setRangeFeedback(`Successfully marked ${rangeStart} to ${rangeEnd} as ${rangeType.replace('_', ' ')}!`);
    setTimeout(() => setRangeFeedback(null), 3000);
  };

  // Add Company Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    const holiday: Holiday = {
      id: `hol-${newHolidayDate}-${Date.now()}`,
      date: newHolidayDate,
      name: newHolidayName.trim(),
      description: newHolidayDesc.trim() || undefined,
    };

    await saveHoliday(holiday);

    // Also mark that day as COMPANY_HOLIDAY in DB
    await updateDateRangeType(newHolidayDate, newHolidayDate, DayType.COMPANY_HOLIDAY, 0);

    setNewHolidayName('');
    setNewHolidayDesc('');
    setHolidayFeedback(`Company holiday '${holiday.name}' added for ${newHolidayDate}!`);
    setTimeout(() => setHolidayFeedback(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Date Range Leave Tool */}
      <Card className="border-border flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Umbrella className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Mark Leave or Absence Range
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Quickly mark consecutive dates as personal leave, sick leave, or other
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {rangeFeedback && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{rangeFeedback}</span>
            </div>
          )}

          <form onSubmit={handleApplyRangeLeave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  required
                  className="h-10 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  required
                  className="h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="select-leave-type" className="block text-xs font-semibold text-foreground mb-1">
                Leave Classification
              </label>
              <Select
                value={rangeType}
                onValueChange={(val) => setRangeType(val as DayType)}
              >
                <SelectTrigger id="select-leave-type" className="w-full text-xs sm:text-sm h-10">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DayType.PERSONAL_LEAVE}>Personal Leave</SelectItem>
                  <SelectItem value={DayType.SICK_LEAVE}>Sick Leave</SelectItem>
                  <SelectItem value={DayType.COMPANY_HOLIDAY}>Company Holiday</SelectItem>
                  <SelectItem value={DayType.OTHER}>Other Non-Working Leave</SelectItem>
                  <SelectItem value={DayType.WORKING}>Working Day (Clear / Reset to Work)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground leading-relaxed border border-border">
              <span className="font-semibold text-foreground">Note:</span> Marking dates as leave will automatically update the calendar and generate the specified red merged B:H row format in the monthly Excel timesheet.
            </div>

            <Button
              type="submit"
              id="btn-apply-leave-range"
              variant="default"
              size="default"
              className="w-full font-bold"
            >
              Apply Leave to Date Range
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Company Holidays Manager */}
      <Card className="border-border flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Company Holidays
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Configure recognized public and company holidays
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {holidayFeedback && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{holidayFeedback}</span>
            </div>
          )}

          {/* Add Holiday Form */}
          <form onSubmit={handleAddHoliday} className="space-y-3 mb-6 p-3.5 bg-muted/40 rounded-xl border border-border">
            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Add New Company Holiday</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Holiday Date
                </label>
                <Input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Holiday Name
                </label>
                <Input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="e.g. Independence Day"
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Add Company Holiday
            </Button>
          </form>

          {/* Existing Holidays List */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Configured Holidays ({holidays.length})
            </h4>

            {holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No company holidays added yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{h.name}</span>
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                        {formatDisplayDate(h.date)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => deleteHoliday(h.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      title="Delete holiday"
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
