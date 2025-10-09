import { Router, type Request, type Response } from 'express';
import { DummyService } from '../services/index.js';



const dummyRoutes = Router();
const dummyService = new DummyService();


/**
 * The implementations will be replaced with static calls over the class ()
 */

dummyRoutes.get('/test', async (req: Request, res: Response) => {
  try {
    const result = await dummyService.getDummyData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dummy data' });
  }
});

// POST /api/dummy/process
dummyRoutes.post('/process', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    const result = await dummyService.processDummyRequest(input);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default dummyRoutes;