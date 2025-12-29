const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enhanced logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log('='.repeat(60));
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    console.log(`Origin: ${req.headers.origin || 'N/A'}`);
    console.log(`User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length > 0) {
        console.log('Query:', JSON.stringify(req.query, null, 2));
    }
    console.log('='.repeat(60));
    next();
});

// Load data files
let users, games, betsData;
try {
    users = require('./data/users.json');
    games = require('./data/games.json');
    betsData = require('./data/bets.json');
    console.log('✅ Data files loaded successfully');
} catch (error) {
    console.error('❌ Error loading data files:', error.message);
    process.exit(1);
}

// Helper functions
const saveUsers = () => {
    try {
        fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error saving users:', error);
    }
};

const saveBets = () => {
    try {
        fs.writeFileSync(path.join(__dirname, 'data', 'bets.json'), JSON.stringify(betsData, null, 2));
    } catch (error) {
        console.error('Error saving bets:', error);
    }
};

const getUser = (token) => {
    return users.users.find(u => u.token === token);
};

// Response wrapper for standard Melbet API format (xg/d schema)
const xgResponse = (data, success = true, error = "") => ({
    Success: success,
    Error: error,
    ErrorCode: 0,
    Value: data
});

const successResponse = (data, message = 'Success') => ({
    Success: true,
    Message: message,
    Result: data
});

const errorResponse = (message, code = 400) => ({
    Success: false,
    Message: message,
    ErrorCode: code
});

// ========================================
// Authentication APIs
// ========================================

const handleLogin = (req, res) => {
    console.log('🔐 Login request received');
    const user = users.users[0];

    const response = {
        "Success": true,
        "Token": user.token,
        "UserId": user.id,
        "Message": "Login Successful - Mock Server",
        "Result": {
            "Id": user.id,
            "Token": user.token,
            "Balance": user.balance,
            "Currency": user.currency,
            "Email": user.email,
            "FirstName": user.firstName,
            "LastName": user.lastName,
            "Phone": user.phone,
            "Country": user.country,
            "Verified": user.verified
        },
        "Value": {
            "Id": user.id,
            "Token": user.token,
            "Balance": user.balance,
            "Currency": user.currency,
            "Email": user.email,
            "FirstName": user.firstName,
            "LastName": user.lastName,
            "Phone": user.phone,
            "Country": user.country,
            "Verified": user.verified
        }
    };

    console.log('✅ Login successful for user:', user.id);
    res.json(response);
};

app.post('/UserAuth/Auth', handleLogin);
app.post('/UserAuth/Auth2', handleLogin);
app.get('/UserAuth/Auth', handleLogin);
app.get('/UserAuth/Auth2', handleLogin);
app.post('/api/v1/auth/login', handleLogin);

// ========================================
// User Profile APIs
// ========================================

// Critical endpoint identified for startup: Account/v1/Mb/UserData
app.get('/Account/v1/Mb/UserData', (req, res) => {
    console.log('👤 Profile UserData request (Critical Startup)');
    const user = users.users[0];

    // Construct response matching ci/g.smali expectations
    const profileData = {
        "Id": user.id,
        "Login": user.id.toString(),
        "Money": user.balance,
        "Currency": user.currency,
        "ActivateStatus": 1,
        "HasBets": true,
        "CountryCode": "RU",
        "Country": "Russia",
        "City": "Moscow",
        "CityId": 1,
        "DtBirthday": "1990-01-01T00:00:00",
        "RegistrationDt": "2023-01-01T12:00:00",
        "Email": user.email,
        "Name": user.firstName,
        "Surname": user.lastName,
        "PhoneClient": user.phone,
        "HasAuthenticator": false,
        "HasTwoFactor": false,
        "IsVip": true,
        "BonusChoice": 1,
        "VerificationStatusGroupCode": "Verified",
        "PointsAccumulated": 100
    };

    res.json(xgResponse(profileData));
});

// Device data update (called during startup)
app.post('/UserDevice/v1/MobileDevice/UpdateUserData', (req, res) => {
    console.log('📱 Device UserData update request');
    res.json(xgResponse(null));
});

app.get('/api/v1/user/profile', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = token ? getUser(token) : users.users[0];

    if (!user) {
        return res.status(401).json(errorResponse("Unauthorized", 401));
    }

    res.json(xgResponse({
        "Id": user.id,
        "Email": user.email,
        "FirstName": user.firstName,
        "LastName": user.lastName,
        "Phone": user.phone,
        "Country": user.country,
        "Currency": user.currency,
        "RegistrationDate": user.registrationDate,
        "Verified": user.verified
    }));
});

// ========================================
// Balance APIs
// ========================================

app.get('/Account/v1/Mb/GetUserBalance', (req, res) => {
    console.log('💰 Balance request');
    const user = users.users[0];

    const balances = [
        {
            "Id": user.id,
            "Balance": user.balance,
            "Currency": user.currency,
            "Type": 0
        }
    ];
    res.json(xgResponse(balances));
});

app.get('/api/v1/wallet/balance', (req, res) => {
    const user = users.users[0];

    res.json(successResponse({
        "Balance": user.balance,
        "Currency": user.currency,
        "BonusBalance": 0
    }));
});

// ========================================
// Games APIs
// ========================================

app.get('/api/v1/games/list', (req, res) => {
    console.log('🎮 Games list request');
    res.json(successResponse(games.games, 'Games retrieved successfully'));
});

app.get('/api/v1/games/:id', (req, res) => {
    const gameId = parseInt(req.params.id);
    const game = games.games.find(g => g.id === gameId);

    if (!game) {
        return res.status(404).json(errorResponse("Game not found", 404));
    }

    res.json(successResponse(game));
});

app.post('/api/v1/games/:id/launch', (req, res) => {
    const gameId = parseInt(req.params.id);
    const game = games.games.find(g => g.id === gameId);

    if (!game) {
        return res.status(404).json(errorResponse("Game not found", 404));
    }

    console.log(`🚀 Launching game: ${game.name}`);

    res.json(successResponse({
        "GameUrl": `http://localhost:3000/game/${gameId}`,
        "SessionId": `session_${Date.now()}`,
        "GameId": gameId,
        "DemoMode": req.body.demo || false
    }));
});

// ========================================
// Betting APIs
// ========================================

app.post('/api/v1/bets/place', (req, res) => {
    console.log('🎲 Bet placement request');
    const { gameId, amount, betType } = req.body;
    const user = users.users[0];

    if (amount <= 0 || amount > user.balance) {
        return res.status(400).json(errorResponse("Invalid bet amount or insufficient balance"));
    }

    const bet = {
        "id": betsData.nextBetId++,
        "userId": user.id,
        "gameId": gameId,
        "amount": amount,
        "betType": betType || "single",
        "status": "pending",
        "timestamp": new Date().toISOString(),
        "result": null,
        "payout": null
    };

    user.balance -= amount;

    // Simulate game result
    const win = Math.random() > 0.5;
    const multiplier = win ? (1 + Math.random() * 2) : 0;

    bet.status = "settled";
    bet.result = win ? "win" : "loss";
    bet.payout = win ? amount * multiplier : 0;

    user.balance += bet.payout;

    betsData.bets.push(bet);

    saveUsers();
    saveBets();

    console.log(`✅ Bet placed: ${bet.result} - Payout: ${bet.payout}`);

    res.json(successResponse({
        "BetId": bet.id,
        "Status": bet.status,
        "Result": bet.result,
        "Payout": bet.payout,
        "NewBalance": user.balance
    }));
});

app.get('/api/v1/bets/history', (req, res) => {
    const userId = users.users[0].id;
    const userBets = betsData.bets.filter(b => b.userId === userId);

    res.json(successResponse(userBets));
});

// ========================================
// Wallet APIs
// ========================================

app.post('/api/v1/wallet/deposit', (req, res) => {
    const { amount } = req.body;
    const user = users.users[0];

    if (amount <= 0) {
        return res.status(400).json(errorResponse("Invalid amount"));
    }

    user.balance += amount;
    saveUsers();

    console.log(`💵 Deposit: ${amount} - New balance: ${user.balance}`);

    res.json(successResponse({
        "Amount": amount,
        "NewBalance": user.balance,
        "TransactionId": `dep_${Date.now()}`
    }, "Deposit successful"));
});

app.post('/api/v1/wallet/withdraw', (req, res) => {
    const { amount } = req.body;
    const user = users.users[0];

    if (amount <= 0 || amount > user.balance) {
        return res.status(400).json(errorResponse("Invalid amount or insufficient balance"));
    }

    user.balance -= amount;
    saveUsers();

    console.log(`💸 Withdrawal: ${amount} - New balance: ${user.balance}`);

    res.json(successResponse({
        "Amount": amount,
        "NewBalance": user.balance,
        "TransactionId": `wd_${Date.now()}`
    }, "Withdrawal successful"));
});

// ========================================
// Config & System APIs
// ========================================

app.get('/android/versions', (req, res) => {
    res.json({
        "force_update": false,
        "version": "1.0.0",
        "latest_version": "1.0.0",
        "update_url": ""
    });
});

app.get('/api/v1/config', (req, res) => {
    try {
        // Try multiple paths for localConfig.json to support both local and cloud deployments
        const paths = [
            path.join(__dirname, 'localConfig.json'),
            path.join(__dirname, '..', 'assets', 'localConfig.json'),
            path.join(__dirname, 'assets', 'localConfig.json')
        ];

        let configPath = paths.find(p => fs.existsSync(p));

        if (!configPath) {
            console.error('❌ localConfig.json not found in any expected location');
            return res.status(500).json(errorResponse("Configuration file missing"));
        }

        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Dynamically determine the host IP from the request
        const requestHost = req.headers.host || '127.0.0.1';
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        configData.Common.SiteDomain = `${protocol}://${requestHost}`;

        // Construct the full response expected by gf/f.smali (jf/c mapping)
        // and hf/h.smali (jf/d mapping for critical config)
        const response = {
            "Success": true,
            "Result": {
                "Settings": configData.Settings,
                "Common": configData.Common,
                "Bets": configData.Bets,
                "MainMenu": configData.MainMenu,
                // Critical flags identified from jf/d.smali
                "CriticalConfig": {
                    "hasSectionToto": true,
                    "hasBetConstructor": true,
                    "hasFinancial": true,
                    "hasSectionXGames": true,
                    "hasSectionAggregator": true
                }
            }
        };

        res.json(response);
        console.log('📡 Configuration served for host:', requestHost);
    } catch (error) {
        console.error('❌ Error serving config:', error.message);
        res.status(500).json(errorResponse("Error loading configuration"));
    }
});




// ========================================
// Health & Info
// ========================================

app.get('/health', (req, res) => {
    res.json({
        "status": "healthy",
        "timestamp": new Date().toISOString(),
        "uptime": process.uptime(),
        "version": "2.0.0"
    });
});

app.get('/', (req, res) => {
    res.json({
        "message": "Melbet Mock Server v2.0 - Enhanced Edition",
        "status": "running",
        "version": "2.0.0",
        "endpoints": {
            "auth": ["/UserAuth/Auth", "/api/v1/auth/login"],
            "balance": ["/Account/v1/Mb/GetUserBalance", "/api/v1/wallet/balance"],
            "games": ["/api/v1/games/list", "/api/v1/games/:id", "/api/v1/games/:id/launch"],
            "betting": ["/api/v1/bets/place", "/api/v1/bets/history"],
            "wallet": ["/api/v1/wallet/deposit", "/api/v1/wallet/withdraw"],
            "profile": ["/api/v1/user/profile"],
            "system": ["/health", "/api/v1/config", "/android/versions"]
        },
        "totalAPIs": 15
    });
});

// ========================================
// Catch-all
// ========================================

app.use((req, res) => {
    console.log(`⚠️  UNMATCHED REQUEST: ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);

    res.status(200).json(xgResponse({
        "Path": req.url,
        "Method": req.method,
        "Info": "Mock response - endpoint not specifically handled"
    }));
});

// ========================================
// Start Server
// ========================================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.clear();
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║   🚀 Melbet Mock Server v2.0 - ENHANCED EDITION 🚀      ║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log();
    console.log('📡 Server Information:');
    console.log(`   • Local:    http://localhost:${PORT}`);
    console.log(`   • Network:  http://192.168.1.55:${PORT}`);
    console.log(`   • Emulator: http://10.0.2.2:${PORT}`);
    console.log();
    console.log('📋 Available APIs:');
    console.log('   ✅ 15+ endpoints ready');
    console.log('   ✅ 5 games available');
    console.log('   ✅ Full wallet system');
    console.log('   ✅ Betting system active');
    console.log();
    console.log('🎮 Test server:');
    console.log(`   Open http://localhost:${PORT} in browser`);
    console.log();
    console.log('⚠️  IMPORTANT:');
    console.log('   DO NOT CLOSE THIS WINDOW!');
    console.log('   App won\'t work if server is not running');
    console.log();
    console.log('═'.repeat(60));
    console.log('📝 Request logs will appear below:');
    console.log('═'.repeat(60));
    console.log();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
