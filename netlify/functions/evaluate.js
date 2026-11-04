import { GoogleGenAI } from "@google/genai";

export async function handler(event, context) {
  // 1. Handle HTTP Method
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ feedback: "Method Not Allowed" }),
    };
  }

  try {
    // 2. Parse Incoming Request Data
    const body = JSON.parse(event.body || "{}");
    const { sentence, prompt, type } = body;

    if (!sentence) {
      return {
        statusCode: 400,
        body: JSON.stringify({ feedback: "No sentence provided.", correct: false }),
      };
    }

    // 3. Initialize Gemini Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ feedback: "Server configuration error: GEMINI_API_KEY is missing in Netlify settings.", correct: false }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // 4. Construct System Instruction Prompt
    const systemPrompt = `You are an expert English language tutor evaluating a student's answer.
Task Type: ${type || 'comparative'}
Prompt given to student: "${prompt || 'Compare two things'}"
Student's input: "${sentence}"

Analyze the student's grammar, vocabulary, and relevance.
Return ONLY a valid JSON object matching this exact structure:
{
  "correct": true or false,
  "feedback": "Detailed explanation and guidance for the student."
}`;

    // 5. Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    const parsedData = JSON.parse(responseText);

    // 6. Return Response to Frontend
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correct: parsedData.correct ?? true,
        feedback: parsedData.feedback || "Good job practicing!"
      }),
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correct: false,
        feedback: `AI Grader Error: ${error.message}`
      }),
    };
  }
}
