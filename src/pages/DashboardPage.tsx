import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWorkLog } from '../context/WorkLogContext';
import { useModal } from '../context/ModalContext';
import { MonthlySummaryCard } from '../components/dashboard/MonthlySummaryCard';
import { MonthCalendar } from '../components/calendar/MonthCalendar';

interface DashboardPageProps {
  onOpenWarningsModal?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenWarningsModal: propOpenWarnings }) => {
  const navigate = useNavigate();
  const { setSelectedDate } = useWorkLog();
  const { openWarningsModal } = useModal();

  const handleOpenWarnings = propOpenWarnings || openWarningsModal;

  const handleSelectDayForEntry = (dateIso: string) => {
    setSelectedDate(dateIso);
    navigate({
      to: '/daily',
      search: { date: dateIso },
    });
  };

  return (
    <div className="space-y-6">
      <MonthlySummaryCard onOpenWarningsModal={handleOpenWarnings} />
      <MonthCalendar onSelectDayForEntry={handleSelectDayForEntry} />
    </div>
  );
};
