import { supabaseClient } from '@stealth-town/shared/supabase';

export class AssetRepo {

  async findBySymbol(symbol: string) {
    const { data, error } = await supabaseClient
      .from('assets')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error) throw error;
    return data;
  }

  async findById(assetId: string) {
    const { data, error } = await supabaseClient
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) throw error;
    return data;
  }

  async findAll() {
    const { data, error } = await supabaseClient
      .from('assets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}
