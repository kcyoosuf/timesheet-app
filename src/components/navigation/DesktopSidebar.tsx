import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Calendar as CalendarIcon,
  PenTool,
  ClipboardCheck,
  Palmtree,
  Settings as SettingsIcon,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../Navbar';
import { useWorkLog } from '../../context/WorkLogContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ThemeToggle } from '../common/ThemeToggle';

interface DesktopSidebarProps {
  onOpenWarningsModal: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ onOpenWarningsModal }) => {
  const location = useLocation();
  const {
    monthlyStats,
    validationIssues,
    exportExcel,
    exportCsv,
    loadSampleAugust2026Data,
  } = useWorkLog();

  const warningCount = validationIssues.length;

  const getActiveTab = (): ActiveTab => {
    const path = location.pathname;
    if (path.startsWith('/daily')) return 'daily';
    if (path.startsWith('/review')) return 'review';
    if (path.startsWith('/holidays')) return 'holidays';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const currentTab = getActiveTab();

  const navItems: { id: ActiveTab; label: string; to: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Calendar', to: '/', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'daily', label: 'Daily Entry', to: '/daily', icon: <PenTool className="w-4 h-4" /> },
    {
      id: 'review',
      label: 'Timesheet Review',
      to: '/review',
      icon: <ClipboardCheck className="w-4 h-4" />,
      badge: warningCount > 0 ? warningCount : undefined,
    },
    { id: 'holidays', label: 'Leaves & Holidays', to: '/holidays', icon: <Palmtree className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', to: '/settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 h-screen z-30 transition-colors">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-foreground tracking-tight text-base leading-tight">
              WorkLog
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Timesheet & Logs
            </span>
          </div>
        </Link>
        <Badge variant="amber" className="text-[10px] font-bold">
          Local-First
        </Badge>
      </div>

      {/* Monthly Progress / Summary Card */}
      <div className="p-4 border-b border-border/80 bg-muted/30">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="text-muted-foreground">{monthlyStats.monthName} {monthlyStats.year}</span>
          <span className="font-mono font-bold text-foreground">{monthlyStats.totalHoursFormatted}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/50">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                monthlyStats.expectedWorkingDays > 0
                  ? (monthlyStats.loggedWorkingDays / monthlyStats.expectedWorkingDays) * 100
                  : 0
              )}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5 font-medium">
          <span>{monthlyStats.loggedWorkingDays} / {monthlyStats.expectedWorkingDays} logged</span>
          <span className="font-semibold text-foreground">{monthlyStats.completionRate}%</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.to}
              id={`sidebar-tab-${item.id}`}
              className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all select-none cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenWarningsModal();
                  }}
                  title={`${item.badge} warnings found`}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full cursor-pointer ${
                    isActive ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Sample Data if Empty */}
        {monthlyStats.loggedWorkingDays === 0 && (
          <div className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleAugust2026Data}
              className="w-full justify-start text-xs text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
              <span>Load Sample Data</span>
            </Button>
          </div>
        )}

        {/* Validation Warning Alert in Sidebar */}
        {warningCount > 0 && (
          <div className="pt-3">
            <button
              onClick={onOpenWarningsModal}
              className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">{warningCount} Warnings Found</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Click to inspect and resolve missing or overlapping hours
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Quick Exports & Theme */}
      <div className="p-3 border-t border-border space-y-2 bg-muted/20">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Quick Export
          </span>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportExcel}
            className="h-8 text-[11px] font-semibold px-2 justify-center gap-1.5"
            title="Export Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="h-8 text-[11px] font-semibold px-2 justify-center gap-1.5"
            title="Export CSV (.csv)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>CSV</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};
