import { type Trade, RISK_MODE_CONFIG } from '@stealth-town/shared/types';
import { PriceService } from '../services/PriceService.js';

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

  private priceService: PriceService;

  constructor() {
    this.priceService = new PriceService();
    console.log('🔧 RealTradeResolver initialized with Binance price feed');
  }

  async getCurrentPrice(symbol: string = 'ETH'): Promise<number> {
    return await this.priceService.getCurrentPrice(symbol);
  }

  async resolve(trade: Trade): Promise<TradeResolution | null> {
    const currentPrice = await this.getCurrentPrice('ETH');

    console.log(`📊 Trade ${trade.id} - Entry: $${trade.entryPrice}, Current: $${currentPrice}, Liquidation: $${trade.liquidationPrice}`);

    // Check liquidation condition (long-only: price drops below threshold)
    if (currentPrice <= trade.liquidationPrice) {
      console.log(`💥 Trade ${trade.id} LIQUIDATED - Price dropped to $${currentPrice}`);
      return {
        tradeId: trade.id,
        status: 'liquidated',
        tokensReward: 0, // No tokens on liquidation
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

      console.log(`✅ Trade ${trade.id} COMPLETED - Reward: ${tokensReward} tokens`);
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
}
