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

        // Update building status to 'completed' - requires user to claim
        await this.buildingRepo.updateBuildingStatus(trade.buildingId, BuildingStatus.COMPLETED);
        console.log(`✅ Trade ${resolution.tradeId} completed - Building ${trade.buildingId} awaiting claim`);

      } else if (resolution.status === 'liquidated') {
        // Update trade as liquidated
        // Note: Tokens are awarded when user claims the liquidated trade (100 tokens consolation)
        await this.tradeRepo.resolveLiquidation(resolution.tradeId);

        // Update building status to 'liquidated' - requires user to claim
        await this.buildingRepo.updateBuildingStatus(trade.buildingId, BuildingStatus.LIQUIDATED);
        console.log(`💥 Trade ${resolution.tradeId} liquidated - Building ${trade.buildingId} awaiting claim`);
      }

    } catch (error) {
      console.error(`❌ Failed to update database for trade ${trade.id}:`, error);
      throw error;
    }
  }
}