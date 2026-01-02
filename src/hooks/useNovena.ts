import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { localNovenaService, LocalNovenaRun, LocalDayProgress } from '@/services/localNovenaService';
import { JSONContent } from '@tiptap/react';

interface Novena {
  id: string;
  slug: string;
  title: string;
  title_pt: string | null;
  description: string | null;
  description_pt: string | null;
  cover_image_url: string | null;
  duration: number;
  is_active: boolean;
}

interface NovenaDay {
  id: string;
  novena_id: string;
  day_number: number;
  title: string;
  title_pt: string | null;
}

interface ContentBlock {
  id: string;
  novena_day_id: string;
  block_type: 'paragraph' | 'prayer' | 'quote' | 'intention';
  content: string;
  content_pt: string | null;
  sort_order: number;
}

export interface ChecklistItem {
  id: string;
  novena_day_id: string;
  label: string;
  label_pt: string | null;
  sort_order: number;
  repetition_count: number;
}

interface NovenaRun {
  id: string;
  user_id: string;
  novena_id: string;
  started_at: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  completed_at: string | null;
}

// Ensure NovenaRun covers both for type safety where they overlap
type AnyNovenaRun = NovenaRun | LocalNovenaRun;

interface DayProgress {
  id: string;
  run_id: string;
  day_number: number;
  checklist_state: Record<string, number | boolean>; // number for repetition count, boolean for legacy/simple checkboxes
  is_completed: boolean;
  completed_at: string | null;
}

// Fetch all active novenas
export const useNovenas = () => {
  return useQuery({
    queryKey: ['novenas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novenas')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Novena[];
    },
  });
};

// Fetch a single novena by slug
export const useNovena = (slug: string) => {
  return useQuery({
    queryKey: ['novena', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novenas')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as Novena | null;
    },
    enabled: !!slug,
  });
};

// Fetch novena days
export const useNovenaDays = (novenaId: string | undefined) => {
  return useQuery({
    queryKey: ['novena-days', novenaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novena_days')
        .select('*')
        .eq('novena_id', novenaId!)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data as NovenaDay[];
    },
    enabled: !!novenaId,
  });
};

// Fetch content blocks for a day
export const useDayContent = (dayId: string | undefined) => {
  return useQuery({
    queryKey: ['day-content', dayId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('day_content_blocks')
        .select('*')
        .eq('novena_day_id', dayId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as ContentBlock[];
    },
    enabled: !!dayId,
  });
};

// Fetch checklist items for a day
export const useDayChecklist = (dayId: string | undefined) => {
  return useQuery({
    queryKey: ['day-checklist', dayId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('day_checklist_items')
        .select('*')
        .eq('novena_day_id', dayId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as unknown as ChecklistItem[];
    },
    enabled: !!dayId,
  });
};

// Fetch day document (TipTap JSON)
export const useDayDocument = (dayId: string | undefined, locale: 'pt' | 'en' = 'pt') => {
  return useQuery({
    queryKey: ['day-document', dayId, locale],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('day_documents')
        .select('doc')
        .eq('novena_day_id', dayId!)
        .eq('locale', locale)
        .maybeSingle();

      if (error) throw error;
      return (data?.doc ?? null) as JSONContent | null;
    },
    enabled: !!dayId,
  });
};

// Get or create a novena run for the current user
export const useNovenaRun = (novenaId: string | undefined) => {
  const { user, isAnonymous } = useAuth();
  // We want to fetch if we have a novenaId. If user is null, we fetch local.
  const isEnabled = !!novenaId;

  return useQuery({
    queryKey: ['novena-run', novenaId, user?.id || 'guest'],
    queryFn: async () => {
      if (!user) {
        // Guest mode: fetch from LocalStorage
        return localNovenaService.getRunByNovenaId(novenaId!) as AnyNovenaRun | null;
      }

      // Get the most recent in-progress run
      const { data, error } = await supabase
        .from('user_novena_runs')
        .select('*')
        .eq('novena_id', novenaId!)
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data as NovenaRun | null;
    },
    enabled: isEnabled,
  });
};

// Fetch all runs for the current user
export const useMyRuns = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-runs', user?.id || 'guest'],
    queryFn: async () => {
      if (!user) {
        // Guest mode: return local runs (without user_day_progress details for now, or fetch them manually if needed)
        // For the homepage/list, we mostly need the runs themselves. 
        // If we need progress stats, we might need to enhance this.
        const localRuns = localNovenaService.getRuns();

        // Fetch details for these novenas to display titles
        const novenaIds = localRuns.map(r => r.novena_id);
        let novenaDetails: { id: string; title: string; slug: string }[] = [];

        if (novenaIds.length > 0) {
          const { data } = await supabase
            .from('novenas')
            .select('id, title, slug')
            .in('id', novenaIds);
          if (data) novenaDetails = data;
        }

        const runsWithProgress = localRuns.map(run => {
          const progress = localNovenaService.getAllDayProgress(run.id);
          const details = novenaDetails.find(n => n.id === run.novena_id);

          return {
            ...run,
            user_day_progress: progress.map(p => ({ is_completed: p.is_completed })),
            novenas: details ? { title: details.title, slug: details.slug } : null
          }
        });
        return runsWithProgress as (AnyNovenaRun & {
          user_day_progress: { is_completed: boolean }[];
          novenas: { title: string; slug: string } | null;
        })[];
      }

      const { data, error } = await supabase
        .from('user_novena_runs')
        .select(`
          *,
          novenas (
            title,
            slug
          ),
          user_day_progress (
            is_completed
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'in_progress');

      if (error) throw error;
      return data as (NovenaRun & {
        user_day_progress: { is_completed: boolean }[];
        novenas: { title: string; slug: string } | null;
      })[];
    },
  });
};

// Create a new novena run
export const useCreateNovenaRun = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (novenaId: string) => {
      if (!user) {
        // Guest mode
        return localNovenaService.createRun(novenaId) as AnyNovenaRun;
      }

      const { data, error } = await supabase
        .from('user_novena_runs')
        .insert({
          novena_id: novenaId,
          user_id: user.id,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;
      return data as NovenaRun;
    },
    onSuccess: (data) => {
      const userId = user?.id || 'guest';
      queryClient.invalidateQueries({ queryKey: ['novena-run', data.novena_id, userId] });
      queryClient.invalidateQueries({ queryKey: ['my-runs', userId] });
    },
  });
};

// Get progress for all days in a run
export const useRunProgress = (runId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['run-progress', runId],
    queryFn: async () => {
      if (!user && runId) {
        // Guest mode - simplistic check, if runId exists and no user logged in, assume local
        // Ideally we check if runId matches a local UUID format vs Supabase UUID, 
        // but commonly they are both UUIDs. However, we only look in LS if !user.
        return localNovenaService.getAllDayProgress(runId) as unknown as DayProgress[]; // Cast effectively compatible types
      }

      const { data, error } = await supabase
        .from('user_day_progress')
        .select('*')
        .eq('run_id', runId!)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data as DayProgress[];
    },
    enabled: !!runId,
  });
};

// Get or create day progress
export const useDayProgress = (runId: string | undefined, dayNumber: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['day-progress', runId, dayNumber],
    queryFn: async () => {
      if (!user && runId) {
        return localNovenaService.getDayProgress(runId, dayNumber) as unknown as DayProgress | null;
      }

      const { data, error } = await supabase
        .from('user_day_progress')
        .select('*')
        .eq('run_id', runId!)
        .eq('day_number', dayNumber)
        .maybeSingle();

      if (error) throw error;
      return data as DayProgress | null;
    },
    enabled: !!runId && dayNumber > 0,
  });
};

// Update day progress (checklist state)
export const useUpdateDayProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      runId,
      dayNumber,
      checklistState,
      isCompleted,
    }: {
      runId: string;
      dayNumber: number;
      checklistState: Record<string, number | boolean>;
      isCompleted: boolean;
    }) => {
      if (!user) {
        // Guest mode
        return localNovenaService.saveDayProgress(runId, dayNumber, checklistState, isCompleted) as unknown as DayProgress;
      }

      // First check if progress exists
      const { data: existing } = await supabase
        .from('user_day_progress')
        .select('id')
        .eq('run_id', runId)
        .eq('day_number', dayNumber)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_day_progress')
          .update({
            checklist_state: checklistState,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as DayProgress;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('user_day_progress')
          .insert({
            run_id: runId,
            day_number: dayNumber,
            checklist_state: checklistState,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data as DayProgress;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['day-progress', data.run_id, data.day_number] });
      queryClient.invalidateQueries({ queryKey: ['run-progress', data.run_id] });
    },
  });
};

// Complete the novena run
export const useCompleteNovenaRun = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (runId: string) => {
      if (!user) {
        return localNovenaService.updateRunStatus(runId, 'completed') as unknown as NovenaRun;
      }

      const { data, error } = await supabase
        .from('user_novena_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
        .select()
        .single();

      if (error) throw error;
      return data as NovenaRun;
    },
    onSuccess: (data) => {
      const userId = user?.id || 'guest';
      queryClient.invalidateQueries({ queryKey: ['novena-run', data.novena_id, userId] });
      queryClient.invalidateQueries({ queryKey: ['my-runs', userId] });
      queryClient.invalidateQueries({ queryKey: ['novena-stats', data.novena_id, userId] });
    },
  });
};

// Cancel the novena run
export const useCancelNovenaRun = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (runId: string) => {
      if (!user) {
        // Guest mode - delete or mark cancelled
        // For simplicity in guest mode we might just remove it
        return localNovenaService.updateRunStatus(runId, 'abandoned') as unknown as NovenaRun;
      }

      const { data, error } = await supabase
        .from('user_novena_runs')
        .update({
          status: 'cancelled', // Migration added this status
          completed_at: new Date().toISOString(), // Mark as finished so index ignore it
        })
        .eq('id', runId)
        .select()
        .single();

      if (error) throw error;
      return data as NovenaRun;
    },
    onSuccess: (data) => {
      const userId = user?.id || 'guest';
      queryClient.invalidateQueries({ queryKey: ['novena-run', data.novena_id, userId] });
      queryClient.invalidateQueries({ queryKey: ['my-runs', userId] });
    },
  });
};

// Fetch completion stats for a user/novena
// Fetch completion stats for a user/novena
export const useNovenaStats = (novenaId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['novena-stats', novenaId, user?.id],
    queryFn: async () => {
      if (!user || !novenaId) return { completion_count: 0, last_completed_at: null };

      // We can query the view strictly or just query runs directly if view migration is optional
      // Let's rely on the view 'user_novena_stats'
      const { data, error } = await supabase
        .from('user_novena_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('novena_id', novenaId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Fallback if view doesn't exist? Nah, just throw or return empty
        console.warn("View user_novena_stats might be missing", error);
        return { completion_count: 0, last_completed_at: null };
      }

      // Explicitly cast to unknown then to expected shape to break likely bad inference
      return (data || { completion_count: 0, last_completed_at: null }) as { completion_count: number; last_completed_at: string | null };
    },
    enabled: !!user && !!novenaId
  });
};
