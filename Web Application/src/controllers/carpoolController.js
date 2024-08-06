const { checkIn, checkOut, formatMessage, studentDelete } = require('../services/carpoolService');
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

const handleDelete = async (req, res) => {
    try {
        const { childIds } = req.body;
        const response = await studentDelete(childIds);

        if (response.success) {
            broadcastMessage('newCheckIn', response.data);
        }

        res.status(response.status).json(response);
    } catch (error) {
        console.error('Error during check-out:', error);
        res.status(500).json({ success: false, message: 'Error during check-out' });
    }
};

const searchByLastName = async (req, res) => {
    try {
        if (!req.body || !req.body.lastName) {
          return res.status(400).json({ success: false, message: 'Last name is required.' });
        }
    
        const { lastName } = req.body;
        console.log('Last Name:', lastName); // Outputs: Canoy
    
        const result = await searchByLastName(lastName);
        res.json(result);
      } catch (error) {
        console.error('Error in searchByLastName controller:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    };

module.exports = { handleCheckIn, handleCheckOut, handleDelete, searchByLastName};