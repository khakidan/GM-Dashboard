import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limit to accept large images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health Check
  app.get("/api/health", (req, res) => {
    res.status(200).send("OK");
  });

  // Google Auth Config API
  app.get("/api/auth/config", (req, res) => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    res.json({ clientId: clientId || null });
  });

  // Google Token Exchange API
  app.post("/api/auth/google-token", async (req, res) => {
    try {
      const { code, redirect_uri, refresh_token } = req.body;
      const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.warn('⚠️ [Server] Persistent Sync Disabled: Missing Google Client Secret or ID.');
        console.info('   To enable persistent background sync, set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_SECRET in your .env or AI Studio Secrets.');
        return res.status(400).json({ 
          error: "CONFIGURATION_REQUIRED",
          message: "Google Client Secret/ID is not configured in the environment." 
        });
      }

      console.log(`[Server] Auth Request Received: ${refresh_token ? 'Refresh' : 'Exchange'}`);

      const params = new URLSearchParams();
      params.append('client_id', clientId || '');
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

      console.log('✅ [Server] Token operation successful.');
      res.json(data);
    } catch (error: any) {
      console.error("❌ [Server] Token exchange exception", error);
      res.status(500).json({ error: "Internal server error during token exchange" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log('[Server] Production mode: Serving static files from', distPath);
    
    // Explicitly serve index.html for the root to be safe
    app.get('/', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build error: index.html missing at ' + indexPath);
      }
    });

    app.use(express.static(distPath));
    
    // Catch-all for SPA routing
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build error: index.html missing.');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
