# Phase 2: Server - API & Business Logic

## Objective
Implement server-side logic for Town-Investment loop with repositories, services, and API routes

## Tasks

### 2.1 Repositories (Data Access Layer)

#### 2.1.1 User Repository
**File:** `packages/server/src/repos/UserRepo.ts`

Methods:
```typescript
- findById(userId: string): Promise<User | null>
- create(userData: Partial<User>): Promise<User>
- updateBalances(userId: string, balances: Partial<UserBalances>): Promise<User>
- getTownLevel(userId: string): Promise<number>
- upgradeTownLevel(userId: string): Promise<User>
- getUnlockedSlots(userId: string): Promise<number>
```

#### 2.1.2 Building Repository
**File:** `packages/server/src/repos/BuildingRepo.ts`

Methods:
```typescript
- findById(buildingId: string): Promise<Building | null>
- findByUserId(userId: string): Promise<Building[]>
- create(userId: string, slotNumber: number): Promise<Building>
- updateStatus(buildingId: string, status: BuildingStatus): Promise<Building>
- getActiveBuildings(userId: string): Promise<Building[]>
- countUserBuildings(userId: string): Promise<number>
```

#### 2.1.3 Trade Repository
**File:** `packages/server/src/repos/TradeRepo.ts`

Methods:
```typescript
- findById(tradeId: string): Promise<Trade | null>
- findByBuildingId(buildingId: string): Promise<Trade | null>
- findActiveByUserId(userId: string): Promise<Trade[]>
- create(tradeData: CreateTradeInput): Promise<Trade>
- updateStatus(tradeId: string, status: TradeStatus): Promise<Trade>
- resolveCompletion(tradeId: string, tokensReward: number): Promise<Trade>
- resolveLiquidation(tradeId: string): Promise<Trade>
- getAllActiveTrades(): Promise<Trade[]> // for worker
```

#### 2.1.4 Energy Purchase Repository
**File:** `packages/server/src/repos/EnergyPurchaseRepo.ts`

Methods:
```typescript
- create(userId: string, packageType: EnergyPackage, energyAmount: number, usdcCost: number): Promise<EnergyPurchase>
- findByUserId(userId: string): Promise<EnergyPurchase[]>
```

#### 2.1.5 Building Purchase Repository
**File:** `packages/server/src/repos/BuildingPurchaseRepo.ts`

Methods:
```typescript
- create(userId: string, buildingId: string, slotNumber: number, usdcCost: number): Promise<BuildingPurchase>
- findByUserId(userId: string): Promise<BuildingPurchase[]>
```

#### 2.1.6 Update Repo Index
**File:** `packages/server/src/repos/index.ts`

Export all repos:
```typescript
export * from './UserRepo.js';
export * from './BuildingRepo.js';
export * from './TradeRepo.js';
export * from './EnergyPurchaseRepo.js';
export * from './BuildingPurchaseRepo.js';
```

### 2.2 Services (Business Logic Layer)

#### 2.2.1 Town Service
**File:** `packages/server/src/services/town/TownService.ts`

Methods:
```typescript
// User & Balances
- getUserBalances(userId: string): Promise<UserBalances>
- getTownState(userId: string): Promise<TownState>

// Energy Shop
- buyEnergy(userId: string, packageType: EnergyPackage): Promise<{ success: boolean, newBalance: number }>
  * Validate USDC balance
  * Deduct USDC
  * Add energy
  * Record purchase

// Building Shop
- buyBuilding(userId: string, slotNumber: number): Promise<Building>
  * Validate USDC balance (100 USDC)
  * Validate slot availability
  * Validate town level unlocks slot
  * Validate user doesn't exceed max buildings
  * Deduct USDC
  * Create building
  * Record purchase

// Trading
- startTrade(userId: string, buildingId: string, riskMode: RiskMode): Promise<Trade>
  * Validate building ownership
  * Validate building is idle
  * Validate energy balance
  * Get current ETH price (mock for now)
  * Calculate liquidation price
  * Calculate completion time
  * Deduct energy
  * Create trade
  * Update building status to 'active'

- claimReward(userId: string, tradeId: string): Promise<{ tokens: number, energy: number }>
  * Validate trade ownership
  * Validate trade is completed/liquidated
  * If completed: add tokens to user balance
  * If liquidated: energy already deducted (do nothing)
  * Update building status to 'idle'
  * Return rewards

// Town Leveling (bonus - if time permits)
- upgradeTown(userId: string): Promise<TownState>
  * Validate can upgrade (has tokens/resources)
  * Increment town level
  * Return new state with unlocked slots
```

#### 2.2.2 Price Service (Mock)
**File:** `packages/server/src/services/price/PriceService.ts`

Methods:
```typescript
- getCurrentPrice(symbol: string = 'ETH'): Promise<number>
  * Return mock price (e.g., 3000 + random variance)
  * Later: connect to real price feed
```

#### 2.2.3 Update Services Index
**File:** `packages/server/src/services/index.ts`

```typescript
export * from './town/TownService.js';
export * from './price/PriceService.js';
```

### 2.3 API Routes

#### 2.3.1 Auth Routes (Workaround)
**File:** `packages/server/src/routes/auth.routes.ts`

Endpoints:
```typescript
POST /api/auth/register
  Body: { userId?: string } // optional - if provided, fetch existing user
  Response: { user: User, token?: string }

  Logic:
  - If userId provided: fetch user or return 404
  - If no userId: create new user with defaults (30 energy, 0 tokens, 100 USDC, town level 1)
  - Return user data

POST /api/auth/login
  Body: { userId: string }
  Response: { user: User }

  Logic:
  - Fetch user by ID
  - Return user data or 404
```

#### 2.3.2 Town Routes
**File:** `packages/server/src/routes/town.routes.ts`

Endpoints:
```typescript
GET /api/town/state/:userId
  Response: { balances: UserBalances, town: TownState, buildings: Building[] }

POST /api/town/buy-energy
  Body: { userId: string, packageType: EnergyPackage }
  Response: { success: boolean, newBalance: number }

POST /api/town/buy-building
  Body: { userId: string, slotNumber: number }
  Response: { building: Building }

POST /api/town/start-trade
  Body: { userId: string, buildingId: string, riskMode: RiskMode }
  Response: { trade: Trade }

POST /api/town/claim-reward
  Body: { userId: string, tradeId: string }
  Response: { tokens: number, energy: number }

GET /api/town/trades/:userId
  Response: { activeTrades: Trade[], completedTrades: Trade[] }
```

#### 2.3.3 Update Routes Index
**File:** `packages/server/src/routes/index.ts`

```typescript
import authRoutes from './auth.routes.js';
import townRoutes from './town.routes.js';

router.use('/auth', authRoutes);
router.use('/town', townRoutes);
```

### 2.4 Error Handling

#### 2.4.1 Custom Errors
**File:** `packages/server/src/util/errors.ts`

```typescript
export class InsufficientBalanceError extends Error {
  constructor(currency: string, required: number, available: number) {
    super(`Insufficient ${currency}: required ${required}, available ${available}`);
  }
}

export class InvalidSlotError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BuildingNotIdleError extends Error {
  constructor() {
    super('Building is not idle');
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
  }
}
```

#### 2.4.2 Error Middleware
Update `packages/server/src/app.ts` error handler to handle custom errors with appropriate status codes

### 2.5 Testing & Validation

#### Manual Testing Script
**File:** `packages/server/test-town-loop.http` (if using REST Client) or Postman collection

```http
### Register new user
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{}

### Login with existing user
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "userId": "xxx-xxx-xxx"
}

### Get town state
GET http://localhost:3000/api/town/state/{userId}

### Buy energy (small package)
POST http://localhost:3000/api/town/buy-energy
Content-Type: application/json

{
  "userId": "xxx",
  "packageType": "small"
}

### Buy building
POST http://localhost:3000/api/town/buy-building
Content-Type: application/json

{
  "userId": "xxx",
  "slotNumber": 1
}

### Start trade
POST http://localhost:3000/api/town/start-trade
Content-Type: application/json

{
  "userId": "xxx",
  "buildingId": "xxx",
  "riskMode": "turtle"
}

### Claim reward
POST http://localhost:3000/api/town/claim-reward
Content-Type: application/json

{
  "userId": "xxx",
  "tradeId": "xxx"
}
```

## Validation Checklist

- [ ] All repositories implement CRUD operations
- [ ] TownService handles all business logic with validations
- [ ] PriceService returns mock prices
- [ ] All API routes implemented and exported
- [ ] Error handling for edge cases (insufficient balance, invalid slots, etc.)
- [ ] Server builds and runs without errors
- [ ] Manual API testing passes for happy path
- [ ] Currency balances update correctly

## Next Steps
Proceed to Phase 3 - Worker integration (connect trade engine to resolve trades)
