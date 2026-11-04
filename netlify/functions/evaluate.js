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
    const prompt = String(body.prompt || "Compare two things").trim();
    const type = String(body.type || "comparative").trim();

    if (!sentence) {
      return {
        statusCode: 400,
        body: JSON.stringify({ feedback: "Please provide a sentence to check.", correct: false }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ feedback: "Server error: GEMINI_API_KEY is not set.", correct: false }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Plain ASCII system instructions to prevent ByteString encoding errors
    const systemPrompt = `You are an expert English tutor. Evaluate the student sentence based on the prompt.
Task: ${type}
Prompt: ${prompt}
Student Sentence: ${sentence}

Return a strict JSON object with these exact keys:
{"correct": true or false, "feedback": "your detailed grammar feedback here"}`;

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
        feedback: String(data.feedback || "Good effort!")
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
