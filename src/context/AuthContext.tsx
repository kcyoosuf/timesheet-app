import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseService, SupabaseConfig } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  config: SupabaseConfig;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'signin' | 'signup' | 'forgot' | 'config';
  openAuthModal: (tab?: 'signin' | 'signup' | 'forgot' | 'config') => void;
  closeAuthModal: () => void;
  updateConfig: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  clearConfig: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SupabaseConfig>(supabaseService.getConfig());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'forgot' | 'config'>('signin');

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const currentConfig = supabaseService.getConfig();
      setConfig(currentConfig);

      if (!currentConfig.isConfigured) {
        if (isMounted) {
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentSession = await supabaseService.getSession();
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (err) {
        console.error('Error checking initial auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Subscribe to auth state changes if configured
    const listener = supabaseService.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      if (listener) {
        listener.unsubscribe();
      }
    };
  }, [config.isConfigured]);

  const openAuthModal = useCallback((tab: 'signin' | 'signup' | 'forgot' | 'config' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const updateConfig = useCallback(async (url: string, key: string) => {
    supabaseService.setCustomConfig(url, key);
    const newConfig = supabaseService.getConfig();
    setConfig(newConfig);

    if (newConfig.isConfigured) {
      const test = await supabaseService.testConnection();
      return test;
    }
    return { success: false, message: 'Configuration cleared.' };
  }, []);

  const clearConfig = useCallback(() => {
    supabaseService.clearConfig();
    setConfig(supabaseService.getConfig());
    setUser(null);
    setSession(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const result = await supabaseService.signInWithPassword(email, password);
    setIsLoading(false);

    if (result.error) {
      return { success: false, error: result.error };
    }

    setUser(result.user);
    setSession(result.session);
    return { success: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    const result = await supabaseService.signUp(email, password, displayName);
    setIsLoading(false);

    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.session) {
      setUser(result.user);
      setSession(result.session);
    }

    return {
      success: true,
      confirmationRequired: result.confirmationRequired,
    };
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    await supabaseService.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const result = await supabaseService.resetPasswordForEmail(email);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }, []);

  const value = {
    user,
    session,
    isAuthenticated: Boolean(user),
    isLoading,
    config,
    isConfigured: config.isConfigured,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    updateConfig,
    clearConfig,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
