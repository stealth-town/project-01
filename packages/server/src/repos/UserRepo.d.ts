import { type UserBalances } from '@stealth-town/shared/types';
export declare class UserRepo {
    findById(userId: string): Promise<{
        created_at: string;
        energy: number;
        id: string;
        tokens: number;
        town_level: number;
        updated_at: string;
        usdc: number;
    }>;
    create(userData?: {
        id?: string;
    }): Promise<{
        created_at: string;
        energy: number;
        id: string;
        tokens: number;
        town_level: number;
        updated_at: string;
        usdc: number;
    }>;
    getBalances(userId: string): Promise<UserBalances>;
    updateBalances(userId: string, balances: Partial<UserBalances>): Promise<{
        created_at: string;
        energy: number;
        id: string;
        tokens: number;
        town_level: number;
        updated_at: string;
        usdc: number;
    }>;
    addCurrency(userId: string, currency: 'energy' | 'tokens' | 'usdc', amount: number): Promise<number>;
    deductCurrency(userId: string, currency: 'energy' | 'tokens' | 'usdc', amount: number): Promise<number>;
    getTownLevel(userId: string): Promise<number>;
    upgradeTownLevel(userId: string): Promise<{
        created_at: string;
        energy: number;
        id: string;
        tokens: number;
        town_level: number;
        updated_at: string;
        usdc: number;
    }>;
    getUnlockedSlots(userId: string): Promise<number>;
}
//# sourceMappingURL=UserRepo.d.ts.map