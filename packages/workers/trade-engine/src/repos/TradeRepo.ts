import { supabaseClient } from '@stealth-town/shared/supabase';
import { type Trade } from '@stealth-town/shared/types';
import { transformTrade } from '../utils/transforms.js';

export class TradeRepo {

  async getAllActiveTrades(): Promise<Trade[]> {
    const { data, error } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    return (data || []).map(transformTrade);
  }

  async updateTradeStatus(tradeId: string, status: 'pending' | 'active' | 'completed' | 'liquidated') {
    const { error } = await supabaseClient
      .from('trades')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    if (error) throw error;
  }

  async resolveCompletion(tradeId: string, tokensReward: number) {
    const { error } = await supabaseClient
      .from('trades')
      .update({
        status: 'completed',
        tokens_reward: tokensReward,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    if (error) throw error;
  }

  async resolveLiquidation(tradeId: string) {
    const { error } = await supabaseClient
      .from('trades')
      .update({
        status: 'liquidated',
        tokens_reward: 0,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tradeId);

    if (error) throw error;
  }
}
