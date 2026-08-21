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
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-extrabold">WorkLog</SheetTitle>
                <SheetDescription className="text-[11px]">
                  Local-First Timesheet Manager
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* User Account / Auth Section */}
          <div className="p-3 mb-3 rounded-xl bg-card border border-border">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0 px-1">
                    Continuous Sync
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    Supabase Connected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      onOpenChange(false);
                    }}
                    className="h-6 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-foreground">Local Guest Mode</p>
                  <p className="text-[10px] text-muted-foreground">Data stored in browser</p>
                </div>
                <Button
                  size="sm"
                  variant="amber"
                  onClick={() => {
                    onOpenChange(false);
                    openAuthModal(isConfigured ? 'signin' : 'config');
                  }}
                  className="h-8 text-xs font-bold gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Button>
              </div>
            )}
          </div>

          {/* Month Stats Card */}
          <div className="p-3 mb-4 rounded-xl bg-muted/60 border border-border">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-muted-foreground">{monthlyStats.monthName} {monthlyStats.year}</span>
              <span className="font-mono font-bold text-foreground">{monthlyStats.totalHoursFormatted}</span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
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
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
              <span>{monthlyStats.loggedWorkingDays} / {monthlyStats.expectedWorkingDays} days logged</span>
              <span>{monthlyStats.completionRate}%</span>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="amber" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Exports Section */}
          <div className="mt-5 pt-4 border-t border-border space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
              Exports & Actions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportExcel();
                onOpenChange(false);
              }}
              className="w-full justify-start text-xs font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 mr-2" />
              <span>Export Excel (.xlsx)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportCsv();
                onOpenChange(false);
              }}
              className="w-full justify-start text-xs font-semibold"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 mr-2" />
              <span>Export CSV (.csv)</span>
            </Button>

            {warningCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onOpenWarningsModal();
                  onOpenChange(false);
                }}
                className="w-full justify-start text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                <span>View {warningCount} Warnings</span>
              </Button>
            )}
          </div>
        </div>

        {/* Theme Selector in Footer */}
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Appearance
          </p>
          <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                theme === 'light'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                theme === 'system'
                  ? 'bg-card text-foreground shadow-2xs'
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
