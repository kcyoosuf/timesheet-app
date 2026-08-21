import React, { useEffect, useCallback } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useWorkLog } from '../context/WorkLogContext';
import { DailyEntryView } from '../components/daily-entry/DailyEntryView';

export const DailyEntryPage: React.FC = () => {
  const search = useSearch({ strict: false }) as { date?: string };
  const { selectedDate, setSelectedDate } = useWorkLog();
  const navigate = useNavigate();

  // Sync from URL search parameter into state on mount or external navigation
  useEffect(() => {
    if (search.date && search.date !== selectedDate) {
      setSelectedDate(search.date);
    }
  }, [search.date]);

  // When date changes within the view, update state AND URL search params
  const handleDateChange = useCallback(
    (newDate: string) => {
      setSelectedDate(newDate);
      navigate({
        to: '/daily',
        search: { date: newDate },
        replace: true,
      });
    },
    [navigate, setSelectedDate]
  );

  const handleSavedSuccess = () => {
    // Keep user on the page or allow seamless continued editing
  };

  return (
    <DailyEntryView
      onDateChange={handleDateChange}
      onSavedSuccess={handleSavedSuccess}
    />
  );
};
