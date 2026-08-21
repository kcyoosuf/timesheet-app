import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ThemeToggle } from '../common/ThemeToggle';
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
  Lock,
  FileSpreadsheet,
  Check,
  Copy,
  Code2,
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../../services/supabaseService';

export const AuthScreen: React.FC = () => {
  const {
    signIn,
    signUp,
    resetPassword,
    isConfigured,
    config,
    updateConfig,
    isLoading: isAuthLoading,
  } = useAuth();

  const { theme } = useTheme();

  // Tab State: 'signin' | 'signup' | 'forgot' | 'config'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'config'>(
    isConfigured ? 'signin' : 'config'
  );

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
  const [showSqlDrawer, setShowSqlDrawer] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    setUrlInput(config.url || '');
    setKeyInput(config.key || '');
    if (!config.isConfigured) {
      setActiveTab('config');
    }
  }, [config.url, config.key, config.isConfigured]);

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
      setErrorMessage('Please provide both your email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Signing you into your workspace...');
    } else {
      setErrorMessage(result.error || 'Failed to sign in. Please verify your email and password.');
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
          'Account created! A confirmation link was sent to your email. Check your inbox or Supabase dashboard to complete sign in.'
        );
      } else {
        setSuccessMessage('Account registered successfully! Redirecting into your workspace...');
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
      setSuccessMessage('Password reset link sent! Check your email inbox.');
    } else {
      setErrorMessage(result.error || 'Unable to send password reset request.');
    }
  };

  // Save Supabase Config Handler
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!urlInput.trim() || !keyInput.trim()) {
      setErrorMessage('Both Supabase URL and Publishable / Anon API Key are required.');
      return;
    }

    setIsSubmitting(true);
    const result = await updateConfig(urlInput.trim(), keyInput.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Connected to Supabase successfully! You can now sign in or register.');
      setTimeout(() => {
        handleTabChange('signin');
      }, 1000);
    } else {
      setErrorMessage(result.message || 'Could not connect to Supabase. Check your URL and Key.');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Header bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              WorkLog & Timesheet
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Secure Cloud Timesheet System &bull; Multi-User Row Level Security
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-xl bg-muted/60 border border-border">
            <ThemeToggle compact />
          </div>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Top Accent / Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-amber-700/15 p-6 border-b border-border text-center relative">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {activeTab === 'signin' && 'Sign in to your account'}
                {activeTab === 'signup' && 'Create your account'}
                {activeTab === 'forgot' && 'Reset your password'}
                {activeTab === 'config' && 'Supabase Database Setup'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {activeTab === 'signin' && 'Enter your credentials to access your isolated daily work logs and timesheets.'}
                {activeTab === 'signup' && 'Register a new account. Your timesheet records are protected by PostgreSQL RLS.'}
                {activeTab === 'forgot' && 'Enter your registered email address to receive password reset instructions.'}
                {activeTab === 'config' && 'Connect your Supabase project to enable multi-user accounts and cloud sync.'}
              </p>

              {/* Pill Navigation */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-background/80 rounded-xl mt-4 border border-border/60 text-xs font-semibold">
                <button
                  type="button"
                  id="tab-signin"
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
                  id="tab-signup"
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
                  id="tab-config"
                  onClick={() => handleTabChange('config')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'config'
                      ? 'bg-card text-foreground font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Database</span>
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
              {/* Error & Success Feedback alerts */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{successMessage}</div>
                </div>
              )}

              {/* 1. SIGN IN FORM */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  {!isConfigured && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Supabase credentials needed
                      </div>
                      Please link your Supabase Project URL and API Key in the Database tab first.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Email Address
                    </label>
                    <Input
                      id="input-signin-email"
                      type="email"
                      placeholder="you@company.com"
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
                        id="input-signin-password"
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
                    id="btn-submit-signin"
                    type="submit"
                    disabled={isSubmitting || !isConfigured}
                    className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs shadow-xs"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>Sign In & Open Timesheet</span>
                  </Button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-muted-foreground">Don't have an account yet? </span>
                    <button
                      type="button"
                      onClick={() => handleTabChange('signup')}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                    >
                      Register now
                    </button>
                  </div>
                </form>
              )}

              {/* 2. SIGN UP FORM */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Full Name / Display Name
                    </label>
                    <Input
                      id="input-signup-name"
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
                      id="input-signup-email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Password
                      </label>
                      <Input
                        id="input-signup-password"
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
                        id="input-signup-confirm"
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
                    <span>Row Level Security (RLS) ensures only you can view and edit your timesheets.</span>
                  </div>

                  <Button
                    id="btn-submit-signup"
                    type="submit"
                    disabled={isSubmitting || !isConfigured}
                    className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs shadow-xs"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>Create Account</span>
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

              {/* 3. FORGOT PASSWORD */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Enter the email address associated with your account, and we will send a password reset link.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
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
                    className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs shadow-xs"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>Send Password Reset Email</span>
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

              {/* 4. DATABASE API CONFIGURATION */}
              {activeTab === 'config' && (
                <form onSubmit={handleSaveConfig} className="space-y-3.5">
                  <div className="text-xs text-muted-foreground">
                    Enter your Supabase Project URL and API Key from{' '}
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
                      Supabase Project URL
                    </label>
                    <Input
                      id="input-config-url"
                      type="url"
                      placeholder="https://xyz.supabase.co"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Publishable / Anon API Key
                    </label>
                    <Input
                      id="input-config-key"
                      type="password"
                      placeholder="sb_publishable_... or eyJhbGciOi..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowSqlDrawer(!showSqlDrawer)}
                      className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{showSqlDrawer ? 'Hide SQL Migration' : 'View SQL Schema & RLS'}</span>
                    </button>
                  </div>

                  {showSqlDrawer && (
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Supabase SQL Editor Script</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopySql}
                          className="h-6 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700"
                        >
                          {copiedSql ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                          <span>{copiedSql ? 'Copied' : 'Copy'}</span>
                        </Button>
                      </div>
                      <pre className="text-[10px] font-mono text-emerald-300 bg-black/50 p-2 rounded max-h-40 overflow-x-auto">
                        {SUPABASE_SQL_SCHEMA}
                      </pre>
                    </div>
                  )}

                  <Button
                    id="btn-submit-config"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs shadow-xs"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Save & Test Supabase Credentials</span>
                  </Button>
                </form>
              )}
            </div>

            {/* Footer Information */}
            <div className="bg-muted/40 px-6 py-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Protected by Supabase Auth</span>
              </div>
              <span className="font-mono text-[10px]">v1.0 &bull; RLS Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
