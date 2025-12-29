const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log requests
app.use((req, res, next) => {
    const remoteIp = req.socket.remoteAddress || req.connection.remoteAddress;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} FROM ${remoteIp}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

// --- Fake Data ---
const FAKE_BALANCE_AMOUNT = 5000.0;
const FAKE_CURRENCY = "USD";
const FAKE_USER_ID = 123456789;

// --- Endpoints ---

// Login (Auth and Auth2)
const handleLogin = (req, res) => {
    // Return a fake successful login response
    // The structure needs to match what the app expects (which is hard to know exactly without the model)
    // But usually it returns a token and user info.
    res.json({
        "Success": true,
        "Token": "fake_token_12345",
        "UserId": FAKE_USER_ID,
        "Message": "Login Successful via Mock Server",
        "Result": {
            "Id": FAKE_USER_ID,
            "Token": "fake_token_12345",
            "Balance": FAKE_BALANCE_AMOUNT,
            "Currency": FAKE_CURRENCY
        }
    });
};

app.post('/UserAuth/Auth', handleLogin);
app.post('/UserAuth/Auth2', handleLogin);
app.get('/UserAuth/Auth', handleLogin); // Sometimes GET is used? Replicating just in case
app.get('/UserAuth/Auth2', handleLogin);


// Balance
app.get('/Account/v1/Mb/GetUserBalance', (req, res) => {
    res.json([
        {
            "Id": FAKE_USER_ID,
            "Balance": FAKE_BALANCE_AMOUNT,
            "Currency": FAKE_CURRENCY,
            "Type": 0 // 0 usually main balance
        }
    ]);
});

// Update Check (Return no update)
// Identifying the path is tricky, but often it's version.json or similar.
// If the app hits this, we return empty or identical version.
app.get('/android/versions', (req, res) => {
    res.json({
        "force_update": false,
        "version": "1.0.0"
    });
});

// Catch-all
app.use((req, res) => {
    console.log(`Unmatched request: ${req.method} ${req.url}`);
    res.status(200).json({ "Success": true, "Message": "Mock Catch-All" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mock server running on http://0.0.0.0:${PORT}`);
    console.log(`Ensure your Android device/emulator can reach this IP.`);
});
