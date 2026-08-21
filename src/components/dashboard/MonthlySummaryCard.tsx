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
    <Card className="border-border shadow-xs">
      <CardHeader className="p-4 sm:p-5 pb-4 border-b border-border">
        {/* Top Header: Month Switcher & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {monthlyStats.monthName} {monthlyStats.year}
              </h2>
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-medium">
                {monthlyStats.totalCalendarDays} Days
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overview of logged hours, working days, and schedule status
            </p>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
              <Button
                variant="ghost"
                size="iconSm"
                id="btn-prev-month"
                onClick={goToPreviousMonth}
                title="Previous Month"
                aria-label="Previous Month"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                id="btn-today"
                onClick={goToToday}
                className="h-7 px-2.5 text-xs font-semibold text-foreground hover:bg-card rounded-md"
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
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
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
                <SelectTrigger id="select-month-picker" aria-label="Select month" className="h-8 text-xs font-medium w-[115px]">
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
                <SelectTrigger id="select-year-picker" aria-label="Select year" className="h-8 text-xs font-medium w-[80px]">
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
          <div className="mt-3.5 p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium truncate">
                {validationIssues.length} {validationIssues.length === 1 ? 'warning' : 'warnings'} detected in this month (missing daily logs).
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWarningsModal}
              className="shrink-0 h-7 text-xs font-semibold border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20"
            >
              Review Warnings
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
          {/* Metric 1: Total Working Days */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1.5 font-medium">
              <span>Working Days</span>
              <Briefcase className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {monthlyStats.totalWorkingDays}
            </div>
          </div>

          {/* Metric 2: Logged Days */}
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-[11px] mb-1.5 font-medium">
              <span>Logged Days</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {monthlyStats.loggedWorkingDays}
            </div>
          </div>

          {/* Metric 3: Missing Days */}
          <div className={`p-3 rounded-lg border flex flex-col justify-between ${
            monthlyStats.missingWorkingDays > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'bg-muted/40 border-border/60 text-muted-foreground'
          }`}>
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span>Missing Days</span>
              <AlertCircle className={`w-3.5 h-3.5 ${monthlyStats.missingWorkingDays > 0 ? 'text-amber-600 dark:text-amber-400' : 'opacity-70'}`} />
            </div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight ${monthlyStats.missingWorkingDays > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-foreground'}`}>
              {monthlyStats.missingWorkingDays}
            </div>
          </div>

          {/* Metric 4: Leaves */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1.5 font-medium">
              <span>Leaves</span>
              <Umbrella className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {totalLeaves}
            </div>
          </div>

          {/* Metric 5: Holidays */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1.5 font-medium">
              <span>Holidays</span>
              <Flag className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {monthlyStats.companyHolidayDays}
            </div>
          </div>

          {/* Metric 6: Weekends */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1.5 font-medium">
              <span>Weekends</span>
              <Coffee className="w-3.5 h-3.5 opacity-70" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {monthlyStats.weekendDays}
            </div>
          </div>

          {/* Metric 7: Total Hours */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/25 col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between text-foreground text-[11px] mb-1.5 font-medium">
              <span>Total Hours</span>
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-mono tracking-tight">
              {monthlyStats.totalLoggedHoursFormatted}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
