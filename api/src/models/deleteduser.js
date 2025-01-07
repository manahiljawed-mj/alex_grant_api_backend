const mongoose = require('mongoose');

const DeletedUserSchema = new mongoose.Schema({
    originalUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to original user
    firstName: { type: String, required: false }, // User's first name
    lastName: { type: String, required: false }, // User's last name
    userName: { type: String, required: false }, // User's username
    email: { type: String, required: false }, // User's email
    createdAt: { type: Date, default: Date.now }, // Timestamp when the user was deleted
  });

module.exports = mongoose.model('DeletedUser', DeletedUserSchema);
