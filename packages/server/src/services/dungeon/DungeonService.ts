import type { CharacterId, UserId } from "@stealth-town/shared/types";
import { UserRepo } from "../../repos/UserRepo.js";
import { CharacterRepo } from "../../repos/CharacterRepo.js";
import { DungeonRunsRepo } from "../../repos/DungeonRunsRepo.js";
import { CharacterDungeonRepo } from "../../repos/CharacterDungeonRepo.js";
import { DungeonEventRepo } from "../../repos/DungeonEventRepo.js";

export class DungeonService {
  private userRepo: UserRepo;
  private characterRepo: CharacterRepo;
  private dungeonRunsRepo: DungeonRunsRepo;
  private characterDungeonRepo: CharacterDungeonRepo;
  private dungeonEventRepo: DungeonEventRepo;

  constructor() {
    this.userRepo = new UserRepo();
    this.characterRepo = new CharacterRepo();
    this.dungeonRunsRepo = new DungeonRunsRepo();
    this.characterDungeonRepo = new CharacterDungeonRepo();
    this.dungeonEventRepo = new DungeonEventRepo();
  }

  /**
   * Get active character dungeon for a character
   */
  async getActiveCharacterDungeon(characterId: CharacterId) {
    return await this.characterDungeonRepo.findActiveByCharacterId(characterId);
  }

  /**
   * Get active dungeon with character dungeon data
   */
  async getActiveDungeonStatus(characterId: CharacterId) {
    const characterDungeon = await this.characterDungeonRepo.findActiveByCharacterId(characterId);

    if (!characterDungeon) {
      return null;
    }

    const dungeonRun = await this.dungeonRunsRepo.findById(characterDungeon.dungeon_run_id);

    return {
      characterDungeon,
      dungeonRun,
    };
  }

  /**
   * Get unclaimed character dungeons for a character
   */
  async getUnclaimedDungeons(characterId: CharacterId) {
    return await this.characterDungeonRepo.findUnclaimedByCharacterId(characterId);
  }

  /**
   * Get all-time stats for a character
   */
  async getCharacterStats(characterId: CharacterId) {
    const character = await this.characterRepo.findById(characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    return await this.characterDungeonRepo.getCharacterStats(characterId);
  }

  /**
   * Get dungeon events (combat log) for a character dungeon
   */
  async getDungeonEvents(characterDungeonId: string, limit?: number) {
    if (limit) {
      return await this.dungeonEventRepo.findRecentByCharacterDungeonId(characterDungeonId, limit);
    }
    return await this.dungeonEventRepo.findByCharacterDungeonId(characterDungeonId);
  }

  /**
   * Claim rewards for a character dungeon
   */
  async claimDungeonReward(characterDungeonId: string, userId: UserId) {
    const characterDungeon = await this.characterDungeonRepo.findById(characterDungeonId);

    if (!characterDungeon) {
      throw new Error("Character dungeon not found");
    }

    // Validate ownership
    if (characterDungeon.user_id !== userId) {
      throw new Error("Character dungeon does not belong to user");
    }

    // Validate it's finished
    if (!characterDungeon.finished_at) {
      throw new Error("Character dungeon is not yet finished");
    }

    // Validate not already claimed
    if (characterDungeon.claimed_at) {
      throw new Error("Character dungeon rewards already claimed");
    }

    // Mark as claimed
    const updated = await this.characterDungeonRepo.claim(characterDungeonId);

    // Add tokens to user
    await this.userRepo.addCurrency(userId, "tokens", characterDungeon.tokens_earned);

    return {
      tokens: characterDungeon.tokens_earned,
      characterDungeon: updated,
    };
  }

  /**
   * Claim all unclaimed rewards for a character
   */
  async claimAllRewards(characterId: CharacterId, userId: UserId) {
    // Verify character belongs to user
    const character = await this.characterRepo.findById(characterId);
    if (!character) {
      throw new Error("Character not found");
    }
    if (character.user_id !== userId) {
      throw new Error("Character does not belong to user");
    }

    // Get all unclaimed character dungeons
    const unclaimedDungeons = await this.characterDungeonRepo.findUnclaimedByCharacterId(characterId);

    if (unclaimedDungeons.length === 0) {
      return {
        totalTokens: 0,
        claimedCount: 0,
        dungeons: [],
      };
    }

    // Calculate total tokens
    const totalTokens = unclaimedDungeons.reduce((sum, cd) => sum + cd.tokens_earned, 0);

    // Claim all
    const claimed = await Promise.all(
      unclaimedDungeons.map((cd) => this.characterDungeonRepo.claim(cd.id))
    );

    // Add tokens to user
    await this.userRepo.addCurrency(userId, "tokens", totalTokens);

    return {
      totalTokens,
      claimedCount: claimed.length,
      dungeons: claimed,
    };
  }

  /**
   * Create a character dungeon entry for a character in a dungeon run
   * Called by dungeon worker when enrolling characters
   */
  async enrollCharacterInDungeon(characterId: CharacterId, dungeonRunId: string) {
    const character = await this.characterRepo.findById(characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    // Don't enroll characters with 0 damage rating
    if (character.damage_rating <= 0) {
      return null;
    }

    // Check if already enrolled
    const existing = await this.characterDungeonRepo.findActiveByCharacterId(characterId);
    if (existing) {
      return existing;
    }

    return await this.characterDungeonRepo.create({
      character_id: characterId,
      dungeon_run_id: dungeonRunId,
      user_id: character.user_id,
      starting_damage_rating: character.damage_rating,
    });
  }

  /**
   * Record a hit for a character dungeon
   * Called by dungeon worker every 5 seconds
   */
  async recordHit(characterDungeonId: string, damage: number) {
    // Create event
    await this.dungeonEventRepo.create({
      character_dungeon_id: characterDungeonId,
      damage_dealt: damage,
    });

    // Update character dungeon totals
    return await this.characterDungeonRepo.incrementDamage(characterDungeonId, damage);
  }

  /**
   * Finish a character dungeon
   * Called by dungeon worker when dungeon ends
   */
  async finishCharacterDungeon(characterDungeonId: string) {
    return await this.characterDungeonRepo.finish(characterDungeonId);
  }

  /**
   * Get all active character dungeons
   * Used by dungeon worker to process hits
   */
  async getAllActiveCharacterDungeons() {
    return await this.characterDungeonRepo.findAllActive();
  }

  // DEPRECATED: Old methods for backward compatibility with existing code
  // These will be removed once worker is updated

  async createDungeonRunIfNeeded(characterId: CharacterId) {
    // This method is now handled by the dungeon worker
    // Keeping for backward compatibility
    console.warn("createDungeonRunIfNeeded is deprecated and does nothing");
  }
}
