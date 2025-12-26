
import { v4 as uuidv4 } from 'uuid';

export interface LocalNovenaRun {
    id: string;
    user_id: string; // 'guest'
    novena_id: string;
    started_at: string; // ISO string
    status: 'in_progress' | 'completed' | 'abandoned';
    completed_at: string | null;
}

export interface LocalDayProgress {
    id: string;
    run_id: string;
    day_number: number;
    checklist_state: Record<string, number | boolean>;
    is_completed: boolean;
    completed_at: string | null;
}

const RUNS_KEY = 'gratianovem_local_runs';
const DAY_PROGRESS_KEY = 'gratianovem_local_day_progress';

export const localNovenaService = {
    // --- Runs ---

    getRuns: (): LocalNovenaRun[] => {
        try {
            const stored = localStorage.getItem(RUNS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error reading local runs', e);
            return [];
        }
    },

    getRunByNovenaId: (novenaId: string): LocalNovenaRun | null => {
        const runs = localNovenaService.getRuns();
        // Get the most recent in-progress run, similar to backend logic
        return runs
            .filter((r) => r.novena_id === novenaId && r.status === 'in_progress')
            .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0] || null;
    },

    createRun: (novenaId: string): LocalNovenaRun => {
        const runs = localNovenaService.getRuns();
        const newRun: LocalNovenaRun = {
            id: uuidv4(),
            user_id: 'guest',
            novena_id: novenaId,
            started_at: new Date().toISOString(),
            status: 'in_progress',
            completed_at: null,
        };

        // Save
        localStorage.setItem(RUNS_KEY, JSON.stringify([...runs, newRun]));
        return newRun;
    },

    updateRunStatus: (runId: string, status: 'completed' | 'abandoned') => {
        const runs = localNovenaService.getRuns();
        const updatedRuns = runs.map((r) => {
            if (r.id === runId) {
                return {
                    ...r,
                    status,
                    completed_at: status === 'completed' ? new Date().toISOString() : r.completed_at,
                };
            }
            return r;
        });
        localStorage.setItem(RUNS_KEY, JSON.stringify(updatedRuns));
        return updatedRuns.find(r => r.id === runId);
    },

    // --- Day Progress ---

    getAllDayProgress: (runId: string): LocalDayProgress[] => {
        try {
            const stored = localStorage.getItem(DAY_PROGRESS_KEY);
            const allProgress: LocalDayProgress[] = stored ? JSON.parse(stored) : [];
            return allProgress.filter((p) => p.run_id === runId).sort((a, b) => a.day_number - b.day_number);
        } catch (e) {
            console.error('Error reading local day progress', e);
            return [];
        }
    },

    getDayProgress: (runId: string, dayNumber: number): LocalDayProgress | null => {
        const allProgress = localNovenaService.getAllDayProgress(runId);
        return allProgress.find((p) => p.day_number === dayNumber) || null;
    },

    saveDayProgress: (
        runId: string,
        dayNumber: number,
        checklistState: Record<string, number | boolean>,
        isCompleted: boolean
    ): LocalDayProgress => {
        const stored = localStorage.getItem(DAY_PROGRESS_KEY);
        const allProgress: LocalDayProgress[] = stored ? JSON.parse(stored) : [];

        const existingIndex = allProgress.findIndex(
            (p) => p.run_id === runId && p.day_number === dayNumber
        );

        let result: LocalDayProgress;

        if (existingIndex >= 0) {
            // Update
            const updated = {
                ...allProgress[existingIndex],
                checklist_state: checklistState,
                is_completed: isCompleted,
                completed_at: isCompleted ? (allProgress[existingIndex].is_completed ? allProgress[existingIndex].completed_at : new Date().toISOString()) : null
            };
            allProgress[existingIndex] = updated;
            result = updated;
        } else {
            // Create
            const newProgress: LocalDayProgress = {
                id: uuidv4(),
                run_id: runId,
                day_number: dayNumber,
                checklist_state: checklistState,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null
            };
            allProgress.push(newProgress);
            result = newProgress;
        }

        localStorage.setItem(DAY_PROGRESS_KEY, JSON.stringify(allProgress));
        return result;
    },

    // --- Sync Utilities ---

    clearAll: () => {
        localStorage.removeItem(RUNS_KEY);
        localStorage.removeItem(DAY_PROGRESS_KEY);
    }
};
