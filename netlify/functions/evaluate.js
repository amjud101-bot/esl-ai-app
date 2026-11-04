import { GoogleGenAI } from "@google/genai";

// Route requests through Netlify AI Gateway. The gateway credentials are
// injected automatically by Netlify, so no personal API key is needed (and a
// malformed GEMINI_API_KEY set on the site can no longer break requests).
const ai = new GoogleGenAI({
  apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
  httpOptions: { baseUrl: process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/, "") },
});

const json = (status, data) => Response.json(data, { status });

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { feedback: "Method Not Allowed", correct: false });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { feedback: "Invalid request body.", correct: false });
  }

  const sentence = String(body.sentence || "").trim();
  const prompt = String(body.prompt || "Compare two things").trim();
  const type = String(body.type || "comparative").trim();

  if (!sentence) {
    return json(400, { feedback: "Please provide a sentence to check.", correct: false });
  }

  const task =
    type === "roleplay"
      ? `Role-play as a friendly ticket seller. The student is practising this situation: "${prompt}". Reply in character in 1-3 short sentences, and gently point out any grammar mistakes in the student's request.`
      : `The student is practising comparatives (-er than / more ... than). Prompt: "${prompt}". Check whether the student's sentence correctly compares the two things using a comparative form, and give short, encouraging grammar feedback (2-4 sentences). If it is wrong, show a corrected example.`;

  const instructions = `You are an expert, encouraging English (ESL) tutor.
${task}

Student sentence: "${sentence}"

Return ONLY a JSON object with exactly these keys:
{"correct": true or false, "feedback": "your feedback here"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: instructions,
      config: { responseMimeType: "application/json" },
    });

    const data = JSON.parse(response.text);

    return json(200, {
      correct: Boolean(data.correct),
      feedback: String(data.feedback || "Good effort!"),
    });
  } catch (error) {
    console.error("Evaluation failed:", error);
    return json(500, {
      correct: false,
      feedback: "The AI grader is temporarily unavailable. Please try again in a moment.",
    });
  }
};
