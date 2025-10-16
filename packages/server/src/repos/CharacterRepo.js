import { supabaseClient } from "@stealth-town/shared/supabase";
export class CharacterRepo {
    /**
     * Find character by ID
     */
    async findById(characterId) {
        const { data, error } = await supabaseClient
            .from("characters")
            .select("*")
            .eq("id", characterId)
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Find character by user ID
     */
    async findByUserId(userId) {
        const { data, error } = await supabaseClient
            .from("characters")
            .select("*")
            .eq("user_id", userId)
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
     * Create a new character
     */
    async create(characterData) {
        const { data, error } = await supabaseClient
            .from("characters")
            .insert({
            ...characterData,
            damage_rating: characterData.damage_rating ?? 0,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Update a character
     */
    async update(characterId, updates) {
        const { data, error } = await supabaseClient
            .from("characters")
            .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
            .eq("id", characterId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Delete a character
     */
    async delete(characterId) {
        const { data, error } = await supabaseClient
            .from("characters")
            .delete()
            .eq("id", characterId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    /**
     * Update character's damage rating
     */
    async updateDamageRating(characterId, damageRating) {
        return await this.update(characterId, { damage_rating: damageRating });
    }
    /**
     * Get all characters (for admin purposes)
     */
    async findAll() {
        const { data, error } = await supabaseClient
            .from("characters")
            .select("*")
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        return data;
    }
}
//# sourceMappingURL=CharacterRepo.js.map