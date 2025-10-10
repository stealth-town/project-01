import {
  type UserBalances,
  type TownState,
  EnergyPackage,
  RiskMode,
  BuildingStatus,
  ENERGY_PACKAGES,
  BUILDING_COST_USDC,
  RISK_MODE_CONFIG,
  TOWN_LEVEL_SLOTS,
  MAX_BUILDINGS
} from '@stealth-town/shared/types';
import { UserRepo } from '../../repos/UserRepo.js';
import { BuildingRepo } from '../../repos/BuildingRepo.js';
import { TradeRepo } from '../../repos/TradeRepo.js';
import { EnergyPurchaseRepo } from '../../repos/EnergyPurchaseRepo.js';
import { BuildingPurchaseRepo} from '../../repos/BuildingPurchaseRepo.js';
import { PriceService } from '../price/PriceService.js';

export class TownService {
  private userRepo: UserRepo;
  private buildingRepo: BuildingRepo;
  private tradeRepo: TradeRepo;
  private energyPurchaseRepo: EnergyPurchaseRepo;
  private buildingPurchaseRepo: BuildingPurchaseRepo;
  private priceService: PriceService;

  constructor() {
    this.userRepo = new UserRepo();
    this.buildingRepo = new BuildingRepo();
    this.tradeRepo = new TradeRepo();
    this.energyPurchaseRepo = new EnergyPurchaseRepo();
    this.buildingPurchaseRepo = new BuildingPurchaseRepo();
    this.priceService = new PriceService();
  }

  /**
   * Get user balances
   */
  async getUserBalances(userId: string): Promise<UserBalances> {
    return await this.userRepo.getBalances(userId);
  }

  /**
   * Get town state (level and unlocked slots)
   */
  async getTownState(userId: string): Promise<TownState> {
    const townLevel = await this.userRepo.getTownLevel(userId);
    const unlockedSlots = TOWN_LEVEL_SLOTS[townLevel as keyof typeof TOWN_LEVEL_SLOTS] || 1;

    return {
      level: townLevel,
      unlockedSlots
    };
  }

  /**
   * Buy energy package
   */
  async buyEnergy(userId: string, packageType: EnergyPackage): Promise<{ success: boolean, newBalance: number }> {
    const pkg = ENERGY_PACKAGES[packageType];
    if (!pkg) {
      throw new Error(`Invalid energy package: ${packageType}`);
    }

    // Check USDC balance
    const balances = await this.userRepo.getBalances(userId);
    if (balances.usdc < pkg.usdc) {
      throw new Error(`Insufficient USDC: required ${pkg.usdc}, available ${balances.usdc}`);
    }

    // Deduct USDC
    await this.userRepo.deductCurrency(userId, 'usdc', pkg.usdc);

    // Add energy
    const newBalance = await this.userRepo.addCurrency(userId, 'energy', pkg.energy);

    // Record purchase
    await this.energyPurchaseRepo.create(userId, packageType, pkg.energy, pkg.usdc);

    return { success: true, newBalance };
  }

  /**
   * Buy building (slot)
   */
  async buyBuilding(userId: string, slotNumber: number) {
    // Validate slot number
    if (slotNumber < 1 || slotNumber > MAX_BUILDINGS) {
      throw new Error(`Invalid slot number: ${slotNumber}. Must be between 1 and ${MAX_BUILDINGS}`);
    }

    // Check USDC balance
    const balances = await this.userRepo.getBalances(userId);
    if (balances.usdc < BUILDING_COST_USDC) {
      throw new Error(`Insufficient USDC: required ${BUILDING_COST_USDC}, available ${balances.usdc}`);
    }

    // Check town level unlocks this slot
    const townLevel = await this.userRepo.getTownLevel(userId);
    const unlockedSlots = TOWN_LEVEL_SLOTS[townLevel as keyof typeof TOWN_LEVEL_SLOTS] || 1;

    if (slotNumber > unlockedSlots) {
      throw new Error(`Slot ${slotNumber} not unlocked. Town level ${townLevel} unlocks ${unlockedSlots} slots`);
    }

    // Check user doesn't exceed max buildings
    const buildingCount = await this.buildingRepo.countUserBuildings(userId);
    if (buildingCount >= MAX_BUILDINGS) {
      throw new Error(`Maximum buildings reached: ${MAX_BUILDINGS}`);
    }

    // Check slot isn't already occupied
    const existingBuildings = await this.buildingRepo.findByUserId(userId);
    const slotOccupied = existingBuildings.some(b => b.slotNumber === slotNumber);
    if (slotOccupied) {
      throw new Error(`Slot ${slotNumber} is already occupied`);
    }

    // Deduct USDC
    await this.userRepo.deductCurrency(userId, 'usdc', BUILDING_COST_USDC);

    // Create building
    const building = await this.buildingRepo.create(userId, slotNumber);
    if (!building) {
      throw new Error('Failed to create building');
    }

    // Record purchase
    await this.buildingPurchaseRepo.create(userId, building.id, slotNumber, BUILDING_COST_USDC);

    return building;
  }

  /**
   * Start trade
   */
  async startTrade(userId: string, buildingId: string, riskMode: RiskMode) {
    // Validate building ownership
    const building = await this.buildingRepo.findById(buildingId);
    if (!building) {
      throw new Error('Building not found');
    }
    if (building.userId !== userId) {
      throw new Error('Building does not belong to user');
    }

    // Validate building is idle
    if (building.status !== 'idle') {
      throw new Error(`Building is not idle. Current status: ${building.status}`);
    }

    // Get risk mode config
    const config = RISK_MODE_CONFIG[riskMode];
    if (!config) {
      throw new Error(`Invalid risk mode: ${riskMode}`);
    }

    // Check energy balance
    const balances = await this.userRepo.getBalances(userId);
    if (balances.energy < config.energyCost) {
      throw new Error(`Insufficient energy: required ${config.energyCost}, available ${balances.energy}`);
    }

    // Get current price
    const currentPrice = await this.priceService.getCurrentPrice('ETH');

    // Calculate liquidation price
    const liquidationPrice = currentPrice * (1 - config.liquidationThreshold);

    // Calculate completion time
    const completionTime = new Date(Date.now() + config.duration * 1000);

    // Deduct energy
    await this.userRepo.deductCurrency(userId, 'energy', config.energyCost);

    // Get ETH asset ID (from seed data)
    const ethAssetId = '4d5b6c7d-8e9f-0a1b-2c3d-4e5f6a7b8c9d'; // This should be queried from assets table

    // Create trade
    const trade = await this.tradeRepo.create({
      buildingId,
      userId,
      riskMode,
      energySpent: config.energyCost,
      entryPrice: currentPrice,
      liquidationPrice,
      completionTime,
      assetId: ethAssetId
    });
    if (!trade) {
      throw new Error('Failed to create trade');
    }

    // Update building status to active
    await this.buildingRepo.updateStatus(buildingId, BuildingStatus.ACTIVE);

    // Activate the trade (set status to 'active')
    await this.tradeRepo.activateTrade(trade.id);

    return trade;
  }

  /**
   * Claim reward from completed/liquidated trade
   */
  async claimReward(userId: string, tradeId: string): Promise<{ tokens: number, energy: number }> {
    // Get trade
    const trade = await this.tradeRepo.findById(tradeId);
    if (!trade) {
      throw new Error('Trade not found');
    }

    // Validate ownership
    if (trade.userId !== userId) {
      throw new Error('Trade does not belong to user');
    }

    // Validate trade is completed or liquidated
    if (trade.status !== 'completed' && trade.status !== 'liquidated') {
      throw new Error(`Trade cannot be claimed. Current status: ${trade.status}`);
    }

    // Get building and set to idle
    await this.buildingRepo.updateStatus(trade.buildingId, BuildingStatus.IDLE);

    // If completed, add tokens to user balance
    let tokensReward = 0;
    if (trade.status === 'completed' && trade.tokensReward) {
      tokensReward = trade.tokensReward;
      await this.userRepo.addCurrency(userId, 'tokens', tokensReward);
    }

    // Energy was already deducted when trade started
    // If liquidated, energy is lost (no refund)

    return {
      tokens: tokensReward,
      energy: 0 // Energy already deducted
    };
  }

  /**
   * Get all user trades
   */
  async getUserTrades(userId: string) {
    const activeTrades = await this.tradeRepo.findActiveByUserId(userId);
    const completedTrades = await this.tradeRepo.findCompletedByUserId(userId);

    return {
      activeTrades,
      completedTrades
    };
  }
}
