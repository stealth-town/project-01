import { Router, type Request, type Response } from "express";
import { DungeonService } from "../services/dungeon/DungeonService.js";

const router = Router();
const dungeonService = new DungeonService();

/**
 * GET /api/dungeon/character/:characterId/active
 * Get active dungeon status for a character
 */
router.get("/character/:characterId/active", async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({
        error: "Missing character ID",
        message: "characterId is required",
      });
    }

    const status = await dungeonService.getActiveDungeonStatus(characterId);

    if (!status) {
      return res.json({
        active: false,
        characterDungeon: null,
        dungeonRun: null,
      });
    }

    res.json({
      active: true,
      characterDungeon: status.characterDungeon,
      dungeonRun: status.dungeonRun,
    });
  } catch (error: any) {
    console.error("Get active dungeon status error:", error);
    res.status(500).json({
      error: "Failed to get active dungeon status",
      message: error.message,
    });
  }
});

/**
 * GET /api/dungeon/character/:characterId/unclaimed
 * Get all unclaimed character dungeons for a character
 */
router.get("/character/:characterId/unclaimed", async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({
        error: "Missing character ID",
        message: "characterId is required",
      });
    }

    const dungeons = await dungeonService.getUnclaimedDungeons(characterId);

    res.json({
      dungeons,
      count: dungeons.length,
    });
  } catch (error: any) {
    console.error("Get unclaimed dungeons error:", error);
    res.status(500).json({
      error: "Failed to get unclaimed dungeons",
      message: error.message,
    });
  }
});

/**
 * GET /api/dungeon/character/:characterId/stats
 * Get all-time stats for a character
 */
router.get("/character/:characterId/stats", async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({
        error: "Missing character ID",
        message: "characterId is required",
      });
    }

    const stats = await dungeonService.getCharacterStats(characterId);

    res.json(stats);
  } catch (error: any) {
    console.error("Get character stats error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Character not found",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to get character stats",
      message: error.message,
    });
  }
});

/**
 * GET /api/dungeon/events/:characterDungeonId
 * Get dungeon events (combat log) for a character dungeon
 */
router.get("/events/:characterDungeonId", async (req: Request, res: Response) => {
  try {
    const { characterDungeonId } = req.params;
    const { limit } = req.query;

    if (!characterDungeonId) {
      return res.status(400).json({
        error: "Missing character dungeon ID",
        message: "characterDungeonId is required",
      });
    }

    const events = await dungeonService.getDungeonEvents(
      characterDungeonId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      events,
      count: events.length,
    });
  } catch (error: any) {
    console.error("Get dungeon events error:", error);
    res.status(500).json({
      error: "Failed to get dungeon events",
      message: error.message,
    });
  }
});

/**
 * POST /api/dungeon/claim
 * Claim reward for a specific character dungeon
 */
router.post("/claim", async (req: Request, res: Response) => {
  try {
    const { characterDungeonId, userId } = req.body;

    if (!characterDungeonId || !userId) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "characterDungeonId and userId are required",
      });
    }

    const result = await dungeonService.claimDungeonReward(characterDungeonId, userId);

    res.json({
      message: "Reward claimed successfully",
      tokensAwarded: result.tokens,
      characterDungeon: result.characterDungeon,
    });
  } catch (error: any) {
    console.error("Claim dungeon reward error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Resource not found",
        message: error.message,
      });
    }

    if (
      error.message.includes("already claimed") ||
      error.message.includes("not yet finished") ||
      error.message.includes("does not belong")
    ) {
      return res.status(400).json({
        error: "Invalid claim request",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to claim dungeon reward",
      message: error.message,
    });
  }
});

/**
 * POST /api/dungeon/claim-all
 * Claim rewards for all unclaimed character dungeons for a character
 */
router.post("/claim-all", async (req: Request, res: Response) => {
  try {
    const { characterId, userId } = req.body;

    if (!characterId || !userId) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "characterId and userId are required",
      });
    }

    const result = await dungeonService.claimAllRewards(characterId, userId);

    res.json({
      message: "All rewards claimed successfully",
      totalTokens: result.totalTokens,
      claimedCount: result.claimedCount,
      dungeons: result.dungeons,
    });
  } catch (error: any) {
    console.error("Claim all dungeon rewards error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Resource not found",
        message: error.message,
      });
    }

    if (error.message.includes("does not belong")) {
      return res.status(400).json({
        error: "Invalid claim request",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to claim all dungeon rewards",
      message: error.message,
    });
  }
});

export default router;
