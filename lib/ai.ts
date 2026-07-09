import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

let geminiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or left as default. Dynamic Gemini generation is disabled.");
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return geminiClient;
}

let openaiClient: OpenAI | null = null;
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "MY_OPENAI_API_KEY") {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  let parser: any = null;
  try {
    // Dynamic import: if pdf-parse/pdfjs-dist throws anything during module
    // load (a known risk in serverless environments), it happens INSIDE this
    // try/catch and gets reported back as readable JSON, instead of crashing
    // the whole function before our error handling even starts.
    const { PDFParse } = await import("pdf-parse");
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || "";
  } catch (err) {
    console.error("Error extracting text from PDF with pdf-parse:", err);
    // Re-throw with a clear, identifiable message so the API route's own
    // catch block surfaces this exact reason in its JSON response.
    throw new Error(`PDF_EXTRACTION_FAILED: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

export function buildLessonSystemPrompt(cleanTopic: string, hasMaterial: boolean): string {
  return `You are a professional, expert English teacher specialized in Differentiated Instruction for Taiwanese students preparing for the GSAT (學測).

${
  hasMaterial
    ? `You have been given REAL uploaded teaching material below. It may contain a numbered vocabulary word list, a reading article, or both.
You MUST base every part of this lesson -- vocabulary, collocations, reading passages, comprehension questions, and grammar examples -- directly and specifically on this uploaded material.
- If the material includes a numbered vocabulary list, you MUST use those exact words (or a close, representative subset of them) as your vocabulary/collocation items -- do not invent unrelated words.
- If the material includes a reading passage, article, or story, the "text" field at all three levels (beginner/intermediate/advanced) MUST be a version of THAT SAME story -- same characters, same plot, same setting -- simplified for beginner and elevated in complexity for advanced. Do NOT replace it with a different, unrelated topic or story.
- Comprehension questions (mainIdeaQuestion, mainIdeaOptions, readingDetails) must be answerable directly from the passage you wrote, which itself must reflect the uploaded material's actual content.
- Do not fall back to a generic or unrelated example topic under any circumstances when material has been provided.`
    : `No material was uploaded, so create original content on the topic: "${cleanTopic}".`
}

Generate exactly a single valid JSON object representing a LessonVersion, matching three student levels: 基礎 (Basic), 中級 (Essential), and 高級 (Advanced).

=== LANGUAGE RULES (STRICT -- FOLLOW EXACTLY) ===
Write ONLY in English (zero Chinese characters) for these fields:
- text (all three levels)
- mainIdeaQuestion, mainIdeaOptions (all three levels)
- grammarTipTitle, grammarTipContent (all three levels)
- vocabulary[].word, vocabulary[].definition, vocabulary[].example
- collocations[].phrase, collocations[].verb, collocations[].noun
- readingDetails[].question, readingDetails[].answer
- advancedGrammar[].rule, advancedGrammar[].example, advancedGrammar[].explanation
- graphicOrganizer[].label, graphicOrganizer[].description
- criticalThinkingQuestion
- translationChallenge.correctEnglish1, translationChallenge.correctEnglish2, translationChallenge.hints
- gsatWritingPrompt.sampleEssay

Write ONLY in Traditional Chinese (繁體中文) for these fields:
- vocabulary[].chinese, collocations[].chinese (these are translations of the English word/phrase next to them)
- translationChallenge.chineseSentence1, translationChallenge.chineseSentence2, translationChallenge.prompt
- gsatWritingPrompt.title, gsatWritingPrompt.promptText, gsatWritingPrompt.paragraph1Prompt, gsatWritingPrompt.paragraph2Prompt, gsatWritingPrompt.guidelines

Never mix languages within a single field (a "Chinese" field should contain zero English sentences beyond quoting an English word being translated, and an "English" field should contain zero Chinese characters).

Every field in the schema below is REQUIRED -- do not omit or leave any field empty, even if it feels repetitive with other fields.

JSON Schema:
{
  "topic": string (the topic title or name you write/derive from the input),
  "beginner": {
    "text": string (short simple story on the topic 30-50 words),
    "mainIdeaQuestion": string,
    "mainIdeaOptions": [string, string, string, string] (4 options),
    "mainIdeaAnswer": number (index of correct option 0 to 3),
    "grammarTipTitle": string,
    "grammarTipContent": string,
    "vocabulary": [
      {
        "word": string,
        "definition": string,
        "chinese": string,
        "example": string
      } (exactly 5 items)
    ],
    "translationChallenge": {
      "chineseSentence1": string,
      "chineseSentence2": string,
      "correctEnglish1": string,
      "correctEnglish2": string,
      "prompt": string,
      "hints": [string, string, string] (exactly 3 translation tips)
    }
  },
  "intermediate": {
    "text": string (expository/informative text, 60-80 words),
    "mainIdeaQuestion": string,
    "mainIdeaOptions": [string, string, string, string] (4 options),
    "mainIdeaAnswer": number (index of correct option 0 to 3),
    "grammarTipTitle": string,
    "grammarTipContent": string,
    "collocations": [
      {
        "phrase": string,
        "verb": string,
        "noun": string,
        "chinese": string
      } (exactly 4 items)
    ],
    "readingDetails": [
      { "question": string, "answer": string },
      { "question": string, "answer": string }
    ],
    "translationChallenge": {
      "chineseSentence1": string,
      "chineseSentence2": string,
      "correctEnglish1": string,
      "correctEnglish2": string,
      "prompt": string,
      "hints": [string, string, string]
    }
  },
  "advanced": {
    "text": string (high-level academic/literary text, 80-120 words, must contain special structures like negative inversion, conditional inversion 'Had I...', or subjunctive clauses),
    "mainIdeaQuestion": string,
    "mainIdeaOptions": [string, string, string, string] (4 options),
    "mainIdeaAnswer": number (index of correct option 0 to 3),
    "grammarTipTitle": string,
    "grammarTipContent": string,
    "advancedGrammar": [
      {
        "type": "inversion" | "conditional" | "subjunctive" | "other",
        "rule": string,
        "example": string,
        "explanation": string
      } (exactly 3 advanced structures)
    ],
    "graphicOrganizer": [
      {
        "id": "root-node",
        "label": string (Thesis statement),
        "type": "thesis",
        "description": string,
        "children": [string] (list of child IDs)
      },
      {
        "id": "branch-1",
        "label": string,
        "type": "point",
        "description": string,
        "children": [string]
      },
      {
        "id": "branch-2",
        "label": string,
        "type": "point",
        "description": string,
        "children": [string]
      },
      {
        "id": "leaf-1",
        "label": string,
        "type": "evidence",
        "description": string
      },
      {
        "id": "leaf-2",
        "label": string,
        "type": "evidence",
        "description": string
      }
    ] (Generate a list representing a tree structure showing the graphic organizer of the advanced reading text. Total 5 nodes. Must link together using children arrays),
    "criticalThinkingQuestion": string,
    "translationChallenge": {
      "chineseSentence1": string,
      "chineseSentence2": string,
      "correctEnglish1": string,
      "correctEnglish2": string,
      "prompt": string,
      "hints": [string, string, string]
    },
    "gsatWritingPrompt": {
      "title": string (e.g. "學測英文作文高分挑戰題目"),
      "promptText": string (A highly professional Taiwan GSAT (學測) essay prompt closely related to the subject matter of the material. Provide clear guidelines for a 2-paragraph essay. In Traditional Chinese.),
      "paragraph1Prompt": string (Detailed instruction of what they should write in Paragraph 1, about 50-80 words/ideas, e.g. describing the phenomenon/situations/reading content),
      "paragraph2Prompt": string (Detailed instruction of what they should write in Paragraph 2, about 80-120 words/ideas, e.g. detailing personal views, solutions, or predictions),
      "guidelines": [string, string, string] (List of exactly 3 grading expectations or rubric directions in Traditional Chinese),
      "sampleEssay": string (A flawless 2-paragraph model essay scoring high marks on this prompt, about 150-200 English words, utilizing advanced vocabulary, structures and connectors)
    }
  }
}

CRITICAL RULES for Translation Challenges:
- Chinese-English translation challenge: must be two separate sentences but contextually linked together.
- For Beginner: simple words, e.g. "Water is very clean. We must drink it."
- For Intermediate: collocations and compound elements.
- For Advanced: must include a special sentence structure like inversion (e.g., 'Not only... but also...', 'Only when...', 'Hardly had...', 'Under no circumstances should...') or conditional (e.g. 'Had they known...', 'Were we to...', 'Should you...'). Mention this explicitly in the hints.
- The returned correctEnglish1 and correctEnglish2 must be fully in line with standard academic English.`;
}

// ---------------------------------------------------------------------------
// System prompt builder for /api/lesson/grade-translation
// ---------------------------------------------------------------------------

export function buildGradingPrompt(opts: {
  studentAnswer1: string;
  studentAnswer2: string;
  target1: string;
  target2: string;
  level?: string;
  prompt?: string;
}): string {
  const { studentAnswer1, studentAnswer2, target1, target2, level, prompt } = opts;
  return `You are a professional, rigorous English grammar grader and tutor.
A student submitted their translation for two contextually linked Chinese sentences.
Level of student: ${level || "Intermediate"}
Original Task Prompt: "${prompt}"
Reference Model Translation 1: "${target1}"
Reference Model Translation 2: "${target2}"

Student's Attempt 1: "${studentAnswer1}"
Student's Attempt 2: "${studentAnswer2}"

Evaluate the student's submission carefully. Provide a constructive, encouraging feedback report in Traditional Chinese (繁體中文).
Be extremely precise with grammar checks. If the level is Advanced, pay strong attention to invert structures or conditionals.
Return exactly a single JSON object. Do not include markdown code blocks in your answer, return raw JSON match.

JSON Specifications:
{
  "score": number (0 to 100),
  "isExcellent": boolean (true if score >= 90),
  "vocabularyFeedback": string (Traditional Chinese: feedback about key word choices),
  "grammarFeedback": string (Traditional Chinese: feedback about grammar structures, inversion/tense),
  "suggestedPhrasing": string (A polished, natural version that represents a native way to say it, combing best elements of student's try),
  "encouragement": string (Encouraging note to stay motivated)
}`;
}

// ---------------------------------------------------------------------------
// Fallback generator for simulated lessons (used when no AI key is configured
// or when the AI call fails)
// ---------------------------------------------------------------------------

export function createSimulatedLesson(topic: string): any {
  return {
    id: `custom-sim-${Date.now()}`,
    topic: topic,
    createdAt: new Date().toLocaleDateString(),
    beginner: {
      text: `${topic} is very interesting to learn. Many people like to study this topic because they feel excited. It is good for our world and helps people communicate better.`,
      mainIdeaQuestion: `What makes ${topic} exciting for people according to the text?`,
      mainIdeaOptions: [
        "People feel bored about it.",
        "It is good for our world and helps people learn and communicate.",
        "Computers cannot handle this topic at all.",
        "It was invented centuries ago and remains useless."
      ],
      mainIdeaAnswer: 1,
      grammarTipTitle: "Using 'Because' to Connect Clauses",
      grammarTipContent: "Use 'because' to connect an active statement with a reason in a single sentence: 'Many people study this topic because they feel excited.' Avoid comma splicing.",
      vocabulary: [
        { word: "interesting", definition: "Arousing curiosity or interest; holding effortful attention.", chinese: "有趣的", example: "Learning new topics is very interesting." },
        { word: "study", definition: "To acquire knowledge or read detail.", chinese: "學習", example: "Students study hard for exams." },
        { word: "excited", definition: "Feeling or showing great enthusiasm or eagerness.", chinese: "興奮的", example: "He is excited about starting his new course." },
        { word: "good", definition: "To be desired or approved of; of high quality.", chinese: "好的 / 有益的", example: "A balanced diet is very good for your health." },
        { word: "world", definition: "The planet earth and all the people living on it.", chinese: "世界", example: "We want to travel around the entire world." }
      ],
      translationChallenge: {
        chineseSentence1: `${topic} 是一個非常有趣的領域。`,
        chineseSentence2: "它幫助我們學習許多有用的新技能。",
        correctEnglish1: `${topic} is a very interesting field.`,
        correctEnglish2: "It helps us learn many useful new skills.",
        prompt: `Translate: '${topic} 是一個非常有趣的領域。它幫助我們學習許多有用的新技能。'`,
        hints: ["Use 'interesting field' for 有趣的領域.", "Use 'helps us learn' for 幫助我們學習.", "Use 'useful new skills' for 有用的新技能."]
      }
    },
    intermediate: {
      text: `When researchers examine ${topic}, they uncover elements essential to human development. Although understanding this topic fully takes serious dedication, the resulting breakthroughs can streamline workflows. Ultimately, raising public awareness on this subject can inspire global solutions.`,
      mainIdeaQuestion: "Which summary represents the main idea of this intermediate segment?",
      mainIdeaOptions: [
        "Researching this topic has zero impact on streamling standard workflows.",
        "The subject demands serious dedication, but its breakthroughs streamline systems and trigger collective solutions.",
        "The public is completely aware of the topic already, so study is futile.",
        "Ecosystems are unaffected by modern intellectual breakthroughs on this subject."
      ],
      mainIdeaAnswer: 1,
      grammarTipTitle: "Time Clauses with 'When'",
      grammarTipContent: "Time clause: 'When researchers examine topic, [independent clause]'. Keep the verb tenses consistent (present simple + present simple for factual truths).",
      collocations: [
        { phrase: "examine topic", verb: "examine", noun: "topic", chinese: "研究/檢查這個主題" },
        { phrase: "essential development", verb: "essential", noun: "development", chinese: "不可或缺的發展" },
        { phrase: "streamline workflow", verb: "streamline", noun: "workflows", chinese: "簡化工作流程" },
        { phrase: "raise awareness", verb: "raise", noun: "awareness", chinese: "提升意識" }
      ],
      readingDetails: [
        { question: "What do researchers uncover when examining this subject?", answer: "They uncover elements essential to human development." },
        { question: "What is necessary to understand this topic fully?", answer: "It takes serious commitment and dedication." }
      ],
      translationChallenge: {
        chineseSentence1: "研究人員對這個主題表現出極大的興趣。",
        chineseSentence2: "這樣的研究能夠幫助我們簡化工作流程。",
        correctEnglish1: "Researchers show great interest in this subject.",
        correctEnglish2: "Such research can help us streamline our work processes.",
        prompt: "Translate: '研究人員對這個主題表現出極大的興趣。這樣的研究能夠幫助我們簡化工作流程。'",
        hints: ["Use 'show great interest in' for 表現出極大的興趣.", "Use 'Such research' for 這樣的研究.", "Use 'streamline work processes' or 'streamline workflows' for 簡化工作流程."]
      }
    },
    advanced: {
      text: `Rarely do societies encounter an issue as multi-faceted as ${topic}. Not only does it query our social ethics, but it also compels us to reshape current structural policies. Were governments to abandon critical investments in this field, intellectual progress would collapse, triggering systemic failures across modern cognitive frameworks.`,
      mainIdeaQuestion: `Analyze the advanced textual perspective on ${topic}:`,
      mainIdeaOptions: [
        "The subject is simple and does not involve social ethics or structural issues.",
        "Neglecting research in this area leads to systemic collapse and halts critical human progress.",
        "Governments will naturally fund the subject even if they abandon all ethical policies.",
        "The topic is a minor issue that only rarely gets encountered in remote rural societies."
      ],
      mainIdeaAnswer: 1,
      grammarTipTitle: "Formatting Formal Subject-Verb Inversions",
      grammarTipContent: "Notice advanced inverting structures in the text: \n1. Negative Adverb fronting: 'Rarely do societies encounter... [Rarely + Aux (do) + Subj (societies) + Verb (encounter)]'. \n2. Inverted Conditional: 'Were governments to abandon...' replaces 'If governments were to abandon...'.",
      advancedGrammar: [
        { type: "inversion", rule: "Rarely/Seldom + Auxiliary + Subject + Verb", example: "Seldom do we find such high dedication in research.", explanation: "Places literary emphasis on how infrequent the condition is." },
        { type: "conditional", rule: "Were + Subject + to + Infinitive", example: "Were you to ask, I would offer coordinates.", explanation: "Formal substitute for a second conditional conditional clause." },
        { type: "inversion", rule: "Not only + Auxiliary + Subject + Verb + also", example: "Not only does he study, but he also researches.", explanation: "Expands two balanced items." }
      ],
      graphicOrganizer: [
        { id: "s-root", label: "Theme: Multi-Faceted Challenges of " + topic, type: "thesis", description: "Analyzing both the social queries and critical policy reshaping requirements.", children: ["s-branch-1", "s-branch-2"] },
        { id: "s-branch-1", label: "Ethical & Structural Expansion", type: "point", description: "Not only does it query ethics, but forces policy change.", children: ["s-leaf-1"] },
        { id: "s-branch-2", label: "State Abandonment Consequences", type: "point", description: "Were governments to withdraw, intellectual collapse would follow.", children: ["s-leaf-2"] },
        { id: "s-leaf-1", label: "Structural Policies", type: "evidence", description: "Requires redesigning current infrastructural guidelines to protect social standards." },
        { id: "s-leaf-2", label: "Cognitive Collapses", type: "evidence", description: "Halting inquiry will impact downstream technical frameworks and critical thinking." }
      ],
      criticalThinkingQuestion: `How should contemporary systems prioritize resource allocation for ${topic} to maximize civil prosperity? Defend your view with logical assertions.`,
      translationChallenge: {
        chineseSentence1: "我們很少遇到像這個主題這樣引人深思的事物。",
        chineseSentence2: "要是我們忽視它，它會阻礙我們未來的發展。",
        correctEnglish1: "Seldom do we encounter anything as thought-provoking as this topic.",
        correctEnglish2: "Were we to ignore it, it would hinder our future development.",
        prompt: `Translate with negative inversion 'Seldom do we...' and conditional inversion 'Were we to...': '我們很少遇到像這個主題這樣引人深思的事物。要是我們忽視它，它會阻礙我們未來的發展。'`,
        hints: ["Start with: 'Seldom do we encounter...'", "Use 'thought-provoking' for 引人深思.", "Start the second with 'Were we to ignore it...'"]
      },
      gsatWritingPrompt: {
        title: "學測英文作文高分挑戰題目：" + topic,
        promptText: `近年來，「${topic}」在社會大眾及教育界引起了廣泛討論，對我們的生活、思維與倫理價值都帶來了深遠的影響。請根據此現象寫一篇英文作文（約150-180個單字），以表達你對此議題的看法。`,
        paragraph1Prompt: "第一段：簡述「" + topic + "」所代表的核心概念、其對現代人生活帶來的顯著影響或可能造成的隱憂。",
        paragraph2Prompt: "第二段：提出你個人的看法或親身經歷。不論你對此是抱持樂觀、疑慮還是中立態度，請具體陳述理由，並說明面對此現象時，我們應當如何調適或應對。",
        guidelines: [
          "第一段必須清晰點出「" + topic + "」的核心價值或當前爭議，並做到文意切題、條理清楚。",
          "第二段須結合個人切身感受或周遭具體實例，分析自身應對策略，文章語調應顯得客觀、理性且極具思辨力。",
          "作文中宜融入進階字彙與特別句型，如倒裝句 (Seldom/Not only... but also) 或假設語氣 (Were we to...)，提升寫作層次與學術美感。"
        ],
        sampleEssay: `Rarely do we encounter an intellectual milestone that shapes our contemporary landscape as powerfully as ${topic}. In the first place, this topic plays a pivotal role in optimizing our cognitive frameworks, streamline complex workflows, and foster deep creative solutions. However, were communities to misunderstand its boundaries, unethical disruptions could easily arise, undermining our established structural regulations.

From my perspective, ${topic} should be embraced as an indispensable asset rather than a perilous threat. To ensure dynamic progress, we must develop robust critical thinking and establish ethical guidelines. Only by doing so can we fully exploit its colossal benefits safely while protecting our traditional collective ideals.`
      }
    }
  };
}

// ---------------------------------------------------------------------------
// Simple rule-based translation grader (offline fallback)
// ---------------------------------------------------------------------------

export function localGrader(student1: string, student2: string, ref1: string, ref2: string, level?: string): any {
  const cleanAns1 = student1.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const cleanAns2 = student2.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const cleanRef1 = ref1.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const cleanRef2 = ref2.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  const words1 = cleanAns1.split(/\s+/);
  const words2 = cleanAns2.split(/\s+/);
  const refWords1 = cleanRef1.split(/\s+/);
  const refWords2 = cleanRef2.split(/\s+/);

  let matchCount1 = 0;
  refWords1.forEach((w) => {
    if (words1.includes(w) && w.length > 2) matchCount1++;
  });
  let matchCount2 = 0;
  refWords2.forEach((w) => {
    if (words2.includes(w) && w.length > 2) matchCount2++;
  });

  const totalPossible = Math.max(1, refWords1.filter((w) => w.length > 2).length + refWords2.filter((w) => w.length > 2).length);
  const matched = matchCount1 + matchCount2;

  let score = Math.min(100, Math.round((matched / totalPossible) * 75) + 25);

  if (level === "advanced") {
    const invertedWordCheck = ["seldom", "never", "only", "not until", "scarcely", "hardly", "were", "had"].some(
      (w) => cleanAns1.includes(w) || cleanAns2.includes(w)
    );
    if (!invertedWordCheck) {
      score = Math.max(30, score - 20);
    } else {
      score = Math.min(100, score + 10);
    }
  }

  if (student1.trim().length === 0 || student2.trim().length === 0) {
    score = 15;
  }

  return {
    score,
    isExcellent: score >= 90,
    vocabularyFeedback: `透過比對參考句子與您的拼寫，我們發現您使用了許多切題的單字。例如："${words1.slice(0, 3).join(" ")}" 等。請繼續保持並累積更多近義詞！`,
    grammarFeedback:
      level === "advanced"
        ? `在高級組合中，特殊句型（如否定倒裝 Not until / Seldom 或虛擬倒裝 Were we to...）是評分的關鍵。您的語序及助動詞搭配呈現出不錯的寫作意識！`
        : `您在此級別的句子連接詞與動詞時態搭配良好，展現了良好的句型結構穩定度！`,
    suggestedPhrasing: `${ref1} ${ref2}`,
    encouragement:
      score >= 80
        ? "非常優秀的翻譯水準！您的句型不僅流暢，且精準貼近母語者的表達方式，請繼續挑戰更高難度！"
        : "這是一個很好的嘗試！英文寫作講求多看多練，對照上方的 Suggested Phrasing 可以給您更多修辭上的啟發喔！",
  };
}
