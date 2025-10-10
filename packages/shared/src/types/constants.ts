/**
 * Constants and configuration for Town Loop (MVP)
 */

import { EnergyPackage, RiskMode } from './enums.js';

/**
 * Energy Package Pricing
 */
export const ENERGY_PACKAGES = {
  [EnergyPackage.SMALL]: { energy: 1, usdc: 1 },
  [EnergyPackage.MEDIUM]: { energy: 11, usdc: 10 },
  [EnergyPackage.LARGE]: { energy: 60, usdc: 50 }
} as const;

/**
 * Building Configuration
 */
export const BUILDING_COST_USDC = 100;
export const MAX_BUILDINGS = 3;

/**
 * Risk Mode Configuration
 * - energyCost: Energy required to start trade
 * - duration: Trade duration in seconds
 * - liquidationThreshold: Price drop percentage that triggers liquidation (0.05 = 5%)
 * - tokensReward: Tokens rewarded on successful completion
 */
export const RISK_MODE_CONFIG = {
  [RiskMode.TURTLE]: {
    energyCost: 5,
    duration: 300, // 5 minutes
    liquidationThreshold: 0.05, // 5% drop
    tokensReward: 50
  },
  [RiskMode.WALK]: {
    energyCost: 10,
    duration: 180, // 3 minutes
    liquidationThreshold: 0.10, // 10% drop
    tokensReward: 120
  },
  [RiskMode.CHEETAH]: {
    energyCost: 20,
    duration: 120, // 2 minutes
    liquidationThreshold: 0.15, // 15% drop
    tokensReward: 250
  }
} as const;

/**
 * Town Level Configuration
 * Maps town level to number of unlocked building slots
 */
export const TOWN_LEVEL_SLOTS = {
  1: 1, // level 1 = 1 slot unlocked
  2: 2, // level 2 = 2 slots unlocked
  3: 3  // level 3 = 3 slots unlocked
} as const;

/**
 * Starting Balances for New Users
 */
export const STARTING_BALANCES = {
  energy: 30,
  tokens: 0,
  usdc: 100, // Mock USDC for demo
  townLevel: 1
} as const;

/**
 * Item Shop Configuration (for Character loop - future)
 */
export const ITEM_COST_TOKENS = 100;
export const EQUIPMENT_SLOTS = 6;
