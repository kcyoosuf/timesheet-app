import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Sheet Container */}
      <div className="fixed inset-0 z-50 flex">{children}</div>
    </div>
  );
};

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  onClose?: () => void;
  showClose?: boolean;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  (
    {
      side = 'right',
      className,
      children,
      onClose,
      showClose = true,
      ...props
    },
    ref
  ) => {
    const sideStyles = {
      top: 'inset-x-0 top-0 border-b border-border animate-in slide-in-from-top duration-200 max-h-[85vh]',
      bottom:
        'inset-x-0 bottom-0 border-t border-border animate-in slide-in-from-bottom duration-200 max-h-[90vh] rounded-t-3xl',
      left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border animate-in slide-in-from-left duration-200',
      right:
        'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border animate-in slide-in-from-right duration-200',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'fixed z-50 bg-card p-6 shadow-2xl transition ease-in-out text-card-foreground overflow-y-auto',
          sideStyles[side],
          className
        )}
        {...props}
      >
        {/* Grab bar indicator for bottom sheet on mobile */}
        {side === 'bottom' && (
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4 -mt-2" />
        )}
        {children}
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left pb-4 border-b border-border mb-4',
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-bold text-foreground leading-none', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription };
