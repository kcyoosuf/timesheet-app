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
    <Card className="border-border">
      <CardHeader className="pb-4 border-b border-border">
        {/* Top Header with Filters and Export Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold">
              Monthly Timesheet Review
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {monthlyStats.monthName} {monthlyStats.year} &bull; {monthlyStats.loggedWorkingDays} of {monthlyStats.totalWorkingDays} working days logged ({monthlyStats.totalLoggedHoursFormatted})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Warnings quick indicator */}
            {validationIssues.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onOpenWarningsModal}
                className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{validationIssues.length} Warnings</span>
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs font-medium border border-border">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-card text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-card text-foreground shadow-2xs font-semibold' : 'text-muted-foreground hover:text-foreground'
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
                  variant="amber"
                  size="sm"
                  id="btn-review-export-dropdown"
                  className="gap-1.5 font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 p-1.5">
                <DropdownMenuItem
                  onClick={exportExcel}
                  className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer p-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Download Excel (.xlsx)</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={exportCsv}
                  className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer p-2"
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
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Filter:</span>
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="text-xs h-7 px-2.5 rounded-lg"
            >
              All Days ({allMonthDates.length})
            </Button>
            <Button
              variant={filterType === 'working' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('working')}
              className="text-xs h-7 px-2.5 rounded-lg"
            >
              Working ({monthlyStats.totalWorkingDays})
            </Button>
            <Button
              variant={filterType === 'missing' ? 'amber' : 'outline'}
              size="sm"
              onClick={() => setFilterType('missing')}
              className="text-xs h-7 px-2.5 rounded-lg font-bold"
            >
              Missing ({monthlyStats.missingWorkingDays})
            </Button>
            <Button
              variant={filterType === 'leaves' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('leaves')}
              className="text-xs h-7 px-2.5 rounded-lg"
            >
              Leaves & Holidays
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        {/* Main Review View: Table Mode */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0 border border-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-500/10 border-b border-border text-foreground font-bold">
                  <th className="py-3 px-3.5 whitespace-nowrap">Date</th>
                  <th className="py-3 px-3 whitespace-nowrap">Day Type</th>
                  <th className="py-3 px-3 whitespace-nowrap">Ticket Numbers</th>
                  <th className="py-3 px-4 min-w-[280px]">Description</th>
                  <th className="py-3 px-3 whitespace-nowrap">PR</th>
                  <th className="py-3 px-3 whitespace-nowrap">Branch</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Hours</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
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
                    let tagClass = 'text-muted-foreground bg-muted';
                    if (record?.type === DayType.PERSONAL_LEAVE) {
                      label = 'Personal Leave';
                      tagClass = 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-semibold';
                    } else if (record?.type === DayType.SICK_LEAVE) {
                      label = 'Sick Leave';
                      tagClass = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-semibold';
                    } else if (record?.type === DayType.COMPANY_HOLIDAY) {
                      label = holiday ? `Company Holiday (${holiday.name})` : 'Company Holiday';
                      tagClass = 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-semibold';
                    } else if (record?.type === DayType.OTHER) {
                      label = record.notes || 'Other Leave';
                      tagClass = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 font-semibold';
                    }

                    return (
                      <tr
                        key={dateIso}
                        className="hover:bg-muted/40 transition-colors bg-muted/20"
                      >
                        <td className="py-2.5 px-3.5 font-medium text-foreground whitespace-nowrap">
                          {formatShortDate(dateIso)}
                        </td>
                        <td colSpan={6} className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs ${tagClass}`}>
                            {label} (Excel B:H merged)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          0.0
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => onSelectDateForEdit(dateIso)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit day"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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
                        className="bg-amber-500/10 hover:bg-amber-500/15 transition-colors border-l-4 border-l-amber-500"
                      >
                        <td className="py-3 px-3.5 font-bold text-amber-900 dark:text-amber-300 whitespace-nowrap">
                          {formatShortDate(dateIso)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant="amber" className="text-[10px]">
                            Working Day
                          </Badge>
                        </td>
                        <td colSpan={5} className="py-3 px-4 text-amber-800 dark:text-amber-200 italic">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>No work update logged for this working day</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-900 dark:text-amber-300">
                          {formatMinutesToDecimalHours(record?.hoursMinutes || 0)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="amber"
                            size="sm"
                            onClick={() => onSelectDateForEdit(dateIso)}
                            className="text-xs h-7 font-bold"
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
                          className="hover:bg-muted/40 transition-colors group"
                        >
                          {/* Show date on first entry row */}
                          <td className="py-3 px-3.5 font-medium text-foreground whitespace-nowrap align-top">
                            {idx === 0 ? formatShortDate(dateIso) : ''}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap align-top">
                            {idx === 0 && (
                              <Badge variant="emerald" className="text-[10px]">
                                Working
                              </Badge>
                            )}
                          </td>

                          {/* Ticket numbers */}
                          <td className="py-3 px-3 whitespace-nowrap align-top font-mono font-bold text-foreground">
                            {(entry.tickets || []).join(', ') || '-'}
                          </td>

                          {/* Description */}
                          <td className="py-3 px-4 text-foreground font-normal leading-relaxed align-top">
                            {entry.description || <span className="text-muted-foreground italic">Empty description</span>}
                          </td>

                          {/* PR Info */}
                          <td className="py-3 px-3 whitespace-nowrap align-top font-mono">
                            {entry.prUrl ? (
                              <a
                                href={entry.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                              >
                                <span>{entry.prNumber ? `#${entry.prNumber}` : 'PR link'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : entry.prNumber ? (
                              <span className="text-purple-700 dark:text-purple-300">#{entry.prNumber}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Branch */}
                          <td className="py-3 px-3 whitespace-nowrap align-top font-mono text-muted-foreground">
                            {entry.branch || '-'}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 whitespace-nowrap align-top">
                            <Badge variant="outline" className="text-[10px]">
                              {entry.status || 'Done'}
                            </Badge>
                          </td>

                          {/* Hours */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-foreground align-top">
                            {idx === 0 ? formatMinutesToDecimalHours(record.hoursMinutes) : ''}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-center align-top">
                            {idx === 0 && (
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => onSelectDateForEdit(dateIso)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Edit this day"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
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
                <tr className="bg-primary/10 border-t-2 border-border font-bold text-foreground">
                  <td colSpan={7} className="py-3.5 px-4 text-center tracking-wide">
                    Total Hours Worked in {monthlyStats.monthName.slice(0, 3)}{monthlyStats.year.toString().slice(-2)} (Excel A:E merged formula =SUM)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-sm font-extrabold text-primary">
                    {formatMinutesToDecimalHours(monthlyStats.totalLoggedMinutes)} hrs
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Cards Mode: Mobile Browsing */
          <div className="space-y-3">
            {filteredDates.map((dateIso) => {
              const record = monthDaysMap.get(dateIso);
              const holiday = holidaysMap.get(dateIso);
              const isWorking = record?.type === DayType.WORKING;
              const hasEntries = isWorking && record.entries && record.entries.length > 0;
              const isMissing = isWorking && !hasEntries;

              return (
                <div
                  key={dateIso}
                  className={`p-4 rounded-xl border transition-all ${
                    isMissing
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isWorking
                      ? 'bg-card border-border shadow-2xs'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {formatDisplayDate(dateIso)}
                      </span>
                      <Badge
                        variant={
                          isWorking
                            ? hasEntries
                              ? 'emerald'
                              : 'amber'
                            : 'outline'
                        }
                        className="text-[10px]"
                      >
                        {record?.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {isWorking && (
                        <span className="font-mono font-bold text-xs text-foreground">
                          {formatMinutesToDecimalHours(record?.hoursMinutes || 0)} hrs
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => onSelectDateForEdit(dateIso)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Edit day"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isWorking && hasEntries && (
                    <div className="mt-3 space-y-3">
                      {record.entries.map((entry, i) => (
                        <div key={i} className="text-xs space-y-1.5 p-2.5 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
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
