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
      <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20 transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            {/* Left: Mobile Menu Button & Brand (mobile only) / Page Title (desktop) */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-foreground hover:bg-muted"
                aria-label="Open Mobile Menu"
              >
                <Menu className="w-4 h-4" />
              </Button>

              {/* Mobile-only logo */}
              <Link to="/" className="flex md:hidden items-center gap-2 group">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-foreground tracking-tight text-sm">
                  WorkLog
                </span>
              </Link>

              {/* Desktop active page title */}
              <div className="hidden md:flex items-center gap-2.5">
                <h1 className="text-sm lg:text-base font-semibold text-foreground tracking-tight">
                  {getPageTitle()}
                </h1>
                <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground px-2 py-0.5">
                  {monthlyStats.monthName} {monthlyStats.year}
                </Badge>
              </div>
            </div>

            {/* Right: Actions, Profile & Export */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Warnings indicator button */}
              {warningCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  id="btn-header-warnings"
                  onClick={onOpenWarningsModal}
                  title={`${warningCount} warnings found`}
                  className="hidden sm:flex h-8 px-2.5 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium gap-1.5 text-xs rounded-md"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}</span>
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
                  className="hidden xl:flex items-center gap-1.5 h-8 text-xs border-dashed"
                >
                  <Sparkles className="w-3.5 h-3.5 opacity-70" />
                  <span>Sample Data</span>
                </Button>
              )}

              {/* Export Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    id="btn-export-dropdown"
                    className="h-8 px-2.5 gap-1.5 font-medium text-xs rounded-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 p-1">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {monthlyStats.monthName} {monthlyStats.year}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    id="btn-dropdown-excel"
                    onClick={exportExcel}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium text-foreground">Excel (.xlsx)</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    id="btn-dropdown-csv"
                    onClick={exportCsv}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded-sm"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-medium text-foreground">CSV (.csv)</span>
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
