import { GoogleGenAI } from '@google/genai';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { sentence, prompt, type } = JSON.parse(event.body || '{}');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correct: false,
          feedback: 'Error: GEMINI_API_KEY environment variable is not set in Netlify.',
          score: 0
        })
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = type === 'roleplay'
      ? `You are a helpful ESL practice partner. Respond to the user's roleplay input: "${sentence}". Context: ${prompt || 'General conversation'}. Return ONLY a JSON object: {"correct": true, "feedback": "Your reply", "score": 100}`
      : `You are an expert ESL teacher. Evaluate this sentence: "${sentence}". Prompt context: ${prompt || 'General'}. Return ONLY a JSON object with keys: "correct" (boolean), "feedback" (string explaining errors or giving encouragement), "score" (number 0-100), and "corrected" (string with corrected sentence if needed). No markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
    });

    let rawText = response.text || '{}';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (e) {
      result = {
        correct: true,
        feedback: rawText,
        score: 100
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correct: result.correct ?? true,
        feedback: result.feedback || rawText,
        score: result.score || 100,
        corrected: result.corrected || sentence
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correct: false,
        feedback: `API Error: ${err.message}`,
        score: 0
      })
    };
  }
}
