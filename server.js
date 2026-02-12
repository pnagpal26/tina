// TINA - AI Phone Answering Service for Rental Properties
require('dotenv').config();
const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
// const { transcribeAudio } = require('./services/deepgram'); // TODO: Add Deepgram later
const { getClaudeResponse } = require('./services/claude');
// const { textToSpeech } = require('./services/elevenlabs'); // TODO: Add ElevenLabs later

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

// Store conversation sessions in memory (use Redis/Supabase for production)
const conversations = new Map();

app.get('/', (req, res) => {
  res.send('TINA is running');
});

app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  // Initial greeting with recording consent
  twiml.say({
    voice: 'Polly.Joanna'
  }, 'Hi, thanks for calling about our rental listings. This call may be recorded for quality purposes. Which property are you calling about?');

  // Use Gather for synchronous speech recognition
  const gather = twiml.gather({
    input: 'speech',
    action: '/voice/process',
    method: 'POST',
    speechTimeout: 3,
    timeout: 5,
    language: 'en-US',
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

app.post('/voice/process', async (req, res) => {
  const { CallSid, SpeechResult } = req.body;
  const twiml = new VoiceResponse();

  // LOG EVERYTHING for debugging
  console.log(`[${CallSid}] Process callback received:`, {
    SpeechResult,
    fullBody: req.body
  });

  try {
    // Get or create conversation history
    if (!conversations.has(CallSid)) {
      conversations.set(CallSid, []);
    }
    const conversationHistory = conversations.get(CallSid);

    let aiResponse;

    // Check if speech was detected
    if (!SpeechResult || SpeechResult.trim() === '') {
      console.log(`[${CallSid}] No speech detected, prompting to repeat`);
      aiResponse = "Sorry, I didn't catch that. Could you please repeat?";
    } else {
      console.log(`[${CallSid}] User said: ${SpeechResult}`);

      // Add user message to conversation history
      conversationHistory.push({
        role: 'user',
        content: SpeechResult,
      });

      // Get Claude's response
      aiResponse = await getClaudeResponse(conversationHistory);
      console.log(`[${CallSid}] TINA says: ${aiResponse}`);

      // Add AI response to history
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });
    }

    // Speak the response
    twiml.say({
      voice: 'Polly.Joanna'
    }, aiResponse);

    // Continue the conversation with Gather
    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/process',
      method: 'POST',
      speechTimeout: 3,
      timeout: 5,
      language: 'en-US',
    });

  } catch (error) {
    console.error('Error processing call:', error);
    twiml.say('Sorry, I encountered an error. Please try again later.');
    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => {
  console.log(`TINA server listening on port ${PORT}`);
});
