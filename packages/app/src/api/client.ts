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
}

export const apiClient = new ApiClient(API_BASE_URL);
