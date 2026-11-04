import { GoogleGenAI } from '@google/genai';

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { sentence, prompt, type } = JSON.parse(event.body);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const systemPrompt = type === 'roleplay'
            ? `You are a cinema ticket seller. Evaluate this student's polite request: "${sentence}". Reply in-character and give brief grammar feedback if needed. Return JSON with keys "correct" (boolean) and "feedback" (string).`
            : `You are an expert ESL teacher. Evaluate this student sentence: "${sentence}" for the prompt: "${prompt}". Check comparative grammar (-er than / more... than). Return JSON with keys "correct" (boolean) and "feedback" (string).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemPrompt,
        });

        let rawText = response.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            result = {
                correct: true,
                feedback: rawText
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correct: result.correct ?? true,
                feedback: result.feedback || rawText
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}
