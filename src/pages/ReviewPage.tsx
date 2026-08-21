import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWorkLog } from '../context/WorkLogContext';
import { useModal } from '../context/ModalContext';
import { MonthlyReviewTable } from '../components/month-review/MonthlyReviewTable';

interface ReviewPageProps {
  onOpenWarningsModal?: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({ onOpenWarningsModal: propOpenWarnings }) => {
  const navigate = useNavigate();
  const { setSelectedDate } = useWorkLog();
  const { openWarningsModal } = useModal();

  const handleOpenWarnings = propOpenWarnings || openWarningsModal;

  const handleSelectDateForEdit = (dateIso: string) => {
    setSelectedDate(dateIso);
    navigate({
      to: '/daily',
      search: { date: dateIso },
    });
  };

  return (
    <MonthlyReviewTable
      onSelectDateForEdit={handleSelectDateForEdit}
      onOpenWarningsModal={handleOpenWarnings}
    />
  );
};
