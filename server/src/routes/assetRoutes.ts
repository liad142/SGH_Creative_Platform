import { Router } from 'express';
import { generateAsset } from '../controllers/assetController.js';

const router = Router();

router.post('/generate-asset', generateAsset);

export default router;
