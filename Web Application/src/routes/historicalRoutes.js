const express = require('express');
const router = express.Router();
const { getHistoricalData, endCarpoolSession } = require('../controllers/historicalController');

router.get('/historical-data', getHistoricalData);
router.post('/submit-end', endCarpoolSession);

module.exports = router;