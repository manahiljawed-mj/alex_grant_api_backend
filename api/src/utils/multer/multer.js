const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const uploadDir = './src/audio/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Set the destination folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Create a unique filename
  }
});

// Multer upload configuration
const upload2 = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const validMimeTypes = ['audio/mpeg', 'audio/mp3']; // Accept both MPEG and MP3 MIME types
    if (validMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Accept MP3 files
    } else {
      cb(new Error('Invalid file type. Only MP3 files are allowed.'), false); // Reject other types
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB (optional)
  }
}).single('audioFile'); // Expecting 'audioFile' in the form data

// Error handling for multer
upload2.middleware = (req, res, next) => {
  upload2(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const textFileStorage = multer.memoryStorage();
const textFileUpload = multer({ storage: textFileStorage }).single('file'); // 'file' is the name of the for

module.exports = { upload2, textFileUpload };
