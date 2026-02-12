const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are TINA, an AI assistant for a rental property company. You help callers inquire about rental listings, schedule viewings, and answer questions about properties.

CRITICAL: Keep ALL responses to 1-2 sentences maximum. You're speaking on the phone - be brief and conversational.

When callers ask about properties, gather information about:
- What type of property they're looking for (apartment, house, etc.)
- Number of bedrooms/bathrooms
- Budget range
- Desired move-in date
- Location preferences

If they mention a specific property, acknowledge it and ask how you can help.`;

async function getClaudeResponse(conversationHistory) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

module.exports = { getClaudeResponse };
