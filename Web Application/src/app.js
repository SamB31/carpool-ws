const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const carpoolRoutes = require('./routes/carpoolRoutes');
const historicalRoutes = require('./routes/historicalRoutes');
const WebSocketHandler = require('./websocket/websocketHandler');
const { insertDataFromCsv } = require('./utils/csvUpload');
const setupAdminJS = require('./models/admin');
const { sequelize } = require('./config/database');
const { resetAfterSchoolCareStatus } = require('./utils/resetASC')


const app = express();
const upload = multer();

app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

setupAdminJS(app);

insertDataFromCsv('./family.csv')

// Test the database connection
async function testDatabaseConnection() {
    try {
        await sequelize.authenticate();
        console.log('Connection to the database has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

// Call the test function
testDatabaseConnection();



app.use('/carpool', carpoolRoutes);
app.use('/historical', historicalRoutes);
app.use('/reset', resetAfterSchoolCareStatus)


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/historical', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'historical.html'));
});

app.get('/carpool', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'carpool.html'));
});

sequelize.sync()

module.exports = app;