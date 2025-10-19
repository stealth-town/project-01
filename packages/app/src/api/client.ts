import type {
  UserBalances,
  TownBuilding,
  Trade,
  EnergyPackage,
  RiskMode
} from '@stealth-town/shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register() {
    return this.request<{ userId: string; username: string; message: string }>('/auth/register', {
      method: 'POST',
    });
  }

  async login(userId: string) {
    return this.request<{ user: { id: string; username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Town state
  async getTownState(userId: string) {
    return this.request<{
      balances: UserBalances;
      town: { level: number; unlockedSlots: number };
      buildings: TownBuilding[];
    }>(`/town/state/${userId}`);
  }

  // Energy purchases
  async buyEnergy(userId: string, packageType: EnergyPackage) {
    return this.request<{ success: boolean; newBalance: number }>('/town/buy-energy', {
      method: 'POST',
      body: JSON.stringify({ userId, packageType }),
    });
  }

  // Building purchases
  async buyBuilding(userId: string, slotNumber: number) {
    return this.request<{ building: TownBuilding }>('/town/buy-building', {
      method: 'POST',
      body: JSON.stringify({ userId, slotNumber }),
    });
  }

  // Town upgrade
  async upgradeTown(userId: string) {
    return this.request<{ newLevel: number; unlockedSlots: number }>('/town/upgrade', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Trade management
  async startTrade(userId: string, buildingId: string, riskMode: RiskMode) {
    return this.request<{ trade: Trade }>('/town/start-trade', {
      method: 'POST',
      body: JSON.stringify({ userId, buildingId, riskMode }),
    });
  }

  async claimReward(userId: string, tradeId: string) {
    return this.request<{ tokens: number; energy: number }>('/town/claim-reward', {
      method: 'POST',
      body: JSON.stringify({ userId, tradeId }),
    });
  }

  async getUserTrades(userId: string) {
    return this.request<Trade[]>(`/town/trades/${userId}`);
  }

  // Character endpoints
  async getCharacterByUserId(userId: string) {
    return this.request<{ character: any }>(`/characters/user/${userId}`);
  }

  async createCharacter(userId: string) {
    return this.request<{ character: any }>('/characters/generate', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Item endpoints
  async getCharacterItems(characterId: string) {
    return this.request<{ items: any[] }>(`/items/character/${characterId}`);
  }

  async getEquipmentSummary(characterId: string) {
    return this.request<{
      equippedItems: any[];
      totalDamageContribution: number;
      totalItemCount: number;
      inventoryCount: number;
      equippedCount: number;
      availableSlots: number;
    }>(`/items/character/${characterId}/summary`);
  }

  async initiateGacha(characterId: string, userId: string) {
    return this.request<{ offeredItems: any[]; message: string }>('/items/gacha/initiate', {
      method: 'POST',
      body: JSON.stringify({ characterId, userId }),
    });
  }

  async confirmGacha(characterId: string, userId: string, choice: number, offeredItems: any[]) {
    return this.request<{ createdItem: any; allOfferedItems: any[]; message: string }>('/items/gacha/confirm', {
      method: 'POST',
      body: JSON.stringify({ characterId, userId, choice, offeredItems }),
    });
  }

  // @deprecated Use initiateGacha and confirmGacha instead
  async buyItem(characterId: string, userId: string) {
    return this.request<{ item: any; message: string }>('/items', {
      method: 'POST',
      body: JSON.stringify({ characterId, userId }),
    });
  }

  async equipItem(itemId: string, slot: number) {
    return this.request<{ item: any }>('/items/equip', {
      method: 'POST',
      body: JSON.stringify({ itemId, slot }),
    });
  }

  async unequipItem(itemId: string) {
    return this.request<{ item: any }>('/items/unequip', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  }

  async deleteItem(itemId: string) {
    return this.request<{ message: string; item: any }>(`/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Dungeon endpoints
  async getActiveDungeonStatus(characterId: string) {
    return this.request<{
      active: boolean;
      characterDungeon: any;
      dungeonRun: any;
    }>(`/dungeon/character/${characterId}/active`);
  }

  async getUnclaimedDungeons(characterId: string) {
    return this.request<{
      dungeons: any[];
      count: number;
    }>(`/dungeon/character/${characterId}/unclaimed`);
  }

  async getCharacterDungeonStats(characterId: string) {
    return this.request<{
      totalDamage: number;
      totalUsdc: number;
      totalRuns: number;
    }>(`/dungeon/character/${characterId}/stats`);
  }

  async getDungeonEvents(characterDungeonId: string, limit?: number) {
    const url = limit
      ? `/dungeon/events/${characterDungeonId}?limit=${limit}`
      : `/dungeon/events/${characterDungeonId}`;
    return this.request<{
      events: any[];
      count: number;
    }>(url);
  }

  async claimDungeonReward(characterDungeonId: string, userId: string) {
    return this.request<{
      message: string;
      usdcAwarded: number;
      characterDungeon: any;
    }>('/dungeon/claim', {
      method: 'POST',
      body: JSON.stringify({ characterDungeonId, userId }),
    });
  }

  async claimAllDungeonRewards(characterId: string, userId: string) {
    return this.request<{
      message: string;
      totalUsdc: number;
      claimedCount: number;
      dungeons: any[];
    }>('/dungeon/claim-all', {
      method: 'POST',
      body: JSON.stringify({ characterId, userId }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
