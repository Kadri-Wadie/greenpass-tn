const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

// The QR code encodes a link here — serve the verify page for any record id.
app.get('/verify/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

module.exports = app;
