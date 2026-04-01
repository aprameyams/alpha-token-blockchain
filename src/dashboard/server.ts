import express from 'express';
import path from 'path';

/**
 * Dashboard Server
 */
const app = express();
const port = process.env.DASHBOARD_PORT || 8080;

// Use absolute path from project root
const publicPath = path.join(process.cwd(), 'src', 'public');

app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/api-config', (req, res) => {
  res.json({
    apiUrl: process.env.API_URL || 'http://localhost:3000',
  });
});

app.listen(port, () => {
  console.log(`Dashboard running on http://localhost:${port}`);
});
