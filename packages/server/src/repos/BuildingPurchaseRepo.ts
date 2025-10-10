import { supabaseClient } from '@stealth-town/shared/supabase';
import { type BuildingPurchase } from '@stealth-town/shared/types';
import { transformBuildingPurchase } from '../utils/transforms.js';

export class BuildingPurchaseRepo {

  async create(
    userId: string,
    buildingId: string,
    slotNumber: number,
    usdcCost: number
  ): Promise<BuildingPurchase> {
    const { data, error } = await supabaseClient
      .from('building_purchases')
      .insert({
        user_id: userId,
        building_id: buildingId,
        slot_number: slotNumber,
        usdc_cost: usdcCost
      })
      .select()
      .single();

    if (error) throw error;
    return transformBuildingPurchase(data);
  }

  async findByUserId(userId: string): Promise<BuildingPurchase[]> {
    const { data, error } = await supabaseClient
      .from('building_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformBuildingPurchase);
  }
}
