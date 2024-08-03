const WebSocket = require('ws');
const { formatMessage } = require('../services/carpoolService');
const { historicalFormatMessage} = require('../services/historicalService.js')
const { wsOptions, allowedEvents } = require('../config/websocket.js');

class WebSocketHandler {
    constructor() {
        this.wss = null;
    }

    init(server) {
        this.wss = new WebSocket.Server({ server, ...wsOptions });

        this.wss.on('connection', (ws) => {
            console.log('New client connected');

            ws.on('message', async (message) => {
                
                const clientMessage = JSON.parse(message);

                if (clientMessage.page === '1') {
                    // send inline table to page
                    const formattedData = await formatMessage();
                    ws.send(JSON.stringify({ type: 'initial', data: formattedData }));
                }

                if (clientMessage.page === '2') {
                    // send historical data to page
                    const formattedData = await historicalFormatMessage();
                    ws.send(JSON.stringify({ type: 'historical', data: formattedData }));
                }
            });

            ws.on('close', () => {
                console.log('Client has disconnected');
            });
        });
    }

    handleMessage(message) {
        const data = JSON.parse(message);
        // Handle incoming messages here
        console.log('Received:', data);
    }

    broadcast(type, data) {
        if (!this.wss) {
            console.error('WebSocket server is not initialized.');
            return;
        }

        if (!allowedEvents.includes(type)) {
            console.error(`Invalid event type: ${type}`);
            return;
        }

        const message = JSON.stringify({ type, data });
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

const webSocketHandler = new WebSocketHandler();

module.exports = webSocketHandler;
module.exports.broadcastMessage = (event, data) => {
    webSocketHandler.broadcast(event, data);
};
