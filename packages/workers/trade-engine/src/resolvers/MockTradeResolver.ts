import type { ITradeResolver, TradeOutcome } from '../core/TradeResolverWrapper.js';
import type { Trade } from '../core/TradeMonitor.js';

/**
 * Mock implementation of trade resolver
 * 
 * Phase 1: Resolves randomly after 3 seconds with fixed token rewards
 * - 50% chance of survival
 * - Fixed rewards per risk tier
 */
export class MockTradeResolver implements ITradeResolver {
  private readonly RESOLUTION_DELAY_MS = 3000; // 3 seconds
  
  // Token rewards per risk mode
  private readonly REWARDS = {
    turtle: 50,
    walk: 100,
    cheetah: 200
  };

  getName(): string {
    return 'MockTradeResolver';
  }

  /**
   * Resolve a trade with random outcome after delay
   */
  async resolve(trade: Trade): Promise<TradeOutcome> {
    console.log(`🎲 MockResolver: Processing trade ${trade.id} (${trade.riskMode})`);
    
    // Simulate processing time
    await this.delay(this.RESOLUTION_DELAY_MS);
    
    // Random outcome (50/50 chance)
    const survived = Math.random() > 0.5;
    const state = survived ? 'completed' : 'liquidated';
    const tokensEarned = survived ? this.REWARDS[trade.riskMode] : 0;
    
    console.log(`${survived ? '✅' : '❌'} Trade ${trade.id} ${state} - Tokens: ${tokensEarned}`);
    
    return {
      tradeId: trade.id,
      state,
      tokensEarned,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Helper to simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}