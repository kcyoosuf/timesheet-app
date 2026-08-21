import React from 'react';
import { Link } from '@tanstack/react-router';
import { Calendar, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        The requested route does not exist. You can return to the calendar dashboard anytime.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="amber" className="gap-2 font-bold">
            <Calendar className="w-4 h-4" />
            <span>Return to Calendar</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
