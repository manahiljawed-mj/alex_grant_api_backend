const express = require('express');
const chatController = require('../controllers/chat');
// Multer storage and configuration (use the updated version above)
const { upload2, textFileUpload } = require('../utils/multer/multer'); // Adjust the import path to where you define your multer config

const router = express.Router();

router.post('/', textFileUpload, chatController.createChat); // Use the 'upload' middleware here
router.get('/get-chats', chatController.getChats);
router.post('/generate-text-to-speech', chatController.generateTTS);
router.post('/generate-speech-to-text', upload2, chatController.generateSTT); // Just use upload2 here
router.post('/generate-voice-chat', upload2, chatController.generateVoiceChat); // Use upload2 here for audio file upload
router.get('/generate-image', chatController.imageGeneration);

module.exports = router;
