// src/server/routes/health.ts

import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

export default router;