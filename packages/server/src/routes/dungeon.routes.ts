import { Router, type Request, type Response } from "express";
import { DungeonService } from "../services/dungeon/DungeonService.js";

const router = Router();
const dungeonService = new DungeonService();

/**
 * GET /api/dungeon/character/:characterId/unclaimed
 * Get all unclaimed dungeon runs for a character
 */
router.get(
    "/character/:characterId/unclaimed",
    async (req: Request, res: Response) => {
        try {
            const { characterId } = req.params;

            if (!characterId) {
                return res.status(400).json({
                    error: "Missing character ID",
                    message: "characterId is required",
                });
            }

            const runs = await dungeonService.getUnclaimedRuns(characterId);

            res.json({
                runs,
                count: runs.length,
            });
        } catch (error: any) {
            console.error("Get unclaimed dungeon runs error:", error);

            if (error.message.includes("not found")) {
                return res.status(404).json({
                    error: "Character not found",
                    message: error.message,
                });
            }

            res.status(500).json({
                error: "Failed to get unclaimed dungeon runs",
                message: error.message,
            });
        }
    }
);

/**
 * POST /api/dungeon/claim
 * Claim reward for a specific dungeon run
 */
router.post("/claim", async (req: Request, res: Response) => {
    try {
        const { dungeonRunId, userId } = req.body;

        if (!dungeonRunId || !userId) {
            return res.status(400).json({
                error: "Missing required fields",
                message: "dungeonRunId and userId are required",
            });
        }

        const result = await dungeonService.claimReward(dungeonRunId, userId);

        res.json({
            message: "Reward claimed successfully",
            tokensAwarded: result.tokens,
            run: result.run,
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
 * Claim rewards for all unclaimed dungeon runs for a character
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
            runs: result.runs,
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

/**
 * GET /api/dungeon/runs/:dungeonRunId
 * Get a specific dungeon run by ID
 */
router.get("/runs/:dungeonRunId", async (req: Request, res: Response) => {
    try {
        const { dungeonRunId } = req.params;

        if (!dungeonRunId) {
            return res.status(400).json({
                error: "Missing dungeon run ID",
                message: "dungeonRunId is required",
            });
        }

        const run = await dungeonService.getDungeonRun(dungeonRunId);

        res.json({ run });
    } catch (error: any) {
        console.error("Get dungeon run error:", error);

        if (error.message.includes("not found")) {
            return res.status(404).json({
                error: "Dungeon run not found",
                message: error.message,
            });
        }

        res.status(500).json({
            error: "Failed to get dungeon run",
            message: error.message,
        });
    }
});

/**
 * GET /api/dungeon/character/:characterId/runs
 * Get all dungeon runs for a character
 */
router.get(
    "/character/:characterId/runs",
    async (req: Request, res: Response) => {
        try {
            const { characterId } = req.params;

            if (!characterId) {
                return res.status(400).json({
                    error: "Missing character ID",
                    message: "characterId is required",
                });
            }

            const runs = await dungeonService.getCharacterRuns(characterId);

            res.json({
                runs,
                count: runs.length,
            });
        } catch (error: any) {
            console.error("Get character dungeon runs error:", error);

            if (error.message.includes("not found")) {
                return res.status(404).json({
                    error: "Character not found",
                    message: error.message,
                });
            }

            res.status(500).json({
                error: "Failed to get character dungeon runs",
                message: error.message,
            });
        }
    }
);

export default router;

