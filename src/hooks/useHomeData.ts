import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Novena {
    id: string;
    slug: string;
    title: string;
    title_pt: string | null;
    description: string | null;
    description_pt: string | null;
    cover_image_url: string | null;
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

// Fetch the most popular novenas (based on active runs)
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
                // Fallback: Return latest 3 if no runs exist
                const { data: latest } = await supabase
                    .from('novenas')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(3);
                return (latest || []) as Novena[];
            }

            // 2. Count occurrences (runs is potentially just the user's runs due to RLS)
            const counts: Record<string, number> = {};
            runs?.forEach((run) => {
                counts[run.novena_id] = (counts[run.novena_id] || 0) + 1;
            });

            // 3. Sort IDs by frequency
            let topNovenaIds = Object.keys(counts)
                .sort((a, b) => counts[b] - counts[a])
                .slice(0, 3); // Top 3 from runs

            // 4. Backfill: If we have < 3, fetch more from 'novenas' table to fill the carousel
            if (topNovenaIds.length < 3) {
                const limit = 3 - topNovenaIds.length;
                const { data: extras } = await supabase
                    .from('novenas')
                    .select('id')
                    .eq('is_active', true)
                    .not('id', 'in', `(${topNovenaIds.length > 0 ? topNovenaIds.join(',') : '00000000-0000-0000-0000-000000000000'})`) // Exclude already found
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (extras) {
                    topNovenaIds = [...topNovenaIds, ...extras.map(e => e.id)];
                }
            }

            // 5. Fetch details for all final IDs
            const { data: novenas, error: novenaError } = await supabase
                .from('novenas')
                .select('*')
                .in('id', topNovenaIds);

            if (novenaError) throw novenaError;

            // 6. Sort results to match frequency/added order
            const sortedNovenas = topNovenaIds
                .map(id => novenas?.find(n => n.id === id))
                .filter(n => !!n) as Novena[];

            return sortedNovenas;
        },
    });
};
