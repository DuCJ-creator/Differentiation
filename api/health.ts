import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getGeminiClient, getOpenAIClient } from "../lib/ai.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: "ok",
    geminiConfigured: !!getGeminiClient(),
    openaiConfigured: !!getOpenAIClient(),
  });
}
