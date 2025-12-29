const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log ALL requests
app.use((req, res, next) => {
    const remoteIp = req.socket.remoteAddress || req.connection.remoteAddress;
    console.log(`[REQUEST] ${req.method} ${req.url} FROM ${remoteIp}`);
    next();
});

const FAKE_BALANCE = 5000.0;
const FAKE_USER_ID = 123456789;

// CRITICAL: Config endpoint for app startup
app.get('/api/config', (req, res) => {
    res.json({ Success: true, Result: { ServerTime: new Date().toISOString(), MaintenanceMode: false } });
});

app.post('/api/config', (req, res) => {
    res.json({ Success: true, Result: { ServerTime: new Date().toISOString(), MaintenanceMode: false } });
});

// Auth endpoints
const handleLogin = (req, res) => {
    res.json({ Success: true, Token: "fake_token_123", UserId: FAKE_USER_ID, Result: { Id: FAKE_USER_ID, Balance: FAKE_BALANCE } });
};

app.post('/UserAuth/Auth', handleLogin);
app.post('/UserAuth/Auth2', handleLogin);
app.get('/api/auth', handleLogin);

// Catch-all
app.use((req, res) => {
    console.log(`UNMATCHED: ${req.method} ${req.url}`);
    res.json({ Success: true, Message: "Mock response" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://192.168.1.55:${PORT}`);
});
