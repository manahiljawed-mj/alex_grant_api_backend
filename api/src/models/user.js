const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        pin: {
            type: Number,
            trim: true,
        },
        hasFingerprint: {
            type: Boolean,
            default: false, // Indicates if the user has enrolled a fingerprint
        },
        fingerprintHash: {
            type: String, // Stores the hashed fingerprint data
            trim: true,
            default: null, // Default to null if no fingerprint is set
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
