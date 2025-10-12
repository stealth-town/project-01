import { supabaseClient } from "@stealth-town/shared/supabase";
import type { ItemId, CharacterId, ItemType } from "@stealth-town/shared/types";

export interface ItemData {
  id?: ItemId;
  character_id: CharacterId;
  item_type: "weapon" | "armor" | "accessory" | "helmet" | "boots" | "gloves";
  damage_contribution: number;
  is_equipped?: boolean;
  equipped_slot?: number;
}

export class ItemRepo {
  /**
   * Find item by ID
   */
  async findById(itemId: ItemId) {
    const { data, error } = await supabaseClient
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find all items for a character
   */
  async findByCharacterId(characterId: CharacterId) {
    const { data, error } = await supabaseClient
      .from("items")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Find equipped items for a character
   */
  async findEquippedByCharacterId(characterId: CharacterId) {
    const { data, error } = await supabaseClient
      .from("items")
      .select("*")
      .eq("character_id", characterId)
      .eq("is_equipped", true)
      .order("equipped_slot");

    if (error) throw error;
    return data;
  }

  /**
   * Find items by type for a character
   */
  async findByCharacterIdAndType(characterId: CharacterId, itemType: ItemType) {
    const { data, error } = await supabaseClient
      .from("items")
      .select("*")
      .eq("character_id", characterId)
      .eq("item_type", itemType)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create a new item
   */
  async create(itemData: ItemData) {
    const { data, error } = await supabaseClient
      .from("items")
      .insert({
        ...itemData,
        is_equipped: itemData.is_equipped ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an item
   */
  async update(itemId: ItemId, updates: Partial<ItemData>) {
    const { data, error } = await supabaseClient
      .from("items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an item
   */
  async delete(itemId: ItemId) {
    const { data, error } = await supabaseClient
      .from("items")
      .delete()
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Equip an item (set is_equipped to true and assign slot)
   */
  async equip(itemId: ItemId, slot: number) {
    // First, unequip any item in that slot for the same character
    const item = await this.findById(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Check if slot is already occupied
    const existingItem = await supabaseClient
      .from("items")
      .select("id")
      .eq("character_id", item.character_id)
      .eq("equipped_slot", slot)
      .eq("is_equipped", true)
      .single();

    if (existingItem.data && existingItem.data.id !== itemId) {
      throw new Error(`Slot ${slot} is already occupied`);
    }

    // Update the item
    const { data, error } = await supabaseClient
      .from("items")
      .update({
        is_equipped: true,
        equipped_slot: slot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Unequip an item (set is_equipped to false and clear slot)
   */
  async unequip(itemId: ItemId) {
    const { data, error } = await supabaseClient
      .from("items")
      .update({
        is_equipped: false,
        equipped_slot: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get total damage contribution for a character (sum of all equipped items)
   */
  async getTotalDamageContribution(characterId: CharacterId): Promise<number> {
    const { data, error } = await supabaseClient
      .from("items")
      .select("damage_contribution")
      .eq("character_id", characterId)
      .eq("is_equipped", true);

    if (error) throw error;

    return data.reduce((total, item) => total + item.damage_contribution, 0);
  }

  /**
   * Count items for a character
   */
  async countByCharacterId(characterId: CharacterId): Promise<number> {
    const { count, error } = await supabaseClient
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("character_id", characterId);

    if (error) throw error;
    return count || 0;
  }
}
