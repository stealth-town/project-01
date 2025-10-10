import { type Trade, RISK_MODE_CONFIG } from '@stealth-town/shared/types';

export interface TradeResolution {
  tradeId: string;
  status: 'completed' | 'liquidated' | 'active';
  tokensReward?: number;
  currentPrice: number;
  entryPrice: number;
  liquidationPrice: number;
}

export interface ITradeResolver {
  resolve(trade: Trade): Promise<TradeResolution | null>;
  getCurrentPrice(symbol: string): Promise<number>;
}

export class RealTradeResolver implements ITradeResolver {

  private basePrice: number = 3000; // Base ETH price

  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    // Mock price with realistic variance
    const variance = (Math.random() - 0.5) * 0.04; // +/- 2%
    const price = this.basePrice * (1 + variance);
    return parseFloat(price.toFixed(2));
  }

  async resolve(trade: Trade): Promise<TradeResolution | null> {
    const currentPrice = await this.getCurrentPrice('ETH');

    // Check liquidation condition (long-only: price drops below threshold)
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
    const completionTime = new Date(trade.completionTime);

    if (now >= completionTime) {
      // Calculate tokens reward based on risk mode
      const config = RISK_MODE_CONFIG[trade.riskMode];
      const tokensReward = config?.tokensReward || 0;

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
    return {
      tradeId: trade.id,
      status: 'active',
      currentPrice,
      entryPrice: trade.entryPrice,
      liquidationPrice: trade.liquidationPrice
    };
  }

  /**
   * Set base price for testing
   */
  setBasePrice(price: number) {
    this.basePrice = price;
  }
}
