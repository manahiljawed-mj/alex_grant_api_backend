// utils/payment.js
const processPayment = async ({ amount, cardDetails }) => {
    // Simulate a payment processing flow
    try {
        // Replace this logic with actual payment gateway integration
        if (Math.random() > 0.2) { // Simulate 80% success rate
            return {
                success: true,
                transactionId: `txn_${Date.now()}`,
            };
        } else {
            throw new Error('Payment failed');
        }
    } catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
};

module.exports = { processPayment };
