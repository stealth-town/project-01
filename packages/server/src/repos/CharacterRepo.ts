import { supabaseClient } from "@stealth-town/shared/supabase";
import type { CharacterId, UserId } from "@stealth-town/shared/types";

export interface CharacterData {
    id?: CharacterId;
    user_id: UserId;
    damage_rating?: number;
}

export class CharacterRepo {
    /**
     * Find character by ID
     */
    async findById(characterId: CharacterId) {
        const { data, error } = await supabaseClient
            .from("characters")
            .select("*")
            .eq("id", characterId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Find character by user ID
     */
    async findByUserId(userId: UserId) {
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
    async create(characterData: CharacterData) {
        const { data, error } = await supabaseClient
            .from("characters")
            .insert({
                ...characterData,
                damage_rating: characterData.damage_rating ?? 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update a character
     */
    async update(characterId: CharacterId, updates: Partial<CharacterData>) {
        const { data, error } = await supabaseClient
            .from("characters")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", characterId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete a character
     */
    async delete(characterId: CharacterId) {
        const { data, error } = await supabaseClient
            .from("characters")
            .delete()
            .eq("id", characterId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update character's damage rating
     */
    async updateDamageRating(characterId: CharacterId, damageRating: number) {
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

        if (error) throw error;
        return data;
    }
}

