import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGeminiClient, getOpenAIClient, buildGradingPrompt, localGrader } from "../../lib/ai.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { studentAnswer1, studentAnswer2, target1, target2, level, prompt } = req.body || {};

  if (studentAnswer1 === undefined || studentAnswer2 === undefined) {
    return res.status(400).json({ error: "Missing student answers." });
  }

  const gemini = getGeminiClient();
  const openai = getOpenAIClient();
  const gradingPrompt = buildGradingPrompt({ studentAnswer1, studentAnswer2, target1, target2, level, prompt });

  try {
    if (gemini) {
      console.log("Calling Gemini API for translation grading...");
      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Grade this student translation submission.",
        config: {
          systemInstruction: gradingPrompt,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text;
      if (!responseText) throw new Error("No response text from Gemini.");
      return res.json(JSON.parse(responseText.trim()));
    } else if (openai) {
      console.log("Calling OpenAI API for translation grading...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: gradingPrompt },
          { role: "user", content: "Grade this student translation submission." },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty grader result.");
      return res.json(JSON.parse(content.trim()));
    } else {
      const graded = localGrader(studentAnswer1, studentAnswer2, target1, target2, level);
      return res.json(graded);
    }
  } catch (error: any) {
    console.error("AI Grading Error:", error);
    const graded = localGrader(studentAnswer1, studentAnswer2, target1, target2, level);
    return res.json({
      ...graded,
      offlineNotes: "Returned offline grading evaluation due to connection error.",
    });
  }
}
