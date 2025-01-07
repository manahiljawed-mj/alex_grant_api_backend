const User = require("../models/user"); // Import the User model
const PaymentMethod = require("../models/paymentmethod"); // Import the User model
const Subscription = require('../models/subscription');   // Import Subscription model
const { verifyToken } = require('../utils/jwt/jwt');
exports.paymentProceed = async (req, res, next) => {

    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: 'Authorization token is required.' });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
        const { cardHolderName, cardNumber, expiryMonth, expiryYear, amount } = req.body;

        if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear || !amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // first card details verify through stripe then add payemnt functio the cardtype get from cardddetails function
        //    

        // Create a new payment method
        const paymentMethod = await PaymentMethod.create({
            userId: decoded.userId,
            cardHolderName,
            cardNumber: cardNumber,
            cardType: 'Visa', // Replace with dynamic logic if needed
            expiryMonth,
            expiryYear,
            isDefault: true,
        });
        // Create a new subscription
        const subscription = await Subscription.create({
            userId: decoded.userId,
            paymentMethodId: paymentMethod._id,
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            amount,
            paymentStatus: 'Success',
        });
        // Respond with the chat data
        return res.status(201).json({
            message: 'Payment and subscription successful',
            subscription,
            paymentTransactionId: /*paymentResponse.transactionId*/ "123",
        });
    } catch (error) {
        console.error('Error while proceed payment:', error.message);
        return res.status(500).json({
            message: 'An error occurred while proceed payment. Please try again later.',
            error: error.message,
        });
    }
}
