const mongoose = require('mongoose');

// Message schema
const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin', 'system'], // Added 'system' for system messages
    required: true,
  },
  content: {
    type: String,
    required: true, // Message content or image URL
  },
  type: {
    type: String,
    enum: ['text', 'image'], // Type of message
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Auto timestamp
  },
});

// Chat schema
const ChatSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, // Associated user
  },
  messages: [MessageSchema], // Array of messages
  chatType: {
    type: String,
    enum: ['individual', 'group'], // Added for group chat support
    default: 'individual',
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // For group chats, list of participants
  }],
  isDeleted: {
    type: Boolean,
    default: false, // Optional field for soft delete
  },
});

// Indexing for performance
ChatSchema.index({ userId: 1 });

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;
