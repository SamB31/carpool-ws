const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { handleCheckIn, handleCheckOut, handleDelete, searchByLastName } = require('../controllers/carpoolController.js');


router.post('/submit-check-in', upload.none(), handleCheckIn);
router.post('/submit-check-out', upload.none(), handleCheckOut);
router.post('/submit-delete', upload.none(), handleDelete);
router.post('/search-by-lastname', upload.none(), searchByLastName);


module.exports = router;