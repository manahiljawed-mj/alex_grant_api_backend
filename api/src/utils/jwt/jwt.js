const jwt = require('jsonwebtoken');

// Function to create a JWT token
const createToken = (userId, username) => {
    return jwt.sign(
        { userId: userId, username: username}, // Payload
        process.env.JWT_SECRET, // Ensure this is set in your environment file
        { expiresIn: '1h' } // Token expiration time (can be adjusted)
    );
};

const verifyToken = (token) => {
    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the token is expired
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        if (decoded.exp && decoded.exp < now) {
            throw new Error('Token has expired');
        }

        // If the token is valid and not expired, return the decoded payload
        return decoded;
    } catch (err) {
        // Handle any errors (e.g., token expired, invalid token, etc.)
        if (err.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        if (err.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw new Error('Token verification failed');
    }
};


module.exports = { createToken, verifyToken };
