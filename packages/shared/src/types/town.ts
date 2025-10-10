/**
 * Town Loop Domain Types (MVP)
 */

import { RiskMode, BuildingStatus, TradeStatus, EnergyPackage } from './enums.js';

export interface UserBalances {
  energy: number;
  tokens: number;
  usdc: number;
}

export interface TownState {
  level: number; // 1-3
  unlockedSlots: number; // derived from level
}

export interface TownBuilding {
  id: string;
  userId: string;
  slotNumber: number;
  status: BuildingStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Trade {
  id: string;
  buildingId: string;
  userId: string;
  riskMode: RiskMode;
  status: TradeStatus;
  energySpent: number;
  entryPrice: number;
  liquidationPrice: number;
  completionTime: Date | string;
  tokensReward?: number | null;
  assetId: string;
  startedAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  completedAt?: Date | string | null;
  claimed: 'claimed' | 'unclaimed' | 'non_applicable';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EnergyPurchase {
  id: string;
  userId: string;
  packageType: EnergyPackage;
  energyAmount: number;
  usdcCost: number;
  createdAt: Date | string;
}

export interface BuildingPurchase {
  id: string;
  userId: string;
  buildingId: string;
  usdcCost: number;
  slotNumber: number;
  createdAt: Date | string;
}

/**
 * API Request Types
 */

export interface EnergyPurchaseRequest {
  packageType: EnergyPackage;
}

export interface BuildingPurchaseRequest {
  slotNumber: number;
}

export interface StartTradeRequest {
  buildingId: string;
  riskMode: RiskMode;
}

export interface ClaimRewardRequest {
  tradeId: string;
}

/**
 * API Response Types
 */

export interface TownStateResponse {
  balances: UserBalances;
  town: TownState;
  buildings: TownBuilding[];
}

export interface TradesResponse {
  activeTrades: Trade[];
  completedTrades: Trade[];
}

export interface ClaimRewardResponse {
  tokens: number;
  energy: number;
}
