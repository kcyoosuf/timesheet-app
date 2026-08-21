import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  Calendar as CalendarIcon,
  PenTool,
  ClipboardCheck,
  Palmtree,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ActiveTab } from '../Navbar';
import { useWorkLog } from '../../context/WorkLogContext';

interface MobileBottomDockProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onOpenWarningsModal: () => void;
  onOpenQuickMenu?: () => void;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab: activeTabProp,
  setActiveTab,
  onOpenWarningsModal,
}) => {
  const { validationIssues, monthDaysMap, selectedDate } = useWorkLog();
  const location = useLocation();
  const warningCount = validationIssues.length;

  // Determine current active tab
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

  // Check if today or selected day is missing
  const isSelectedMissing =
    monthDaysMap.get(selectedDate)?.type === 'WORKING' &&
    (!monthDaysMap.get(selectedDate)?.entries || monthDaysMap.get(selectedDate)?.entries?.length === 0);

  const dockItems: { id: ActiveTab; label: string; to: string; icon: React.ReactNode; badge?: number | boolean }[] = [
    {
      id: 'dashboard',
      label: 'Calendar',
      to: '/',
      icon: <CalendarIcon className="w-5 h-5" />,
    },
    {
      id: 'daily',
      label: 'Log Entry',
      to: '/daily',
      icon: <PenTool className="w-5 h-5" />,
      badge: isSelectedMissing,
    },
    {
      id: 'review',
      label: 'Timesheet',
      to: '/review',
      icon: <ClipboardCheck className="w-5 h-5" />,
      badge: warningCount > 0 ? warningCount : undefined,
    },
    {
      id: 'holidays',
      label: 'Leaves',
      to: '/holidays',
      icon: <Palmtree className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      to: '/settings',
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe">
      {/* Floating Island Style Navigation Dock */}
      <div className="mx-3 mb-2.5 p-1.5 bg-card/95 backdrop-blur-md rounded-2xl border border-border shadow-xl flex items-center justify-around gap-1">
        {dockItems.map((item) => {
          const isActive = currentTab === item.id;
          const isCenterAction = item.id === 'daily';

          return (
            <Link
              key={item.id}
              to={item.to}
              id={`mobile-dock-${item.id}`}
              onClick={() => setActiveTab?.(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors relative select-none cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative">
                {item.icon}

                {/* Badge indicator */}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
                {typeof item.badge === 'boolean' && item.badge && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-card" />
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
