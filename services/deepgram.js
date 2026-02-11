const { createClient } = require('@deepgram/sdk');

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

async function transcribeAudio(audioUrl) {
  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: audioUrl },
      {
        model: 'nova-2',
        smart_format: true,
      }
    );

    if (error) throw error;

    const transcript = result.results.channels[0].alternatives[0].transcript;
    return transcript;
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    throw error;
  }
}

module.exports = { transcribeAudio };
