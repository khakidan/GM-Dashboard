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

  it('POST /auth/token exchanges code for access token and returns it to the client', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'test-secret');
    
    const mockSuccessResponse = { access_token: 'fake-token', expires_in: 3600 };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    } as Response);
    
    const response = await request(app).post('/api/auth/google-token').send({ 
      code: 'test',
      redirect_uri: 'http://localhost:3000'
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSuccessResponse);
  });

  it('POST /auth/token returns 400 when code is missing from the request body', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-id');
    vi.stubEnv('VITE_GOOGLE_CLIENT_SECRET', 'test-secret');
    
    const response = await request(app).post('/api/auth/google-token').send({ redirect_uri: 'http://localhost' });
    expect(response.status).toBe(400);
  });
});
