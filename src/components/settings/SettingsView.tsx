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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* 1. User Management & Row Level Security (RLS) Card */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3.5 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted/80 text-foreground flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">
                    User Management & Row Level Security
                  </CardTitle>
                  <Badge variant={isAuthenticated ? 'secondary' : 'outline'} className="text-[10px]">
                    {isAuthenticated ? 'Authenticated' : 'Local Guest'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  PostgreSQL Row Level Security ensures each user strictly accesses only their own timesheets
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="h-8 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-1.5"
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
                    className="h-8 text-xs font-medium gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openAuthModal(isConfigured ? 'signin' : 'config')}
                    className="h-8 text-xs font-medium gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3">
          {isAuthenticated ? (
            <div className="p-3.5 rounded-lg bg-muted/20 border border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background font-medium text-xs flex items-center justify-center shrink-0">
                    {(user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-xs">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 py-0.5 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>RLS Protected (UUID: {user?.id.slice(0, 8)}...)</span>
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-muted-foreground border-t border-border pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-medium text-foreground text-[11px]">User ID (auth.uid()):</span>
                  <p className="font-mono text-[11px] select-all truncate text-muted-foreground mt-0.5">
                    {user?.id}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-foreground text-[11px]">Security Scope:</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    All timesheet entries in database are scoped to <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">user_id = auth.uid()</code>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-muted/20 border border-border space-y-2">
              <div className="flex items-center gap-2 font-medium text-xs text-foreground">
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Operating in Local Offline Mode</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your entries are stored locally inside your browser's IndexedDB. To enable private cloud sync with multi-user isolation, connect your Supabase project.
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAuthModal(isConfigured ? 'signin' : 'config')}
                  className="text-xs font-medium gap-1.5 h-7"
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
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted/80 text-foreground flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">
                Profile & Timesheet Defaults
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configured values will auto-populate new work entries and generated Excel timesheets
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {savedFeedback && (
            <div className="mb-3.5 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Your Name / Timesheet Author
                </label>
                <Input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Yoosuf"
                  className="h-9 text-xs"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Used in filename: <span className="font-mono text-foreground">Timesheet-{userName || 'Name'}-August-2026.xlsx</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Default Working Hours (HH:MM or Decimal)
                </label>
                <Input
                  type="text"
                  value={defaultHours}
                  onChange={(e) => setDefaultHours(e.target.value)}
                  placeholder="08:00"
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  e.g. "8", "8:00", "8.5" &rarr; defaults to 8h 00m standard day
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Default Client
                </label>
                <Input
                  type="text"
                  value={defaultClient}
                  onChange={(e) => setDefaultClient(e.target.value)}
                  placeholder="Evolver"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Default Project
                </label>
                <Input
                  type="text"
                  value={defaultProject}
                  onChange={(e) => setDefaultProject(e.target.value)}
                  placeholder="ARIA"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Default Job / Role
                </label>
                <Input
                  type="text"
                  value={defaultJob}
                  onChange={(e) => setDefaultJob(e.target.value)}
                  placeholder="Development"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <Button
                type="submit"
                id="btn-save-settings"
                className="font-medium gap-1.5 text-xs h-8 px-3 rounded-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Defaults</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Supabase Cloud Sync & RLS Schema Setup */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3.5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted/80 text-foreground flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">
                    Supabase PostgreSQL & Cloud Sync
                  </CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    RLS Enabled
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sync work logs to your private Supabase database with Row Level Security
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSqlSchema((prev) => !prev)}
              className="gap-1.5 text-xs font-medium shrink-0 self-start sm:self-auto h-8"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showSqlSchema ? 'Hide SQL Script' : 'SQL Schema & RLS'}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Schema Drawer */}
          {showSqlSchema && (
            <div className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    Supabase SQL Editor Script
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySql}
                  className="h-7 text-xs"
                >
                  {copiedSql ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  <span>{copiedSql ? 'Copied' : 'Copy Script'}</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste this into your Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Run.
              </p>
              <pre className="text-[11px] font-mono bg-background p-3 rounded border border-border overflow-x-auto max-h-52">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {/* Sync Feedback */}
          {supabaseSyncFeedback && (
            <div
              className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-medium ${
                supabaseSyncFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400'
              }`}
            >
              {supabaseSyncFeedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{supabaseSyncFeedback.message}</span>
            </div>
          )}

          {/* Credentials Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Supabase Project URL
                </label>
                <Input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="font-mono text-xs h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Publishable / Anon API Key
                </label>
                <Input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="sb_publishable_... or eyJhbGciOi..."
                  className="font-mono text-xs h-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveSupabaseConfig}
                  disabled={!supabaseUrl.trim() && !supabaseKey.trim()}
                  className="text-xs h-8"
                >
                  Save Credentials
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleTestSupabaseConnection}
                  disabled={isTestingSupabase || !supabaseUrl || !supabaseKey}
                  className="text-xs gap-1.5 font-medium h-8"
                >
                  {isTestingSupabase ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>Test Connection</span>
                </Button>

                {(supabaseUrl || supabaseKey) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSupabaseConfig}
                    className="text-xs text-rose-600 hover:text-rose-700 h-8"
                  >
                    Disconnect
                  </Button>
                )}
              </div>

              {lastSyncTime && (
                <span className="text-[10px] text-muted-foreground">
                  Last synced: {new Date(lastSyncTime).toLocaleDateString()} {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Continuous Dual Sync Live Status Card */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                    <Cloud className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-xs">Automatic Dual-Storage Sync</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Timesheets and logs are continuously stored locally in IndexedDB and synced to Supabase.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePullFromSupabase}
                  disabled={isSyncingSupabase || !supabaseUrl || !supabaseKey}
                  className="text-xs font-medium gap-1.5 shrink-0 self-start sm:self-auto h-7 px-2.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  <span>Refresh Cloud Data</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Backup & Restore (Local IndexedDB JSON) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted/80 text-foreground flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold tracking-tight">
                JSON Backup & Restore
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Export or import full snapshot backups for offline safety
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {importError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export Backup Card */}
            <div className="p-3.5 rounded-lg bg-muted/20 border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-medium text-foreground text-xs mb-1">Export Full Backup</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Download a JSON snapshot containing all work logs, settings, and holidays.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                id="btn-export-backup"
                onClick={exportBackup}
                className="w-full gap-2 text-xs font-medium h-8"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </Button>
            </div>

            {/* Import Backup Card */}
            <div className="p-3.5 rounded-lg bg-muted/20 border border-border flex flex-col justify-between">
              <div>
                <h4 className="font-medium text-foreground text-xs mb-1">Import Backup</h4>
                <p className="text-xs text-muted-foreground mb-3">
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
                  className="flex items-center justify-center gap-2 w-full py-1.5 px-3 bg-background border border-border hover:bg-muted text-foreground text-xs font-medium rounded-md transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Select JSON File</span>
                </label>
              </div>
            </div>
          </div>

          {/* Restore Confirmation Drawer */}
          {importPreview && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirm Backup Restore ({importPreview.daysCount} days found)</span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-foreground font-medium">
                  <input
                    type="radio"
                    name="import-strat"
                    checked={importStrategy === 'merge'}
                    onChange={() => setImportStrategy('merge')}
                  />
                  <span>Merge with existing</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-foreground font-medium">
                  <input
                    type="radio"
                    name="import-strat"
                    checked={importStrategy === 'replace'}
                    onChange={() => setImportStrategy('replace')}
                  />
                  <span>Replace all</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleExecuteRestore}
                  className="text-xs font-medium h-7"
                >
                  Apply Restore
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImportPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Danger Zone & Sample Data */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Data Management & Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-foreground">Load Sample August 2026 Data</p>
              <p className="text-xs text-muted-foreground">
                Populate August 2026 with realistic sample timesheet entries (40h/week, Evolver ARIA project).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadSampleAugust2026Data}
              className="gap-1.5 text-xs font-medium shrink-0 h-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Load Sample</span>
            </Button>
          </div>

          <div className="border-t border-border pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Clear All Local Data</p>
              <p className="text-xs text-muted-foreground">
                Erase all daily work entries, leave tags, and custom settings from this browser.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={clearAllData}
              className="gap-1.5 text-xs font-medium shrink-0 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local DB</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
