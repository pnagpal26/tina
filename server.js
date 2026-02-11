require('dotenv').config();
const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('TINA is running');
});

app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say('Thanks for calling. This service is under construction.');

  res.type('text/xml');
  res.send(twiml.toString());
});

app.listen(PORT, () => {
  console.log(`TINA server listening on port ${PORT}`);
});
