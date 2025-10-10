import { type Trade } from '@stealth-town/shared/types';
import { type ITradeResolver, type TradeResolution } from '../resolvers/RealTradeResolver.js';
import { TradeRepo } from '../repos/TradeRepo.js';
import { BuildingRepo } from '../repos/BuildingRepo.js';
import { UserRepo } from '../repos/UserRepo.js';
import { BuildingStatus } from '@stealth-town/shared/types';

/**
 * Wrapper that manages the current resolver implementation
 * Allows swapping resolvers at runtime and adds common logic
 */
export class TradeResolverWrapper {
  private resolver: ITradeResolver;
  private tradeRepo: TradeRepo;
  private buildingRepo: BuildingRepo;
  private userRepo: UserRepo;

  constructor(
    resolver: ITradeResolver,
    tradeRepo: TradeRepo,
    buildingRepo: BuildingRepo,
    userRepo: UserRepo
  ) {
    this.resolver = resolver;
    this.tradeRepo = tradeRepo;
    this.buildingRepo = buildingRepo;
    this.userRepo = userRepo;
    console.log(`📦 TradeResolverWrapper initialized`);
  }

  /**
   * Resolve a trade using the current resolver
   */
  async resolve(trade: Trade): Promise<void> {
    console.log(`⚙️  Resolving trade ${trade.id}`);

    try {
      const resolution = await this.resolver.resolve(trade);

      // Only process if trade status changed
      if (!resolution || resolution.status === 'active') {
        return;
      }

      console.log(`✅ Trade ${resolution.tradeId} resolved: ${resolution.status}`);

      // Update database based on resolution
      await this.updateDatabase(trade, resolution);

    } catch (error) {
      console.error(`❌ Failed to resolve trade ${trade.id}:`, error);
      throw error;
    }
  }

  /**
   * Update database with trade resolution
   */
  private async updateDatabase(trade: Trade, resolution: TradeResolution): Promise<void> {
    try {
      if (resolution.status === 'completed') {
        // Update trade as completed
        await this.tradeRepo.resolveCompletion(
          resolution.tradeId,
          resolution.tokensReward || 0
        );

        // Add tokens to user balance
        if (resolution.tokensReward && resolution.tokensReward > 0) {
          await this.userRepo.addTokens(trade.userId, resolution.tokensReward);
          console.log(`💰 Added ${resolution.tokensReward} tokens to user ${trade.userId}`);
        }

      } else if (resolution.status === 'liquidated') {
        // Update trade as liquidated
        await this.tradeRepo.resolveLiquidation(resolution.tradeId);
        console.log(`💥 Trade ${resolution.tradeId} liquidated`);
      }

      // Update building status back to idle
      await this.buildingRepo.updateBuildingStatus(trade.buildingId, BuildingStatus.IDLE);
      console.log(`🏢 Building ${trade.buildingId} set to idle`);

    } catch (error) {
      console.error(`❌ Failed to update database for trade ${trade.id}:`, error);
      throw error;
    }
  }
}