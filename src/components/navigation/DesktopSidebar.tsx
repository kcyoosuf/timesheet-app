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
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-card border-r border-border min-h-screen sticky top-0 h-screen z-30 transition-colors">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border/80">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-xs">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground tracking-tight text-sm leading-none">
              WorkLog
            </span>
            <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
              Timesheet Manager
            </span>
          </div>
        </Link>
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
          v1.0
        </Badge>
      </div>

      {/* Monthly Progress / Summary Card */}
      <div className="p-3.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-foreground">{monthlyStats.monthName} {monthlyStats.year}</span>
          <span className="font-mono font-semibold text-foreground text-[11px]">{monthlyStats.totalHoursFormatted}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
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
          <span>{monthlyStats.loggedWorkingDays}/{monthlyStats.expectedWorkingDays} days</span>
          <span className="font-mono text-foreground font-medium">{monthlyStats.completionRate}%</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.to}
              id={`sidebar-tab-${item.id}`}
              className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors select-none cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-normal'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'}>
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
                  className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-full cursor-pointer ${
                    isActive ? 'bg-background text-foreground' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
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
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleAugust2026Data}
              className="w-full justify-start text-xs border-dashed text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 opacity-70" />
              <span>Load Sample Data</span>
            </Button>
          </div>
        )}

        {/* Validation Warning Alert in Sidebar */}
        {warningCount > 0 && (
          <div className="pt-2">
            <button
              onClick={onOpenWarningsModal}
              className="w-full text-left p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs font-semibold">{warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                Missing logs or hours detected
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer: Quick Exports & Theme */}
      <div className="p-2.5 border-t border-border/80 space-y-2 bg-card">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Export
          </span>
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={exportExcel}
            className="h-7 text-[11px] font-medium px-2 justify-center gap-1.5 rounded-md"
            title="Export Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="h-7 text-[11px] font-medium px-2 justify-center gap-1.5 rounded-md"
            title="Export CSV (.csv)"
          >
            <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>CSV</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

