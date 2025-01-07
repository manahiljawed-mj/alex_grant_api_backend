const OpenAI = require("openai");
const { verifyToken } = require('../utils/jwt/jwt');
const { Chat, ChatTypes, ContentTypes } = require('../models/chat');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const csv = require('csv-parser');
const streamifier = require('streamifier');
const AdmZip = require('adm-zip');
const fs = require("fs");
const path = require("path");
const speechFile = path.resolve("./speech.mp3");

// Initialize OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});
const sessions = {}; // Initialize the sessions object to store session data in memory


exports.createChat = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: 'Authorization token is required.' });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
        const { message, sessionId } = req.body;

        const chatHistory = await Chat.find({
            userId: decoded.userId,
            sessionId: sessionId,
          });
          
        // `message` will come from the form-data fields
        let file = req.file; // File will be handled by multer

        let inputMessage = null;
        let fileContent = null;
        let contentType = ContentTypes.MESSAGE; // Default to message content

        // Handle message content
        if (message) {
            inputMessage = message;
        }

        // Handle file content
        if (file) {
            contentType = ContentTypes.FILE; // Set content type to 'file'
        
            // Handling PDF files
            if (file.mimetype === 'application/pdf') {
                const pdfData = await pdfParse(file.buffer);
                fileContent = pdfData.text;
                inputMessage = inputMessage || fileContent;
        
            // Handling image files (add additional logic if needed)
            } else if (file.mimetype.startsWith('image/')) {
                fileContent = `Received an image of type ${file.mimetype}`;
                inputMessage = inputMessage || fileContent;
        
            // Handling XLSX files
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                console.log('XLSX file detected');
                
                // Read the XLSX file
                const workbook = xlsx.read(file.buffer, { type: 'buffer' });
                const sheetNames = workbook.SheetNames;
                const sheetData = sheetNames.map(sheet => ({
                    sheet: sheet,
                    data: xlsx.utils.sheet_to_json(workbook.Sheets[sheet])
                }));
            
                // Log sheet data for debugging
                console.log(sheetData, 'sheetData');
            
                // Create a readable summary of the sheet data
                const firstSheetData = sheetData[0]?.data || [];  // Get first sheet's data if available
                const sampleData = firstSheetData.slice(0, 5);  // Only take first 5 rows for the summary (optional)
                
                // Convert sample data into a human-readable string
                const summarizedData = sampleData.map(row => JSON.stringify(row)).join(", ");
                
                // Set summarized data as fileContent (or inputMessage if needed)
                fileContent = `Received an XLSX file with ${sheetNames.length} sheet(s). Sample data from first sheet: ${summarizedData}`;
            
                // Use summarizedData as the input for the OpenAI request
                inputMessage = summarizedData;  // Directly assign the summarized data
            
                // No need for inputMessage = inputMessage || fileContent since we're directly setting inputMessage to summarizedData
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {        
                // Parse the DOCX file using mammoth
                const docxData = await mammoth.extractRawText({ buffer: file.buffer });
                
                // Extract the text content
                fileContent = docxData.value;
                inputMessage = inputMessage || fileContent;
        
            } 
            else if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
                    const results = [];
        
                    // Convert the buffer into a readable stream
                    const fileStream = streamifier.createReadStream(file.buffer);
                    
                    // Pipe the stream to csv-parser and handle the data
                    await new Promise((resolve, reject) => {
                        fileStream
                            .pipe(csv())
                            .on('data', (data) => results.push(data))
                            .on('end', () => {
                                // Process results after the CSV is parsed
                                fileContent = `Received a CSV file. Parsed data: ${JSON.stringify(results.slice(0, 5))}`; // Show first 5 rows
                                inputMessage = inputMessage || fileContent;
                                resolve();  // Resolve the promise when parsing is done
                            })
                            .on('error', (err) => {
                                console.error('Error parsing CSV file:', err);
                                reject(err);  // Reject the promise on error
                            });
                    });
            }
            else if (file.mimetype === 'application/zip') {                
                // Create a new instance of AdmZip to extract the contents
                const zip = new AdmZip(file.buffer);

                // Extract all the files in the ZIP
                const zipEntries = zip.getEntries();  // Get all entries in the ZIP file

                // Process each file inside the ZIP
                let zipContents = zipEntries.map(entry => {
                    // Only handle files, ignore directories
                    if (!entry.isDirectory) {
                        const fileName = entry.entryName;
                        fileContent = entry.getData().toString('utf-8'); // Convert buffer to string
                        return { fileName, fileContent };
                    }
                }).filter(entry => entry); // Filter out any directories or undefined entries
                
                if (zipContents.length === 0) {
                    return res.status(400).json({ message: 'No files found in the ZIP archive.' });
                }

                // Create a summarized message from the ZIP contents
                const zipMessage = zipContents.map(entry => `File: ${entry.fileName}, Content: ${entry.fileContent.slice(0, 100)}...`).join("\n");

                // Set the ZIP file contents as inputMessage
                inputMessage = zipMessage;

            }
            else {
                return res.status(400).json({ message: 'Unsupported file type.' });
            }
        }

        

        if (!inputMessage) {
            return res.status(400).json({ message: 'Message or file content is required.' });
        }
        // Create a prompt with the conversation history
        const prompt = chatHistory.reduce((acc, current) => {
            acc += `${current.message}\n${current.response}\n`;
            return acc;
        }, '') + inputMessage;
  
        // Call OpenAI Chat Completion API
        const completion = await openai.chat.completions.create({
            model: process.env.MODEL_NAME || "gpt-4",
            messages: [{ role: "user", content: prompt }],
        });

        const chatResponse = completion.choices[0]?.message?.content || "No response generated.";

        // Save the chat in the database
        const chat = new Chat({
            userId: decoded.userId,
            sessionId: sessionId,
            message: contentType === 0 ? inputMessage : undefined,
            response: chatResponse,
            fileContent: contentType === 2 ? fileContent : undefined,
            fileType: contentType === 2 ? file.mimetype.split('/')[1] : undefined,
            contentType: contentType,  // Set flag to 'file' or 'message'
            chatType: ChatTypes.CHAT,
        });

        await chat.save();

        return res.status(200).json({
            message: 'Chat response generated and saved successfully.',
            data: chatResponse,
        });
    } catch (error) {
        console.error('Error while generating chat response:', error.message);
        return res.status(500).json({
            message: 'An error occurred while generating the chat response. Please try again later.',
            error: error.message,
        });
    }
};


exports.getChats = async (req, res, next) => {
    try {
        // Retrieve the token from the Authorization header
        const token = req.headers.authorization?.split(" ")[1]; // Format: "Bearer <token>"

        if (!token) {
            return res.status(401).json({ message: 'Authorization token is required.' });
        }

        // Verify the token and extract the userId
        let decoded;
        try {
            decoded = verifyToken(token); // Verify the token using the verifyToken function
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }

        // Get optional filters from query params (e.g., sessionId or limit)
        const {  limit = 10, skip = 0 } = req.query; // Default to 10 chats, skip 0

        // Build query object
        let query = { userId: decoded.userId, sessionId: sessionId }; // Filter chats by userId

        // Fetch chats from the database (with pagination)
        const chats = await Chat.find(query)
            .skip(parseInt(skip)) // Skip the first 'skip' number of results
            .limit(parseInt(limit)) // Limit the number of results
            .sort({ createdAt: -1 }); // Sort by creation time, descending (latest first)
         // Map the numeric values to appropriate strings for contentType and chatType
         const formattedChats = chats.map(chat => {
            const formattedChat = {
                ...chat.toObject(), // Convert mongoose document to plain object
                contentType: chat.contentType === 0 ? 'MESSAGE' : chat.contentType === 1 ? 'VOICE' : 'FILE',
                chatType: chat.chatType === 0 ? 'CHAT' : chat.chatType === 1 ? 'VOICE' : 'OTHER',
            };

            return formattedChat;
        });

        // Respond with the chat data
        return res.status(200).json({
            message: 'Chats fetched successfully.',
            data: formattedChats,
        });
    } catch (error) {
        console.error('Error while fetching chats:', error.message);
        return res.status(500).json({
            message: 'An error occurred while fetching chats. Please try again later.',
            error: error.message,
        });
    }
};

exports.generateTTS = async (req, res, next) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      try {
        // Request for text-to-speech conversion
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
          });
        // Define the path for the audio file
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);
    
        // Send back the path to the audio file
        console.log(speechFile , " speechFile");
        res.json({ message: "Audio generated successfully", filePath: speechFile });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate audio" });
      }

}
exports.generateSTT = async (req, res, next) => {
    try {
      // Ensure the file is uploaded correctly
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      // Path to the uploaded file (in case you're using multer's diskStorage)
      const filePath = req.file.path;
      console.log(filePath , "filePath");
  
      // Request for speech-to-text conversion
      const translation = await openai.audio.translations.create({
        file: fs.createReadStream(filePath), // Using the file from multer's temporary folder
        model: "whisper-1",
      });
  
      // Send back the generated text
      res.json({ message: 'Text generated successfully', text: translation.text });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate text' });
    }
  };

exports.generateVoiceChat = async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required.' });
    }

    let decoded;
    try {
        decoded = verifyToken(token);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    const audioFile = req.file; // Uploaded MP3 file
    const sessionId = sessionId;
    if (!sessionId || !audioFile) {
        return res.status(400).json({ error: "Session ID and audio file are required" });
    }
    try {
        // Step 1: Save the uploaded file to the 'audio' folder
        const sttResponse = await openai.audio.translations.create({
            file: fs.createReadStream(audioFile.path), // Use the uploaded MP3 file path
            model: "whisper-1",
        });
        const transcribedText = sttResponse.text;

        // Step 2: Add user message to session
        if (!sessions[sessionId]) {
            sessions[sessionId] = { messages: [] };
        }
        sessions[sessionId].messages.push({ role: 'user', content: transcribedText });


        // Step 3: Send transcribed text to GPT for a response
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: sessions[sessionId].messages,
        });
        const gptReplyText = gptResponse.choices[0].message.content;
        // Step 4: Add GPT response to session
        sessions[sessionId].messages.push({ role: 'assistant', content: gptReplyText });

        // Step 5: Convert GPT response to voice note (TTS)
        const ttsResponse = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: gptReplyText,
        });

        fs.unlinkSync(audioFile.path); // Remove the temporary file


        // Save the audio file
        const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
        const ttsFilePath = path.join('src/audio', `${sessionId}_${Date.now()}.mp3`);
        await fs.promises.writeFile(ttsFilePath, ttsBuffer);

          // Save the chat in the database

          const chat = new Chat({
            userId: decoded.userId,
            sessionId: sessionId,
            message:  transcribedText,
            response: gptReplyText,
            contentType: ContentTypes.VOICE,  // Set flag to 'file' or 'message'
            chatType: ChatTypes.VOICE,
        });

        await chat.save();


        res.json({
            message: "Voice chat generated successfully",
            transcribedText,
            gptReplyText,
            ttsFilePath: ttsFilePath,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate voice chat", details: error.message });
    }
};

exports.imageGeneration = async (req, res) => {
  try {
    // Call OpenAI's image generation API
    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: "a bucket of red roses",
        n: 1,
        size: "1024x1024",
    });

    // Extract the image URL from the response
    const imageUrl = response.data[0].url;

    // Return the image URL in the response
    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    console.error("Error generating image:", error.message);

    // Return an error response
    res.status(500).json({
      success: false,
      error: "Failed to generate image. Please try again later.",
    });
  }
};
