import { supabaseClient } from "@stealth-town/shared/supabase";
import type { CharacterId, UserId } from "@stealth-town/shared/types";

export interface CharacterDungeonData {
  id?: string;
  character_id: CharacterId;
  dungeon_run_id: string;
  user_id: UserId;
  starting_damage_rating: number;
  total_damage_dealt?: number;
  usdc_earned?: number;
  joined_at?: string;
  finished_at?: string | null;
  claimed_at?: string | null;
}

export class CharacterDungeonRepo {
  /**
   * Create a new character dungeon entry
   */
  async create(data: CharacterDungeonData) {
    const { data: result, error } = await supabaseClient
      .from("character_dungeons")
      .insert({
        character_id: data.character_id,
        dungeon_run_id: data.dungeon_run_id,
        user_id: data.user_id,
        starting_damage_rating: data.starting_damage_rating,
        total_damage_dealt: data.total_damage_dealt ?? 0,
        usdc_earned: data.usdc_earned ?? 0,
        joined_at: data.joined_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Find character dungeon by ID
   */
  async findById(id: string) {
    const { data, error } = await supabaseClient
      .from("character_dungeons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find active character dungeon for a character
   */
  async findActiveByCharacterId(characterId: CharacterId) {
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
  async findByDungeonRunId(dungeonRunId: string) {
    const { data, error } = await supabaseClient
      .from("character_dungeons")
      .select("*")
      .eq("dungeon_run_id", dungeonRunId);

    if (error) throw error;
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

    if (error) throw error;
    return data;
  }

  /**
   * Find unclaimed character dungeons for a character
   * Limited to the 20 most recent to prevent performance issues
   */
  async findUnclaimedByCharacterId(characterId: CharacterId) {
    const { data, error } = await supabaseClient
      .from("character_dungeons")
      .select("*")
      .eq("character_id", characterId)
      .not("finished_at", "is", null)
      .is("claimed_at", null)
      .order("finished_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  }

  /**
   * Update character dungeon
   */
  async update(id: string, updates: Partial<CharacterDungeonData>) {
    const { data, error } = await supabaseClient
      .from("character_dungeons")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Increment damage dealt and USDC earned
   */
  async incrementDamage(id: string, damageAmount: number) {
    const characterDungeon = await this.findById(id);

    // Convert damage to USDC: 0.01 USDC per 1 damage dealt
    const usdcEarned = damageAmount * 0.01;

    const { data, error } = await supabaseClient
      .from("character_dungeons")
      .update({
        total_damage_dealt: characterDungeon.total_damage_dealt + damageAmount,
        usdc_earned: characterDungeon.usdc_earned + usdcEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark character dungeon as finished
   */
  async finish(id: string) {
    return await this.update(id, {
      finished_at: new Date().toISOString(),
    });
  }

  /**
   * Mark character dungeon as claimed
   */
  async claim(id: string) {
    return await this.update(id, {
      claimed_at: new Date().toISOString(),
    });
  }

  /**
   * Get total stats for a character (all-time)
   */
  async getCharacterStats(characterId: CharacterId) {
    const { data, error } = await supabaseClient
      .from("character_dungeons")
      .select("total_damage_dealt, usdc_earned")
      .eq("character_id", characterId)
      .not("finished_at", "is", null);

    if (error) throw error;

    const totalDamage = data.reduce((sum, cd) => sum + cd.total_damage_dealt, 0);
    const totalUsdc = data.reduce((sum, cd) => sum + cd.usdc_earned, 0);
    const totalRuns = data.length;

    return {
      totalDamage,
      totalUsdc,
      totalRuns,
    };
  }
}
