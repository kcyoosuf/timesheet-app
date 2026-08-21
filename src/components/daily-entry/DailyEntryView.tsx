import React, { useState, useEffect } from 'react';
import {
  formatDisplayDate,
  parseDateIso,
  formatDateIso,
  getTodayIso,
} from '../../utils/dates';
import {
  formatMinutesToHhMm,
  parseHoursInputToMinutes,
} from '../../utils/formatting';
import { useWorkLog } from '../../context/WorkLogContext';
import { DayType, DayRecord, WorkLogEntry } from '../../models/types';
import { parserService } from '../../services/parserService';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  Trash2,
  Plus,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Tag,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';

interface DailyEntryViewProps {
  onSavedSuccess?: () => void;
  onDateChange?: (dateIso: string) => void;
}

export const DailyEntryView: React.FC<DailyEntryViewProps> = ({ onSavedSuccess, onDateChange }) => {
  const {
    selectedDate,
    setSelectedDate,
    currentDayRecord,
    saveCurrentDayRecord,
    settings,
  } = useWorkLog();

  // Local state for the day form
  const [dayType, setDayType] = useState<DayType>(currentDayRecord.type);
  const [hoursInput, setHoursInput] = useState<string>(
    formatMinutesToHhMm(currentDayRecord.hoursMinutes || settings.defaultWorkingHoursMinutes)
  );
  const [notes, setNotes] = useState<string>(currentDayRecord.notes || '');
  const [rawPastedText, setRawPastedText] = useState<string>('');
  const [entries, setEntries] = useState<WorkLogEntry[]>(currentDayRecord.entries || []);
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);

  // Sync state whenever selectedDate changes or currentDayRecord updates
  useEffect(() => {
    setDayType(currentDayRecord.type);
    setHoursInput(formatMinutesToHhMm(currentDayRecord.hoursMinutes));
    setNotes(currentDayRecord.notes || '');
    setEntries(currentDayRecord.entries ? [...currentDayRecord.entries] : []);
    if (currentDayRecord.entries && currentDayRecord.entries.length > 0 && currentDayRecord.entries[0].rawUpdate) {
      setRawPastedText(currentDayRecord.entries.map((e) => e.rawUpdate).filter(Boolean).join('\n\n'));
    } else {
      setRawPastedText('');
    }
  }, [currentDayRecord, selectedDate]);

  const handleSetDate = (newDateIso: string) => {
    if (onDateChange) {
      onDateChange(newDateIso);
    } else {
      setSelectedDate(newDateIso);
    }
  };

  // Navigate to previous/next day
  const handlePrevDay = () => {
    const { year, month, day } = parseDateIso(selectedDate);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() - 1);
    const newDateIso = formatDateIso(date.getFullYear(), date.getMonth(), date.getDate());
    handleSetDate(newDateIso);
  };

  const handleNextDay = () => {
    const { year, month, day } = parseDateIso(selectedDate);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + 1);
    const newDateIso = formatDateIso(date.getFullYear(), date.getMonth(), date.getDate());
    handleSetDate(newDateIso);
  };

  const handleGoToToday = () => {
    handleSetDate(getTodayIso());
  };

  // Day Type change handler
  const handleDayTypeChange = (newType: DayType) => {
    setDayType(newType);
    if (newType === DayType.WORKING) {
      if (parseHoursInputToMinutes(hoursInput) === 0) {
        setHoursInput(formatMinutesToHhMm(settings.defaultWorkingHoursMinutes));
      }
    } else {
      setHoursInput('00:00');
    }
  };

  // Deterministic Parse Button Action
  const handleParseUpdate = () => {
    if (!rawPastedText.trim()) return;

    const parsedItems = parserService.parse(rawPastedText);
    const newEntries: WorkLogEntry[] = parsedItems.map((item, idx) => ({
      id: `entry-${selectedDate}-${Date.now()}-${idx}`,
      date: selectedDate,
      tickets: item.tickets,
      description: item.description,
      status: item.status || 'Done',
      prNumber: item.prNumber,
      prUrl: item.prUrl,
      branch: item.branch,
      client: settings.defaultClient || 'Evolver',
      project: settings.defaultProject || 'ARIA',
      job: settings.defaultJob || 'Development',
      hoursMinutes: settings.defaultWorkingHoursMinutes,
      rawUpdate: item.rawUpdate || rawPastedText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (dayType === DayType.WEEKEND) {
      setDayType(DayType.WORKING);
      setHoursInput(formatMinutesToHhMm(settings.defaultWorkingHoursMinutes));
    }

    setEntries(newEntries);
  };

  // Add an empty manual entry
  const handleAddManualEntry = () => {
    const newEntry: WorkLogEntry = {
      id: `entry-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      tickets: [],
      description: '',
      status: 'Done',
      client: settings.defaultClient || 'Evolver',
      project: settings.defaultProject || 'ARIA',
      job: settings.defaultJob || 'Development',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries([...entries, newEntry]);
  };

  // Update a single entry's field
  const handleUpdateEntry = (index: number, updates: Partial<WorkLogEntry>) => {
    const updated = [...entries];
    updated[index] = {
      ...updated[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setEntries(updated);
  };

  // Delete an entry
  const handleDeleteEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  // Save Day Record
  const handleSaveDay = async () => {
    const hoursMinutes = parseHoursInputToMinutes(hoursInput);

    const recordToSave: DayRecord = {
      date: selectedDate,
      type: dayType,
      hoursMinutes: dayType === DayType.WORKING ? hoursMinutes : 0,
      notes: notes.trim() || undefined,
      entries: dayType === DayType.WORKING ? entries : [],
    };

    await saveCurrentDayRecord(recordToSave);

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);

    if (onSavedSuccess) {
      onSavedSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Date Selector & Quick Day Navigator */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
                <Button
                  variant="ghost"
                  size="iconSm"
                  id="btn-day-prev"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  aria-label="Previous Day"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  id="btn-day-next"
                  onClick={handleNextDay}
                  title="Next Day"
                  aria-label="Next Day"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    id="input-date-picker"
                    aria-label="Select date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && handleSetDate(e.target.value)}
                    className="font-semibold text-base sm:text-lg text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-foreground focus:outline-none cursor-pointer tracking-tight"
                  />
                  {selectedDate === getTodayIso() && (
                    <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
                      Today
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-normal">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedDate !== getTodayIso() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToToday}
                  className="text-xs font-medium h-8"
                >
                  Today
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                id="btn-save-day-top"
                onClick={handleSaveDay}
                className="gap-1.5 font-medium text-xs h-8"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </Button>
            </div>
          </div>

          {/* Saved Success Toast */}
          {isSavedAlert && (
            <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Day record saved successfully.</span>
            </div>
          )}

          {/* Day Classification Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            {/* Day Type Selector */}
            <div>
              <label htmlFor="select-day-type" className="block text-xs font-medium text-muted-foreground mb-1">
                Day Type
              </label>
              <Select
                value={dayType}
                onValueChange={(val) => handleDayTypeChange(val as DayType)}
              >
                <SelectTrigger id="select-day-type" className="w-full text-xs font-medium h-9">
                  <SelectValue placeholder="Select day type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DayType.WORKING}>Working Day</SelectItem>
                  <SelectItem value={DayType.WEEKEND}>Weekend</SelectItem>
                  <SelectItem value={DayType.PERSONAL_LEAVE}>Personal Leave</SelectItem>
                  <SelectItem value={DayType.SICK_LEAVE}>Sick Leave</SelectItem>
                  <SelectItem value={DayType.COMPANY_HOLIDAY}>Company Holiday</SelectItem>
                  <SelectItem value={DayType.OTHER}>Other Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Working Hours Input */}
            <div>
              <label htmlFor="input-hours" className="block text-xs font-medium text-muted-foreground mb-1">
                Hours
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="text"
                  id="input-hours"
                  value={hoursInput}
                  disabled={dayType !== DayType.WORKING}
                  onChange={(e) => setHoursInput(e.target.value)}
                  placeholder="08:00"
                  className="font-mono text-xs h-9"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {['8h', '7.5h', '4h'].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={dayType !== DayType.WORKING}
                      onClick={() => setHoursInput(preset)}
                      className="px-2 h-9 text-xs font-medium"
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label htmlFor="input-day-notes" className="block text-xs font-medium text-muted-foreground mb-1">
                Notes
              </label>
              <Input
                type="text"
                id="input-day-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sprint demo or half-day"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Work Log Section */}
      {dayType === DayType.WORKING && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Paste Daily Update Box */}
          <Card className="lg:col-span-5 border-border shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <CardTitle className="text-xs font-semibold">Paste Daily Update</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRawPastedText('')}
                  className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Paste your raw standup or work notes. The parser extracts ticket IDs, PR links, branch, and status automatically.
                </p>

                <Textarea
                  id="textarea-raw-update"
                  rows={8}
                  value={rawPastedText}
                  onChange={(e) => setRawPastedText(e.target.value)}
                  placeholder={`Example update format:

Added reanalyzing status support to My Work - ARIA-5854
Status - Done
PR - https://github.com/EvolverHub/frontend/pull/550
Branch - feature/aria-5854`}
                  className="font-mono text-xs min-h-[180px]"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  variant="default"
                  size="default"
                  id="btn-parse-update"
                  onClick={handleParseUpdate}
                  disabled={!rawPastedText.trim()}
                  className="w-full gap-2 font-medium text-xs h-9"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse Update</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Extracted Structured Work Entries */}
          <Card className="lg:col-span-7 border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xs font-semibold">
                    Work Entries ({entries.length})
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                    Editable
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  id="btn-add-entry"
                  onClick={handleAddManualEntry}
                  className="gap-1 text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Entry</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {entries.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-border rounded-lg">
                  <FileText className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs font-medium text-foreground">No entries yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 mb-3">
                    Paste update on the left and click Parse, or create manually.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualEntry}
                    className="gap-1 text-xs h-7"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Entry</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <div
                      key={entry.id || index}
                      className="p-3.5 rounded-lg bg-muted/20 border border-border relative transition-colors"
                    >
                      {/* Entry Header: Ticket numbers & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                          <Input
                            type="text"
                            placeholder="e.g. ARIA-5854"
                            value={(entry.tickets || []).join(', ')}
                            onChange={(e) =>
                              handleUpdateEntry(index, {
                                tickets: e.target.value
                                  .split(/[,/\s]+/)
                                  .map((t) => t.trim().toUpperCase())
                                  .filter(Boolean),
                              })
                            }
                            className="font-mono font-medium text-xs h-7 w-full sm:w-56"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
                          <Select
                            value={entry.status || 'Done'}
                            onValueChange={(val) => handleUpdateEntry(index, { status: val })}
                          >
                            <SelectTrigger aria-label="Entry status" className="h-7 text-xs font-medium w-[110px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Done">Done</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="In Review">In Review</SelectItem>
                              <SelectItem value="In QA">In QA</SelectItem>
                              <SelectItem value="Blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => handleDeleteEntry(index)}
                            className="text-muted-foreground hover:text-rose-600 h-7 w-7"
                            title="Delete this entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Description Textarea */}
                      <div className="mb-2.5">
                        <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                          Description
                        </label>
                        <Textarea
                          rows={2}
                          value={entry.description || ''}
                          onChange={(e) => handleUpdateEntry(index, { description: e.target.value })}
                          placeholder="Work description..."
                          className="text-xs min-h-[50px]"
                        />
                      </div>

                      {/* Metadata Row: PR URL & Branch */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* PR Input */}
                        <div>
                          <div className="flex items-center gap-1 mb-1 text-muted-foreground font-medium text-[10px]">
                            <GitPullRequest className="w-3 h-3 text-muted-foreground" />
                            <span>PR Link or #Number</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              value={entry.prUrl || (entry.prNumber ? `#${entry.prNumber}` : '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                const isUrl = val.startsWith('http');
                                handleUpdateEntry(index, {
                                  prUrl: isUrl ? val : undefined,
                                  prNumber: !isUrl && val.replace('#', '') ? parseInt(val.replace('#', ''), 10) : undefined,
                                });
                              }}
                              placeholder="https://github.com/.../pull/550"
                              className="font-mono text-xs h-7"
                            />
                            {entry.prUrl && (
                              <a
                                href={entry.prUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-muted-foreground hover:text-foreground"
                                title="Open PR URL"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Branch Input */}
                        <div>
                          <div className="flex items-center gap-1 mb-1 text-muted-foreground font-medium text-[10px]">
                            <GitBranch className="w-3 h-3 text-muted-foreground" />
                            <span>Branch</span>
                          </div>
                          <Input
                            type="text"
                            value={entry.branch || ''}
                            onChange={(e) => handleUpdateEntry(index, { branch: e.target.value })}
                            placeholder="feature/aria-5854"
                            className="font-mono text-xs h-7"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Save Action */}
              {entries.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    id="btn-save-day-bottom"
                    onClick={handleSaveDay}
                    className="gap-1.5 font-medium text-xs h-8"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save {entries.length} Entries</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Non-working Day Confirmation Card */}
      {dayType !== DayType.WORKING && (
        <Card className="border-border shadow-xs text-center">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">
              Marked as {dayType.replace('_', ' ')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-3">
              This date is classified as non-working. Timesheet columns will display a centered "{dayType.replace('_', ' ')}" indicator.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveDay}
              className="font-medium text-xs h-8"
            >
              Save Day Status
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
