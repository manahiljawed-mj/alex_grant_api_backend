// src/routes/otpRoutes.js

const express = require('express');
const otpController = require('../controllers/otp');

const router = express.Router();

router.post('/generate-otp', otpController.generateOtp);
router.post('/verify-otp', otpController.verifyOtp);



module.exports = router;
