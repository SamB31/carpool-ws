const http = require('http');
const app = require('./app');
const WebSocketHandler = require('./websocket/websocketHandler');

// Create an HTTP server
const server = http.createServer(app);

// Initialize WebSocketHandler with the HTTP server
WebSocketHandler.init(server);


const PORT = 80; // Make sure the port is correct
const HOST = '0.0.0.0'; 
app.listen(PORT, HOST, async () => {
    try {
        console.log(`Server is running on http://${HOST}:${PORT}`);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});