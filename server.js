import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from dist or docs
const staticDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, 'docs');

app.use(express.static(staticDir));

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`StickIQ server running at http://0.0.0.0:${PORT}`);
});
