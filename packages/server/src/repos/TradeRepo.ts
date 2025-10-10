import { transformTrade } from '../utils/transforms.js';
import { supabaseClient } from '@stealth-town/shared/supabase';
import { TradeStatus, RiskMode, type Trade } from '@stealth-town/shared/types';

interface CreateTradeInput {
  buildingId: string;
  userId: string;
  riskMode: RiskMode;
  energySpent: number;
  entryPrice: number;
  liquidationPrice: number;
  completionTime: Date;
  assetId: string;
}

export class TradeRepo {

  async findById(tradeId: string) {
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (error) throw error;
    return data ? transformTrade(data) : null;
  }

  async findByBuildingId(buildingId: string) {
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('building_id', buildingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? transformTrade(data) : null;
  }

  async findActiveByUserId(userId: string): Promise<Trade[]> {
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'active']); // pending = building, active = active

    if (error) throw error;
    return (data || []).map(transformTrade);
  }

  async findCompletedByUserId(userId: string): Promise<Trade[]> {
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['completed', 'liquidated'])
      .order('resolved_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []).map(transformTrade);
  }

  async create(tradeData: CreateTradeInput) {
    const { data, error } = await supabaseClient
      .from('trades')
      .insert({
        building_id: tradeData.buildingId,
        user_id: tradeData.userId,
        risk_mode: tradeData.riskMode,
        status: 'pending', // Maps to 'building' in app layer
        energy_spent: tradeData.energySpent,
        entry_price: tradeData.entryPrice,
        liquidation_price: tradeData.liquidationPrice,
        completion_time: tradeData.completionTime.toISOString(),
        asset_id: tradeData.assetId,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data ? transformTrade(data) : null;
  }

  async updateStatus(tradeId: string, status: 'pending' | 'active' | 'completed' | 'liquidated') {
    const { data, error } = await supabaseClient
      .from('trades')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (error) throw error;
    return data ? transformTrade(data) : null;
  }

  async activateTrade(tradeId: string) {
    return await this.updateStatus(tradeId, 'active');
  }

  async resolveCompletion(tradeId: string, tokensReward: number) {
    const { data, error } = await supabaseClient
      .from('trades')
      .update({
        status: 'completed',
        tokens_reward: tokensReward,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (error) throw error;
    return data ? transformTrade(data) : null;
  }

  async resolveLiquidation(tradeId: string) {
    const { data, error } = await supabaseClient
      .from('trades')
      .update({
        status: 'liquidated',
        tokens_reward: 0,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (error) throw error;
    return data ? transformTrade(data) : null;
  }

  async getAllActiveTrades(): Promise<Trade[]> {
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    return (data || []).map(transformTrade);
  }
}
