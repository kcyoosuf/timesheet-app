import React, { useState, useRef } from 'react';
import { useWorkLog } from '../../context/WorkLogContext';
import { useAuth } from '../../context/AuthContext';
import { Settings, BackupData } from '../../models/types';
import {
  formatMinutesToHhMm,
  parseHoursInputToMinutes,
} from '../../utils/formatting';
import { backupService } from '../../export/backupService';
import {
  supabaseService,
  SUPABASE_SQL_SCHEMA,
} from '../../services/supabaseService';
import {
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  User,
  Cloud,
  CloudUpload,
  CloudDownload,
  Check,
  Copy,
  Code2,
  RefreshCw,
  ShieldCheck,
  LogIn,
  LogOut,
  UserPlus,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

export const SettingsView: React.FC = () => {
  const {
    settings,
    saveSettings,
    exportBackup,
    importBackup,
    loadSampleAugust2026Data,
    clearAllData,
    pushToSupabase,
    pullFromSupabase,
  } = useWorkLog();

  const {
    user,
    isAuthenticated,
    openAuthModal,
    signOut,
    isConfigured,
    config,
    updateConfig,
    clearConfig,
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local settings form state
  const [userName, setUserName] = useState<string>(settings.userName || 'Yoosuf');
  const [defaultClient, setDefaultClient] = useState<string>(settings.defaultClient || 'Evolver');
  const [defaultProject, setDefaultProject] = useState<string>(settings.defaultProject || 'ARIA');
  const [defaultJob, setDefaultJob] = useState<string>(settings.defaultJob || 'Development');
  const [defaultHours, setDefaultHours] = useState<string>(
    formatMinutesToHhMm(settings.defaultWorkingHoursMinutes || 480)
  );

  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [importPreview, setImportPreview] = useState<{
    backup: BackupData;
    daysCount: number;
  } | null>(null);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Supabase Configuration & Sync State
  const [supabaseUrl, setSupabaseUrl] = useState<string>(config.url);
  const [supabaseKey, setSupabaseKey] = useState<string>(config.key);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    tablesExist?: boolean;
  } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [supabaseSyncFeedback, setSupabaseSyncFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(supabaseService.getLastSyncTime());

  // Update local state if external config changes
  React.useEffect(() => {
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
  }, [config.url, config.key]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMinutes = parseHoursInputToMinutes(defaultHours);

    const updated: Settings = {
      ...settings,
      userName: userName.trim() || 'Yoosuf',
      defaultClient: defaultClient.trim() || 'Evolver',
      defaultProject: defaultProject.trim() || 'ARIA',
      defaultJob: defaultJob.trim() || 'Development',
      defaultWorkingHoursMinutes: parsedMinutes > 0 ? parsedMinutes : 480,
    };

    await saveSettings(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  // Supabase Config Save & Test
  const handleSaveSupabaseConfig = async () => {
    const res = await updateConfig(supabaseUrl, supabaseKey);
    setSupabaseStatus({
      tested: true,
      success: res.success,
      message: res.message,
    });
    setSupabaseSyncFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    setTimeout(() => setSupabaseSyncFeedback(null), 3500);
  };

  const handleClearSupabaseConfig = () => {
    clearConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setSupabaseStatus(null);
    setLastSyncTime(null);
    setSupabaseSyncFeedback({
      type: 'success',
      message: 'Supabase credentials removed from this browser.',
    });
    setTimeout(() => setSupabaseSyncFeedback(null), 3000);
  };

  const handleTestSupabaseConnection = async () => {
    setIsTestingSupabase(true);
    setSupabaseSyncFeedback(null);
    try {
      await updateConfig(supabaseUrl, supabaseKey);
      const result = await supabaseService.testConnection();
      setSupabaseStatus({
        tested: true,
        success: result.success,
        message: result.message,
        tablesExist: result.tablesExist,
      });
    } catch (err: any) {
      setSupabaseStatus({
        tested: true,
        success: false,
        message: err?.message || 'Connection test failed.',
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handlePushToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseSyncFeedback(null);
    try {
      const result = await pushToSupabase(user?.id);
      if (result.success) {
        setSupabaseSyncFeedback({
          type: 'success',
          message: result.message,
        });
        setLastSyncTime(new Date().toISOString());
      } else {
        setSupabaseSyncFeedback({
          type: 'error',
          message: result.message || 'Push to Supabase failed.',
        });
      }
    } catch (err: any) {
      setSupabaseSyncFeedback({
        type: 'error',
        message: err?.message || 'Sync failed.',
      });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!window.confirm('Pull your work logs from Supabase and replace local entries?')) return;
    setIsSyncingSupabase(true);
    setSupabaseSyncFeedback(null);
    try {
      const result = await pullFromSupabase(user?.id);
      if (result.success) {
        setSupabaseSyncFeedback({
          type: 'success',
          message: result.message,
        });
        setLastSyncTime(new Date().toISOString());
      } else {
        setSupabaseSyncFeedback({
          type: 'error',
          message: result.message || 'Pull from Supabase failed.',
        });
      }
    } catch (err: any) {
      setSupabaseSyncFeedback({
        type: 'error',
        message: err?.message || 'Pull failed.',
      });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Handle Backup File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = backupService.validateBackupData(parsed);

        if (!validation.isValid || !validation.backup) {
          setImportError(validation.error || 'Invalid backup JSON file.');
          return;
        }

        setImportPreview({
          backup: validation.backup,
          daysCount: validation.backup.dayRecords?.length || 0,
        });
      } catch {
        setImportError('Failed to parse JSON file. Ensure it is a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!importPreview) return;
    try {
      await importBackup(importPreview.backup, importStrategy);
      setImportSuccess(
        `Successfully restored ${importPreview.daysCount} day records with '${importStrategy}' strategy!`
      );
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportSuccess(null), 4000);
    } catch {
      setImportError('An error occurred while importing backup data.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. User Management & Row Level Security (RLS) Card */}
      <Card className="border-border">
        <CardHeader className="pb-4 border-b border-border bg-gradient-to-r from-amber-500/5 via-transparent to-emerald-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold">
                    User Management & Row Level Security (RLS)
                  </CardTitle>
                  <Badge variant={isAuthenticated ? 'emerald' : 'outline'} className="text-[10px]">
                    {isAuthenticated ? 'Authenticated User' : 'Local Guest'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  PostgreSQL Row Level Security ensures each user can strictly see and edit only their own work logs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAuthModal(isConfigured ? 'signup' : 'config')}
                    className="h-8 text-xs font-semibold gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="amber"
                    onClick={() => openAuthModal(isConfigured ? 'signin' : 'config')}
                    className="h-8 text-xs font-bold gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {isAuthenticated ? (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                    {(user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </h4>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>RLS Protected (UUID: {user?.id.slice(0, 8)}...)</span>
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-foreground">User ID (auth.uid()):</span>
                  <p className="font-mono text-[11px] select-all truncate text-muted-foreground/90 mt-0.5">
                    {user?.id}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Security Scope:</span>
                  <p className="text-[11px] text-muted-foreground/90 mt-0.5">
                    All timesheet entries in database are scoped to <code className="font-mono bg-muted px-1 py-0.5 rounded">user_id = auth.uid()</code>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Currently Operating in Local Offline Mode</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Your entries are currently stored only inside your browser's IndexedDB. To enable private cloud sync with multi-user isolation, sign in with your Supabase account. Each user only sees and modifies their own logs.
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="amber"
                  onClick={() => openAuthModal(isConfigured ? 'signin' : 'config')}
                  className="text-xs font-bold gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect / Sign In with Supabase</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. General & Timesheet Default Settings */}
      <Card className="border-border">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Profile & Timesheet Defaults
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Configured values will auto-populate new work entries and generated Excel timesheets
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {savedFeedback && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Your Name / Timesheet Author
                </label>
                <Input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Yoosuf"
                  className="h-10 text-sm"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Used in file naming: <span className="font-mono text-foreground font-semibold">Timesheet-{userName || 'Name'}-August-2026.xlsx</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Default Working Hours (HH:MM or Decimal)
                </label>
                <Input
                  type="text"
                  value={defaultHours}
                  onChange={(e) => setDefaultHours(e.target.value)}
                  placeholder="08:00"
                  className="h-10 text-sm font-mono"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  e.g. "8", "8:00", "8.5" &rarr; defaults to 8h 00m standard day
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Default Client
                </label>
                <Input
                  type="text"
                  value={defaultClient}
                  onChange={(e) => setDefaultClient(e.target.value)}
                  placeholder="Evolver"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Default Project
                </label>
                <Input
                  type="text"
                  value={defaultProject}
                  onChange={(e) => setDefaultProject(e.target.value)}
                  placeholder="ARIA"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Default Job / Role
                </label>
                <Input
                  type="text"
                  value={defaultJob}
                  onChange={(e) => setDefaultJob(e.target.value)}
                  placeholder="Development"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                id="btn-save-settings"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Defaults</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Supabase Cloud Sync & RLS Schema Setup */}
      <Card className="border-border">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold">
                    Supabase PostgreSQL & Cloud Sync
                  </CardTitle>
                  <Badge variant="emerald" className="text-[10px]">
                    RLS Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sync work logs to your private Supabase database with Row Level Security
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSqlSchema((prev) => !prev)}
              className="gap-1.5 text-xs font-semibold shrink-0 self-start sm:self-auto"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showSqlSchema ? 'Hide SQL Script' : 'Supabase SQL Schema & RLS'}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Schema Drawer */}
          {showSqlSchema && (
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Supabase SQL Editor Script (Run in Dashboard)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySql}
                  className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Paste this into your{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>{' '}
                &rarr; <strong>SQL Editor &rarr; New Query &rarr; Run</strong>. It enables Row Level Security (RLS) so each user only sees and modifies their own records.
              </p>
              <pre className="text-[11px] font-mono text-emerald-300 bg-black/50 p-3 rounded-lg overflow-x-auto max-h-64 scrollbar-thin">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {/* Sync Feedback */}
          {supabaseSyncFeedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                supabaseSyncFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
              }`}
            >
              {supabaseSyncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{supabaseSyncFeedback.message}</span>
            </div>
          )}

          {/* Connection Status Box */}
          {supabaseStatus && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                supabaseStatus.success
                  ? supabaseStatus.tablesExist
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
              }`}
            >
              {supabaseStatus.success ? (
                supabaseStatus.tablesExist ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {supabaseStatus.success
                    ? supabaseStatus.tablesExist
                      ? 'Connected & Ready'
                      : 'Connected (Setup Required)'
                    : 'Connection Error'}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">{supabaseStatus.message}</p>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Supabase Project URL
                </label>
                <Input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="font-mono text-xs h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Publishable / Anon API Key
                </label>
                <Input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_... or eyJhbGciOi..."
                  className="font-mono text-xs h-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveSupabaseConfig}
                  disabled={!supabaseUrl.trim() && !supabaseKey.trim()}
                  className="text-xs"
                >
                  Save Credentials
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleTestSupabaseConnection}
                  disabled={isTestingSupabase || !supabaseUrl || !supabaseKey}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold"
                >
                  {isTestingSupabase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Test Connection</span>
                </Button>

                {(supabaseUrl || supabaseKey) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSupabaseConfig}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    Clear / Disconnect
                  </Button>
                )}
              </div>

              {lastSyncTime && (
                <span className="text-[11px] text-muted-foreground">
                  Last synced: {new Date(lastSyncTime).toLocaleDateString()} {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Continuous Dual Sync Live Status Card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm">Automatic Dual-Storage Synchronization</h4>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        Active & Real-Time
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All your timesheets, day classifications, and work logs are continuously written to local IndexedDB and synced to your Supabase PostgreSQL cloud tables.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePullFromSupabase}
                  disabled={isSyncingSupabase || !supabaseUrl || !supabaseKey}
                  className="text-xs font-semibold gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  {isSyncingSupabase ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span>Refresh Cloud Data</span>
                </Button>
              </div>

              {lastSyncTime && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Last synced with Supabase: {new Date(lastSyncTime).toLocaleDateString()} at {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Backup & Restore (Local IndexedDB JSON) */}
      <Card className="border-border">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                Offline JSON Backup & Restore
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                All your data is stored locally in your browser's IndexedDB. Export file backups anytime for offline safety.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {importError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Backup Card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">Export Full Backup</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Download a JSON snapshot containing all work logs, settings, and holidays.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                id="btn-export-backup"
                onClick={exportBackup}
                className="w-full gap-2 text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON Backup</span>
              </Button>
            </div>

            {/* Import Backup Card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-foreground text-sm mb-1">Import Backup</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Restore from a previously exported JSON backup file.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="input-file-backup"
                />
                <label
                  htmlFor="input-file-backup"
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-background border border-input hover:bg-accent text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span>Select Backup JSON File</span>
                </label>
              </div>
            </div>
          </div>

          {/* Restore Confirmation Drawer */}
          {importPreview && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Backup Restore ({importPreview.daysCount} days found)</span>
              </div>

              <p className="text-xs text-foreground">
                Select how you would like to apply the imported data:
              </p>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground">
                  <input
                    type="radio"
                    name="import-strat"
                    checked={importStrategy === 'merge'}
                    onChange={() => setImportStrategy('merge')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Merge with existing records</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground">
                  <input
                    type="radio"
                    name="import-strat"
                    checked={importStrategy === 'replace'}
                    onChange={() => setImportStrategy('replace')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Replace all current records</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="amber"
                  size="sm"
                  onClick={handleExecuteRestore}
                  className="text-xs font-bold gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Restore</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImportPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Danger Zone & Sample Data */}
      <Card className="border-border">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground">
            Data Reset & Sample Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">Load Sample August 2026 Data</p>
              <p className="text-xs text-muted-foreground">
                Populate August 2026 with realistic sample timesheet entries (40h/week, Evolver ARIA project).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadSampleAugust2026Data}
              className="gap-2 text-xs font-semibold shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Sample Data</span>
            </Button>
          </div>

          <div className="border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Clear All Local Data</p>
              <p className="text-xs text-muted-foreground">
                Erase all daily work entries, leave tags, and custom settings from this browser.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={clearAllData}
              className="gap-2 text-xs font-semibold shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Clear Local DB</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
