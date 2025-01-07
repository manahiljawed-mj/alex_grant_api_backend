const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    paymentMethodId: {
        type: String,
        required: true,
    },
    customer: {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: false,
        },
    },
    card: {
        brand: {
            type: String,
            required: true,
        },
        last4: {
            type: String,
            required: true,
        },
        exp_month: {
            type: Number,
            required: true,
        },
        exp_year: {
            type: Number,
            required: true,
        },
    },
    status: {
        type: String,
        enum: ['succeeded', 'pending', 'failed', 'requires_action', 'requires_payment_method'], 
        default: 'pending',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
