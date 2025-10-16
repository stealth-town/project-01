import { Router, type Request, type Response } from "express";
import { CharacterService } from "../services/character/CharacterService.js";

const router = Router();
const characterService = new CharacterService();

/**
 * POST /api/characters/generate
 * Generate a new character (with nothing)
 */
router.post("/generate", async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                error: "Missing required fields",
                message: "userId is required",
            });
        }

        const character = await characterService.createCharacter(userId);

        res.status(201).json({
            message: "Character created",
            character,
        });
    } catch (error: any) {
        console.error("Generate character error:", error);
        res.status(500).json({
            error: "Failed to generate character",
            message: error.message,
        });
    }
});

/**
 * GET /api/characters/user/:userId
 * Get character by user ID
 */
router.get("/user/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                error: "Missing user ID",
                message: "userId is required",
            });
        }

        const character = await characterService.getCharacterByUserId(userId);

        res.status(200).json({ character });
    } catch (error: any) {
        console.error("Get character by user ID error:", error);
        res.status(500).json({
            error: "Failed to get character",
            message: error.message,
        });
    }
});

/**
 * GET /api/characters/:characterId
 * Get character by character ID
 */
router.get("/:characterId", async (req: Request, res: Response) => {
    try {
        const { characterId } = req.params;

        if (!characterId) {
            return res.status(400).json({
                error: "Missing character ID",
                message: "characterId is required",
            });
        }

        const character = await characterService.getCharacter(characterId);

        res.status(200).json({ character });
    } catch (error: any) {
        console.error("Get character error:", error);
        res.status(500).json({
            error: "Failed to get character",
            message: error.message,
        });
    }
});

export default router;

