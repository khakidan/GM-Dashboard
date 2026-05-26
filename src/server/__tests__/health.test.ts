import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from '../routes/health';

describe('Health Router', () => {
  it('returns 200 OK for GET /api/health', async () => {
    const app = express();
    app.use('/api', healthRouter);

    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});
