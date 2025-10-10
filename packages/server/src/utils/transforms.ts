import type { TownBuilding, Trade, EnergyPurchase, BuildingPurchase } from '@stealth-town/shared/types';

// Transform database snake_case to domain camelCase

export function transformBuilding(dbBuilding: any): TownBuilding {
  return {
    id: dbBuilding.id,
    userId: dbBuilding.user_id,
    slotNumber: dbBuilding.slot_number,
    status: dbBuilding.status,
    createdAt: dbBuilding.created_at,
    updatedAt: dbBuilding.updated_at,
  };
}

export function transformTrade(dbTrade: any): Trade {
  return {
    id: dbTrade.id,
    buildingId: dbTrade.building_id,
    userId: dbTrade.user_id,
    assetId: dbTrade.asset_id,
    riskMode: dbTrade.risk_mode,
    status: dbTrade.status,
    energySpent: dbTrade.energy_spent,
    entryPrice: dbTrade.entry_price,
    liquidationPrice: dbTrade.liquidation_price,
    completionTime: dbTrade.completion_time,
    tokensReward: dbTrade.tokens_reward,
    resolvedAt: dbTrade.resolved_at,
    claimed: dbTrade.claimed,
    createdAt: dbTrade.created_at,
    completedAt: dbTrade.completed_at,
    updatedAt: dbTrade.updated_at,
  };
}

export function transformEnergyPurchase(dbPurchase: any): EnergyPurchase {
  return {
    id: dbPurchase.id,
    userId: dbPurchase.user_id,
    packageType: dbPurchase.package_type,
    energyAmount: dbPurchase.energy_amount,
    usdcCost: dbPurchase.usdc_cost,
    createdAt: dbPurchase.created_at,
  };
}

export function transformBuildingPurchase(dbPurchase: any): BuildingPurchase {
  return {
    id: dbPurchase.id,
    userId: dbPurchase.user_id,
    buildingId: dbPurchase.building_id,
    usdcCost: dbPurchase.usdc_cost,
    slotNumber: dbPurchase.slot_number,
    createdAt: dbPurchase.created_at,
  };
}
