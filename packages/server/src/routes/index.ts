import { Router } from "express";
import authRoutes from "./auth.routes.js";
import townRoutes from "./town.routes.js";
import itemRoutes from "./item.routes.js";
import characterRoutes from "./character.routes.js";

/**
 * Main router file
 * Routes for MVP Town-Investment Loop
 */

const router = Router();

// Auth routes (register/login workaround)
router.use("/auth", authRoutes);

// Town routes (energy, buildings, trades)
router.use("/town", townRoutes);

// Item routes (CRUD operations for character items)
router.use("/items", itemRoutes);

// Character routes (character generation and management)
router.use("/characters", characterRoutes);

// Future routes
// router.use('/dungeon', dungeonRoutes);

export default router;
