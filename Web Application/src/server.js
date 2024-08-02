const http = require('http');
const app = require('./app');
const WebSocketHandler = require('./websocket/websocketHandler');

// Create an HTTP server
const server = http.createServer(app);

// Initialize WebSocketHandler with the HTTP server
WebSocketHandler.init(server);

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

app.listen(PORT, HOST, async () => {
    try {
        await testConnection();
        console.log(`Server is running on http://${HOST}:${PORT}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});