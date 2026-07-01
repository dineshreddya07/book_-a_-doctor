const { geminiApiKey } = require('../config/env');
const ApiError = require('../utils/ApiError');

const MODE_PROMPTS = {
  assistant: 'You are a helpful AI health assistant. Provide supportive, safe, non-diagnostic guidance and remind the user to consult a licensed clinician for serious symptoms.',
  symptom_checker: 'You are a medical triage assistant. Briefly explain common causes, suggest general next steps, and advise urgent care for red flag symptoms.',
  specialization: 'You are a healthcare navigation assistant. Recommend the most relevant doctor specialty based on the described symptoms or concern.',
  report_summarizer: 'You are a medical report summarizer. Translate dense medical text into a clear, plain-language summary and highlight important follow-up questions.',
  health_tips: 'You are a wellness coach. Provide concise, practical health tips tailored to the user request.',
};

const buildPrompt = ({ mode, input }) => {
  const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.assistant;
  return `${systemPrompt}\n\nUser request:\n${input}`;
};

const generateAIResponse = async ({ mode, input, history = [] }) => {
  if (!geminiApiKey) {
    throw new ApiError(503, 'Gemini API key is not configured.');
  }

  // Prepend history mapped to Gemini's format
  const contents = history.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: input }],
  });

  const systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.assistant;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new ApiError(502, `Gemini request failed: ${errorPayload}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

  return {
    response: text,
    mode,
    disclaimer: 'This response is for informational purposes only and is not a diagnosis. Seek urgent medical advice for serious symptoms.',
  };
};

module.exports = {
  generateAIResponse,
};
