import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  ChevronDown,
  Download,
  Menu,
  Sparkles,
} from 'lucide-react';
import { useWorkLog } from '../context/WorkLogContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { MobileSidebar } from './navigation/MobileSidebar';
import { UserNavButton } from './auth/UserNavButton';

export type ActiveTab = 'dashboard' | 'daily' | 'review' | 'holidays' | 'settings';

interface NavbarProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenWarningsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab: activeTabProp,
  setActiveTab: setActiveTabProp,
  onOpenWarningsModal,
}) => {
  const {
    monthlyStats,
    validationIssues,
    exportExcel,
    exportCsv,
    loadSampleAugust2026Data,
  } = useWorkLog();

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const warningCount = validationIssues.length;

  // Determine current active route for page title
  const getActiveTab = (): ActiveTab => {
    if (activeTabProp) return activeTabProp;
    const path = location.pathname;
    if (path.startsWith('/daily')) return 'daily';
    if (path.startsWith('/review')) return 'review';
    if (path.startsWith('/holidays')) return 'holidays';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const currentTab = getActiveTab();

  const getPageTitle = () => {
    switch (currentTab) {
      case 'daily':
        return 'Daily Work Entry';
      case 'review':
        return 'Monthly Timesheet Review';
      case 'holidays':
        return 'Leaves & Public Holidays';
      case 'settings':
        return 'Preferences & Sync';
      default:
        return 'Monthly Calendar';
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border sticky top-0 z-20 shadow-2xs transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Left: Mobile Menu Button & Brand (mobile only) / Page Title (desktop) */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-foreground hover:bg-muted"
                aria-label="Open Mobile Menu"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Mobile-only logo */}
              <Link to="/" className="flex md:hidden items-center gap-2 group">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-foreground tracking-tight text-base">
                  WorkLog
                </span>
              </Link>

              {/* Desktop active page title */}
              <div className="hidden md:flex items-center gap-2.5">
                <h1 className="text-base lg:text-lg font-bold text-foreground tracking-tight">
                  {getPageTitle()}
                </h1>
                <Badge variant="outline" className="text-[11px] font-semibold text-muted-foreground">
                  {monthlyStats.monthName} {monthlyStats.year}
                </Badge>
              </div>
            </div>

            {/* Right: Actions, Profile & Export */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Warnings indicator button - hidden on mobile, visible on tablet/desktop */}
              {warningCount > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  id="btn-header-warnings"
                  onClick={onOpenWarningsModal}
                  title={`${warningCount} warnings found`}
                  className="hidden sm:flex h-8 sm:h-9 px-2 sm:px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>{warningCount} Warnings</span>
                </Button>
              )}

              {/* Sample data button if empty */}
              {monthlyStats.loggedWorkingDays === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  id="btn-load-sample"
                  onClick={loadSampleAugust2026Data}
                  title="Load sample August 2026 timesheet"
                  className="hidden xl:flex items-center gap-1.5 text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sample Data</span>
                </Button>
              )}

              {/* Export Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="amber"
                    size="sm"
                    id="btn-export-dropdown"
                    className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1 sm:gap-1.5 font-bold text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 p-1.5">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {monthlyStats.monthName} {monthlyStats.year} Timesheet
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    id="btn-dropdown-excel"
                    onClick={exportExcel}
                    className="flex items-start gap-2.5 p-2.5 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Excel Timesheet (.xlsx)
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Official format with formulas, client & job details
                      </p>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    id="btn-dropdown-csv"
                    onClick={exportCsv}
                    className="flex items-start gap-2.5 p-2.5 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        Raw CSV Data (.csv)
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Standard comma-separated format for quick data parsing
                      </p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Management & Supabase Auth Avatar / Menu */}
              <UserNavButton onNavigateToSettings={() => navigate({ to: '/settings' })} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Sidebar */}
      <MobileSidebar
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        activeTab={currentTab}
        setActiveTab={(tab) => {
          if (setActiveTabProp) setActiveTabProp(tab);
          const target = tab === 'dashboard' ? '/' : `/${tab}`;
          navigate({ to: target });
        }}
        onOpenWarningsModal={onOpenWarningsModal}
      />
    </>
  );
};
