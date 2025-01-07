const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        paymentMethodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentMethod',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['Success', 'Failed'],
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
