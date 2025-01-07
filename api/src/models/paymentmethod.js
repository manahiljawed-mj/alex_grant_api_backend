const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        cardHolderName: {
            type: String,
            required: true,
            trim: true,
        },
        cardNumber: {
            type: String,
            required: true,
            trim: true,
        },
        cardType: {
            type: String, // e.g., Visa, MasterCard
            required: true,
            trim: true,
        },
        expiryMonth: {
            type: String,
            required: true,
            trim: true,
        },
        expiryYear: {
            type: String,
            required: true,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
