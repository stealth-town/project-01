import { supabaseClient } from "@stealth-town/shared/supabase";
export class DungeonRunsRepo {
    /**
     * Find dungeon run by ID
     */
    async findById(dungeonRunId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .eq("id", dungeonRunId)
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Find all dungeon runs for a character
     */
    async findByCharacterId(characterId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .eq("character_id", characterId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return data;
    }
    /**
     * Find all dungeon runs for a user
     */
    async findByUserId(userId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return data;
    }
    /**
     * Find the currently active dungeon run for a character
     * (one that has started but not finished)
     */
    async findActiveByCharacterId(characterId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .eq("character_id", characterId)
            .is("finished_at", null)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        return data;
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
        if (error)
            throw error;
        return data;
    }
    /**
     * Find finished but unclaimed dungeon runs for a character
     */
    async findUnclaimedByCharacterId(characterId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*")
            .eq("character_id", characterId)
            .not("finished_at", "is", null)
            .is("claimed_at", null)
            .order("finished_at", { ascending: false });
        if (error)
            throw error;
        return data;
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
        if (error)
            throw error;
        // Filter runs that have expired
        const now = new Date();
        return data.filter((run) => {
            const startedAt = new Date(run.started_at);
            const expiresAt = new Date(startedAt.getTime() + run.duration_seconds * 1000);
            return expiresAt <= now;
        });
    }
    /**
     * Create a new dungeon run
     */
    async create(dungeonRunData) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .insert({
            character_id: dungeonRunData.character_id,
            user_id: dungeonRunData.user_id,
            duration_seconds: dungeonRunData.duration_seconds,
            starting_damage_rating: dungeonRunData.starting_damage_rating,
            started_at: dungeonRunData.started_at ?? new Date().toISOString(),
            finished_at: dungeonRunData.finished_at ?? null,
            claimed_at: dungeonRunData.claimed_at ?? null,
            reward_amount: dungeonRunData.reward_amount ?? null,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Update a dungeon run
     */
    async update(dungeonRunId, updates) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
            .eq("id", dungeonRunId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Mark a dungeon run as finished and set the reward amount
     */
    async finish(dungeonRunId, rewardAmount) {
        return await this.update(dungeonRunId, {
            finished_at: new Date().toISOString(),
            reward_amount: rewardAmount,
        });
    }
    /**
     * Mark a dungeon run as claimed
     */
    async claim(dungeonRunId) {
        return await this.update(dungeonRunId, {
            claimed_at: new Date().toISOString(),
        });
    }
    /**
     * Mark multiple dungeon runs as claimed
     */
    async claimMultiple(dungeonRunIds) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .update({
            claimed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .in("id", dungeonRunIds)
            .select();
        if (error)
            throw error;
        return data;
    }
    /**
     * Delete a dungeon run
     */
    async delete(dungeonRunId) {
        const { data, error } = await supabaseClient
            .from("dungeon_runs")
            .delete()
            .eq("id", dungeonRunId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Get all dungeon runs (for admin purposes)
     */
    async findAll(limit) {
        let query = supabaseClient
            .from("dungeon_runs")
            .select("*")
            .order("created_at", { ascending: false });
        if (limit) {
            query = query.limit(limit);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    /**
     * Count total dungeon runs for a user
     */
    async countByUserId(userId) {
        const { count, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);
        if (error)
            throw error;
        return count ?? 0;
    }
    /**
     * Count completed dungeon runs for a character
     */
    async countCompletedByCharacterId(characterId) {
        const { count, error } = await supabaseClient
            .from("dungeon_runs")
            .select("*", { count: "exact", head: true })
            .eq("character_id", characterId)
            .not("finished_at", "is", null);
        if (error)
            throw error;
        return count ?? 0;
    }
}
//# sourceMappingURL=DungeonRunsRepo.js.map