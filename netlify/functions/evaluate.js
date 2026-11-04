import { GoogleGenAI } from "@google/genai";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ feedback: "Method Not Allowed", correct: false }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const sentence = String(body.sentence || "").trim();
    const prompt = String(body.prompt || "").trim();
    const type = String(body.type || "comparative").trim();

    if (!sentence) {
      return {
        statusCode: 400,
        body: JSON.stringify({ feedback: "Please provide a sentence.", correct: false }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ feedback: "Server error: GEMINI_API_KEY is not configured.", correct: false }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert English tutor for B1 level Arabic-speaking students.
Task Type: ${type}
Prompt: "${prompt}"
Student Sentence: "${sentence}"

Evaluate grammar accuracy. Return feedback in two parts:
1. Detailed English explanation/correction.
2. A clear Arabic explanation starting with "الشرح بالعربي:".

Return ONLY a valid JSON object matching this exact structure:
{
  "correct": true or false,
  "feedback": "English explanation here.\n\nالشرح بالعربي: Arabic explanation here."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correct: Boolean(data.correct),
        feedback: String(data.feedback || "Good job!")
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correct: false,
        feedback: "Evaluation error. Please try again."
      }),
    };
  }
}
