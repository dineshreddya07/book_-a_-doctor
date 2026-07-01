const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const AIChat = require('../models/AIChat');
const { generateAIResponse } = require('../services/aiService');

// Ask AI assistant, keeping track of history
const askAssistant = asyncHandler(async (req, res) => {
  const { mode = 'assistant', input } = req.body;

  if (!input || !input.trim()) {
    throw new ApiError(400, 'Input is required');
  }

  // Find or create the latest AI chat session for this user
  let chat = await AIChat.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
  if (!chat) {
    chat = await AIChat.create({ user: req.user._id, messages: [] });
  }

  // Generate response passing existing message history
  const result = await generateAIResponse({
    mode,
    input,
    history: chat.messages,
  });

  // Append user query and AI response to history
  chat.messages.push({ role: 'user', content: input });
  chat.messages.push({ role: 'model', content: result.response });
  await chat.save();

  res.status(200).json(new ApiResponse(200, 'AI response generated', result));
});

// Fetch current conversation history
const getAiHistory = asyncHandler(async (req, res) => {
  let chat = await AIChat.findOne({ user: req.user._id }).sort({ updatedAt: -1 });
  if (!chat) {
    chat = await AIChat.create({ user: req.user._id, messages: [] });
  }
  res.status(200).json(new ApiResponse(200, 'AI history retrieved', chat.messages));
});

// Clear conversation history
const clearAiHistory = asyncHandler(async (req, res) => {
  await AIChat.deleteMany({ user: req.user._id });
  res.status(200).json(new ApiResponse(200, 'AI history cleared', null));
});

module.exports = {
  askAssistant,
  getAiHistory,
  clearAiHistory,
};
