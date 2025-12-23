import { Router } from 'express';
import { listSeasons, initSeason, generateSeason, getChapters, generateTaskFull, decomposeTask, updateTaskPosition, make3DTask } from '../controllers/seasonController.js';

const router = Router();

router.get('/', listSeasons);
router.get('/chapters', getChapters);
router.post('/init', initSeason);
router.post('/generate', generateSeason); // Keep for backwards compatibility

// Split Flow Endpoints
router.post('/tasks/:taskId/generate-full', generateTaskFull);
router.post('/tasks/:taskId/decompose', decomposeTask);
router.post('/tasks/:taskId/make-3d', make3DTask);
router.patch('/tasks/:taskId/position', updateTaskPosition);

export default router;

