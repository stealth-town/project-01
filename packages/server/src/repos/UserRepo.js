import { supabaseClient } from '@stealth-town/shared/supabase';
import { TOWN_LEVEL_SLOTS } from '@stealth-town/shared/types';
export class UserRepo {
    async findById(userId) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return data;
    }
    async create(userData = {}) {
        const { data, error } = await supabaseClient
            .from('users')
            .insert({
            ...(userData.id && { id: userData.id }),
            // Defaults are set in database migration
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async getBalances(userId) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('energy, tokens, usdc')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return {
            energy: data.energy,
            tokens: data.tokens,
            usdc: Number(data.usdc) // Convert from decimal
        };
    }
    async updateBalances(userId, balances) {
        const updateData = {};
        if (balances.energy !== undefined)
            updateData.energy = balances.energy;
        if (balances.tokens !== undefined)
            updateData.tokens = balances.tokens;
        if (balances.usdc !== undefined)
            updateData.usdc = balances.usdc;
        const { data, error } = await supabaseClient
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async addCurrency(userId, currency, amount) {
        const balances = await this.getBalances(userId);
        const oldBalance = balances[currency];
        const newBalance = oldBalance + amount;
        console.log(`💵 UserRepo.addCurrency - ${currency}: ${oldBalance} + ${amount} = ${newBalance}`);
        await this.updateBalances(userId, { [currency]: newBalance });
        console.log(`✅ UserRepo.addCurrency - ${currency} updated to ${newBalance}`);
        return newBalance;
    }
    async deductCurrency(userId, currency, amount) {
        const balances = await this.getBalances(userId);
        const newBalance = balances[currency] - amount;
        if (newBalance < 0) {
            throw new Error(`Insufficient ${currency}: required ${amount}, available ${balances[currency]}`);
        }
        await this.updateBalances(userId, { [currency]: newBalance });
        return newBalance;
    }
    async getTownLevel(userId) {
        const { data, error } = await supabaseClient
            .from('users')
            .select('town_level')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return data.town_level;
    }
    async upgradeTownLevel(userId) {
        const currentLevel = await this.getTownLevel(userId);
        const newLevel = Math.min(currentLevel + 1, 3); // Max level 3
        const { data, error } = await supabaseClient
            .from('users')
            .update({ town_level: newLevel })
            .eq('id', userId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async getUnlockedSlots(userId) {
        const townLevel = await this.getTownLevel(userId);
        return TOWN_LEVEL_SLOTS[townLevel] || 1;
    }
}
//# sourceMappingURL=UserRepo.js.map