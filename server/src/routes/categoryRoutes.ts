import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';

const router = Router();

router.get('/', categoryController.listCategories);
// Category preferences (POST/GET /preferences) are added in the recommendation phase.

export default router;
