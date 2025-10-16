import { supabaseClient } from "@stealth-town/shared/supabase";

export interface DungeonEventData {
  id?: string;
  character_dungeon_id: string;
  damage_dealt: number;
  created_at?: string;
}

export class DungeonEventRepo {
  /**
   * Create a new dungeon event (hit)
   */
  async create(data: DungeonEventData) {
    const { data: result, error } = await supabaseClient
      .from("dungeon_events")
      .insert({
        character_dungeon_id: data.character_dungeon_id,
        damage_dealt: data.damage_dealt,
        created_at: data.created_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Get all events for a character dungeon
   */
  async findByCharacterDungeonId(characterDungeonId: string) {
    const { data, error } = await supabaseClient
      .from("dungeon_events")
      .select("*")
      .eq("character_dungeon_id", characterDungeonId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }

  /**
   * Get recent events for a character dungeon (limit)
   */
  async findRecentByCharacterDungeonId(characterDungeonId: string, limit: number = 50) {
    const { data, error } = await supabaseClient
      .from("dungeon_events")
      .select("*")
      .eq("character_dungeon_id", characterDungeonId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.reverse(); // Return in chronological order
  }

  /**
   * Count events for a character dungeon
   */
  async countByCharacterDungeonId(characterDungeonId: string): Promise<number> {
    const { count, error } = await supabaseClient
      .from("dungeon_events")
      .select("*", { count: "exact", head: true })
      .eq("character_dungeon_id", characterDungeonId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Delete all events for a character dungeon (cleanup)
   */
  async deleteByCharacterDungeonId(characterDungeonId: string) {
    const { error } = await supabaseClient
      .from("dungeon_events")
      .delete()
      .eq("character_dungeon_id", characterDungeonId);

    if (error) throw error;
  }
}
