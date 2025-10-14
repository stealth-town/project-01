import { supabaseClient } from '@stealth-town/shared/supabase';
import { BuildingStatus, type TownBuilding } from '@stealth-town/shared/types';
import { transformBuilding } from '../utils/transforms.js';

export class BuildingRepo {

  async findById(buildingId: string) {
    const { data, error } = await supabaseClient
      .from('buildings')
      .select('*')
      .eq('id', buildingId)
      .single();

    if (error) throw error;
    return data ? transformBuilding(data) : null;
  }

  async findByUserId(userId: string): Promise<TownBuilding[]> {
    const { data, error } = await supabaseClient
      .from('buildings')
      .select('*')
      .eq('user_id', userId)
      .order('slot_number', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformBuilding);
  }

  async create(userId: string, slotNumber: number) {
    const { data, error } = await supabaseClient
      .from('buildings')
      .insert({
        user_id: userId,
        slot_number: slotNumber,
        status: 'idle'
      })
      .select()
      .single();

    if (error) throw error;
    return data ? transformBuilding(data) : null;
  }

  async updateStatus(buildingId: string, status: BuildingStatus) {
    const { data, error} = await supabaseClient
      .from('buildings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', buildingId)
      .select()
      .single();

    if (error) throw error;
    return data ? transformBuilding(data) : null;
  }

  async getActiveBuildings(userId: string) {
    const { data, error } = await supabaseClient
      .from('buildings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return (data || []).map(transformBuilding);
  }

  async countUserBuildings(userId: string): Promise<number> {
    const { count, error } = await supabaseClient
      .from('buildings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  async getAvailableSlot(userId: string): Promise<number | null> {
    const buildings = await this.findByUserId(userId);
    const usedSlots = buildings.map(b => b.slotNumber);

    // Find first available slot (1, 2, or 3)
    for (let slot = 1; slot <= 3; slot++) {
      if (!usedSlots.includes(slot)) {
        return slot;
      }
    }

    return null; // All slots occupied
  }
}
