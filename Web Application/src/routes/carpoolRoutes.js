const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { handleCheckIn, handleCheckOut } = require('../controllers/carpoolController.js');


router.post('/submit-check-in', upload.none(), handleCheckIn);
router.post('/submit-check-out', upload.none(), handleCheckOut);

module.exports = router;