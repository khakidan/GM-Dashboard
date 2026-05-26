import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth';

describe('Auth Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    vi.unstubAllEnvs();
    
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/auth/config', () => {
    it('returns { clientId: null } when env vars are missing', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
      vi.stubEnv('CLIENT_ID', '');
      vi.stubEnv('GOOGLE_CLIENT_ID', '');
      
      const response = await request(app).get('/api/auth/config');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ clientId: null });
    });

    it('returns the clientId when VITE_GOOGLE_CLIENT_ID is set', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
      
      const response = await request(app).get('/api/auth/config');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ clientId: 'test-client-id' });
    });
  });

  describe('POST /api/auth/google-token', () => {
    it('returns 400 with error CONFIGURATION_REQUIRED when clientId or clientSecret env vars are missing', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
      vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', '');
      
      const response = await request(app).post('/api/auth/google-token').send({ code: 'test' });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'CONFIGURATION_REQUIRED',
        message: 'Google Client Secret/ID is not configured in the environment.',
      });
    });

    it('returns 500 on an unexpected internal error', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
      vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'test-secret');
      
      vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));
      
      const response = await request(app).post('/api/auth/google-token').send({ code: 'test' });
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error during token exchange' });
    });

    it('proxies a successful Google token response correctly', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
      vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'test-secret');
      
      const mockSuccessResponse = { access_token: 'fake-token', expires_in: 3600 };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockSuccessResponse,
      } as Response);
      
      const response = await request(app).post('/api/auth/google-token').send({ code: 'test' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSuccessResponse);
    });
  });
});
