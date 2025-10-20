import { supabaseClient } from "@stealth-town/shared/supabase";
import type { UserId } from "@stealth-town/shared/types";

export interface TownData {
    id?: string;
    user_id: UserId;
    level?: number;
    max_slots?: number;
}

export class TownRepo {
    /**
     * Find town by ID
     */
    async findById(townId: string) {
        const { data, error } = await supabaseClient
            .from("towns")
            .select("*")
            .eq("id", townId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Find town by user ID
     */
    async findByUserId(userId: UserId) {
        const { data, error } = await supabaseClient
            .from("towns")
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
     * Create a new town
     */
    async create(townData: TownData) {
        const { data, error } = await supabaseClient
            .from("towns")
            .insert({
                ...townData,
                level: townData.level ?? 1,
                max_slots: townData.max_slots ?? 3,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update a town
     */
    async update(townId: string, updates: Partial<TownData>) {
        const { data, error } = await supabaseClient
            .from("towns")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", townId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete a town
     */
    async delete(townId: string) {
        const { data, error } = await supabaseClient
            .from("towns")
            .delete()
            .eq("id", townId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get all towns (for admin purposes)
     */
    async findAll() {
        const { data, error } = await supabaseClient
            .from("towns")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    }
}
