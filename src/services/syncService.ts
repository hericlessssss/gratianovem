
import { supabase } from '@/integrations/supabase/client';
import { localNovenaService, LocalNovenaRun, LocalDayProgress } from './localNovenaService';

/**
 * Synchronizes local guest data to Supabase for the authenticated user.
 * This should be called immediately after a user signs in or signs up.
 */
export const syncLocalDataToSupabase = async (userId: string) => {
    const localRuns = localNovenaService.getRuns();

    if (localRuns.length === 0) return;

    console.log('Syncing local data for user:', userId);

    try {
        for (const localRun of localRuns) {
            // 1. Check if a remote run already exists for this novena and user
            const { data: existingRemoteRun } = await supabase
                .from('user_novena_runs')
                .select('id')
                .eq('user_id', userId)
                .eq('novena_id', localRun.novena_id)
                .eq('status', 'in_progress')
                .maybeSingle();

            let remoteRunId = existingRemoteRun?.id;

            // 2. If no remote run, create one based on local run
            if (!remoteRunId) {
                const { data: newRun, error: createError } = await supabase
                    .from('user_novena_runs')
                    .insert({
                        user_id: userId,
                        novena_id: localRun.novena_id,
                        started_at: localRun.started_at,
                        status: localRun.status,
                        completed_at: localRun.completed_at,
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error syncing run:', createError);
                    continue; // Skip day sync if run creation failed
                }
                remoteRunId = newRun.id;
            }

            // 3. Sync Day Progress
            const localDays = localNovenaService.getAllDayProgress(localRun.id);

            for (const localDay of localDays) {
                // Upsert day progress
                // We use upsert to ensure we don't duplicate if it partly exists
                // But day progress is ID-based. We need to match by run_id + day_number.

                // First check if specific day progress exists remotely
                const { data: existingDay, error: dayFetchError } = await supabase
                    .from('user_day_progress')
                    .select('id, checklist_state')
                    .eq('run_id', remoteRunId)
                    .eq('day_number', localDay.day_number)
                    .maybeSingle();

                if (dayFetchError) {
                    console.error('Error checking remote day:', dayFetchError);
                    continue;
                }

                if (existingDay) {
                    // Merge checklist state? Or overwrite? 
                    // For now, if local has keys that remote doesn't, or simply prefer local if it was "guest work"
                    // Let's assume the local guest work is the latest "truth" requested to be synced.
                    // However, if the user had OLD data on server, and NEW data on local, local should win?
                    // Let's merged them cautiously. Local overwrites remote for simplicity of "saving my verified progress".

                    await supabase
                        .from('user_day_progress')
                        .update({
                            checklist_state: localDay.checklist_state,
                            is_completed: localDay.is_completed,
                            completed_at: localDay.completed_at,
                        })
                        .eq('id', existingDay.id);
                } else {
                    await supabase
                        .from('user_day_progress')
                        .insert({
                            run_id: remoteRunId,
                            day_number: localDay.day_number,
                            checklist_state: localDay.checklist_state,
                            is_completed: localDay.is_completed,
                            completed_at: localDay.completed_at,
                        });
                }
            }
        }

        // 4. Clear local data after successful sync
        localNovenaService.clearAll();
        console.log('Sync complete, local data cleared.');

    } catch (error) {
        console.error('Sync failed:', error);
    }
};
