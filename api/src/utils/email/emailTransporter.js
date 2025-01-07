const nodemailer = require('nodemailer');
// Email transporter configuration
const createTransporter = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return nodemailer.createTransport({
        service: process.env.SERVICE,
        auth: {
            user: process.env.SMTP_USER, // Dummy username
            pass: process.env.SMTP_PASS  // Dummy password
          },
        tls: {
            rejectUnauthorized: !isProduction, // Disable TLS certificate verification for local development
        },
        debug: isProduction, // Enable debug mode for detailed logs (helpful for troubleshooting)
    });
};

module.exports = createTransporter;
