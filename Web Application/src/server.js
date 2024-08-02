const http = require('http');
const app = require('./app');
const WebSocketHandler = require('./websocket/websocketHandler');

// Create an HTTP server
const server = http.createServer(app);

// Initialize WebSocketHandler with the HTTP server
WebSocketHandler.init(server);

// Start the server
const PORT = 80;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});