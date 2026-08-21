import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkLog } from '../../context/WorkLogContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  LogIn,
  LogOut,
  Sliders,
  Cloud,
  CloudOff,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';

interface UserNavButtonProps {
  onNavigateToSettings?: () => void;
}

export const UserNavButton: React.FC<UserNavButtonProps> = ({ onNavigateToSettings }) => {
  const { user, isAuthenticated, signOut, openAuthModal, isConfigured } = useAuth();
  const { syncStatus, lastSyncTime, isOnline } = useWorkLog();

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        id="btn-user-auth-trigger"
        onClick={() => openAuthModal(isConfigured ? 'signin' : 'config')}
        className="h-9 px-3 gap-1.5 font-bold border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </Button>
    );
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'User';

  const userInitial = displayName.charAt(0).toUpperCase();

  // Render cloud badge indicator
  const renderSyncIndicator = () => {
    if (!isOnline || syncStatus === 'offline') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400" title="Offline: Saving to local IndexedDB">
          <CloudOff className="w-3 h-3" />
          <span className="hidden lg:inline">Offline</span>
        </span>
      );
    }
    if (syncStatus === 'saving') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400" title="Saving to Supabase cloud...">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          <span className="hidden lg:inline">Syncing</span>
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500" title="Cloud sync error. Changes kept in IndexedDB.">
          <AlertCircle className="w-3 h-3" />
          <span className="hidden lg:inline">Sync Alert</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400" title="On-the-go sync active: Local + Supabase connected">
        <Cloud className="w-3 h-3" />
      </span>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          id="btn-user-profile-menu"
          className="h-8 sm:h-9 px-1.5 sm:pl-1.5 sm:pr-2.5 gap-1.5 sm:gap-2 font-semibold bg-background border-border hover:bg-accent"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-600 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
            {userInitial}
          </div>
          <span className="hidden sm:inline text-xs max-w-[90px] truncate text-foreground">
            {displayName}
          </span>
          {renderSyncIndicator()}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-1.5">
        <DropdownMenuLabel className="p-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* Dual Storage Status Banner */}
          <div className="mt-2.5 p-2 rounded-lg bg-muted/60 border border-border/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                IndexedDB + Supabase
              </span>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0.2">
                Continuous Sync
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              All work log entries and preferences automatically save locally and sync to your Supabase PostgreSQL cloud database in real time.
            </p>
            {lastSyncTime && (
              <p className="text-[10px] text-muted-foreground/80 font-mono">
                Last synced: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {onNavigateToSettings && (
          <DropdownMenuItem
            onClick={onNavigateToSettings}
            className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2"
          >
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <span>Database & Preferences</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer p-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
