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

  // Record the caller's response with Twilio transcription
  twiml.record({
    action: '/voice/process',
    method: 'POST',
    maxLength: 30,
    playBeep: false,
    transcribe: true,
    transcribeCallback: '/voice/transcription',
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle transcription callback from Twilio
app.post('/voice/transcription', async (req, res) => {
  const { CallSid, TranscriptionText } = req.body;

  try {
    // Get or create conversation history
    if (!conversations.has(CallSid)) {
      conversations.set(CallSid, []);
    }
    const conversationHistory = conversations.get(CallSid);

    console.log(`[${CallSid}] User said: ${TranscriptionText}`);

    // Add user message to conversation history
    conversationHistory.push({
      role: 'user',
      content: TranscriptionText,
    });

    // Get Claude's response
    const aiResponse = await getClaudeResponse(conversationHistory);
    console.log(`[${CallSid}] TINA says: ${aiResponse}`);

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
    });

  } catch (error) {
    console.error('Error processing transcription:', error);
  }

  // Twilio expects 200 OK
  res.sendStatus(200);
});

app.post('/voice/process', async (req, res) => {
  const { CallSid } = req.body;
  const twiml = new VoiceResponse();

  try {
    // Get conversation history
    const conversationHistory = conversations.get(CallSid) || [];

    // If we have a response from Claude, speak it
    if (conversationHistory.length > 0) {
      const lastMessage = conversationHistory[conversationHistory.length - 1];
      if (lastMessage.role === 'assistant') {
        twiml.say({
          voice: 'Polly.Joanna'
        }, lastMessage.content);
      }
    }

    // Continue the conversation
    twiml.record({
      action: '/voice/process',
      method: 'POST',
      maxLength: 30,
      playBeep: false,
      transcribe: true,
      transcribeCallback: '/voice/transcription',
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
