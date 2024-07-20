const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const csv = require('csv-parser');
const { Sequelize, Op } = require('sequelize');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');



// #region ORM

// const sequelize = new Sequelize('database', 'username', 'password', {
//     dialect: 'sqlite',
//     storage: './database.db'
// });

const sequelize = new Sequelize('carpool', 'samb31', 'Asb2107!', {
    host: 'localhost',
    dialect: 'postgres',
    port: 5432, // default PostgreSQL port
    logging: false, // set to console.log to see the raw SQL queries
    // Additional options
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
});


// Test the connection
async function testConnection() {
    try {
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
}

// Define models
const Family = sequelize.define('family', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    familyId: Sequelize.INTEGER,
});


const InLine = sequelize.define('inline', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    familyId: {
        type: Sequelize.INTEGER,
        unique: true,
        references: {
            model: Family,
            key: 'id'
        }
    },
});

const Historical = sequelize.define('historical', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    familyId: {
        type: Sequelize.INTEGER,
        references: {
            model: Family,
            key: 'id'
        }
    }
});

// Relationships
InLine.belongsTo(Family, {foreignKey: 'familyId'});
Historical.belongsTo(Family, {foreignKey: 'familyId'});

testConnection();

sequelize.sync();

// #endregion

function broadcastMessage(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

async function formatmessage() {

    // Fetch the latest InLine records along with associated Family data
    const allInLineRecords = await InLine.findAll({
        include: [{
            model: Family,
            attributes: ['id','firstName', 'lastName', 'familyId']
        }],
        order: [['createdAt', 'ASC']]
    });

    const formattedData = allInLineRecords.map(record => {
        // Extracting dataValues from each inline record
        const inlineData = record.dataValues;
        
        // Extracting family data from each inline record's family object
        const familyData = inlineData.family ? inlineData.family.dataValues : {};

        return {
            uniqueId: familyData.id,
            firstName: familyData.firstName,
            lastName: familyData.lastName,
            familyId: familyData.familyId,
            createdAt: inlineData.createdAt
        };
    });
    return formattedData
}

async function historicalformatmessage() {

    // Fetch the latest InLine records along with associated Family data
    const allHistoricalRecords = await Historical.findAll({
        include: [{
            model: Family,
            attributes: ['firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']]
    });

    const formattedData = allHistoricalRecords.map(record => {
        // Extracting dataValues from each inline record
        const inlineData = record.dataValues;
        
        // Extracting family data from each inline record's family object
        const familyData = inlineData.family ? inlineData.family.dataValues : {};

        return {
            firstName: familyData.firstName,
            lastName: familyData.lastName,
            createdAt: inlineData.createdAt
        };
    });
    return formattedData
}

// #region CSV


function writeDataToCSVFile(data, filePath = 'historicalData.csv') {
    return new Promise((resolve, reject) => {
        // Start with the header
        let csvContent = 'FirstName,LastName,Picked up at\n';
        // Append each row
        data.forEach(row => {
            console.log(row.dataValues.family.dataValues.firstName)
            const firstName = row.dataValues.family.dataValues.firstName; // Adjust according to your data structure
            const lastName = row.dataValues.family.dataValues.lastName; // Adjust according to your data structure
            const createdAt = row.dataValues.createdAt; // Adjust according to your data structure

            // Create a CSV row and handle potential commas in data
            const csvRow = `"${firstName}","${lastName}","${createdAt}"\n`;
            csvContent += csvRow;
        });

        // Write the CSV content to file
        fs.writeFile(filePath, csvContent, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

// Function to read and parse CSV file
const readCsvFile = (filePath) => {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

// Main function to insert data
const insertDataFromCsv = async (filePath) => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync the model with the database
        await Family.sync();

        // Read data from CSV file
        const families = await readCsvFile(filePath);

        // Insert data into the database
        for (const family of families) {
            await Family.create(family);
        }

        console.log('Data inserted successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};

//insertDataFromCsv('/Users/samblanton/Desktop/Node/family.csv');

// #endregion

// #region HTTP server


// #region AdminJS Setup
async function setupAdminJS(app) {
    const AdminJS = (await import('adminjs')).default;
    const AdminJSExpress = await import('@adminjs/express');
    const AdminJSSequelize = await import('@adminjs/sequelize');

    AdminJS.registerAdapter(AdminJSSequelize);

    const adminJs = new AdminJS({
        databases: [sequelize],
        rootPath: '/admin',
    });

    const adminRouter = AdminJSExpress.buildRouter(adminJs);
    app.use(adminJs.options.rootPath, adminRouter);
}
// #endregion


const app = express();

// Serve static files (e.g., CSS, JavaScript, images) from a directory named 'public'
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


const upload = multer();

setupAdminJS(app);

app.get('/', (req, res) => {
    fs.readFile('templates/index.html', (err, data) => {
        if (err) {
            res.status(500).send('Error loading index.html');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

app.get('/historical', (req, res) => {
    fs.readFile('templates/historical.html', (err, data) => {
        if (err) {
            res.status(500).send('Error loading index.html');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

app.get('/carpool', (req, res) => {
    fs.readFile('templates/carpool.html', (err, data) => {
        if (err) {
            res.status(500).send('Error loading carpool.html');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

app.post('/submit-check-in', upload.none(), async (req, res) => {
    try {
        const { familyId } = req.body;
        
        // Check if any family member with the given familyId is already checked in
        const alreadyCheckedIn = await InLine.findOne({
            include: [{
                model: Family,
                attributes: ['lastName'],
                where: { familyId: familyId }
            }]
        });

        
        if (alreadyCheckedIn != null) {
            return res.status(400).json({ success: false, message: 'User already checked in' });
        }

        // Check if any family member with the given familyId is already in the historical table
        const inHistorical = await Historical.findOne({
            include: [{
                model: Family,
                attributes: ['lastName'],
                where: { familyId: familyId }
            }]
        });

        if (inHistorical != null) {
            return res.status(400).json({ success: false, message: 'User already checked out' });
        }

        // Find all family members with the given familyId
        const familyMembers = await Family.findAll({
            where: { familyId }
        });

        
        if (familyMembers.length === 0) {
            return res.status(400).json({ success: false, message: 'Unknown family ID' });
        }

        // Array to hold last names
        const lastName = familyMembers[0].dataValues.lastName;

        await Promise.all(familyMembers.map(async (member) => {
            // Create a new InLine record
            const inlineRecord = await InLine.create({ familyId: member.dataValues.id });
        }));

        // Broadcast the new check-in
        
        formatmessage().then(formattedData => {
            broadcastMessage({ type: 'newCheckIn', data: formattedData });
        });
        res.json({ success: true, message: `${lastName} checked in` });
    } catch (error) {
        console.error('Error during check-in:', error);
        res.json({ success: false, message: 'Error during check-in' });
    }
});


app.post('/submit-check-out', upload.none(), async (req, res) => {
    try {
        const { childIds } = req.body;

        // Find all specified family members
        const familyMembers = await Family.findAll({
            where: { id: childIds }
        });


        if (familyMembers.length === 0) {
            return res.status(400).json({ success: false, message: 'No family members found for the provided family ID' });
        }

        const notCheckedIn = await InLine.findAll({
            include: [{
                model: Family,
                attributes: ['lastName'],
                where: { id: childIds }
            }]
        });

        if (notCheckedIn.length === 0) {
            return res.status(400).json({ success: false, message: 'User not checked in' });
        }



        // Get all unique last names
        const lastNames = [...new Set(familyMembers.map(member => member.dataValues.lastName))];
        
        // Create a string with all last names
        const lastNamesString = lastNames.join(", ");

        const removalPromises = familyMembers.map(member => 
            
            InLine.destroy({
                where: { familyId: member.id }
            })
        );
        await Promise.all(removalPromises);

        await Promise.all(familyMembers.map(async (member) => {
            // Create a new InLine record
            const addhistorical = await Historical.create({ familyId: member.dataValues.id });
        }));

        formatmessage().then(formattedData => {
            broadcastMessage({ type: 'newCheckIn', data: formattedData });
        });

        res.json({ success: true, message: `${lastNamesString} families checked out successfully` });
    } catch (error) {
        console.error('Error during check-out:', error);
        res.json({ success: false, message: 'Error during check-out' });
    }
});

app.post('/submit-end', upload.none(), async (req, res) => {
    try {
        const historicalData = await Historical.findAll({
            include: [{
                model: Family,
                attributes: ['firstName', 'lastName'] // Include only firstName and lastName
            }]
        });

        try {
            await writeDataToCSVFile(historicalData);
            // Continue with your logic
        } catch (error) {
            console.error('Error writing to file:', error);
            // Handle the error
        }

        // Clear Historical and InLine tables
        await Historical.destroy({ where: {} });
        await InLine.destroy({ where: {} });

        broadcastMessage({ type: 'endCarpool', data: 'Carpool has ended' });
        // Send a confirmation message back to the client
        res.json({ success: true, message: `Carpool has ended` });
    } catch (error) {
        console.error('Error ending carpool:', error);
        res.json({ success: false, message: 'Error ending carpool' });
    }
});


const server = http.createServer(app);

// #endregion

// Initialize a WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Wait for a message from the client to identify the page
    ws.on('message', async (message) => {
        const clientMessage = JSON.parse(message);


        if (clientMessage.page === '1') {
            // send inline table to page 
            formatmessage().then(formattedData => {
                broadcastMessage({ type: 'initial', data: formattedData });
            });
        }

        if (clientMessage.page === '2') {
            // send historical data to page
            historicalformatmessage().then(formattedData => {
                ws.send(JSON.stringify({ type: 'historical', data: formattedData }));
            });
        }

    });

    ws.on('close', () => {
        console.log('Client has disconnected');
    });
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
