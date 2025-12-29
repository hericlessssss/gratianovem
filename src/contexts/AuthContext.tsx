import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { syncLocalDataToSupabase } from '@/services/syncService';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_anonymous: boolean;
  email_notifications?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAnonymous: boolean;
  isAdmin: boolean;
  signInAnonymously: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  linkEmail: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error as Error | null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) {
      await syncLocalDataToSupabase(data.user.id);
    }
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${import.meta.env.VITE_PUBLIC_SITE_URL}/auth`;

    // Check if email already exists using our custom RPC
    const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', {
      email_to_check: email
    });

    if (checkError) {
      console.error('Error checking email:', checkError);
      // Continue to try signup if check fails, to avoid blocking user on network error
    } else if (emailExists) {
      return { error: new Error('Este e-mail já está registrado.') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || 'Peregrino',
          email_notifications: true,
        },
      },
    });
    return { error: error as Error | null };
  };

  const linkEmail = async (email: string, password: string, displayName?: string) => {
    try {
      // Scenario 1: User is logged in (Anonymous) -> Link/Update Account
      if (user) {
        const { data, error } = await supabase.auth.updateUser({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Update profile to mark as non-anonymous and set name
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              email,
              display_name: displayName || 'Peregrino',
              is_anonymous: false,
              email_notifications: true, // Default to true as per requirements
              updated_at: new Date().toISOString()
            })
            .eq('user_id', data.user.id);

          if (profileError) {
            console.error('Erro ao atualizar perfil:', profileError);
          }

          // Sync local data to newly linked account
          await syncLocalDataToSupabase(data.user.id);

          await supabase.auth.refreshSession();
        }
        return { error: null };
      }

      // Scenario 2: No user logged in -> Create New Account (SignUp)
      else {
        const redirectUrl = `${import.meta.env.VITE_PUBLIC_SITE_URL}/auth`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: 'Peregrino',
            },
          },
        });

        if (error) throw error;

        // If auto-confirm is on, session might be established immediately
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          // Sync local data to newly created account
          await syncLocalDataToSupabase(data.session.user.id);
        }

        return { error: null };
      }
    } catch (err) {
      console.error('Erro ao processar conta:', err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Always clear local state, even if server request fails
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      localStorage.removeItem('supabase.auth.token'); // Ensure token is gone
    }
  };

  const isAnonymous = profile?.is_anonymous ?? (!user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAnonymous,
        isAdmin,
        signInAnonymously,
        signInWithEmail,
        signUpWithEmail,
        linkEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
