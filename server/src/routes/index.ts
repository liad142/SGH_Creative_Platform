import { Router } from 'express';
import { generateImage } from '../controllers/generations.js';
import seasonRoutes from './seasonRoutes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generations Routes
router.post('/generate', generateImage);

// Seasons Routes
router.use('/seasons', seasonRoutes);

export default router;
