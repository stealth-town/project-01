import { Router, type Request, type Response } from "express";
import { ItemService } from "../services/item/ItemService.js";
import type { ItemType } from "@stealth-town/shared/types";

const router = Router();
const itemService = new ItemService();

/**
 * GET /api/items/character/:characterId
 * Get all items for a character
 */
router.get("/character/:characterId", async (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;

    if (!characterId) {
      return res.status(400).json({
        error: "Missing character ID",
        message: "characterId is required",
      });
    }

    const items = await itemService.getCharacterItems(characterId);

    res.json({ items });
  } catch (error: any) {
    console.error("Get character items error:", error);
    res.status(500).json({
      error: "Failed to get character items",
      message: error.message,
    });
  }
});

/**
 * GET /api/items/character/:characterId/equipped
 * Get equipped items for a character
 */
router.get(
  "/character/:characterId/equipped",
  async (req: Request, res: Response) => {
    try {
      const { characterId } = req.params;

      if (!characterId) {
        return res.status(400).json({
          error: "Missing character ID",
          message: "characterId is required",
        });
      }

      const equippedItems = await itemService.getEquippedItems(characterId);

      res.json({ equippedItems });
    } catch (error: any) {
      console.error("Get equipped items error:", error);
      res.status(500).json({
        error: "Failed to get equipped items",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/items/character/:characterId/summary
 * Get equipment summary for a character
 */
router.get(
  "/character/:characterId/summary",
  async (req: Request, res: Response) => {
    try {
      const { characterId } = req.params;

      if (!characterId) {
        return res.status(400).json({
          error: "Missing character ID",
          message: "characterId is required",
        });
      }

      const summary = await itemService.getEquipmentSummary(characterId);

      res.json(summary);
    } catch (error: any) {
      console.error("Get equipment summary error:", error);
      res.status(500).json({
        error: "Failed to get equipment summary",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/items/character/:characterId/type/:itemType
 * Get items by type for a character
 */
router.get(
  "/character/:characterId/type/:itemType",
  async (req: Request, res: Response) => {
    try {
      const { characterId, itemType } = req.params;

      if (!characterId || !itemType) {
        return res.status(400).json({
          error: "Missing parameters",
          message: "characterId and itemType are required",
        });
      }

      const items = await itemService.getItemsByType(characterId, itemType as ItemType);

      res.json({ items });
    } catch (error: any) {
      console.error("Get items by type error:", error);
      res.status(500).json({
        error: "Failed to get items by type",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/items/:itemId
 * Get a specific item by ID
 */
router.get("/:itemId", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({
        error: "Missing item ID",
        message: "itemId is required",
      });
    }

    const item = await itemService.getItem(itemId);

    res.json({ item });
  } catch (error: any) {
    console.error("Get item error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Item not found",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to get item",
      message: error.message,
    });
  }
});

/**
 * POST /api/items
 * Create a new item
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { characterId } = req.body;

    if (!characterId) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "characterId, itemType, and damageContribution are required",
      });
    }

    const item = await itemService.createItem(
      characterId
    );

    res.status(201).json({ item });
  } catch (error: any) {
    console.error("Create item error:", error);
    res.status(500).json({
      error: "Failed to create item",
      message: error.message,
    });
  }
});

/**
 * POST /api/items/:itemId/equip
 * Equip an item
 */
router.post("/equip", async (req: Request, res: Response) => {
  try {
    const { itemId, slot } = req.body;

    if (!itemId || slot === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "itemId and slot are required",
      });
    }

    if (slot < 1 || slot > 6) {
      return res.status(400).json({
        error: "Invalid slot number",
        message: "slot must be between 1 and 6",
      });
    }

    const item = await itemService.equipItem({ itemId, slot });

    res.json({ item });
  } catch (error: any) {
    console.error("Equip item error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Item not found",
        message: error.message,
      });
    }

    if (
      error.message.includes("already occupied") ||
      error.message.includes("already equipped") ||
      error.message.includes("Invalid slot")
    ) {
      return res.status(400).json({
        error: "Equipment failed",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to equip item",
      message: error.message,
    });
  }
});

/**
 * POST /api/items/:itemId/unequip
 * Unequip an item
 */
router.post("/unequip", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        error: "Missing item ID",
        message: "itemId is required",
      });
    }

    const item = await itemService.unequipItem(itemId);

    res.json({ item });
  } catch (error: any) {
    console.error("Unequip item error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Item not found",
        message: error.message,
      });
    }

    if (error.message.includes("not equipped")) {
      return res.status(400).json({
        error: "Item not equipped",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Failed to unequip item",
      message: error.message,
    });
  }
});

export default router;
