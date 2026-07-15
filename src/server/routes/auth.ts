// src/server/routes/auth.ts

import { Router } from 'express';
import { createRateLimiter } from '../rateLimiter';
import { requireBody } from '../bodyValidation';

const router = Router();

const GOOGLE_CLIENT_ID =
  process.env.VITE_GOOGLE_CLIENT_ID ||
  process.env.CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
  process.env.VITE_GOOGLE_CLIENT_SECRET ||
  process.env.CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET;

const authLimiter = createRateLimiter('Too many auth requests, please try again later.');

// GET /api/auth/config
router.get('/config', (req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID || null });
});

// POST /api/auth/google-token
router.post('/google-token', authLimiter, requireBody, async (req, res) => {
  try {
    const { code, redirect_uri, refresh_token } = req.body;
    if (!code && !refresh_token) {
      return res.status(400).json({ error: 'Code or refresh_token is required' });
    }
    if (code && !redirect_uri) {
      return res.status(400).json({ error: 'redirect_uri is required when using authorization code' });
    }
    const clientId = GOOGLE_CLIENT_ID;
    const clientSecret = GOOGLE_CLIENT_SECRET;

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

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'GOOGLE_API_ERROR', message: errorText };
      }
      console.error('❌ [Server] Google Token API Error:', errorData);
      return res.status(googleRes.status).json(errorData);
    }

    const data = await googleRes.json();
    res.json(data);
  } catch (error: unknown) {
    console.error('❌ [Server] Token exchange exception', error);
    res.status(500).json({ error: 'Internal server error during token exchange' });
  }
});

export default router;