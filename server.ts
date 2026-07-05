import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import mammoth from "mammoth";
import dotenv from "dotenv";
import {
  getGeminiClient,
  getOpenAIClient,
  buildLessonSystemPrompt,
  buildGradingPrompt,
  createSimulatedLesson,
  localGrader,
} from "./lib/ai.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// NOTE: this file is for LOCAL DEVELOPMENT ONLY.
// On Vercel, the routes below are served instead by the standalone
// serverless functions in /api/health.ts and /api/lesson/*.ts, which
// import the exact same logic from lib/ai.ts. Vercel never executes
// this file in production.

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!getGeminiClient(),
    openaiConfigured: !!getOpenAIClient(),
  });
});

app.post("/api/lesson/generate", async (req, res) => {
  const { topic, materialText, fileData } = req.body;

  if (
    (!topic || typeof topic !== "string" || topic.trim() === "") &&
    (!materialText || typeof materialText !== "string" || materialText.trim() === "") &&
    !fileData
  ) {
    return res.status(400).json({ error: "Please provide a valid topic, uploaded materials, or a file." });
  }

  let finalMaterialText = materialText || "";
  let geminiFilePart: any = null;

  if (fileData && fileData.base64 && fileData.mimeType) {
    const { mimeType, base64 } = fileData;
    if (mimeType.includes("wordprocessingml") || mimeType.includes("docx") || (fileData.name && fileData.name.endsWith(".docx"))) {
      try {
        const buffer = Buffer.from(base64, "base64");
        const docxResult = await mammoth.extractRawText({ buffer });
        finalMaterialText = docxResult.value;
      } catch (docxErr: any) {
        console.error("Error extracting text from docx with mammoth:", docxErr);
      }
    } else if (mimeType.includes("msword") || mimeType.includes("doc") || (fileData.name && fileData.name.endsWith(".doc"))) {
      try {
        const buffer = Buffer.from(base64, "base64");
        const matchUtf8 = buffer.toString("utf-8").match(/[\u4e00-\u9fa5\w\s-]{4,}/g);
        finalMaterialText = matchUtf8 ? matchUtf8.join(" ") : "";
      } catch (docErr: any) {
        console.error("Error extracting text from doc:", docErr);
      }
    } else if (mimeType.includes("pdf") || mimeType.startsWith("image/")) {
      geminiFilePart = { inlineData: { data: base64, mimeType } };
    }
  }

  const hasMaterial = !!(finalMaterialText && finalMaterialText.trim() !== "") || !!geminiFilePart;
  const cleanTopic = topic ? topic.trim().substring(0, 120) : "Custom Reading Analysis";
  const cleanMaterial = finalMaterialText ? finalMaterialText.trim().substring(0, 3000) : "";

  const gemini = getGeminiClient();
  const openai = getOpenAIClient();
  const systemPrompt = buildLessonSystemPrompt(cleanTopic, hasMaterial);

  try {
    if (gemini) {
      const contentsList: any[] = [];
      if (geminiFilePart) contentsList.push(geminiFilePart);

      const promptText = cleanMaterial
        ? `Create a comprehensive differentiated English lesson based on this uploaded material: "${cleanMaterial}"`
        : geminiFilePart
        ? `Create a comprehensive differentiated English lesson based on this uploaded source file.`
        : `Create a comprehensive differentiated English lesson on the topic: "${cleanTopic}"`;

      contentsList.push({ text: promptText });

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsList,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text;
      if (!responseText) throw new Error("No response content from Gemini.");

      const parsed = JSON.parse(responseText.trim());
      const finalLesson = {
        ...parsed,
        id: `custom-${Date.now()}`,
        topic: parsed.topic || (fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic),
        createdAt: new Date().toLocaleDateString(),
      };
      return res.json(finalLesson);
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: cleanMaterial
              ? `Create a comprehensive differentiated English lesson based on this uploaded material: "${cleanMaterial}"`
              : `Create a comprehensive differentiated English lesson on the topic: "${cleanTopic}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("Empty content back from OpenAI.");

      const parsed = JSON.parse(content.trim());
      const finalLesson = {
        ...parsed,
        id: `custom-${Date.now()}`,
        topic: parsed.topic || (fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic),
        createdAt: new Date().toLocaleDateString(),
      };
      return res.json(finalLesson);
    } else {
      const simulatedLesson = createSimulatedLesson(fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic);
      return res.json(simulatedLesson);
    }
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({
      error: "Failed to generate dynamic lesson. Fallback to server local rendering.",
      message: error.message,
      fallback: createSimulatedLesson(fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic),
    });
  }
});

app.post("/api/lesson/grade-translation", async (req, res) => {
  const { studentAnswer1, studentAnswer2, target1, target2, level, prompt } = req.body;

  if (studentAnswer1 === undefined || studentAnswer2 === undefined) {
    return res.status(400).json({ error: "Missing student answers." });
  }

  const gemini = getGeminiClient();
  const openai = getOpenAIClient();
  const gradingPrompt = buildGradingPrompt({ studentAnswer1, studentAnswer2, target1, target2, level, prompt });

  try {
    if (gemini) {
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
});

// Serve Vite SPA in development, build/dist static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server actively listening on http://localhost:${PORT} [ENV: ${process.env.NODE_ENV || "development"}]`);
  });
}

startServer();
