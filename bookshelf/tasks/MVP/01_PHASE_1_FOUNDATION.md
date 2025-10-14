# Phase 1: Foundation - Database & Types

## Objective
Set up database schema and type system to support Town-Investment loop

## Tasks

### 1.1 Database Migrations

#### 1.1.1 Update Users Table
**File:** `packages/database/supabase/migrations/[timestamp]_update_users.sql`

Add fields for:
- `energy` (integer, default 30) - starting energy balance
- `tokens` (integer, default 0) - token balance from trades
- `usdc` (decimal, default 100) - mock USDC balance (start with 100 for testing)
- `town_level` (integer, default 1) - town level (1-3)
- `created_at`, `updated_at` timestamps

#### 1.1.2 Create Buildings Table
**File:** `packages/database/supabase/migrations/[timestamp]_create_buildings_v2.sql`

Schema:
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- slot_number (integer, 1-3) - which slot this building occupies
- status (enum: 'idle', 'active', 'completed', 'liquidated')
- created_at, updated_at
```

Note: Check if buildings table exists from earlier migrations - may need to update instead of create

#### 1.1.3 Create Trades Table (Update if exists)
**File:** `packages/database/supabase/migrations/[timestamp]_update_trades.sql`

Schema:
```sql
- id (uuid, primary key)
- building_id (uuid, foreign key to buildings)
- user_id (uuid, foreign key to users)
- risk_mode (enum: 'turtle', 'walk', 'cheetah')
- status (enum: 'building', 'active', 'completed', 'liquidated')
- energy_spent (integer) - energy cost (varies by risk mode)
- entry_price (decimal) - ETH price at trade start
- liquidation_price (decimal) - calculated threshold
- completion_time (timestamp) - when trade will complete
- tokens_reward (integer, nullable) - tokens earned on success
- created_at, updated_at, resolved_at
```

#### 1.1.4 Create Energy Purchases Table
**File:** `packages/database/supabase/migrations/[timestamp]_create_energy_purchases.sql`

Schema:
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- package_type (enum: 'small', 'medium', 'large') - 1/11/60 energy
- energy_amount (integer)
- usdc_cost (decimal)
- created_at
```

#### 1.1.5 Create Building Purchases Table
**File:** `packages/database/supabase/migrations/[timestamp]_create_building_purchases.sql`

Schema:
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- building_id (uuid, foreign key to buildings)
- usdc_cost (decimal, default 100)
- slot_number (integer)
- created_at
```

### 1.2 Type Generation

#### 1.2.1 Generate Database Types
```bash
cd packages/database
yarn types-gen
yarn types-copy
```

This updates `packages/shared/src/supabase/database.types.ts`

### 1.3 Domain Types & Interfaces

#### 1.3.1 Create Enums
**File:** `packages/shared/src/types/enums.ts`

Add/update:
```typescript
export enum RiskMode {
  TURTLE = 'turtle',
  WALK = 'walk',
  CHEETAH = 'cheetah'
}

export enum BuildingStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  LIQUIDATED = 'liquidated'
}

export enum TradeStatus {
  BUILDING = 'building',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  LIQUIDATED = 'liquidated'
}

export enum EnergyPackage {
  SMALL = 'small',    // 1 energy / 1 USDC
  MEDIUM = 'medium',  // 11 energy / 10 USDC
  LARGE = 'large'     // 60 energy / 50 USDC
}
```

#### 1.3.2 Create Town Types
**File:** `packages/shared/src/types/town.ts`

```typescript
export interface UserBalances {
  energy: number;
  tokens: number;
  usdc: number;
}

export interface TownState {
  level: number; // 1-3
  unlockedSlots: number; // derived from level
}

export interface Building {
  id: string;
  userId: string;
  slotNumber: number;
  status: BuildingStatus;
  activeTrade?: Trade;
}

export interface Trade {
  id: string;
  buildingId: string;
  userId: string;
  riskMode: RiskMode;
  status: TradeStatus;
  energySpent: number;
  entryPrice: number;
  liquidationPrice: number;
  completionTime: Date;
  tokensReward?: number;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface EnergyPurchaseRequest {
  packageType: EnergyPackage;
}

export interface BuildingPurchaseRequest {
  slotNumber: number; // which slot to place building
}

export interface StartTradeRequest {
  buildingId: string;
  riskMode: RiskMode;
}
```

#### 1.3.3 Update Type Exports
**File:** `packages/shared/src/types/index.ts`

Add:
```typescript
export * from "./town.js";
```

### 1.4 Constants & Configuration

#### 1.4.1 Create Town Constants
**File:** `packages/shared/src/types/constants.ts`

```typescript
export const ENERGY_PACKAGES = {
  small: { energy: 1, usdc: 1 },
  medium: { energy: 11, usdc: 10 },
  large: { energy: 60, usdc: 50 }
} as const;

export const BUILDING_COST_USDC = 100;

export const RISK_MODE_CONFIG = {
  turtle: {
    energyCost: 5,
    duration: 300, // 5 minutes (in seconds)
    liquidationThreshold: 0.05, // 5% drop
    tokensReward: 50
  },
  walk: {
    energyCost: 10,
    duration: 180, // 3 minutes
    liquidationThreshold: 0.10, // 10% drop
    tokensReward: 120
  },
  cheetah: {
    energyCost: 20,
    duration: 120, // 2 minutes
    liquidationThreshold: 0.15, // 15% drop
    tokensReward: 250
  }
} as const;

export const TOWN_LEVEL_SLOTS = {
  1: 1, // level 1 = 1 slot unlocked
  2: 2, // level 2 = 2 slots unlocked
  3: 3  // level 3 = 3 slots unlocked
} as const;

export const MAX_BUILDINGS = 3;
```

### 1.5 Rebuild Shared Package

```bash
cd packages/shared
yarn build
```

## Validation Checklist

- [ ] All migrations run successfully
- [ ] Types generated and copied to shared package
- [ ] All enums defined in shared/src/types/enums.ts
- [ ] Town types defined in shared/src/types/town.ts
- [ ] Constants defined and exported
- [ ] Shared package builds without errors
- [ ] Server can import types from @stealth-town/shared

## Next Steps
Proceed to Phase 2 - Server implementation (repositories, services, API routes)
