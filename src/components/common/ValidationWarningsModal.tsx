import React from 'react';
import { useWorkLog } from '../../context/WorkLogContext';
import { AlertTriangle, AlertCircle, FileSpreadsheet, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface ValidationWarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToDate: (dateIso: string) => void;
}

export const ValidationWarningsModal: React.FC<ValidationWarningsModalProps> = ({
  isOpen,
  onClose,
  onJumpToDate,
}) => {
  const { validationIssues, exportExcel, monthlyStats } = useWorkLog();

  const handleExportAnyway = async () => {
    onClose();
    await exportExcel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-lg">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            <DialogTitle>Timesheet Warnings ({validationIssues.length})</DialogTitle>
          </div>
          <DialogDescription>
            We detected potential discrepancies in your {monthlyStats.monthName} {monthlyStats.year} log that might cause incomplete timesheet rows.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 my-2">
          {validationIssues.map((issue, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2 text-foreground">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{issue.message}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onJumpToDate(issue.date);
                  onClose();
                }}
                className="shrink-0 flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline text-[11px] cursor-pointer"
              >
                <span>Fix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Review Manually
          </Button>

          <Button
            variant="amber"
            size="sm"
            onClick={handleExportAnyway}
            className="gap-1.5 font-bold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel Anyway</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
