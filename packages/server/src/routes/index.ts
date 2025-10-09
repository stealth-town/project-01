import { Router } from 'express';
import dummyRoutes from './dummy.routes.js';


/**
 * @description Main router file
 * 
 * This is where the router lives
 * (his mom lives in the package down the street)
 * 
 * TODO - 
 */


const router = Router();

router.use('/dummy', dummyRoutes);
// router.use('/town', townRoutes);
// router.use('/character', characterRoutes);




export default router;