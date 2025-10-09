/**
 * Player-related interfaces and types
 */

import type { UserId, CharacterId, Timestamp } from "./primitives.js";
import type { PlayerStatus } from "./enums.js";

export interface PlayerProfile {
  id: UserId;
  username: string;
  email: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  status: PlayerStatus;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  gold: number;
}

export interface Character {
  id: CharacterId;
  userId: UserId;
  name: string;
  stats: PlayerStats;
  location: {
    townId: string;
    buildingId?: string;
  };
}

