import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import {
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    isConfigured,
    config,
    updateConfig,
    signIn,
    signUp,
    resetPassword,
  } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'config'>(authModalTab);

  // Sync tab with external open trigger
  React.useEffect(() => {
    setActiveTab(authModalTab);
  }, [authModalTab]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Supabase Config Fields
  const [urlInput, setUrlInput] = useState(config.url || '');
  const [keyInput, setKeyInput] = useState(config.key || '');

  // Operation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleTabChange = (tab: 'signin' | 'signup' | 'forgot' | 'config') => {
    resetMessages();
    setActiveTab(tab);
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Successfully signed in! Your work logs are now securely synced.');
      setTimeout(() => {
        closeAuthModal();
        resetMessages();
      }, 1000);
    } else {
      setErrorMessage(result.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email.trim(), password, displayName.trim());
    setIsSubmitting(false);

    if (result.success) {
      if (result.confirmationRequired) {
        setSuccessMessage(
          'Account created! A confirmation email was sent. Check your inbox or Supabase Auth settings to activate.'
        );
      } else {
        setSuccessMessage('Account registered and logged in successfully!');
        setTimeout(() => {
          closeAuthModal();
          resetMessages();
        }, 1200);
      }
    } else {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Password reset link sent to your email.');
    } else {
      setErrorMessage(result.error || 'Unable to send password reset request.');
    }
  };

  // Save Supabase Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!urlInput.trim() || !keyInput.trim()) {
      setErrorMessage('Both Supabase URL and Publishable/Anon API Key are required.');
      return;
    }

    setIsSubmitting(true);
    const result = await updateConfig(urlInput.trim(), keyInput.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Connected to Supabase successfully!');
      setTimeout(() => {
        handleTabChange('signin');
      }, 1000);
    } else {
      setErrorMessage(result.message || 'Could not verify Supabase connection.');
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-700/15 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  User Management & Auth
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Private timesheet storage with PostgreSQL Row Level Security (RLS)
                </DialogDescription>
              </div>
            </div>
            {isConfigured && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Ready
              </Badge>
            )}
          </div>

          {/* Navigation Pill Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-background/80 rounded-xl mt-5 border border-border/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('config')}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-card text-foreground font-bold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Database API</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              {!isConfigured && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Supabase connection not configured yet
                  </div>
                  Please configure your Supabase Project URL and Anon API key in the Database API tab first.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('forgot')}
                    className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-10 text-sm pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Sign In to Timesheet</span>
              </Button>

              <div className="text-center pt-2">
                <span className="text-xs text-muted-foreground">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name / Display Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Yoosuf KC"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Your entries will be protected by Supabase PostgreSQL RLS. Only you can access your data.</span>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Register Account</span>
              </Button>

              <div className="text-center pt-2">
                <span className="text-xs text-muted-foreground">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <p className="text-xs text-muted-foreground">
                Enter your account email. We will send a secure link from your Supabase project to reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-10 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>Send Reset Link</span>
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: DATABASE CONFIGURATION */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div className="text-xs text-muted-foreground">
                Configure your own Supabase project. Get credentials in{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-600 dark:text-amber-400 underline inline-flex items-center gap-0.5 font-semibold"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>{' '}
                &rarr; Project Settings &rarr; API.
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Project URL (HTTPS)
                </label>
                <Input
                  type="url"
                  placeholder="https://xyzproject.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Publishable / Anon Key
                </label>
                <Input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  <span>Row Level Security (RLS) Active</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Credentials are saved locally in your browser. All requests to Supabase are signed and authenticated directly.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Save & Test Supabase Connection</span>
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
