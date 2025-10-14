import { supabaseClient } from '@stealth-town/shared/supabase';

export class UserRepo {

  async getUser(userId: string) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async addTokens(userId: string, amount: number) {
    // Get current balance
    const user = await this.getUser(userId);
    const newBalance = user.tokens + amount;

    // Update balance
    const { error } = await supabaseClient
      .from('users')
      .update({
        tokens: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }
}
