import { supabaseClient } from "@stealth-town/shared/supabase";
import type { CharacterId, UserId, DungeonRunId } from "@stealth-town/shared/types";

export interface DungeonRunData {
    id?: DungeonRunId;
    duration_seconds: number;
    started_at?: string;
    finished_at?: string | null;
}

export interface DungeonRun {
    id: string;
    character_id: CharacterId | null;
    user_id: UserId | null;
    duration_seconds: number;
    started_at: string;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
}

export class DungeonRunsRepo {
    /**
     * Find dungeon run by ID
     */
    async findById(dungeonRunId: DungeonRunId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .eq("id", dungeonRunId)
            .single();

        if (error) throw error;
        return data as DungeonRun;
    }


    /**
     * Find all active dungeon runs
     */
    async findAllActive() {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .is("finished_at", null)
            .order("started_at", { ascending: false });

        if (error) throw error;
        return data as DungeonRun[];
    }


    /**
     * Find all dungeon runs that should be finished but haven't been marked as finished
     * (started_at + duration_seconds < now and finished_at is null)
     */
    async findExpiredRuns() {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .is("finished_at", null)
            .order("started_at", { ascending: true });

        if (error) throw error;

        // Filter runs that have expired
        const now = new Date();
        return (data as DungeonRun[]).filter((run) => {
            const startedAt = new Date(run.started_at);
            const expiresAt = new Date(startedAt.getTime() + run.duration_seconds * 1000);
            return expiresAt <= now;
        });
    }

    /**
     * Create a new dungeon run
     */
    async create(dungeonRunData: DungeonRunData) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .insert({
                duration_seconds: dungeonRunData.duration_seconds,
                started_at: dungeonRunData.started_at ?? new Date().toISOString(),
                finished_at: dungeonRunData.finished_at ?? null,
            })
            .select()
            .single();

        if (error) throw error;
        return data as DungeonRun;
    }

    /**
     * Update a dungeon run
     */
    async update(dungeonRunId: DungeonRunId, updates: Partial<DungeonRunData>) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", dungeonRunId)
            .select()
            .single();

        if (error) throw error;
        return data as DungeonRun;
    }


    /**
     * Delete a dungeon run
     */
    async delete(dungeonRunId: DungeonRunId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .delete()
            .eq("id", dungeonRunId)
            .select()
            .single();

        if (error) throw error;
        return data as DungeonRun;
    }

    /**
     * Get all dungeon runs (for admin purposes)
     */
    async findAll(limit?: number) {
        let query = supabaseClient
            .from("dungeon_runs")
            .select("*")
            .order("created_at", { ascending: false });

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as DungeonRun[];
    }

}

