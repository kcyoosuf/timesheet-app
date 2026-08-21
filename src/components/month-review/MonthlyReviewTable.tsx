import React, { useState, useMemo } from 'react';
import {
  getAllDatesInMonth,
  formatDisplayDate,
  formatShortDate,
} from '../../utils/dates';
import { formatMinutesToDecimalHours } from '../../utils/formatting';
import { useWorkLog } from '../../context/WorkLogContext';
import { DayType } from '../../models/types';
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  ExternalLink,
  Edit3,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
  Tag,
  GitPullRequest,
  GitBranch,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

interface MonthlyReviewTableProps {
  onSelectDateForEdit: (dateIso: string) => void;
  onOpenWarningsModal: () => void;
}

export const MonthlyReviewTable: React.FC<MonthlyReviewTableProps> = ({
  onSelectDateForEdit,
  onOpenWarningsModal,
}) => {
  const {
    currentYear,
    currentMonth,
    monthlyStats,
    monthDaysMap,
    holidaysMap,
    validationIssues,
    exportExcel,
    exportCsv,
  } = useWorkLog();

  const [filterType, setFilterType] = useState<'all' | 'working' | 'missing' | 'leaves'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const allMonthDates = useMemo(() => {
    return getAllDatesInMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Filtered rows calculation
  const filteredDates = useMemo(() => {
    return allMonthDates.filter((dateIso) => {
      const record = monthDaysMap.get(dateIso);
      if (filterType === 'all') return true;
      if (filterType === 'working') return record?.type === DayType.WORKING;
      if (filterType === 'missing') {
        return record?.type === DayType.WORKING && (!record.entries || record.entries.length === 0);
      }
      if (filterType === 'leaves') {
        return (
          record?.type === DayType.PERSONAL_LEAVE ||
          record?.type === DayType.SICK_LEAVE ||
          record?.type === DayType.COMPANY_HOLIDAY ||
          record?.type === DayType.OTHER
        );
      }
      return true;
    });
  }, [allMonthDates, monthDaysMap, filterType]);

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-4 border-b border-border">
        {/* Top Header with Filters and Export Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
              Monthly Timesheet Review
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {monthlyStats.monthName} {monthlyStats.year} &bull; {monthlyStats.loggedWorkingDays} of {monthlyStats.totalWorkingDays} working days logged ({monthlyStats.totalLoggedHoursFormatted})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Warnings quick indicator */}
            {validationIssues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenWarningsModal}
                className="gap-1.5 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-xs h-8"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{validationIssues.length} {validationIssues.length === 1 ? 'Warning' : 'Warnings'}</span>
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg text-xs font-medium border border-border">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  viewMode === 'table' ? 'bg-card text-foreground shadow-2xs font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  viewMode === 'cards' ? 'bg-card text-foreground shadow-2xs font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Cards</span>
              </button>
            </div>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  id="btn-review-export-dropdown"
                  className="gap-1.5 font-medium text-xs h-8"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-1">
                <DropdownMenuItem
                  onClick={exportExcel}
                  className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer p-2 rounded-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Download Excel (.xlsx)</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={exportCsv}
                  className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer p-2 rounded-sm"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Download CSV (.csv)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Selector Row */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none pt-3">
          <div className="flex items-center gap-1 min-w-max pb-1">
            <span className="text-xs font-medium text-muted-foreground mr-1">Filter:</span>
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="text-xs h-7 px-2.5 rounded-md font-medium"
            >
              All ({allMonthDates.length})
            </Button>
            <Button
              variant={filterType === 'working' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('working')}
              className="text-xs h-7 px-2.5 rounded-md font-medium"
            >
              Working ({monthlyStats.totalWorkingDays})
            </Button>
            <Button
              variant={filterType === 'missing' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilterType('missing')}
              className="text-xs h-7 px-2.5 rounded-md font-medium"
            >
              Missing ({monthlyStats.missingWorkingDays})
            </Button>
            <Button
              variant={filterType === 'leaves' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('leaves')}
              className="text-xs h-7 px-2.5 rounded-md font-medium"
            >
              Leaves & Holidays
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-5">
        {/* Main Review View: Table Mode */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0 border border-border rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-foreground font-semibold">
                  <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Tickets</th>
                  <th className="py-2.5 px-3 min-w-[260px]">Description</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">PR</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Branch</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Hours</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredDates.map((dateIso) => {
                  const record = monthDaysMap.get(dateIso);
                  const holiday = holidaysMap.get(dateIso);
                  const isWorking = record?.type === DayType.WORKING;
                  const hasEntries = isWorking && record.entries && record.entries.length > 0;
                  const isMissing = isWorking && !hasEntries;

                  // Non-working day (Weekend, Leave, Holiday)
                  if (!isWorking) {
                    let label = 'Weekend';
                    let tagClass = 'text-muted-foreground bg-muted/60';
                    if (record?.type === DayType.PERSONAL_LEAVE) {
                      label = 'Personal Leave';
                      tagClass = 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 font-medium';
                    } else if (record?.type === DayType.SICK_LEAVE) {
                      label = 'Sick Leave';
                      tagClass = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 font-medium';
                    } else if (record?.type === DayType.COMPANY_HOLIDAY) {
                      label = holiday ? `Company Holiday (${holiday.name})` : 'Company Holiday';
                      tagClass = 'text-purple-600 dark:text-purple-400 bg-purple-500/10 font-medium';
                    } else if (record?.type === DayType.OTHER) {
                      label = record.notes || 'Other Leave';
                      tagClass = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 font-medium';
                    }

                    return (
                      <tr
                        key={dateIso}
                        className="hover:bg-muted/30 transition-colors bg-muted/10"
                      >
                        <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                          {formatShortDate(dateIso)}
                        </td>
                        <td colSpan={6} className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${tagClass}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          0.0
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => onSelectDateForEdit(dateIso)}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            title="Edit day"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  }

                  // Missing Working Day Row
                  if (isMissing) {
                    return (
                      <tr
                        key={dateIso}
                        className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors border-l-2 border-l-amber-500"
                      >
                        <td className="py-2.5 px-3 font-medium text-amber-900 dark:text-amber-300 whitespace-nowrap">
                          {formatShortDate(dateIso)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300">
                            Working Day
                          </Badge>
                        </td>
                        <td colSpan={5} className="py-2.5 px-3 text-amber-800 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>No work update logged for this day</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-amber-900 dark:text-amber-300">
                          {formatMinutesToDecimalHours(record?.hoursMinutes || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectDateForEdit(dateIso)}
                            className="text-xs h-6 px-2 font-medium border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                          >
                            Log Work
                          </Button>
                        </td>
                      </tr>
                    );
                  }

                  // Normal Working Day with entries
                  return (
                    <React.Fragment key={dateIso}>
                      {record?.entries.map((entry, idx) => (
                        <tr
                          key={entry.id || `${dateIso}-${idx}`}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          {/* Show date on first entry row */}
                          <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap align-top">
                            {idx === 0 ? formatShortDate(dateIso) : ''}
                          </td>

                          <td className="py-2.5 px-3 whitespace-nowrap align-top">
                            {idx === 0 && (
                              <Badge variant="secondary" className="text-[10px]">
                                Working
                              </Badge>
                            )}
                          </td>

                          {/* Ticket numbers */}
                          <td className="py-2.5 px-3 whitespace-nowrap align-top font-mono font-medium text-foreground">
                            {(entry.tickets || []).join(', ') || '-'}
                          </td>

                          {/* Description */}
                          <td className="py-2.5 px-3 text-foreground font-normal leading-relaxed align-top">
                            {entry.description || <span className="text-muted-foreground italic">Empty description</span>}
                          </td>

                          {/* PR Info */}
                          <td className="py-2.5 px-3 whitespace-nowrap align-top font-mono">
                            {entry.prUrl ? (
                              <a
                                href={entry.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-foreground hover:underline inline-flex items-center gap-1"
                              >
                                <span>{entry.prNumber ? `#${entry.prNumber}` : 'PR'}</span>
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              </a>
                            ) : entry.prNumber ? (
                              <span className="text-foreground">#{entry.prNumber}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Branch */}
                          <td className="py-2.5 px-3 whitespace-nowrap align-top font-mono text-muted-foreground">
                            {entry.branch || '-'}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 whitespace-nowrap align-top">
                            <Badge variant="outline" className="text-[10px]">
                              {entry.status || 'Done'}
                            </Badge>
                          </td>

                          {/* Hours */}
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-foreground align-top">
                            {idx === 0 ? formatMinutesToDecimalHours(record.hoursMinutes) : ''}
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-3 text-center align-top">
                            {idx === 0 && (
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => onSelectDateForEdit(dateIso)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                title="Edit this day"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Footer Total Row */}
              <tfoot>
                <tr className="bg-muted/40 border-t border-border font-medium text-foreground">
                  <td colSpan={7} className="py-3 px-3 text-left">
                    Total Hours Worked in {monthlyStats.monthName} {monthlyStats.year}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-foreground">
                    {formatMinutesToDecimalHours(monthlyStats.totalLoggedMinutes)} hrs
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Cards Mode: Mobile Browsing */
          <div className="space-y-2.5">
            {filteredDates.map((dateIso) => {
              const record = monthDaysMap.get(dateIso);
              const holiday = holidaysMap.get(dateIso);
              const isWorking = record?.type === DayType.WORKING;
              const hasEntries = isWorking && record.entries && record.entries.length > 0;
              const isMissing = isWorking && !hasEntries;

              return (
                <div
                  key={dateIso}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isMissing
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isWorking
                      ? 'bg-card border-border shadow-xs'
                      : 'bg-muted/20 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-foreground">
                        {formatDisplayDate(dateIso)}
                      </span>
                      <Badge
                        variant={
                          isWorking
                            ? hasEntries
                              ? 'secondary'
                              : 'destructive'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {record?.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {isWorking && (
                        <span className="font-mono font-medium text-xs text-foreground">
                          {formatMinutesToDecimalHours(record?.hoursMinutes || 0)} hrs
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => onSelectDateForEdit(dateIso)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        title="Edit day"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isWorking && hasEntries && (
                    <div className="mt-2.5 space-y-2">
                      {record.entries.map((entry, i) => (
                        <div key={i} className="text-xs space-y-1 p-2 bg-muted/30 rounded border border-border">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 font-mono font-medium text-foreground">
                              <Tag className="w-3 h-3 text-muted-foreground" />
                              <span>{(entry.tickets || []).join(', ') || 'No ticket'}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {entry.status || 'Done'}
                            </Badge>
                          </div>

                          <p className="text-foreground font-normal leading-relaxed">
                            {entry.description}
                          </p>

                          {(entry.prUrl || entry.branch) && (
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground font-mono">
                              {entry.prUrl && (
                                <a
                                  href={entry.prUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                >
                                  <GitPullRequest className="w-3 h-3" />
                                  <span>{entry.prNumber ? `#${entry.prNumber}` : 'PR Link'}</span>
                                </a>
                              )}
                              {entry.branch && (
                                <div className="flex items-center gap-1 text-foreground">
                                  <GitBranch className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>{entry.branch}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isMissing && (
                    <div className="mt-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 bg-amber-500/15 p-2.5 rounded-lg">
                      <span className="italic">No work update entered for this working day.</span>
                      <Button
                        variant="amber"
                        size="sm"
                        onClick={() => onSelectDateForEdit(dateIso)}
                        className="h-7 text-xs font-bold"
                      >
                        Log Entry
                      </Button>
                    </div>
                  )}

                  {!isWorking && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {holiday ? `Company Holiday: ${holiday.name}` : `${record?.type.replace('_', ' ')} (B:H merged in Excel timesheet)`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
