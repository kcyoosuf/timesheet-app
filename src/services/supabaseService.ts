import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { DayRecord, Holiday, Settings, BackupData } from '../models/types';

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
  pushedDays?: number;
  pushedHolidays?: number;
  pulledDays?: number;
  pulledHolidays?: number;
  error?: string;
}

const STORAGE_KEY_CUSTOM_URL = 'worklog_supabase_custom_url';
const STORAGE_KEY_CUSTOM_KEY = 'worklog_supabase_custom_key';
const STORAGE_KEY_LAST_SYNC = 'worklog_supabase_last_sync';

/**
 * Complete PostgreSQL Schema with Row Level Security (RLS) and auth.users scoping.
 * Each authenticated user only has access to their own rows.
 */
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- Timesheet App: User Management & Row Level Security (RLS)
-- Run this SQL in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Create worklog_days table (scoped to user_id)
create table if not exists public.worklog_days (
  id bigint generated always as identity,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date text not null,
  type text not null,
  hours_minutes integer not null default 480,
  notes text,
  entries jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint worklog_days_user_date_unique unique (user_id, date)
);

-- If worklog_days already existed without user_id, add it:
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'worklog_days' and column_name = 'user_id'
  ) then
    alter table public.worklog_days add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
end $$;

-- 2. Create worklog_holidays table (scoped to user_id)
create table if not exists public.worklog_holidays (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date text not null,
  name text not null,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- If worklog_holidays already existed without user_id, add it:
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'worklog_holidays' and column_name = 'user_id'
  ) then
    alter table public.worklog_holidays add column user_id uuid references auth.users(id) on delete cascade default auth.uid();
  end if;
end $$;

-- 3. Create worklog_settings table (one settings row per user)
create table if not exists public.worklog_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  user_name text,
  default_working_hours_minutes integer default 480,
  default_client text,
  default_project text,
  default_job text,
  weekend_days jsonb default '[0, 6]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.worklog_days enable row level security;
alter table public.worklog_holidays enable row level security;
alter table public.worklog_settings enable row level security;

-- 5. Drop any old permissive / public policies
drop policy if exists "Allow all access to worklog_days" on public.worklog_days;
drop policy if exists "Allow all access to worklog_holidays" on public.worklog_holidays;
drop policy if exists "Allow all access to worklog_settings" on public.worklog_settings;

drop policy if exists "Users can select own days" on public.worklog_days;
drop policy if exists "Users can insert own days" on public.worklog_days;
drop policy if exists "Users can update own days" on public.worklog_days;
drop policy if exists "Users can delete own days" on public.worklog_days;

drop policy if exists "Users can select own holidays" on public.worklog_holidays;
drop policy if exists "Users can insert own holidays" on public.worklog_holidays;
drop policy if exists "Users can update own holidays" on public.worklog_holidays;
drop policy if exists "Users can delete own holidays" on public.worklog_holidays;

drop policy if exists "Users can select own settings" on public.worklog_settings;
drop policy if exists "Users can modify own settings" on public.worklog_settings;

-- 6. Define Strict Per-User RLS Policies

-- Policies for worklog_days
create policy "Users can select own days"
  on public.worklog_days for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own days"
  on public.worklog_days for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own days"
  on public.worklog_days for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own days"
  on public.worklog_days for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policies for worklog_holidays
create policy "Users can select own holidays"
  on public.worklog_holidays for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own holidays"
  on public.worklog_holidays for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own holidays"
  on public.worklog_holidays for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own holidays"
  on public.worklog_holidays for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policies for worklog_settings
create policy "Users can select own settings"
  on public.worklog_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can modify own settings"
  on public.worklog_settings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
`;

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl = '';
  private currentKey = '';

  public getConfig(): SupabaseConfig {
    const customUrl = localStorage.getItem(STORAGE_KEY_CUSTOM_URL) || '';
    const customKey = localStorage.getItem(STORAGE_KEY_CUSTOM_KEY) || '';

    const url = customUrl.trim();
    const key = customKey.trim();

    return {
      url,
      key,
      isConfigured: Boolean(url && key),
    };
  }

  public setCustomConfig(url: string, key: string) {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_URL);
    }

    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_KEY);
    }

    // Reset client to reinitialize
    this.client = null;
    this.currentUrl = '';
    this.currentKey = '';
  }

  public clearConfig() {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_URL);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_KEY);
    localStorage.removeItem(STORAGE_KEY_LAST_SYNC);
    this.client = null;
    this.currentUrl = '';
    this.currentKey = '';
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  }

  public setLastSyncTime(isoDate: string) {
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, isoDate);
  }

  public getClient(): SupabaseClient | null {
    const config = this.getConfig();
    if (!config.isConfigured) return null;

    if (this.client && this.currentUrl === config.url && this.currentKey === config.key) {
      return this.client;
    }

    try {
      this.client = createClient(config.url, config.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
      });
      this.currentUrl = config.url;
      this.currentKey = config.key;
      return this.client;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  // ================= Auth Methods =================

  public async getSession(): Promise<Session | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      console.error('Error fetching Supabase session:', err);
      return null;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getUser();
      if (error) return null;
      return data.user;
    } catch {
      return null;
    }
  }

  public async signUp(email: string, password: string, displayName?: string): Promise<{
    user: User | null;
    session: Session | null;
    error: string | null;
    confirmationRequired?: boolean;
  }> {
    const client = this.getClient();
    if (!client) {
      return { user: null, session: null, error: 'Supabase URL and API Key are not configured.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
            full_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      const confirmationRequired = !data.session && Boolean(data.user);

      return {
        user: data.user,
        session: data.session,
        error: null,
        confirmationRequired,
      };
    } catch (err: any) {
      return { user: null, session: null, error: err?.message || 'Sign up failed' };
    }
  }

  public async signInWithPassword(email: string, password: string): Promise<{
    user: User | null;
    session: Session | null;
    error: string | null;
  }> {
    const client = this.getClient();
    if (!client) {
      return { user: null, session: null, error: 'Supabase URL and API Key are not configured.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err: any) {
      return { user: null, session: null, error: err?.message || 'Sign in failed' };
    }
  }

  public async signOut(): Promise<{ error: string | null }> {
    const client = this.getClient();
    if (!client) return { error: null };

    try {
      const { error } = await client.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Sign out failed' };
    }
  }

  public async resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
    const client = this.getClient();
    if (!client) {
      return { error: 'Supabase URL and API Key are not configured.' };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Password reset request failed' };
    }
  }

  public onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { unsubscribe: () => void } | null {
    const client = this.getClient();
    if (!client) return null;

    const { data: { subscription } } = client.auth.onAuthStateChange(callback);
    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  }

  // ================= Testing & Verification =================

  public async testConnection(): Promise<{ success: boolean; message: string; tablesExist?: boolean }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'Supabase URL and Publishable/Anon Key are not configured.',
      };
    }

    try {
      // Test querying worklog_days
      const { error } = await client.from('worklog_days').select('date').limit(1);

      if (error) {
        // Check if table missing
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return {
            success: true,
            tablesExist: false,
            message: 'Connected to Supabase project! However, tables are not yet created. Please run the SQL schema in your Supabase SQL editor.',
          };
        }
        // If RLS blocked anon or table exists
        if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
          return {
            success: true,
            tablesExist: true,
            message: 'Connected to Supabase! Row Level Security is active and protecting tables.',
          };
        }
        return {
          success: false,
          message: `Supabase notice: ${error.message} (code: ${error.code || 'unknown'})`,
        };
      }

      return {
        success: true,
        tablesExist: true,
        message: 'Successfully connected to Supabase and verified tables!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to reach Supabase server.',
      };
    }
  }

  // ================= Cloud Data Sync =================

  public async pushToCloud(
    data: {
      dayRecords: DayRecord[];
      holidays: Holiday[];
      settings: Settings;
    },
    userId?: string
  ): Promise<SyncResult> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'Supabase credentials not configured.',
      };
    }

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      // 1. Push Day Records (scoped to user)
      let pushedDays = 0;
      if (data.dayRecords && data.dayRecords.length > 0) {
        const rows = data.dayRecords.map((r) => {
          const row: any = {
            date: r.date,
            type: r.type,
            hours_minutes: r.hoursMinutes,
            notes: r.notes || null,
            entries: r.entries || [],
            updated_at: new Date().toISOString(),
          };
          if (effectiveUserId) {
            row.user_id = effectiveUserId;
          }
          return row;
        });

        const conflictTarget = effectiveUserId ? 'user_id,date' : 'date';
        const { error: daysError } = await client
          .from('worklog_days')
          .upsert(rows, { onConflict: conflictTarget });

        if (daysError) {
          // If conflict with standard single key
          const { error: fallbackErr } = await client
            .from('worklog_days')
            .upsert(rows);
          if (fallbackErr) {
            throw new Error(`Failed to sync day records: ${daysError.message}`);
          }
        }
        pushedDays = rows.length;
      }

      // 2. Push Holidays
      let pushedHolidays = 0;
      if (data.holidays && data.holidays.length > 0) {
        const holidayRows = data.holidays.map((h) => {
          const row: any = {
            id: h.id,
            date: h.date,
            name: h.name,
            description: h.description || null,
            updated_at: new Date().toISOString(),
          };
          if (effectiveUserId) {
            row.user_id = effectiveUserId;
          }
          return row;
        });

        const { error: holError } = await client
          .from('worklog_holidays')
          .upsert(holidayRows);

        if (holError) {
          throw new Error(`Failed to sync holidays: ${holError.message}`);
        }
        pushedHolidays = holidayRows.length;
      }

      // 3. Push Settings
      if (data.settings) {
        const settingsRow: any = {
          user_name: data.settings.userName,
          default_working_hours_minutes: data.settings.defaultWorkingHoursMinutes,
          default_client: data.settings.defaultClient,
          default_project: data.settings.defaultProject,
          default_job: data.settings.defaultJob,
          weekend_days: data.settings.weekendDays,
          updated_at: new Date().toISOString(),
        };

        if (effectiveUserId) {
          settingsRow.user_id = effectiveUserId;
        }

        const { error: setErr } = await client
          .from('worklog_settings')
          .upsert(settingsRow);

        if (setErr) {
          console.warn('Settings sync notice:', setErr.message);
        }
      }

      const nowIso = new Date().toISOString();
      this.setLastSyncTime(nowIso);

      return {
        success: true,
        message: `Successfully uploaded ${pushedDays} days and ${pushedHolidays} holidays for your account!`,
        pushedDays,
        pushedHolidays,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Sync to Supabase failed.',
        error: err?.message,
      };
    }
  }

  public async pullFromCloud(userId?: string): Promise<{
    success: boolean;
    message: string;
    data?: BackupData;
    error?: string;
  }> {
    const client = this.getClient();
    if (!client) {
      return {
        success: false,
        message: 'Supabase credentials not configured.',
      };
    }

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      // 1. Fetch Days (RLS automatically scopes to authenticated user, plus explicit filter if user ID present)
      let daysQuery = client.from('worklog_days').select('*');
      if (effectiveUserId) {
        daysQuery = daysQuery.eq('user_id', effectiveUserId);
      }
      const { data: daysData, error: daysError } = await daysQuery;

      if (daysError) throw new Error(`Failed to pull days: ${daysError.message}`);

      // 2. Fetch Holidays
      let holQuery = client.from('worklog_holidays').select('*');
      if (effectiveUserId) {
        holQuery = holQuery.eq('user_id', effectiveUserId);
      }
      const { data: holData, error: holError } = await holQuery;

      if (holError) throw new Error(`Failed to pull holidays: ${holError.message}`);

      // 3. Fetch Settings
      let setQuery = client.from('worklog_settings').select('*');
      if (effectiveUserId) {
        setQuery = setQuery.eq('user_id', effectiveUserId);
      }
      const { data: setData } = await setQuery.maybeSingle();

      const dayRecords: DayRecord[] = (daysData || []).map((r: any) => ({
        date: r.date,
        type: r.type,
        hoursMinutes: r.hours_minutes ?? 480,
        notes: r.notes || undefined,
        entries: Array.isArray(r.entries) ? r.entries : [],
      }));

      const holidays: Holiday[] = (holData || []).map((h: any) => ({
        id: h.id,
        date: h.date,
        name: h.name,
        description: h.description || undefined,
      }));

      const settings: Settings = {
        userName: setData?.user_name || activeUser?.user_metadata?.full_name || 'Yoosuf',
        defaultWorkingHoursMinutes: setData?.default_working_hours_minutes ?? 480,
        defaultClient: setData?.default_client || 'Evolver',
        defaultProject: setData?.default_project || 'ARIA',
        defaultJob: setData?.default_job || 'Development',
        weekendDays: Array.isArray(setData?.weekend_days) ? setData.weekend_days : [0, 6],
      };

      const nowIso = new Date().toISOString();
      this.setLastSyncTime(nowIso);

      return {
        success: true,
        message: `Retrieved ${dayRecords.length} day records and ${holidays.length} holidays from Supabase.`,
        data: {
          version: 1,
          exportedAt: nowIso,
          settings,
          holidays,
          dayRecords,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to pull data from Supabase.',
        error: err?.message,
      };
    }
  }

  // ================= On-the-Go Granular Cloud Operations =================

  /**
   * Immediately saves or updates a single day record in Supabase on the fly.
   */
  public async saveDayToCloud(day: DayRecord, userId?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      const row: any = {
        date: day.date,
        type: day.type,
        hours_minutes: day.hoursMinutes ?? 480,
        notes: day.notes || null,
        entries: day.entries || [],
        updated_at: new Date().toISOString(),
      };
      if (effectiveUserId) {
        row.user_id = effectiveUserId;
      }

      const conflictTarget = effectiveUserId ? 'user_id,date' : 'date';
      const { error } = await client.from('worklog_days').upsert(row, { onConflict: conflictTarget });

      if (error) {
        // Fallback upsert without explicit onConflict in case of single constraint
        const { error: fallbackErr } = await client.from('worklog_days').upsert(row);
        if (fallbackErr) {
          console.warn('saveDayToCloud error:', fallbackErr.message);
          return { success: false, error: fallbackErr.message };
        }
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      console.warn('saveDayToCloud exception:', err);
      return { success: false, error: err?.message || 'Failed to save day to cloud' };
    }
  }

  /**
   * Immediately saves a batch of day records in Supabase on the fly.
   */
  public async saveDaysBatchToCloud(days: DayRecord[], userId?: string): Promise<{ success: boolean; error?: string }> {
    if (!days || days.length === 0) return { success: true };
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      const rows = days.map((day) => {
        const row: any = {
          date: day.date,
          type: day.type,
          hours_minutes: day.hoursMinutes ?? 480,
          notes: day.notes || null,
          entries: day.entries || [],
          updated_at: new Date().toISOString(),
        };
        if (effectiveUserId) {
          row.user_id = effectiveUserId;
        }
        return row;
      });

      const conflictTarget = effectiveUserId ? 'user_id,date' : 'date';
      const { error } = await client.from('worklog_days').upsert(rows, { onConflict: conflictTarget });

      if (error) {
        const { error: fallbackErr } = await client.from('worklog_days').upsert(rows);
        if (fallbackErr) {
          return { success: false, error: fallbackErr.message };
        }
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save batch days to cloud' };
    }
  }

  /**
   * Immediately deletes a day record from Supabase.
   */
  public async deleteDayFromCloud(date: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      let query = client.from('worklog_days').delete().eq('date', date);
      if (effectiveUserId) {
        query = query.eq('user_id', effectiveUserId);
      }

      const { error } = await query;
      if (error) {
        return { success: false, error: error.message };
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete day from cloud' };
    }
  }

  /**
   * Immediately saves or updates a holiday in Supabase on the fly.
   */
  public async saveHolidayToCloud(holiday: Holiday, userId?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      const row: any = {
        id: holiday.id,
        date: holiday.date,
        name: holiday.name,
        description: holiday.description || null,
        updated_at: new Date().toISOString(),
      };
      if (effectiveUserId) {
        row.user_id = effectiveUserId;
      }

      const { error } = await client.from('worklog_holidays').upsert(row);
      if (error) {
        return { success: false, error: error.message };
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save holiday to cloud' };
    }
  }

  /**
   * Immediately deletes a holiday from Supabase.
   */
  public async deleteHolidayFromCloud(holidayId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      let query = client.from('worklog_holidays').delete().eq('id', holidayId);
      if (effectiveUserId) {
        query = query.eq('user_id', effectiveUserId);
      }

      const { error } = await query;
      if (error) {
        return { success: false, error: error.message };
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete holiday from cloud' };
    }
  }

  /**
   * Immediately saves or updates settings in Supabase on the fly.
   */
  public async saveSettingsToCloud(settings: Settings, userId?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      const row: any = {
        user_name: settings.userName,
        default_working_hours_minutes: settings.defaultWorkingHoursMinutes,
        default_client: settings.defaultClient,
        default_project: settings.defaultProject,
        default_job: settings.defaultJob,
        weekend_days: settings.weekendDays,
        updated_at: new Date().toISOString(),
      };
      if (effectiveUserId) {
        row.user_id = effectiveUserId;
      }

      const { error } = await client.from('worklog_settings').upsert(row);
      if (error) {
        return { success: false, error: error.message };
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to save settings to cloud' };
    }
  }

  /**
   * Clears all days and holidays for the user in Supabase.
   */
  public async clearUserDataFromCloud(userId?: string): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, error: 'Supabase client not configured' };

    try {
      const activeUser = await this.getCurrentUser();
      const effectiveUserId = userId || activeUser?.id;

      if (effectiveUserId) {
        await client.from('worklog_days').delete().eq('user_id', effectiveUserId);
        await client.from('worklog_holidays').delete().eq('user_id', effectiveUserId);
      } else {
        await client.from('worklog_days').delete().neq('date', '');
        await client.from('worklog_holidays').delete().neq('id', '');
      }

      this.setLastSyncTime(new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to clear cloud data' };
    }
  }
}

export const supabaseService = new SupabaseService();
