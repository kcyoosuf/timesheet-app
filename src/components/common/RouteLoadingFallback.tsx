import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RouteLoadingFallbackProps {
  message?: string;
}

export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  message = 'Loading view...',
}) => {
  return (
    <div className="w-full min-h-[45vh] flex flex-col items-center justify-center p-8 transition-opacity duration-200">
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col items-center gap-3 max-w-xs text-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">Preparing view components</p>
        </div>
      </div>
    </div>
  );
};
