import { DungeonService } from "../../../../server/dist/services/dungeon/DungeonService.js";
import { CharacterRepo } from "../../../../server/dist/repos/CharacterRepo.js";
import { DungeonRunsRepo } from "../../../../server/dist/repos/DungeonRunsRepo.js";

/**
 * DungeonManager - Manages the global dungeon cycle
 *
 * - Runs dungeons on a fixed 3-minute schedule
 * - Enrolls eligible characters (DR > 0) at the start of each cycle
 * - Generates hits every 5 seconds for each active character
 * - Finishes dungeons after 3 minutes and immediately starts the next cycle
 */
export class DungeonManager {
  private dungeonService: DungeonService;
  private characterRepo: CharacterRepo;
  private dungeonRunsRepo: DungeonRunsRepo;

  private currentDungeonRun: any = null;
  private hitInterval: NodeJS.Timeout | null = null;
  private cycleTimeout: NodeJS.Timeout | null = null;

  private readonly DUNGEON_DURATION_MS = 3 * 60 * 1000; // 3 minutes
  private readonly HIT_INTERVAL_MS = 5 * 1000; // 5 seconds

  constructor() {
    this.dungeonService = new DungeonService();
    this.characterRepo = new CharacterRepo();
    this.dungeonRunsRepo = new DungeonRunsRepo();
  }

  async start() {
    console.log('🏰 DungeonManager starting...');
    console.log(`⏰ Dungeon duration: ${this.DUNGEON_DURATION_MS / 1000}s`);
    console.log(`⚔️  Hit interval: ${this.HIT_INTERVAL_MS / 1000}s`);

    // Start the first dungeon cycle immediately
    await this.startNewCycle();
  }

  async stop() {
    console.log('🛑 DungeonManager stopping...');

    if (this.hitInterval) {
      clearInterval(this.hitInterval);
      this.hitInterval = null;
    }

    if (this.cycleTimeout) {
      clearTimeout(this.cycleTimeout);
      this.cycleTimeout = null;
    }

    // Finish any active dungeon
    if (this.currentDungeonRun) {
      await this.finishCycle();
    }
  }

  /**
   * Start a new dungeon cycle
   */
  private async startNewCycle() {
    try {
      console.log('🆕 Starting new dungeon cycle...');

      // Create a new dungeon run (global event, no specific user/character)
      const dungeonRun = await this.dungeonRunsRepo.create({
        started_at: new Date().toISOString(),
        duration_seconds: this.DUNGEON_DURATION_MS / 1000,
      });

      this.currentDungeonRun = dungeonRun;
      console.log(`✅ Created dungeon run: ${dungeonRun.id}`);

      // Enroll all eligible characters
      await this.enrollCharacters(dungeonRun.id);

      // Start generating hits every 5 seconds
      this.startHitGeneration();

      // Schedule the end of this cycle
      this.cycleTimeout = setTimeout(async () => {
        await this.finishCycle();
        // Immediately start the next cycle
        await this.startNewCycle();
      }, this.DUNGEON_DURATION_MS);

    } catch (error) {
      console.error('❌ Error starting new cycle:', error);
      // Retry after a short delay
      setTimeout(() => this.startNewCycle(), 5000);
    }
  }

  /**
   * Enroll all characters with DR > 0 into the dungeon
   */
  private async enrollCharacters(dungeonRunId: string) {
    try {
      console.log('📋 Enrolling characters...');

      // Get all characters
      const characters = await this.characterRepo.findAll();

      // Filter characters with DR > 0
      const eligibleCharacters = characters.filter((char) => char.damage_rating > 0);

      console.log(`Found ${eligibleCharacters.length} eligible characters (DR > 0)`);

      // Enroll each character
      const enrolledCount = await Promise.all(
        eligibleCharacters.map(async (character) => {
          try {
            const characterDungeon = await this.dungeonService.enrollCharacterInDungeon(
              character.id,
              dungeonRunId
            );
            return characterDungeon ? 1 : 0;
          } catch (error: any) {
            console.error(`⚠️  Failed to enroll character ${character.id}:`, error.message);
            return 0;
          }
        })
      );

      const totalEnrolled = enrolledCount.reduce((sum: number, count: number) => sum + count, 0);
      console.log(`✅ Enrolled ${totalEnrolled} characters in dungeon`);

    } catch (error) {
      console.error('❌ Error enrolling characters:', error);
    }
  }

  /**
   * Start generating hits every 5 seconds
   */
  private startHitGeneration() {
    console.log('⚔️  Starting hit generation...');

    // Generate hits immediately
    this.generateHits();

    // Then continue every 5 seconds
    this.hitInterval = setInterval(async () => {
      await this.generateHits();
    }, this.HIT_INTERVAL_MS);
  }

  /**
   * Generate hits for all active character dungeons
   */
  private async generateHits() {
    try {
      // Get all active character dungeons
      const activeCharacterDungeons = await this.dungeonService.getAllActiveCharacterDungeons();

      if (activeCharacterDungeons.length === 0) {
        return;
      }

      console.log(`⚔️  Generating hits for ${activeCharacterDungeons.length} active characters...`);

      // Generate a hit for each character
      await Promise.all(
        activeCharacterDungeons.map(async (characterDungeon) => {
          try {
            const damage = this.calculateDamage(characterDungeon.starting_damage_rating);
            await this.dungeonService.recordHit(characterDungeon.id, damage);
          } catch (error: any) {
            console.error(
              `⚠️  Failed to record hit for character dungeon ${characterDungeon.id}:`,
              error.message
            );
          }
        })
      );

    } catch (error) {
      console.error('❌ Error generating hits:', error);
    }
  }

  /**
   * Calculate damage with ±10% variance
   */
  private calculateDamage(baseDamage: number): number {
    // ±10% variance
    const variance = 0.1;
    const minDamage = baseDamage * (1 - variance);
    const maxDamage = baseDamage * (1 + variance);

    // Random damage between min and max
    const damage = Math.random() * (maxDamage - minDamage) + minDamage;

    // Return as whole number (round)
    return Math.round(damage);
  }

  /**
   * Finish the current dungeon cycle
   */
  private async finishCycle() {
    try {
      console.log('🏁 Finishing dungeon cycle...');

      // Stop generating hits
      if (this.hitInterval) {
        clearInterval(this.hitInterval);
        this.hitInterval = null;
      }

      if (!this.currentDungeonRun) {
        return;
      }

      // Get all active character dungeons for this run
      const activeCharacterDungeons = await this.dungeonService.getAllActiveCharacterDungeons();

      console.log(`Finishing ${activeCharacterDungeons.length} character dungeons...`);

      // Finish each character dungeon
      await Promise.all(
        activeCharacterDungeons.map(async (characterDungeon) => {
          try {
            await this.dungeonService.finishCharacterDungeon(characterDungeon.id);
          } catch (error: any) {
            console.error(
              `⚠️  Failed to finish character dungeon ${characterDungeon.id}:`,
              error.message
            );
          }
        })
      );

      // Mark the dungeon run as finished
      await this.dungeonRunsRepo.update(this.currentDungeonRun.id, {
        finished_at: new Date().toISOString(),
      });

      console.log(`✅ Finished dungeon run: ${this.currentDungeonRun.id}`);
      this.currentDungeonRun = null;

    } catch (error) {
      console.error('❌ Error finishing cycle:', error);
    }
  }
}
