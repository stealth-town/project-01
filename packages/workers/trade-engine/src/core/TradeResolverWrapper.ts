import type { Trade } from './TradeMonitor.js';

/**
 * Interface that all trade resolvers must implement
 * This allows us to swap between mock and real implementations
 */
export interface ITradeResolver {
  /**
   * Resolve a trade and return the outcome
   */
  resolve(trade: Trade): Promise<TradeOutcome>;
  
  /**
   * Get the name of this resolver (for logging)
   */
  getName(): string;
}

/**
 * Result of a trade resolution
 */
export type TradeOutcome = {
  tradeId: string;
  state: 'completed' | 'liquidated';
  tokensEarned: number;
  completedAt: string;
};

/**
 * Wrapper that manages the current resolver implementation
 * Allows swapping resolvers at runtime and adds common logic
 */
export class TradeResolverWrapper {
  private resolver: ITradeResolver;

  constructor(resolver: ITradeResolver) {
    this.resolver = resolver;
    console.log(`📦 TradeResolverWrapper initialized with: ${resolver.getName()}`);
  }

  /**
   * Resolve a trade using the current resolver
   */
  async resolve(trade: Trade): Promise<void> {
    console.log(`⚙️  Resolving trade ${trade.id} using ${this.resolver.getName()}`);
    
    try {
      const outcome = await this.resolver.resolve(trade);
      
      // Here we would update the database with the outcome
      // For now, just log it
      console.log(`✅ Trade ${outcome.tradeId} resolved:`, {
        state: outcome.state,
        tokensEarned: outcome.tokensEarned
      });
      
      // TODO: Update database with outcome
      // await this.updateDatabase(outcome);
      
    } catch (error) {
      console.error(`❌ Failed to resolve trade ${trade.id}:`, error);
      throw error;
    }
  }

  /**
   * Swap to a different resolver implementation
   */
  setResolver(resolver: ITradeResolver) {
    console.log(`🔄 Switching resolver from ${this.resolver.getName()} to ${resolver.getName()}`);
    this.resolver = resolver;
  }

  /**
   * Get current resolver name
   */
  getCurrentResolverName(): string {
    return this.resolver.getName();
  }

  /**
   * Update database with trade outcome
   * TODO: Implement when repository is ready
   */
  private async updateDatabase(outcome: TradeOutcome): Promise<void> {
    // This will use the shared repository when implemented
    console.log('💾 Would update database with:', outcome);
  }
}