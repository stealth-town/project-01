import { supabaseClient } from '@stealth-town/shared/supabase';
import { EnergyPackage, type EnergyPurchase } from '@stealth-town/shared/types';
import { transformEnergyPurchase } from '../utils/transforms.js';

export class EnergyPurchaseRepo {

  async create(
    userId: string,
    packageType: EnergyPackage,
    energyAmount: number,
    usdcCost: number
  ): Promise<EnergyPurchase> {
    const { data, error } = await supabaseClient
      .from('energy_purchases')
      .insert({
        user_id: userId,
        package_type: packageType,
        energy_amount: energyAmount,
        usdc_cost: usdcCost
      })
      .select()
      .single();

    if (error) throw error;
    return transformEnergyPurchase(data);
  }

  async findByUserId(userId: string): Promise<EnergyPurchase[]> {
    const { data, error } = await supabaseClient
      .from('energy_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false});

    if (error) throw error;
    return (data || []).map(transformEnergyPurchase);
  }
}
