import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '../ui/button';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="iconSm"
        onClick={toggleTheme}
        title={`Current: ${theme} mode (click to toggle)`}
        className="text-muted-foreground hover:text-foreground rounded-xl"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 bg-muted p-1 rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light Mode"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === 'light'
            ? 'bg-card text-foreground shadow-2xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark Mode"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === 'dark'
            ? 'bg-card text-amber-400 shadow-2xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="System Preference"
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          theme === 'system'
            ? 'bg-card text-foreground shadow-2xs font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
