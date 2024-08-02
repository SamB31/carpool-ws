const http = require('http');
const app = require('./app');
const WebSocketHandler = require('./websocket/websocketHandler');

// Create an HTTP server
const server = http.createServer(app);

// Initialize WebSocketHandler with the HTTP server
WebSocketHandler.init(server);

// Start the server
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
    try {
        sequelize.authenticate();
        console.log('Database connection established.');
        console.log(`Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});