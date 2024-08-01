const { historicalFormatMessage, endCarpool } = require('../services/historicalService');
const { broadcastMessage } = require('../websocket/websocketHandler');

const getHistoricalData = async (req, res) => {
    try {
        const data = await historicalFormatMessage();
        res.json(data);
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({ success: false, message: 'Error fetching historical data' });
    }
};

const endCarpoolSession = async (req, res) => {
    try {
        const response = await endCarpool();

        if (response.success) {
            broadcastMessage('endCarpool', response.message);
        }

        res.status(response.status).json(response);
    } catch (error) {
        console.error('Error ending carpool:', error);
        res.status(500).json({ success: false, message: 'Error ending carpool' });
    }
};

module.exports = { getHistoricalData, endCarpoolSession };
