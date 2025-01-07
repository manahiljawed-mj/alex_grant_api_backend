const express = require('express');
const userController = require('../controllers/user'); // Ensure this is correct
const passport = require('passport'); 
require('../passport');
const router = express.Router();

router.use(passport.initialize()); 
router.use(passport.session());

// Google OAuth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/auth/google/callback', passport.authenticate('google', { 
  successRedirect: '/success', 
  failureRedirect: '/failure' 
}));

router.get('/success', userController.successGoogleLogin);

router.get('/failure', userController.failureGoogleLogin);

// Correct path for 'getUsers' and 'loadAuth' to avoid duplication of '/'.
router.get('/users', userController.getUsers);  // Updated path to /users
router.post('/create-user', userController.createUser);
router.post('/login', userController.login);
router.post('/reset-password', userController.resetPassword);
router.post('/update-user', userController.editUser);
router.get('/delete-user', userController.deleteUser);
router.post('/verify-pin', userController.verifyPin);
router.post('/update-pin', userController.updatePin);
router.post('/add-fingerprint', userController.addFingerprint);
router.post('/authenticate-fingerprint', userController.authenticateFingerprint);
router.post('/set-password', userController.setPassword);
router.post('/stripe-payment', userController.paymentStripe);
router.get('/auth', userController.loadAuth);  // Updated to /auth
router.get('/payments/:userId', userController.getPaymentbyId);
router.get('/get-user-by-email', userController.getUserByEmail);

module.exports = router;
