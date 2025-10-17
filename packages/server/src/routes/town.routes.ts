import { Router, type Request, type Response } from 'express';
import { TownService } from '../services/town/TownService.js';
import { BuildingRepo } from '../repos/BuildingRepo.js';

const router = Router();
const townService = new TownService();
const buildingRepo = new BuildingRepo();

/**
 * GET /api/town/state/:userId
 * Get complete town state (balances, town info, buildings)
 */
router.get('/state/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Get town state for user:', userId);
    console.log('body:', req.body);

    const [balances, town, buildings] = await Promise.all([
      townService.getUserBalances(userId!),
      townService.getTownState(userId!),
      buildingRepo.findByUserId(userId!)
    ]);

    res.json({
      balances,
      town,
      buildings
    });
  } catch (error: any) {
    console.error('Get town state error:', error);
    res.status(500).json({
      error: 'Failed to get town state',
      message: error.message
    });
  }
});

/**
 * POST /api/town/buy-energy
 * Purchase energy package
 */
router.post('/buy-energy', async (req: Request, res: Response) => {
  try {
    const { userId, packageType } = req.body;

    if (!userId || !packageType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and packageType are required'
      });
    }

    const result = await townService.buyEnergy(userId, packageType);

    res.json(result);
  } catch (error: any) {
    console.error('Buy energy error:', error);

    if (error.message.includes('Insufficient')) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to buy energy',
      message: error.message
    });
  }
});

/**
 * POST /api/town/buy-building
 * Purchase a building slot
 */
router.post('/buy-building', async (req: Request, res: Response) => {
  try {
    const { userId, slotNumber } = req.body;

    if (!userId || slotNumber === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and slotNumber are required'
      });
    }

    const building = await townService.buyBuilding(userId, slotNumber);

    res.json({ building });
  } catch (error: any) {
    console.error('Buy building error:', error);

    if (error.message.includes('Insufficient') ||
        error.message.includes('Invalid') ||
        error.message.includes('not unlocked') ||
        error.message.includes('already occupied') ||
        error.message.includes('Maximum buildings')) {
      return res.status(400).json({
        error: 'Purchase failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to buy building',
      message: error.message
    });
  }
});

/**
 * POST /api/town/upgrade
 * Upgrade town to next level
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId is required'
      });
    }

    const result = await townService.upgradeTown(userId);

    res.json(result);
  } catch (error: any) {
    console.error('Upgrade town error:', error);

    if (error.message.includes('Insufficient') ||
        error.message.includes('already at max level') ||
        error.message.includes('No upgrade available')) {
      return res.status(400).json({
        error: 'Upgrade failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to upgrade town',
      message: error.message
    });
  }
});

/**
 * POST /api/town/start-trade
 * Start a trade on a building
 */
router.post('/start-trade', async (req: Request, res: Response) => {
  try {
    const { userId, buildingId, riskMode } = req.body;

    if (!userId || !buildingId || !riskMode) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, buildingId, and riskMode are required'
      });
    }

    const trade = await townService.startTrade(userId, buildingId, riskMode);

    res.json({ trade });
  } catch (error: any) {
    console.error('Start trade error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('Insufficient') ||
        error.message.includes('not idle') ||
        error.message.includes('does not belong') ||
        error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Trade start failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to start trade',
      message: error.message
    });
  }
});

/**
 * POST /api/town/claim-reward
 * Claim reward from completed/liquidated trade
 */
router.post('/claim-reward', async (req: Request, res: Response) => {
  try {
    const { userId, tradeId } = req.body;

    if (!userId || !tradeId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and tradeId are required'
      });
    }

    const reward = await townService.claimReward(userId, tradeId);

    res.json(reward);
  } catch (error: any) {
    console.error('Claim reward error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message
      });
    }

    if (error.message.includes('does not belong') ||
        error.message.includes('cannot be claimed')) {
      return res.status(400).json({
        error: 'Claim failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to claim reward',
      message: error.message
    });
  }
});

/**
 * GET /api/town/trades/:userId
 * Get all user trades (active and completed)
 */
router.get('/trades/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const trades = await townService.getUserTrades(userId!);

    res.json(trades);
  } catch (error: any) {
    console.error('Get trades error:', error);
    res.status(500).json({
      error: 'Failed to get trades',
      message: error.message
    });
  }
});

export default router;
