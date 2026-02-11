require('dotenv').config();
const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { transcribeAudio } = require('./services/deepgram');
const { getClaudeResponse } = require('./services/claude');
const { textToSpeech } = require('./services/elevenlabs');

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

  // Record the caller's response
  twiml.record({
    action: '/voice/process',
    method: 'POST',
    maxLength: 30,
    playBeep: false,
    transcribe: false,
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

app.post('/voice/process', async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;
  const twiml = new VoiceResponse();

  try {
    // Get or create conversation history
    if (!conversations.has(CallSid)) {
      conversations.set(CallSid, []);
    }
    const conversationHistory = conversations.get(CallSid);

    // Step 1: Transcribe the recording with Deepgram
    const transcript = await transcribeAudio(RecordingUrl);
    console.log(`[${CallSid}] User said: ${transcript}`);

    // Step 2: Add to conversation history
    conversationHistory.push({
      role: 'user',
      content: transcript,
    });

    // Step 3: Get Claude's response
    const aiResponse = await getClaudeResponse(conversationHistory);
    console.log(`[${CallSid}] TINA says: ${aiResponse}`);

    // Step 4: Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
    });

    // Step 5: Speak the response (using Twilio's TTS for now, can switch to ElevenLabs)
    twiml.say({
      voice: 'Polly.Joanna'
    }, aiResponse);

    // Step 6: Continue the conversation
    twiml.record({
      action: '/voice/process',
      method: 'POST',
      maxLength: 30,
      playBeep: false,
      transcribe: false,
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
