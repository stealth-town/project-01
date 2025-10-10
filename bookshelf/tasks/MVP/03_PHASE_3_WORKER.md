# Phase 3: Worker - Trade Engine Integration

## Objective
Connect the trade-engine worker to database via Supabase realtime subscriptions to automatically resolve trades

## Tasks

### 3.1 Worker Repository Setup

#### 3.1.1 Trade Repository for Worker
**File:** `packages/workers/trade-engine/src/repos/TradeRepo.ts`

Methods (worker-specific):
```typescript
- getAllActiveTrades(): Promise<Trade[]>
- updateTradeStatus(tradeId: string, status: TradeStatus): Promise<void>
- resolveCompletion(tradeId: string, tokensReward: number): Promise<void>
- resolveLiquidation(tradeId: string): Promise<void>
```

#### 3.1.2 Building Repository for Worker
**File:** `packages/workers/trade-engine/src/repos/BuildingRepo.ts`

Methods:
```typescript
- updateBuildingStatus(buildingId: string, status: BuildingStatus): Promise<void>
```

#### 3.1.3 User Repository for Worker
**File:** `packages/workers/trade-engine/src/repos/UserRepo.ts`

Methods:
```typescript
- addTokens(userId: string, amount: number): Promise<void>
- getUser(userId: string): Promise<User>
```

### 3.2 Trade Resolution Logic

#### 3.2.1 Update Trade Resolver Interface
**File:** `packages/workers/trade-engine/src/resolvers/ITradeResolver.ts`

```typescript
export interface ITradeResolver {
  resolve(trade: Trade): Promise<TradeResolution>;
  getCurrentPrice(symbol: string): Promise<number>;
}

export interface TradeResolution {
  tradeId: string;
  status: 'completed' | 'liquidated';
  tokensReward?: number;
  currentPrice: number;
  entryPrice: number;
  liquidationPrice: number;
}
```

#### 3.2.2 Implement Real Trade Resolver
**File:** `packages/workers/trade-engine/src/resolvers/RealTradeResolver.ts`

```typescript
export class RealTradeResolver implements ITradeResolver {

  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    // Mock for now - return realistic ETH price with variance
    const basePrice = 3000;
    const variance = (Math.random() - 0.5) * 100; // +/- 50
    return basePrice + variance;
  }

  async resolve(trade: Trade): Promise<TradeResolution> {
    const currentPrice = await this.getCurrentPrice('ETH');

    // Check liquidation condition (long-only)
    if (currentPrice <= trade.liquidationPrice) {
      return {
        tradeId: trade.id,
        status: 'liquidated',
        currentPrice,
        entryPrice: trade.entryPrice,
        liquidationPrice: trade.liquidationPrice
      };
    }

    // Check completion condition (timer ended)
    const now = new Date();
    if (now >= trade.completionTime) {
      // Calculate tokens reward based on risk mode
      const tokensReward = this.calculateReward(trade.riskMode);

      return {
        tradeId: trade.id,
        status: 'completed',
        tokensReward,
        currentPrice,
        entryPrice: trade.entryPrice,
        liquidationPrice: trade.liquidationPrice
      };
    }

    // Trade still active
    return null;
  }

  private calculateReward(riskMode: RiskMode): number {
    const rewards = {
      turtle: 50,
      walk: 120,
      cheetah: 250
    };
    return rewards[riskMode];
  }
}
```

#### 3.2.3 Update Trade Resolver Wrapper
**File:** `packages/workers/trade-engine/src/core/TradeResolverWrapper.ts`

Update to handle resolution results and update database:
```typescript
export class TradeResolverWrapper {
  constructor(
    private resolver: ITradeResolver,
    private tradeRepo: TradeRepo,
    private buildingRepo: BuildingRepo,
    private userRepo: UserRepo
  ) {}

  async resolve(trade: Trade): Promise<void> {
    const resolution = await this.resolver.resolve(trade);

    if (!resolution) {
      // Trade still active, no action needed
      return;
    }

    if (resolution.status === 'completed') {
      // Update trade status
      await this.tradeRepo.resolveCompletion(
        resolution.tradeId,
        resolution.tokensReward
      );

      // Add tokens to user balance
      await this.userRepo.addTokens(trade.userId, resolution.tokensReward);

      // Update building status to idle
      await this.buildingRepo.updateBuildingStatus(trade.buildingId, 'idle');

      console.log(`✅ Trade ${trade.id} completed: +${resolution.tokensReward} tokens`);
    }
    else if (resolution.status === 'liquidated') {
      // Update trade status
      await this.tradeRepo.resolveLiquidation(resolution.tradeId);

      // Update building status to idle
      await this.buildingRepo.updateBuildingStatus(trade.buildingId, 'idle');

      // Energy already deducted when trade started
      console.log(`❌ Trade ${trade.id} liquidated`);
    }
  }
}
```

### 3.3 Realtime Subscription Setup

#### 3.3.1 Supabase Realtime Client
**File:** `packages/workers/trade-engine/src/subscriptions/TradeSubscription.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export class TradeSubscription {
  private channel: RealtimeChannel;
  private supabase;

  constructor(
    private onTradeChange: (trade: Trade) => void
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  start() {
    console.log('📡 Starting realtime subscription to trades...');

    this.channel = this.supabase
      .channel('trades-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'trades',
          filter: 'status=in.(active,building)' // only active/building trades
        },
        (payload) => {
          console.log('🔔 Trade change detected:', payload);

          if (payload.new) {
            this.onTradeChange(payload.new as Trade);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to trades');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error:', status);
        }
      });
  }

  stop() {
    console.log('🛑 Stopping realtime subscription...');
    this.channel?.unsubscribe();
  }
}
```

#### 3.3.2 Update Trade Monitor
**File:** `packages/workers/trade-engine/src/core/TradeMonitor.ts`

Update to use both polling AND realtime subscriptions:
```typescript
import { TradeSubscription } from '../subscriptions/TradeSubscription.js';

export class TradeMonitor {
  private subscription: TradeSubscription;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(
    private onTradeTrigger: (trade: Trade) => void,
    private tradeRepo: TradeRepo
  ) {
    this.subscription = new TradeSubscription(this.handleTradeChange.bind(this));
  }

  start() {
    console.log('🔍 Starting trade monitor...');

    // Start realtime subscription
    this.subscription.start();

    // Also poll periodically as backup (every 10 seconds)
    this.pollingInterval = setInterval(() => {
      this.pollActiveTrades();
    }, 10000);
  }

  stop() {
    console.log('🛑 Stopping trade monitor...');
    this.subscription.stop();

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private handleTradeChange(trade: Trade) {
    // Trigger resolution when trade changes
    this.onTradeTrigger(trade);
  }

  private async pollActiveTrades() {
    try {
      const activeTrades = await this.tradeRepo.getAllActiveTrades();

      for (const trade of activeTrades) {
        // Check if trade needs resolution
        const now = new Date();
        if (now >= trade.completionTime) {
          this.onTradeTrigger(trade);
        }
      }
    } catch (error) {
      console.error('Error polling trades:', error);
    }
  }
}
```

### 3.4 Worker Entry Point Update

#### 3.4.1 Update Worker Main
**File:** `packages/workers/trade-engine/src/worker.ts`

```typescript
import { parentPort, workerData } from 'worker_threads';
import { TradeMonitor } from './core/TradeMonitor.js';
import { TradeResolverWrapper } from './core/TradeResolverWrapper.js';
import { RealTradeResolver } from './resolvers/RealTradeResolver.js';
import { TradeRepo } from './repos/TradeRepo.js';
import { BuildingRepo } from './repos/BuildingRepo.js';
import { UserRepo } from './repos/UserRepo.js';

const { workerId } = workerData;

console.log(`[Worker ${workerId}] Initializing trade engine...`);

// Initialize repos
const tradeRepo = new TradeRepo();
const buildingRepo = new BuildingRepo();
const userRepo = new UserRepo();

// Initialize resolver
const realResolver = new RealTradeResolver();
const resolverWrapper = new TradeResolverWrapper(
  realResolver,
  tradeRepo,
  buildingRepo,
  userRepo
);

// Create monitor with trigger callback
const tradeMonitor = new TradeMonitor(
  async (trade: Trade) => {
    console.log(`[Worker ${workerId}] Resolving trade:`, trade.id);
    await resolverWrapper.resolve(trade);
  },
  tradeRepo
);

// Start monitoring
tradeMonitor.start();

// Status updates to parent
setInterval(() => {
  if (parentPort) {
    parentPort.postMessage({
      workerId,
      status: 'running',
      timestamp: new Date().toISOString()
    });
  }
}, 30000); // Every 30 seconds

// Cleanup
process.on('SIGTERM', () => {
  console.log(`[Worker ${workerId}] Shutting down...`);
  tradeMonitor.stop();
  process.exit(0);
});
```

#### 3.4.2 Environment Variables
**File:** `packages/workers/trade-engine/.env.example`

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key-here
```

### 3.5 Testing

#### 3.5.1 Manual Worker Test
1. Start database: `cd packages/database && yarn start`
2. Start server: `cd packages/server && yarn dev`
3. Start worker: `cd packages/workers/trade-engine && yarn dev`
4. Create a trade via API
5. Verify worker logs show:
   - Realtime subscription connected
   - Trade detected via subscription
   - Trade resolved (completed or liquidated)
   - Database updated

#### 3.5.2 Test Scenarios
- **Scenario 1:** Turtle trade completes successfully (5 min wait)
- **Scenario 2:** Cheetah trade gets liquidated (mock price drop)
- **Scenario 3:** Multiple trades resolve concurrently
- **Scenario 4:** Worker restarts and picks up active trades

## Validation Checklist

- [ ] Worker repos implemented for trade, building, user
- [ ] RealTradeResolver implements liquidation and completion logic
- [ ] TradeResolverWrapper updates database on resolution
- [ ] TradeSubscription connects to Supabase realtime
- [ ] TradeMonitor uses both realtime and polling
- [ ] Worker starts and connects to database
- [ ] Trades resolve automatically (completed or liquidated)
- [ ] User balances update correctly on completion
- [ ] Building status returns to idle after resolution

## Next Steps
Proceed to Phase 4 - Frontend (React UI for Town screen)
