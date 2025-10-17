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
 * - energyCost: Energy required to start trade (now uniform at 1)
 * - duration: Trade duration in seconds
 * - liquidationThreshold: Price drop percentage that triggers liquidation (0.005 = 0.5%)
 * - tokensReward: Tokens rewarded on successful completion (now uniform at 100)
 */
export const RISK_MODE_CONFIG = {
  [RiskMode.TURTLE]: {
    energyCost: 1,
    duration: 120, // 120 seconds (2 minutes)
    liquidationThreshold: 0.005, // 0.5% drop
    tokensReward: 100
  },
  [RiskMode.WALK]: {
    energyCost: 1,
    duration: 45, // 45 seconds
    liquidationThreshold: 0.001, // 0.1% drop
    tokensReward: 100
  },
  [RiskMode.CHEETAH]: {
    energyCost: 1,
    duration: 10, // 10 seconds
    liquidationThreshold: 0.0001, // 0.01% drop
    tokensReward: 100
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
 * Town Upgrade Costs
 * Maps town level to USDC cost to upgrade to next level
 */
export const TOWN_UPGRADE_COST = {
  1: 200, // Cost to upgrade from level 1 to level 2
  2: 400  // Cost to upgrade from level 2 to level 3
} as const;

export const MAX_TOWN_LEVEL = 3;

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
