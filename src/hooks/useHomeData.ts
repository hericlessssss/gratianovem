import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Novena {
    id: string;
    slug: string;
    title: string;
    title_pt: string | null;
    description: string | null;
    description_pt: string | null;
    image_url: string | null;
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

            // 2. Count occurrences
            const counts: Record<string, number> = {};
            runs.forEach((run) => {
                counts[run.novena_id] = (counts[run.novena_id] || 0) + 1;
            });

            // 3. Sort IDs by frequency
            const topNovenaIds = Object.keys(counts)
                .sort((a, b) => counts[b] - counts[a])
                .slice(0, 3); // Top 3

            // If we have fewer than 3, fill with others (optional, but good for slider)
            // For now, let's just stick to what we found, or fetch at least 3 distinct if needed. 
            // Logic: Fetch details for these IDs.

            const { data: novenas, error: novenaError } = await supabase
                .from('novenas')
                .select('*')
                .in('id', topNovenaIds);

            if (novenaError) throw novenaError;

            // Sort results to match frequency order (Postgres 'IN' doesn't guarantee order)
            const sortedNovenas = topNovenaIds
                .map(id => novenas?.find(n => n.id === id))
                .filter((n): n is Novena => !!n);

            return sortedNovenas;
        },
    });
};
