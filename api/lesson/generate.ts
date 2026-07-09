import type { VercelRequest, VercelResponse } from "@vercel/node";
import mammoth from "mammoth";
import { getGeminiClient, getOpenAIClient, buildLessonSystemPrompt, createSimulatedLesson, extractPdfText } from "../../lib/ai.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // EVERYTHING is wrapped in this single try/catch now. Any crash --
  // whether from file parsing (docx/pdf) or the AI call itself -- will be
  // caught here and returned as readable JSON, never as an opaque 500.
  try {
    const { topic, materialText, fileData } = req.body || {};

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
          console.log(`Successfully extracted ${finalMaterialText.length} characters from docx!`);
        } catch (docxErr: any) {
          console.error("Error extracting text from docx with mammoth:", docxErr);
        }
      } else if (mimeType.includes("msword") || mimeType.includes("doc") || (fileData.name && fileData.name.endsWith(".doc"))) {
        try {
          const buffer = Buffer.from(base64, "base64");
          const matchUtf8 = buffer.toString("utf-8").match(/[\u4e00-\u9fa5\w\s-]{4,}/g);
          finalMaterialText = matchUtf8 ? matchUtf8.join(" ") : "";
          console.log(`Successfully extracted ${finalMaterialText.length} characters from doc binary fallback!`);
        } catch (docErr: any) {
          console.error("Error extracting text from doc:", docErr);
        }
      } else if (mimeType.includes("pdf")) {
        const buffer = Buffer.from(base64, "base64");
        try {
          finalMaterialText = await extractPdfText(buffer);
          console.log(`Successfully extracted ${finalMaterialText.length} characters from PDF!`);
        } catch (pdfErr: any) {
          // PDF extraction failed -- log it clearly and continue with
          // whatever material text we have (possibly empty), rather than
          // crashing the whole request. The topic/simulated fallback will
          // still work even if PDF parsing is broken.
          console.error("PDF extraction failed:", pdfErr);
          finalMaterialText = finalMaterialText || "";
        }
        geminiFilePart = { inlineData: { data: base64, mimeType } };
      } else if (mimeType.startsWith("image/")) {
        geminiFilePart = { inlineData: { data: base64, mimeType } };
      }
    }

    const hasMaterial = !!(finalMaterialText && finalMaterialText.trim() !== "") || !!geminiFilePart;
    const cleanTopic = topic ? topic.trim().substring(0, 120) : "Custom Reading Analysis";
    const cleanMaterial = finalMaterialText ? finalMaterialText.trim().substring(0, 8000) : "";
    console.log(`Generating lesson. Topic: "${cleanTopic}", HasMaterial: ${hasMaterial}, HasDirectFile: ${!!geminiFilePart}, MaterialChars: ${cleanMaterial.length}`);

    const gemini = getGeminiClient();
    const openai = getOpenAIClient();
    const systemPrompt = buildLessonSystemPrompt(cleanTopic, hasMaterial);

    if (gemini) {
      console.log("Calling Gemini API for lesson generation...");
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

      console.log("Gemini succeeded! Parsing output JSON...");
      const parsed = JSON.parse(responseText.trim());
      const finalLesson = {
        ...parsed,
        id: `custom-${Date.now()}`,
        topic: parsed.topic || (fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic),
        createdAt: new Date().toLocaleDateString(),
      };
      return res.json(finalLesson);
    } else if (openai) {
      console.log("Calling OpenAI API for lesson generation...");

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

      console.log("OpenAI succeeded! Parsing...");
      const parsed = JSON.parse(content.trim());
      const finalLesson = {
        ...parsed,
        id: `custom-${Date.now()}`,
        topic: parsed.topic || (fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic),
        createdAt: new Date().toLocaleDateString(),
      };
      return res.json(finalLesson);
    } else {
      console.log("No AI key configured. Creating a beautiful local simulation of the lesson...");
      const simulatedLesson = createSimulatedLesson(fileData?.name ? fileData.name.replace(/\.[^/.]+$/, "") : cleanTopic);
      return res.json(simulatedLesson);
    }
  } catch (error: any) {
    // ANY uncaught error anywhere above lands here, including module-load
    // crashes, and gets returned as visible JSON instead of an opaque 500.
    console.error("AI Generation Error:", error);
    return res.status(500).json({
      error: "Failed to generate dynamic lesson.",
      message: error?.message || String(error),
      stack: error?.stack || null,
    });
  }
}
