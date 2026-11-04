import { GoogleGenAI } from '@google/genai';

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { text } = JSON.parse(event.body);
        
        // Initialize Gemini with the server-side environment variable
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this English sentence written by an ESL student. Provide friendly corrections, point out any grammar errors, and give a brief explanation. Sentence: "${text}"`,
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: response.text })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
