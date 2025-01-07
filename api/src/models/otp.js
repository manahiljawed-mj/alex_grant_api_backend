const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Assuming you have a User model
    },
    otp: {
        type: Number,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    email: {
        type: String,
        required: true,
    },
    sessionId: {
        type: String,
        required: true,
    },
    expiryTime: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('OTP', otpSchema);
