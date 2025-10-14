import { Router } from 'express';
import authRoutes from './auth.routes.js';
import townRoutes from './town.routes.js';

/**
 * Main router file
 * Routes for MVP Town-Investment Loop
 */

const router = Router();

// Auth routes (register/login workaround)
router.use('/auth', authRoutes);

// Town routes (energy, buildings, trades)
router.use('/town', townRoutes);

// Future routes
// router.use('/character', characterRoutes);
// router.use('/dungeon', dungeonRoutes);

export default router;