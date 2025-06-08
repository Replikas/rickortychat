const express = require('express');
const app = express();
const PORT = 8080;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is working' });
});

app.post('/api/init', (req, res) => {
  res.json({ success: true, message: 'Database initialized' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});