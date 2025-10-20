import { Router, type Request, type Response } from 'express';
import { UserRepo } from '../repos/UserRepo.js';
import { CharacterRepo } from '../repos/CharacterRepo.js';
import { TownRepo } from '../repos/TownRepo.js';

const router = Router();
const userRepo = new UserRepo();
const characterRepo = new CharacterRepo();
const townRepo = new TownRepo();

/**
 * POST /api/auth/register
 * Create a new user with a random username
 * Returns the user ID that can be used to login later
 * Also creates character and town for the user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Create new user with default balances (30 energy, 0 tokens, 10 USDC for testing)
    const user = await userRepo.create();

    console.log('✅ User created:', user.id);

    // Create character for the user
    const character = await characterRepo.create({
      user_id: user.id,
      damage_rating: 0
    });

    console.log('✅ Character created:', character.id);

    // Create town for the user
    const town = await townRepo.create({
      user_id: user.id,
      level: 1,
      max_slots: 3
    });

    console.log('✅ Town created:', town.id);

    // Generate a simple username from the ID
    const username = `player_${user.id.substring(0, 8)}`;

    res.json({
      userId: user.id,
      username,
      characterId: character.id,
      townId: town.id,
      message: 'User created successfully. Save this User ID to login later!'
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login with existing user ID (paste from database)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID required',
        message: 'Please provide a user ID to login'
      });
    }

    const user = await userRepo.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user exists with this ID. Please check the ID or register a new user.'
      });
    }

    // Generate username from ID for display
    const username = `player_${user.id.substring(0, 8)}`;

    res.json({
      user: {
        id: user.id,
        username
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

export default router;
