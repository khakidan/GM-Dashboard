// src/server/routes/auth.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many auth requests, please try again later.',
});

// GET /api/auth/config
router.get('/config', (req, res) => {
  const clientId =
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID;
  res.json({ clientId: clientId || null });
});

// POST /api/auth/google-token
router.post('/google-token', authLimiter, async (req, res) => {
  try {
    const { code, redirect_uri, refresh_token } = req.body;
    const clientId =
      process.env.VITE_GOOGLE_CLIENT_ID ||
      process.env.CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID;
    const clientSecret =
      process.env.VITE_GOOGLE_CLIENT_SECRET ||
      process.env.CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('⚠️ [Server] Persistent Sync Disabled: Missing Google Client Secret or ID.');
      console.info('   To enable persistent background sync, set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in your .env or AI Studio Secrets.');
      return res.status(400).json({
        error: 'CONFIGURATION_REQUIRED',
        message: 'Google Client Secret/ID is not configured in the environment.',
      });
    }


    const params = new URLSearchParams();
    params.append('client_id', clientId); // ✅ B.2 fix: clientId is non-null here
    params.append('client_secret', clientSecret);

    if (refresh_token) {
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refresh_token);
    } else {
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', redirect_uri);
    }

    const googleRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await googleRes.json();
    if (!googleRes.ok) {
      console.error('❌ [Server] Google Token API Error:', data);
      return res.status(googleRes.status).json(data);
    }

    res.json(data);
  } catch (error: unknown) {
    console.error('❌ [Server] Token exchange exception', error);
    res.status(500).json({ error: 'Internal server error during token exchange' });
  }
});

export default router;