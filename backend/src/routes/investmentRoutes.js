import { Router } from 'express';
import { getCatalog, getPlanById } from '../controllers/investmentController.js';

const router = Router();

// Public catalog explorer endpoints
router.get('/', getCatalog);
router.get('/:id', getPlanById);

export default router;

