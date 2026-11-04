import { GoogleGenAI } from "@google/genai";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  // 1. Handle HTTP Method
  if (req.method !== "POST") {
    return json({ feedback: "Method Not Allowed" }, 405);
  }

  try {
    // 2. Parse Incoming Request Data
    const body = await req.json().catch(() => ({}));
    const { sentence, prompt, type } = body;

    if (!sentence) {
      return json({ feedback: "No sentence provided.", correct: false }, 400);
    }

    // 3. Initialize Gemini Client (credentials injected by Netlify AI Gateway)
    const ai = new GoogleGenAI({});

    // 4. Construct System Instruction Prompt
    const systemPrompt = `You are an expert English language tutor evaluating a student's answer.
Task Type: ${type || "comparative"}
Prompt given to student: "${prompt || "Compare two things"}"
Student's input: "${sentence}"

Analyze the student's grammar, vocabulary, and relevance.
Return ONLY a valid JSON object matching this exact structure:
{
  "correct": true or false,
  "feedback": "Detailed explanation and guidance for the student."
}`;

    // 5. Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse(response.text);

    // 6. Return Response to Frontend
    return json({
      correct: parsedData.correct ?? true,
      feedback: parsedData.feedback || "Good job practicing!",
    });
  } catch (error) {
    console.error("Function Error:", error);
    return json(
      { correct: false, feedback: `AI Grader Error: ${error.message}` },
      500
    );
  }
};
