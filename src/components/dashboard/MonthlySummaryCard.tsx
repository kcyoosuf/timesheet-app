import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Umbrella,
  Flag,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import { useWorkLog } from '../../context/WorkLogContext';
import { getMonthName } from '../../utils/dates';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';

interface MonthlySummaryCardProps {
  onOpenWarningsModal: () => void;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({ onOpenWarningsModal }) => {
  const {
    currentYear,
    currentMonth,
    monthlyStats,
    validationIssues,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    setCurrentMonthYear,
  } = useWorkLog();

  const totalLeaves =
    monthlyStats.personalLeaveDays + monthlyStats.sickLeaveDays + monthlyStats.otherLeaveDays;

  return (
    <Card className="border-border">
      <CardHeader className="pb-4 border-b border-border">
        {/* Top Header: Month Switcher & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {monthlyStats.monthName} {monthlyStats.year}
              </h2>
              <Badge variant="blue" className="text-xs px-2.5 py-0.5 font-semibold">
                {monthlyStats.totalCalendarDays} Days
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Timesheet summary and monthly calendar metrics
            </p>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              <Button
                variant="ghost"
                size="iconSm"
                id="btn-prev-month"
                onClick={goToPreviousMonth}
                title="Previous Month"
                aria-label="Previous Month"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                id="btn-today"
                onClick={goToToday}
                className="h-7 px-2.5 text-xs font-bold text-foreground hover:bg-card"
              >
                Today
              </Button>

              <Button
                variant="ghost"
                size="iconSm"
                id="btn-next-month"
                onClick={goToNextMonth}
                title="Next Month"
                aria-label="Next Month"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Month & Year Jump */}
            <div className="flex items-center gap-1.5">
              <Select
                value={String(currentMonth)}
                onValueChange={(val) => setCurrentMonthYear(currentYear, parseInt(val, 10))}
              >
                <SelectTrigger id="select-month-picker" aria-label="Select month" className="h-8 text-xs font-semibold w-[125px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, m) => (
                    <SelectItem key={m} value={String(m)}>
                      {getMonthName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(currentYear)}
                onValueChange={(val) => setCurrentMonthYear(parseInt(val, 10), currentMonth)}
              >
                <SelectTrigger id="select-year-picker" aria-label="Select year" className="h-8 text-xs font-semibold w-[85px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Warnings notification if missing days exist */}
        {validationIssues.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium truncate">
                {validationIssues.length} {validationIssues.length === 1 ? 'warning' : 'warnings'} detected in this month (e.g. missing work entries).
              </span>
            </div>
            <Button
              variant="amber"
              size="sm"
              onClick={onOpenWarningsModal}
              className="shrink-0 h-7 text-xs font-bold"
            >
              Review Warnings
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Metric 1: Total Working Days */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span className="font-medium">Working Days</span>
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">
              {monthlyStats.totalWorkingDays}
            </div>
          </div>

          {/* Metric 2: Logged Days */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs mb-1">
              <span className="font-medium">Logged Days</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 dark:text-emerald-100">
              {monthlyStats.loggedWorkingDays}
            </div>
          </div>

          {/* Metric 3: Missing Days */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            monthlyStats.missingWorkingDays > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              : 'bg-muted/50 border-border text-muted-foreground'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">Missing Days</span>
              <AlertCircle className={`w-3.5 h-3.5 ${monthlyStats.missingWorkingDays > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">
              {monthlyStats.missingWorkingDays}
            </div>
          </div>

          {/* Metric 4: Leaves */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-xs mb-1">
              <span className="font-medium">Leaves</span>
              <Umbrella className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-950 dark:text-indigo-100">
              {totalLeaves}
            </div>
          </div>

          {/* Metric 5: Holidays */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 text-xs mb-1">
              <span className="font-medium">Holidays</span>
              <Flag className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-950 dark:text-purple-100">
              {monthlyStats.companyHolidayDays}
            </div>
          </div>

          {/* Metric 6: Weekends */}
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
              <span className="font-medium">Weekends</span>
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground">
              {monthlyStats.weekendDays}
            </div>
          </div>

          {/* Metric 7: Total Hours */}
          <div className="p-3.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 text-xs mb-1">
              <span className="font-medium">Total Hours</span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-950 dark:text-amber-100">
              {monthlyStats.totalLoggedHoursFormatted}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
