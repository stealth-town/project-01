import { type Trade, RISK_MODE_CONFIG } from '@stealth-town/shared/types';
import { type ITradeResolver, type TradeResolution } from './RealTradeResolver.js';

/**
 * Mock implementation of trade resolver
 *
 * Phase 1: Resolves randomly after 3 seconds with fixed token rewards
 * - 50% chance of survival
 * - Fixed rewards per risk tier
 */
export class MockTradeResolver implements ITradeResolver {
  private readonly RESOLUTION_DELAY_MS = 3000; // 3 seconds
  private basePrice: number = 3000;

  /**
   * Resolve a trade with random outcome after delay
   */
  async resolve(trade: Trade): Promise<TradeResolution | null> {
    console.log(`🎲 MockResolver: Processing trade ${trade.id} (${trade.riskMode})`);

    // Simulate processing time
    await this.delay(this.RESOLUTION_DELAY_MS);

    // Random outcome (50/50 chance)
    const survived = Math.random() > 0.5;
    const status = survived ? 'completed' : 'liquidated';
    const config = RISK_MODE_CONFIG[trade.riskMode];
    const tokensReward = survived ? config.tokensReward : 0;

    console.log(`${survived ? '✅' : '❌'} Trade ${trade.id} ${status} - Tokens: ${tokensReward}`);

    return {
      tradeId: trade.id,
      status,
      tokensReward,
      currentPrice: this.basePrice,
      entryPrice: trade.entryPrice,
      liquidationPrice: trade.liquidationPrice
    };
  }

  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    return this.basePrice;
  }

  /**
   * Helper to simulate async delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}