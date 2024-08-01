const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const carpoolRoutes = require('./routes/carpoolRoutes');
const historicalRoutes = require('./routes/historicalRoutes');
const WebSocketHandler = require('./websocket/websocketHandler');
const setupAdminJS = require('./models/admin');
const { sequelize } = require('./config/database');


const app = express();
const upload = multer();

app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

setupAdminJS(app);

app.use('/carpool', carpoolRoutes);
app.use('/historical', historicalRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/historical', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'historical.html'));
});

app.get('/carpool', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'carpool.html'));
});

// Test database connection and synchronize models
(async () => {
    await sequelize.sync(); // Do not use force: true in production
})();


module.exports = app;