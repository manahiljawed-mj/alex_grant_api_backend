const express = require('express');
const paymentController = require('../controllers/payment');
// Multer storage and configuration (use the updated version above)

const router = express.Router();
router.post('/proceed-payment', paymentController.paymentProceed);

module.exports = router;