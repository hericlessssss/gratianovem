import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Novena {
    id: string;
    slug: string;
    title: string;
    title_pt: string | null;
    description: string | null;
    description_pt: string | null;
    duration: number;
}

// Fetch the most recently added novena
export const useLatestNovena = () => {
    return useQuery({
        queryKey: ['latest-novena'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('novenas')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data as Novena | null;
        },
    });
};

// Fetch the most popular novena (based on active runs)
export const usePopularNovena = () => {
    return useQuery({
        queryKey: ['popular-novena'],
        queryFn: async () => {
            // 1. Get all active runs (just novena_id)
            const { data: runs, error: runsError } = await supabase
                .from('user_novena_runs')
                .select('novena_id')
                .eq('status', 'in_progress');

            if (runsError) throw runsError;

            if (!runs || runs.length === 0) {
                // Fallback: Return latest if no runs exist
                const { data: latest } = await supabase
                    .from('novenas')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return latest as Novena | null;
            }

            // 2. Count occurrences
            const counts: Record<string, number> = {};
            runs.forEach((run) => {
                counts[run.novena_id] = (counts[run.novena_id] || 0) + 1;
            });

            // 3. Find top novena ID
            const topNovenaId = Object.keys(counts).reduce((a, b) =>
                counts[a] > counts[b] ? a : b
            );

            // 4. Fetch details
            const { data: novena, error: novenaError } = await supabase
                .from('novenas')
                .select('*')
                .eq('id', topNovenaId)
                .single();

            if (novenaError) throw novenaError;
            return novena as Novena;
        },
    });
};
