const mongoose = require("mongoose");
// Enum Object for chatType
const ChatTypes = {
  CHAT: 0,
  VOICE: 1,
};
const ContentTypes = {
  MESSAGE: 0,
  VOICE: 1,
  FILE: 2,
  
};


const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String },
  message: { type: String, required: false },
  response: { type: String, required: true },
  fileContent: { type: Buffer, required: false }, // Store file content (like PDF text extraction or image metadata)
  fileType: { type: String, required: false }, // e.g., 'pdf', 'image', etc.
  contentType: { type: Number, enum: Object.values(ContentTypes), required: true }, // Flag to distinguish message vs. file, changed to Number
  createdAt: { type: Date, default: Date.now },
  chatType: { type: Number, enum: Object.values(ChatTypes), required: true }, // Use enum values (0 for chat, 1 for voice)
});

const Chat = mongoose.model("Chat", chatSchema);
module.exports = { Chat, ChatTypes, ContentTypes };
