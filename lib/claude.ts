import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

export interface ClaudeRecommendationInput {
  userPreferences: any;
  candidates: any[];
}

export async function getClaudeRecommendations(input: ClaudeRecommendationInput) {
  if (!process.env.CLAUDE_API_KEY) {
    console.warn("CLAUDE_API_KEY is not set. Returning dummy explanations.");
    // Fallback for development without API key
    return input.candidates.slice(0, 5).map((candidate, index) => ({
      vehicleId: candidate.id,
      rank: index + 1,
      explanation: `This is a great match because it perfectly balances your budget and preferences. As a ${candidate.brand} ${candidate.model}, it offers excellent value for the Nepali market.`
    }));
  }

  const prompt = `
You are an expert vehicle showroom advisor for the Nepali market.
A customer has provided their preferences:
${JSON.stringify(input.userPreferences, null, 2)}

Here are the top candidates that match their budget and hard constraints:
${JSON.stringify(input.candidates, null, 2)}

Please rank the top 5 vehicles for this specific customer. 
For each vehicle, provide a 2-3 sentence explanation of why it's a good fit, specifically mentioning how it relates to their stated preferences, budget, and the Nepal context (e.g., ground clearance for Nepali roads, fuel efficiency, tax advantages for EVs).

Return the response strictly in this JSON format:
{
  "recommendations": [
    {
      "vehicleId": "uuid-here",
      "rank": 1,
      "explanation": "Your explanation here..."
    }
  ]
}
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: "You are a specialized AI designed to output strictly valid JSON without any markdown formatting or introductory text.",
      messages: [{ role: 'user', content: prompt }],
    });
    
    // @ts-ignore
    const resultText = response.content[0].text;
    const result = JSON.parse(resultText);
    return result.recommendations;
  } catch (error) {
    console.error("Error communicating with Claude:", error);
    return [];
  }
}
