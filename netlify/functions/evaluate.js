import { GoogleGenAI } from "@google/genai";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") {
    return json({ feedback: "Method Not Allowed", correct: false }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sentence = String(body.sentence || "").trim();
    const prompt = String(body.prompt || "Compare two things").trim();
    const type = String(body.type || "comparative").trim();

    if (!sentence) {
      return json({ feedback: "Please provide a sentence to check.", correct: false }, 400);
    }

    const ai = new GoogleGenAI({});

    // Plain ASCII system instructions to prevent ByteString encoding errors
    const systemPrompt = `You are an expert English tutor. Evaluate the student sentence based on the prompt.
Task: ${type}
Prompt: ${prompt}
Student Sentence: ${sentence}

Return a strict JSON object with these exact keys:
{"correct": true or false, "feedback": "your detailed grammar feedback here"}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text);

    return json({
      correct: Boolean(data.correct),
      feedback: String(data.feedback || "Good effort!"),
    });
  } catch (error) {
    console.error("Evaluation failed:", error);
    return json({ correct: false, feedback: "Evaluation error. Please try again." }, 500);
  }
};
