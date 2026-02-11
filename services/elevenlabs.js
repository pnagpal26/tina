const ElevenLabs = require('elevenlabs');

const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Rachel voice - professional and clear
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

async function textToSpeech(text) {
  try {
    const audio = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    // Return audio stream/buffer
    return audio;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw error;
  }
}

module.exports = { textToSpeech };
