# Phase 4: Frontend - React UI

## Objective
Build React components for Town screen with real-time updates

## Tasks

### 4.1 Project Setup

#### 4.1.1 API Client
**File:** `packages/app/src/lib/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Auth
  register: async (userId?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  login: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  // Town
  getTownState: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/town/state/${userId}`);
    return res.json();
  },

  buyEnergy: async (userId: string, packageType: string) => {
    const res = await fetch(`${API_BASE_URL}/town/buy-energy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, packageType })
    });
    return res.json();
  },

  buyBuilding: async (userId: string, slotNumber: number) => {
    const res = await fetch(`${API_BASE_URL}/town/buy-building`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, slotNumber })
    });
    return res.json();
  },

  startTrade: async (userId: string, buildingId: string, riskMode: string) => {
    const res = await fetch(`${API_BASE_URL}/town/start-trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, buildingId, riskMode })
    });
    return res.json();
  },

  claimReward: async (userId: string, tradeId: string) => {
    const res = await fetch(`${API_BASE_URL}/town/claim-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tradeId })
    });
    return res.json();
  },

  getTrades: async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/town/trades/${userId}`);
    return res.json();
  }
};
```

#### 4.1.2 Supabase Client (Realtime)
**File:** `packages/app/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 4.1.3 Environment Variables
**File:** `packages/app/.env.local`

```
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4.2 State Management & Hooks

#### 4.2.1 User Context
**File:** `packages/app/src/contexts/UserContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  userId: string | null;
  balances: UserBalances | null;
  townLevel: number;
  setUserId: (id: string) => void;
  refreshBalances: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem('userId')
  );
  const [balances, setBalances] = useState<UserBalances | null>(null);
  const [townLevel, setTownLevel] = useState(1);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
      refreshBalances();
    }
  }, [userId]);

  const refreshBalances = async () => {
    if (!userId) return;

    const data = await api.getTownState(userId);
    setBalances(data.balances);
    setTownLevel(data.town.level);
  };

  return (
    <UserContext.Provider value={{ userId, balances, townLevel, setUserId, refreshBalances }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
```

#### 4.2.2 Trade Realtime Hook
**File:** `packages/app/src/hooks/useTradeRealtime.ts`

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trade } from '@stealth-town/shared/types';

export function useTradeRealtime(userId: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    api.getTrades(userId).then(data => {
      setTrades(data.activeTrades);
    });

    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-trades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Trade updated:', payload);

          if (payload.eventType === 'INSERT') {
            setTrades(prev => [...prev, payload.new as Trade]);
          } else if (payload.eventType === 'UPDATE') {
            setTrades(prev => prev.map(t =>
              t.id === payload.new.id ? payload.new as Trade : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTrades(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return trades;
}
```

### 4.3 Components

#### 4.3.1 Auth Screen
**File:** `packages/app/src/components/AuthScreen.tsx`

```typescript
import { useState } from 'react';
import { api } from '../lib/api';
import { useUser } from '../contexts/UserContext';

export function AuthScreen() {
  const [inputUserId, setInputUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserId } = useUser();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const data = await api.register();
      setUserId(data.user.id);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!inputUserId.trim()) return;

    setLoading(true);
    try {
      const data = await api.login(inputUserId);
      setUserId(data.user.id);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <h1>Tokabu Town</h1>

      <button onClick={handleRegister} disabled={loading}>
        Create New Account
      </button>

      <div className="login-form">
        <input
          type="text"
          placeholder="Enter User ID"
          value={inputUserId}
          onChange={(e) => setInputUserId(e.target.value)}
        />
        <button onClick={handleLogin} disabled={loading}>
          Login
        </button>
      </div>
    </div>
  );
}
```

#### 4.3.2 Balance Display
**File:** `packages/app/src/components/BalanceDisplay.tsx`

```typescript
import { useUser } from '../contexts/UserContext';

export function BalanceDisplay() {
  const { balances, townLevel } = useUser();

  if (!balances) return <div>Loading...</div>;

  return (
    <div className="balance-display">
      <div className="balance-item">
        <span>⚡ Energy:</span>
        <strong>{balances.energy}</strong>
      </div>
      <div className="balance-item">
        <span>🪙 Tokens:</span>
        <strong>{balances.tokens}</strong>
      </div>
      <div className="balance-item">
        <span>💵 USDC:</span>
        <strong>${balances.usdc.toFixed(2)}</strong>
      </div>
      <div className="balance-item">
        <span>🏘️ Town Level:</span>
        <strong>{townLevel}</strong>
      </div>
    </div>
  );
}
```

#### 4.3.3 Energy Shop
**File:** `packages/app/src/components/EnergyShop.tsx`

```typescript
import { useUser } from '../contexts/UserContext';
import { api } from '../lib/api';

const PACKAGES = [
  { type: 'small', energy: 1, usdc: 1, label: '1 Energy - $1' },
  { type: 'medium', energy: 11, usdc: 10, label: '11 Energy - $10' },
  { type: 'large', energy: 60, usdc: 50, label: '60 Energy - $50' }
];

export function EnergyShop() {
  const { userId, balances, refreshBalances } = useUser();

  const handleBuy = async (packageType: string) => {
    if (!userId) return;

    try {
      await api.buyEnergy(userId, packageType);
      await refreshBalances();
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <div className="energy-shop">
      <h3>⚡ Energy Shop</h3>
      {PACKAGES.map(pkg => (
        <button
          key={pkg.type}
          onClick={() => handleBuy(pkg.type)}
          disabled={!balances || balances.usdc < pkg.usdc}
        >
          {pkg.label}
        </button>
      ))}
    </div>
  );
}
```

#### 4.3.4 Building Shop
**File:** `packages/app/src/components/BuildingShop.tsx`

```typescript
import { useUser } from '../contexts/UserContext';
import { api } from '../lib/api';

export function BuildingShop({ buildings, onBuildingPurchased }: Props) {
  const { userId, balances, townLevel, refreshBalances } = useUser();

  const unlockedSlots = townLevel; // level 1 = 1 slot, level 2 = 2 slots, etc.
  const nextSlot = buildings.length + 1;
  const canBuy = nextSlot <= unlockedSlots && balances && balances.usdc >= 100;

  const handleBuy = async () => {
    if (!userId || !canBuy) return;

    try {
      const data = await api.buyBuilding(userId, nextSlot);
      await refreshBalances();
      onBuildingPurchased(data.building);
    } catch (error) {
      console.error('Building purchase failed:', error);
    }
  };

  return (
    <div className="building-shop">
      <h3>🏗️ Buy Building</h3>
      <p>Slots: {buildings.length}/{unlockedSlots}</p>
      <button onClick={handleBuy} disabled={!canBuy}>
        Buy Building - $100
      </button>
      {nextSlot > unlockedSlots && (
        <p>Unlock more slots by upgrading town level!</p>
      )}
    </div>
  );
}
```

#### 4.3.5 Building Slot
**File:** `packages/app/src/components/BuildingSlot.tsx`

```typescript
import { useState } from 'react';
import { Building, RiskMode } from '@stealth-town/shared/types';
import { api } from '../lib/api';
import { useUser } from '../contexts/UserContext';

export function BuildingSlot({ building, trade }: Props) {
  const { userId, refreshBalances } = useUser();
  const [selectedRisk, setSelectedRisk] = useState<RiskMode>('turtle');

  const handleStartTrade = async () => {
    if (!userId || trade) return;

    try {
      await api.startTrade(userId, building.id, selectedRisk);
      await refreshBalances();
    } catch (error) {
      console.error('Start trade failed:', error);
    }
  };

  const handleClaimReward = async () => {
    if (!userId || !trade) return;

    try {
      await api.claimReward(userId, trade.id);
      await refreshBalances();
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  if (!trade) {
    // Building is idle - show risk mode selector
    return (
      <div className="building-slot idle">
        <h4>Building {building.slotNumber}</h4>
        <select value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value as RiskMode)}>
          <option value="turtle">🐢 Turtle (5 min)</option>
          <option value="walk">🚶 Walk (3 min)</option>
          <option value="cheetah">🐆 Cheetah (2 min)</option>
        </select>
        <button onClick={handleStartTrade}>Start Trade</button>
      </div>
    );
  }

  // Building has active/completed trade
  const isCompleted = trade.status === 'completed';
  const isLiquidated = trade.status === 'liquidated';
  const canClaim = isCompleted || isLiquidated;

  return (
    <div className={`building-slot ${trade.status}`}>
      <h4>Building {building.slotNumber}</h4>
      <div className="trade-info">
        <p>Mode: {trade.riskMode}</p>
        <p>Status: {trade.status}</p>
        {isCompleted && <p>✅ Reward: {trade.tokensReward} tokens</p>}
        {isLiquidated && <p>❌ Liquidated</p>}
        {trade.status === 'active' && (
          <p>Time left: {Math.floor((new Date(trade.completionTime).getTime() - Date.now()) / 1000)}s</p>
        )}
      </div>
      {canClaim && (
        <button onClick={handleClaimReward}>Claim Reward</button>
      )}
    </div>
  );
}
```

#### 4.3.6 Town Screen
**File:** `packages/app/src/screens/TownScreen.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTradeRealtime } from '../hooks/useTradeRealtime';
import { api } from '../lib/api';
import { BalanceDisplay } from '../components/BalanceDisplay';
import { EnergyShop } from '../components/EnergyShop';
import { BuildingShop } from '../components/BuildingShop';
import { BuildingSlot } from '../components/BuildingSlot';

export function TownScreen() {
  const { userId } = useUser();
  const [buildings, setBuildings] = useState([]);
  const trades = useTradeRealtime(userId);

  useEffect(() => {
    if (userId) {
      api.getTownState(userId).then(data => {
        setBuildings(data.buildings);
      });
    }
  }, [userId]);

  return (
    <div className="town-screen">
      <BalanceDisplay />

      <div className="town-layout">
        <div className="left-panel">
          <EnergyShop />
          <BuildingShop
            buildings={buildings}
            onBuildingPurchased={(b) => setBuildings([...buildings, b])}
          />
        </div>

        <div className="right-panel">
          <h2>Your Buildings</h2>
          <div className="buildings-grid">
            {buildings.map(building => {
              const trade = trades.find(t => t.buildingId === building.id);
              return (
                <BuildingSlot
                  key={building.id}
                  building={building}
                  trade={trade}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 4.3.7 App Router
**File:** `packages/app/src/App.tsx`

```typescript
import { useState } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { AuthScreen } from './components/AuthScreen';
import { TownScreen } from './screens/TownScreen';

function AppContent() {
  const { userId } = useUser();
  const [currentScreen, setCurrentScreen] = useState<'town' | 'character' | 'dungeon'>('town');

  if (!userId) {
    return <AuthScreen />;
  }

  return (
    <div className="app">
      <nav>
        <button onClick={() => setCurrentScreen('town')}>Town</button>
        <button onClick={() => setCurrentScreen('character')} disabled>Character (Soon)</button>
        <button onClick={() => setCurrentScreen('dungeon')} disabled>Dungeon (Soon)</button>
      </nav>

      {currentScreen === 'town' && <TownScreen />}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
```

### 4.4 Styling (Basic)

#### 4.4.1 Town Screen Styles
**File:** `packages/app/src/screens/TownScreen.css`

```css
.town-screen {
  padding: 20px;
}

.balance-display {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
}

.town-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.building-slot {
  border: 2px solid #ccc;
  padding: 15px;
  border-radius: 8px;
}

.building-slot.idle {
  border-color: #999;
}

.building-slot.active {
  border-color: #4caf50;
}

.building-slot.completed {
  border-color: #2196f3;
}

.building-slot.liquidated {
  border-color: #f44336;
}
```

## Validation Checklist

- [ ] API client configured with all endpoints
- [ ] Supabase realtime client configured
- [ ] UserContext manages auth and balances
- [ ] useTradeRealtime hook subscribes to trade updates
- [ ] AuthScreen allows register/login
- [ ] BalanceDisplay shows energy/tokens/USDC
- [ ] EnergyShop allows purchasing energy packages
- [ ] BuildingShop allows purchasing buildings (respects town level)
- [ ] BuildingSlot shows idle state with risk mode selection
- [ ] BuildingSlot shows active trade with timer
- [ ] BuildingSlot shows completed/liquidated state with claim button
- [ ] Real-time updates work (trade status changes reflect immediately)
- [ ] App builds and runs without errors

## Next Steps
- Test full loop end-to-end
- Polish UI/UX if time permits
- Add error handling and loading states
- Consider adding toast notifications for actions
