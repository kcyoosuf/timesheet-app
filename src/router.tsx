import React, { Suspense, lazy } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useNavigate,
  lazyRouteComponent,
} from '@tanstack/react-router';
import { useAuth } from './context/AuthContext';
import { useWorkLog } from './context/WorkLogContext';
import { useModal } from './context/ModalContext';
import { Navbar } from './components/Navbar';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { MobileBottomDock } from './components/navigation/MobileBottomDock';
import { RouteLoadingFallback } from './components/common/RouteLoadingFallback';
import { AuthScreen } from './components/auth/AuthScreen';
import { NotFoundPage } from './pages/NotFoundPage';
import { RefreshCw } from 'lucide-react';

// Lazy load dialog modals
const ValidationWarningsModal = lazy(() =>
  import('./components/common/ValidationWarningsModal').then((m) => ({
    default: m.ValidationWarningsModal,
  }))
);

const AuthModal = lazy(() =>
  import('./components/auth/AuthModal').then((m) => ({
    default: m.AuthModal,
  }))
);

const RootComponent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isWarningsModalOpen, openWarningsModal, closeWarningsModal } = useModal();
  const { setSelectedDate } = useWorkLog();
  const navigate = useNavigate();

  // Show loading while authenticating session on initial mount
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Mandatory Auth Guard
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const handleJumpToDate = (dateIso: string) => {
    setSelectedDate(dateIso);
    navigate({
      to: '/daily',
      search: { date: dateIso },
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Desktop Persistent Left Sidebar */}
      <DesktopSidebar onOpenWarningsModal={openWarningsModal} />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Compact Top Header */}
        <Navbar onOpenWarningsModal={openWarningsModal} />

        {/* Main Route Outlet Area with Suspense */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8">
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>

        {/* Footer */}
        <footer className="hidden md:block border-t border-border bg-card py-4 text-center text-xs text-muted-foreground transition-colors">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Personal WorkLog &bull; TanStack Router &bull; Supabase Auth &bull; PostgreSQL RLS</span>
            <span className="font-mono text-[11px] text-muted-foreground/80">
              Per-User Data Isolation &bull; Offline-Ready &bull; Code-Split Sidebar App Shell
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Dock Bar */}
      <MobileBottomDock onOpenWarningsModal={openWarningsModal} />

      {/* Validation Warnings Modal - Lazy Loaded */}
      <Suspense fallback={null}>
        {isWarningsModalOpen && (
          <ValidationWarningsModal
            isOpen={isWarningsModalOpen}
            onClose={closeWarningsModal}
            onJumpToDate={handleJumpToDate}
          />
        )}
      </Suspense>

      {/* Supabase Authentication Modal - Lazy Loaded */}
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>
    </div>
  );
};

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

// Index route (Dashboard / Calendar) - Lazy Loaded
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./pages/DashboardPage'), 'DashboardPage'),
  pendingComponent: () => <RouteLoadingFallback message="Loading Calendar..." />,
});

// Daily Entry route with optional ?date= search param - Lazy Loaded
interface DailySearchSchema {
  date?: string;
}

const dailyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/daily',
  validateSearch: (search: Record<string, unknown>): DailySearchSchema => ({
    date: typeof search.date === 'string' ? search.date : undefined,
  }),
  component: lazyRouteComponent(() => import('./pages/DailyEntryPage'), 'DailyEntryPage'),
  pendingComponent: () => <RouteLoadingFallback message="Loading Daily Work Entry..." />,
});

// Review route - Lazy Loaded
const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review',
  component: lazyRouteComponent(() => import('./pages/ReviewPage'), 'ReviewPage'),
  pendingComponent: () => <RouteLoadingFallback message="Loading Timesheet Review..." />,
});

// Holidays & Leaves route - Lazy Loaded
const holidaysRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/holidays',
  component: lazyRouteComponent(() => import('./components/holidays/HolidayLeaveManager'), 'HolidayLeaveManager'),
  pendingComponent: () => <RouteLoadingFallback message="Loading Leaves & Holidays..." />,
});

// Settings route - Lazy Loaded
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: lazyRouteComponent(() => import('./components/settings/SettingsView'), 'SettingsView'),
  pendingComponent: () => <RouteLoadingFallback message="Loading Settings..." />,
});

// Create Route Tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  dailyRoute,
  reviewRoute,
  holidaysRoute,
  settingsRoute,
]);

// Create Router instance
export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  defaultPendingComponent: RouteLoadingFallback,
});

// Register router instance for type safety across TanStack Router hooks
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
