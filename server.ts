import express from 'express';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  // Dev server must run on port 3000 in AI Studio development
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = isProduction ? (Number(process.env.PORT) || 8080) : 3000;

  app.use(express.json());

  // Health check endpoint for Cloud Run & monitoring
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const distPath = path.join(process.cwd(), 'dist');

  if (isProduction) {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
