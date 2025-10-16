import { supabaseClient } from "@stealth-town/shared/supabase";
export class CharacterDungeonRepo {
    /**
     * Create a new character dungeon entry
     */
    async create(data) {
        const { data: result, error } = await supabaseClient
            .from("character_dungeons")
            .insert({
            character_id: data.character_id,
            dungeon_run_id: data.dungeon_run_id,
            user_id: data.user_id,
            starting_damage_rating: data.starting_damage_rating,
            total_damage_dealt: data.total_damage_dealt ?? 0,
            tokens_earned: data.tokens_earned ?? 0,
            joined_at: data.joined_at ?? new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw error;
        return result;
    }
    /**
     * Find character dungeon by ID
     */
    async findById(id) {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .select("*")
            .eq("id", id)
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Find active character dungeon for a character
     */
    async findActiveByCharacterId(characterId) {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .select("*")
            .eq("character_id", characterId)
            .is("finished_at", null)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                // No rows returned
                return null;
            }
            throw error;
        }
        return data;
    }
    /**
     * Find all character dungeons for a specific dungeon run
     */
    async findByDungeonRunId(dungeonRunId) {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .select("*")
            .eq("dungeon_run_id", dungeonRunId);
        if (error)
            throw error;
        return data;
    }
    /**
     * Find all active character dungeons (across all characters in a dungeon run)
     */
    async findAllActive() {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .select("*")
            .is("finished_at", null);
        if (error)
            throw error;
        return data;
    }
    /**
     * Find unclaimed character dungeons for a character
     */
    async findUnclaimedByCharacterId(characterId) {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
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
     * Update character dungeon
     */
    async update(id, updates) {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Increment damage dealt and tokens earned
     */
    async incrementDamage(id, damageAmount) {
        const characterDungeon = await this.findById(id);
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .update({
            total_damage_dealt: characterDungeon.total_damage_dealt + damageAmount,
            tokens_earned: characterDungeon.tokens_earned + damageAmount, // 1:1 ratio
            updated_at: new Date().toISOString(),
        })
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Mark character dungeon as finished
     */
    async finish(id) {
        return await this.update(id, {
            finished_at: new Date().toISOString(),
        });
    }
    /**
     * Mark character dungeon as claimed
     */
    async claim(id) {
        return await this.update(id, {
            claimed_at: new Date().toISOString(),
        });
    }
    /**
     * Get total stats for a character (all-time)
     */
    async getCharacterStats(characterId) {
        const { data, error } = await supabaseClient
            .from("character_dungeons")
            .select("total_damage_dealt, tokens_earned")
            .eq("character_id", characterId)
            .not("finished_at", "is", null);
        if (error)
            throw error;
        const totalDamage = data.reduce((sum, cd) => sum + cd.total_damage_dealt, 0);
        const totalTokens = data.reduce((sum, cd) => sum + cd.tokens_earned, 0);
        const totalRuns = data.length;
        return {
            totalDamage,
            totalTokens,
            totalRuns,
        };
    }
}
//# sourceMappingURL=CharacterDungeonRepo.js.map