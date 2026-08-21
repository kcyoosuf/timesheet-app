import React from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import {
  Calendar as CalendarIcon,
  PenTool,
  ClipboardCheck,
  Palmtree,
  Settings as SettingsIcon,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Moon,
  Sun,
  Laptop,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ActiveTab } from '../Navbar';
import { useWorkLog } from '../../context/WorkLogContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenWarningsModal: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  open,
  onOpenChange,
  activeTab,
  setActiveTab,
  onOpenWarningsModal,
}) => {
  const {
    monthlyStats,
    validationIssues,
    exportExcel,
    exportCsv,
  } = useWorkLog();

  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, openAuthModal, isConfigured } = useAuth();
  const { theme, setTheme } = useTheme();
  const warningCount = validationIssues.length;

  const handleNav = (tab: ActiveTab, to: string) => {
    setActiveTab(tab);
    onOpenChange(false);
    navigate({ to });
  };

  const navItems: { id: ActiveTab; label: string; to: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Calendar Dashboard', to: '/', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'daily', label: 'Daily Work Entry', to: '/daily', icon: <PenTool className="w-4 h-4" /> },
    {
      id: 'review',
      label: 'Monthly Timesheet Review',
      to: '/review',
      icon: <ClipboardCheck className="w-4 h-4" />,
      badge: warningCount > 0 ? warningCount : undefined,
    },
    { id: 'holidays', label: 'Leaves & Holidays', to: '/holidays', icon: <Palmtree className="w-4 h-4" /> },
    { id: 'settings', label: 'Preferences & Cloud Sync', to: '/settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" onClose={() => onOpenChange(false)} className="w-[300px] flex flex-col justify-between">
        <div>
          <SheetHeader className="text-left pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold tracking-tight">WorkLog</SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground">
                  Timesheet & Logs
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* User Account / Auth Section */}
          <div className="p-3 my-3 rounded-lg bg-muted/30 border border-border">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                      {(user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0 px-1">
                    Sync
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Cloud className="w-3 h-3" />
                    Connected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      onOpenChange(false);
                    }}
                    className="h-6 text-[11px] text-rose-600 hover:text-rose-700 px-1.5"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Local Mode</p>
                  <p className="text-[10px] text-muted-foreground">Browser storage</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    openAuthModal(isConfigured ? 'signin' : 'config');
                  }}
                  className="h-7 text-xs font-medium gap-1 rounded-md"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In</span>
                </Button>
              </div>
            )}
          </div>

          {/* Month Stats Card */}
          <div className="p-3 mb-3 rounded-lg bg-muted/20 border border-border">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground font-medium">{monthlyStats.monthName} {monthlyStats.year}</span>
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
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 font-medium">
              <span>{monthlyStats.loggedWorkingDays}/{monthlyStats.expectedWorkingDays} days</span>
              <span className="font-mono text-foreground font-medium">{monthlyStats.completionRate}%</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id, item.to)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Exports Section */}
          <div className="mt-4 pt-3 border-t border-border space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
              Exports
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportExcel();
                  onOpenChange(false);
                }}
                className="h-8 justify-center text-xs font-medium rounded-md gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Excel</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportCsv();
                  onOpenChange(false);
                }}
                className="h-8 justify-center text-xs font-medium rounded-md gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>CSV</span>
              </Button>
            </div>

            {warningCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenWarningsModal();
                  onOpenChange(false);
                }}
                className="w-full justify-start text-xs font-medium border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                <span>{warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Theme Selector in Footer */}
        <div className="pt-3 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-1 mb-1.5">
            Appearance
          </p>
          <div className="grid grid-cols-3 gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1.5 py-1 rounded-md text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1.5 py-1 rounded-md text-xs font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex items-center justify-center gap-1.5 py-1 rounded-md text-xs font-medium transition-colors ${
                theme === 'system'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
