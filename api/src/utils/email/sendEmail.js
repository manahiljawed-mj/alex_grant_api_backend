const createTransporter = require('./emailTransporter');

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.SMTP_USER, // Sender
            to, // Receiver
            subject, // Email subject
            html: htmlContent, // HTML email content
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;
