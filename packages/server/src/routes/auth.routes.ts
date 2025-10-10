import { Router, type Request, type Response } from 'express';
import { UserRepo } from '../repos/UserRepo.js';

const router = Router();
const userRepo = new UserRepo();

/**
 * POST /api/auth/register
 * Register a new user or fetch existing user by ID
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    let user;

    if (userId) {
      // Try to fetch existing user
      try {
        user = await userRepo.findById(userId);
      } catch (error) {
        return res.status(404).json({
          error: 'User not found',
          message: 'No user exists with this ID'
        });
      }
    } else {
      // Create new user with default balances
      user = await userRepo.create();
    }

    res.json({
      user,
      message: userId ? 'User found' : 'User created'
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
 * Login with existing user ID
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
        message: 'No user exists with this ID'
      });
    }

    res.json({
      user,
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
