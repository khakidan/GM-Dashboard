import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import morgan from "morgan";
import healthRouter from './src/server/routes/health';
import authRouter from './src/server/routes/auth';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  app.use(morgan('dev'));

  // Increase payload size limit to accept large images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);

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
