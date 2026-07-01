const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'model', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AIChat = mongoose.model('AIChat', aiChatSchema);

module.exports = AIChat;
