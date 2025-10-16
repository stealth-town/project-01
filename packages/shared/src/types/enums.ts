/**
 * Game-related enums
 */

export enum PlayerStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  AWAY = "AWAY",
}

export enum QuestStatus {
  AVAILABLE = "AVAILABLE",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Town/Trade Loop Enums (MVP)
 */

export enum RiskMode {
  TURTLE = 'turtle',
  WALK = 'walk',
  CHEETAH = 'cheetah'
}

export enum BuildingStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  LIQUIDATED = 'liquidated'
}

// Note: Database uses 'pending', 'active', 'completed', 'liquidated'
// We map 'pending' to 'building' in application layer
export enum TradeStatus {
  BUILDING = 'pending',    // Maps to DB 'pending'
  ACTIVE = 'active',
  COMPLETED = 'completed',
  LIQUIDATED = 'liquidated'
}

export enum EnergyPackage {
  SMALL = 'small',    // 1 energy / 1 USDC
  MEDIUM = 'medium',  // 11 energy / 10 USDC
  LARGE = 'large'     // 60 energy / 50 USDC
}

