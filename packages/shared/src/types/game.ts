/**
 * Game-related interfaces and types
 */

import type { ItemId, TownId, BuildingId } from "./primitives.js";
import type { ItemRarity } from "./enums.js";

export interface GameItem {
  id: ItemId;
  name: string;
  description: string;
  rarity: ItemRarity;
  value: number;
  stackable: boolean;
  maxStack?: number;
}

export interface Town {
  id: TownId;
  name: string;
  description: string;
  population: number;
  buildings: BuildingId[];
}

export interface Building {
  id: BuildingId;
  townId: TownId;
  name: string;
  type: "shop" | "inn" | "guild" | "dungeon" | "other";
  level: number;
}

