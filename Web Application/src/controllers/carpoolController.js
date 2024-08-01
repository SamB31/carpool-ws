const { checkIn, checkOut, formatMessage } = require('../services/carpoolService');
const { broadcastMessage } = require('../websocket/websocketHandler');

const handleCheckIn = async (req, res) => {
    try {
        const { familyId } = req.body;
        const response = await checkIn(familyId);


        if (response.success) {
            broadcastMessage('newCheckIn', response.data);
        }

        res.status(response.status).json(response);
    } catch (error) {
        console.error('Error during check-in:', error);
        res.status(500).json({ success: false, message: 'Error during check-in' });
    }
};

const handleCheckOut = async (req, res) => {
    try {
        const { childIds } = req.body;
        const response = await checkOut(childIds);

        if (response.success) {
            broadcastMessage('newCheckIn', response.data);
        }

        res.status(response.status).json(response);
    } catch (error) {
        console.error('Error during check-out:', error);
        res.status(500).json({ success: false, message: 'Error during check-out' });
    }
};

module.exports = { handleCheckIn, handleCheckOut };