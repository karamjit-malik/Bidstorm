import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import * as adminController from '../controllers/adminController';

const router = Router();

// Every admin route requires an authenticated admin.
router.use(requireAuth, requireRole('admin'));

router.get('/fraud-signals', adminController.listFraudSignals);
router.patch('/fraud-signals/:id/resolve', adminController.resolveFraudSignal);
router.post('/auctions/:id/suspend', adminController.suspendAuction);
router.post('/users/:id/suspend', adminController.suspendUser);
router.get('/analytics/overview', adminController.analyticsOverview);

export default router;
