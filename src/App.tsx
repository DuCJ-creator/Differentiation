import React, { useState, useEffect } from "react";
import { LessonVersion, ScoreState } from "./types";
import { DEFAULT_LESSONS } from "./data";
import BeginnerView from "./components/BeginnerView";
import IntermediateView from "./components/IntermediateView";
import AdvancedView from "./components/AdvancedView";
import {
  playTapSound,
  playLevelUpSound,
} from "./utils/audio";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Award,
  Sparkles,
  Upload,
  Download,
  FileText,
  Plus,
  Compass,
  Trophy,
  History,
  Info,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function App() {
  // Lesson versions state (persisted to localStorage)
  const [lessons, setLessons] = useState<LessonVersion[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; mimeType: string; base64: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active level tab ("beginner" | "intermediate" | "advanced")
  const [activeLevel, setActiveLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  // Game/Score State
  const [points, setPoints] = useState(120); // start with 120 points for welcoming!
  const [streak, setStreak] = useState(3); // start with 3-day streak active
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Load state or fallback defaults
  useEffect(() => {
    const savedLessons = localStorage.getItem("aistudio_lessons");
    let loaded: LessonVersion[] = [];
    if (savedLessons) {
      try {
        loaded = JSON.parse(savedLessons).filter((l: any) => 
          l.id !== "annual-traditions" && 
          !l.topic.toLowerCase().includes("annual traditions") &&
          !l.topic.toLowerCase().includes("social bonds")
        );
        if (loaded.length === 0) {
          loaded = DEFAULT_LESSONS;
        }
      } catch (e) {
        loaded = DEFAULT_LESSONS;
      }
    } else {
      loaded = DEFAULT_LESSONS;
    }
    setLessons(loaded);
    if (loaded.length > 0) {
      setActiveLessonId(loaded[0].id);
    }

    // Load score
    const savedPoints = localStorage.getItem("aistudio_points");
    if (savedPoints) {
      setPoints(Number(savedPoints));
    }
    const savedStreak = localStorage.getItem("aistudio_streak");
    if (savedStreak) {
      setStreak(Number(savedStreak));
    }
  }, []);

  // Sync state helpers
  const saveLessons = (updated: LessonVersion[]) => {
    localStorage.setItem("aistudio_lessons", JSON.stringify(updated));
    setLessons(updated);
  };

  const handleAddPoints = (pts: number) => {
    const newPoints = points + pts;
    setPoints(newPoints);
    localStorage.setItem("aistudio_points", String(newPoints));
    
    // Check level up or special achievements
    if (newPoints > 300 && points <= 300) {
      playLevelUpSound();
      alert("🏆 恭喜升級！您的英語學分已突破 300 大關，榮獲「資深學者 Senior Scholar」頭銜！");
    } else if (newPoints > 600 && points <= 600) {
      playLevelUpSound();
      alert("👑 登峰造極！您的英語學術點數突破 600 分，解鎖「終身學術院士 Academician」王冠！");
    }
  };

  // Download Lesson in JSON format
  const downloadLessonJSON = (lesson: LessonVersion) => {
    if (!lesson) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lesson, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Differentiated_Lesson_${lesson.topic.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      playTapSound();
    } catch (e) {
      console.error(e);
      alert("下載 JSON 失敗。");
    }
  };

  // Download Lesson in Markdown format
  const downloadLessonMarkdown = (lesson: LessonVersion) => {
    if (!lesson) return;
    try {
      const mdText = `# ${lesson.topic} - Shirley Du's Differentiated English Academy (杜老師英文分級講堂)
設計教師：Shirley Du

---

## 🧭 初級班教材 (Beginner Level)
### 📖 閱讀文章 (Reading Passage)
${lesson.beginner.text}

### 💡 核心文法技巧 (Grammar Tip)
* **主題**: ${lesson.beginner.grammarTipTitle}
* **內容**: ${lesson.beginner.grammarTipContent}

### 📝 關鍵單字與例句 (Vocabulary)
${lesson.beginner.vocabulary?.map((v, i) => `${i+1}. **${v.word}** (${v.chinese}): ${v.definition}\n   * *例句*: ${v.example}`).join("\n") || "無"}

### 🔍 主旨理解測試 (Reading Comprehension)
* **問題**: ${lesson.beginner.mainIdeaQuestion}
${lesson.beginner.mainIdeaOptions.map((opt, idx) => `  * [${idx === lesson.beginner.mainIdeaAnswer ? "x" : " "}] ${opt}`).join("\n")}

### ✍️ 翻譯寫作挑戰 (Translation Challenge)
* 句 1: ${lesson.beginner.translationChallenge.chineseSentence1}
* 句 2: ${lesson.beginner.translationChallenge.chineseSentence2}
* 參考翻譯 1: ${lesson.beginner.translationChallenge.correctEnglish1}
* 參考翻譯 2: ${lesson.beginner.translationChallenge.correctEnglish2}
* 寫作提示: ${lesson.beginner.translationChallenge.hints.join(", ")}

---

## 🧭 中級班教材 (Intermediate Level)
### 📖 閱讀文章 (Reading Passage)
${lesson.intermediate.text}

### 💡 核心文法技巧 (Grammar Tip)
* **主題**: ${lesson.intermediate.grammarTipTitle}
* **內容**: ${lesson.intermediate.grammarTipContent}

### 🔗 實用語塊搭配 (Collocations)
${lesson.intermediate.collocations?.map((c, i) => `${i+1}. **${c.phrase}** (動詞: ${c.verb}, 名詞: ${c.noun}) - ${c.chinese}`).join("\n") || "無"}

### 🔬 微觀細節問答 (Reading Details)
${lesson.intermediate.readingDetails?.map((d, i) => `${i+1}. **問**: ${d.question}\n   * **答**: ${d.answer}`).join("\n") || "無"}

### 🔍 主旨理解測試 (Reading Comprehension)
* **問題**: ${lesson.intermediate.mainIdeaQuestion}
${lesson.intermediate.mainIdeaOptions.map((opt, idx) => `  * [${idx === lesson.intermediate.mainIdeaAnswer ? "x" : " "}] ${opt}`).join("\n")}

### ✍️ 翻譯寫作挑戰 (Translation Challenge)
* 句 1: ${lesson.intermediate.translationChallenge.chineseSentence1}
* 句 2: ${lesson.intermediate.translationChallenge.chineseSentence2}
* 參考翻譯 1: ${lesson.intermediate.translationChallenge.correctEnglish1}
* 參考翻譯 2: ${lesson.intermediate.translationChallenge.correctEnglish2}
* 寫作提示: ${lesson.intermediate.translationChallenge.hints.join(", ")}

---

## 🧭 高級班教材 (Advanced Level)
### 📖 閱讀文章 (Reading Passage)
${lesson.advanced.text}

### 💡 核心文法技巧 (Grammar Tip)
* **主題**: ${lesson.advanced.grammarTipTitle}
* **內容**: ${lesson.advanced.grammarTipContent}

### 🎓 進階句型與特殊文法 (Advanced Grammar Rules)
${lesson.advanced.advancedGrammar?.map((g, i) => `${i+1}. **範例**: ${g.example}\n   * *規則 [${g.type}]*: ${g.rule}\n   * *解析*: ${g.explanation}`).join("\n") || "無"}

### 📊 文本結構圖 (Graphic Organizer Structure)
${lesson.advanced.graphicOrganizer?.map((g) => `* **[${g.type.toUpperCase()}]** ID: ${g.id} - ${g.label}\n  * *解析*: ${g.description}\n  * *分支*: ${g.children?.join(", ") || "無分枝"}`).join("\n") || "無"}

### 🧠 理性思辨研討 (Critical Thinking Question)
* ${lesson.advanced.criticalThinkingQuestion}

### ✍️ 顛覆性語意翻譯挑戰 (Advanced Translation Challenge)
* 句 1: ${lesson.advanced.translationChallenge.chineseSentence1}
* 句 2: ${lesson.advanced.translationChallenge.chineseSentence2}
* 參考翻譯 1: ${lesson.advanced.translationChallenge.correctEnglish1}
* 參考翻譯 2: ${lesson.advanced.translationChallenge.correctEnglish2}
* 寫作提示: ${lesson.advanced.translationChallenge.hints.join(", ")}
`;

      const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdText);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Differentiated_Lesson_${lesson.topic.replace(/\s+/g, '_')}.md`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      playTapSound();
    } catch (e) {
      console.error(e);
      alert("下載 Markdown 失敗。");
    }
  };

  // Download Lesson in MS Word (.doc) format
  const downloadLessonDoc = (lesson: LessonVersion) => {
    if (!lesson) return;
    try {
      playTapSound();
      
      const vocabularyRows = lesson.beginner.vocabulary?.map(v => `
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">${v.word}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${v.chinese}</td>
          <td style="padding: 8px; border: 1px solid #ddd;"><i>${v.definition}</i></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${v.example}</td>
        </tr>
      `).join('') || '';

      const collocationRows = lesson.intermediate.collocations?.map(c => `
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">${c.phrase}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${c.chinese}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${c.verb} + ${c.noun}</td>
        </tr>
      `).join('') || '';

      const advancedGrammarRows = lesson.advanced.advancedGrammar?.map(g => `
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd; text-transform: capitalize;">${g.type}</td>
          <td style="padding: 8px; border: 1px solid #ddd;"><b>規則:</b> ${g.rule}<br><b>解析:</b> ${g.explanation}</td>
          <td style="padding: 8px; font-style: italic; border: 1px solid #ddd;">${g.example}</td>
        </tr>
      `).join('') || '';

      const gsatPrompt = lesson.advanced.gsatWritingPrompt ? `
        <div style="background-color: #fcf8e3; border: 1px solid #faebcc; padding: 15px; margin-top: 15px; border-radius: 6px;">
          <h3 style="color: #8a6d3b; margin-top: 0;">🎯 台灣學測英文作文高分挑戰 (Taiwan GSAT Writing Prompt)</h3>
          <p><b>題目說明:</b> ${lesson.advanced.gsatWritingPrompt.promptText}</p>
          <p><b>段落規劃:</b></p>
          <ul>
            <li><b>第一段:</b> ${lesson.advanced.gsatWritingPrompt.paragraph1Prompt}</li>
            <li><b>第二段:</b> ${lesson.advanced.gsatWritingPrompt.paragraph2Prompt}</li>
          </ul>
          <p><b>寫作評分要點 (Guidelines):</b></p>
          <ol>
            ${lesson.advanced.gsatWritingPrompt.guidelines.map(g => `<li>${g}</li>`).join('')}
          </ol>
          <p><b>高分範文 (Sample Essay):</b></p>
          <p style="background-color: #ffffff; padding: 10px; border-left: 4px solid #8a6d3b; font-style: italic; line-height: 1.6;">
            ${lesson.advanced.gsatWritingPrompt.sampleEssay.replace(/\n/g, '<br>')}
          </p>
        </div>
      ` : '';

      const htmlString = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${lesson.topic} - Differentiated Study Pack</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 5px; text-align: center; }
            h2 { color: #2b6cb0; border-bottom: 1px solid #cbd5e0; padding-bottom: 3px; margin-top: 30px; }
            h3 { color: #2d3748; margin-top: 20px; }
            .section { margin-bottom: 40px; }
            .reading-text { background-color: #f7fafc; padding: 15px; border-left: 5px solid #4a5568; font-size: 14px; line-height: 1.8; margin-bottom: 20px; text-align: justify; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
            th { background-color: #edf2f7; text-align: left; padding: 8px; border: 1px solid #cbd5e0; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>杜老師英文分級講堂 - Differentiated Lesson Pack</h1>
          <p style="text-align: center; font-size: 12px; color: #718096;">研讀主題：<b>${lesson.topic}</b> &bull; 設計導師：Shirley Du &bull; 日期：${lesson.createdAt}</p>
          
          <!-- 1. BEGINNER LEVEL -->
          <div class="section">
            <h2>🧭 基礎班 (Basic Level Lesson)</h2>
            <h3>📖 閱讀文章 (Reading Passage)</h3>
            <div class="reading-text">${lesson.beginner.text}</div>
            
            <h3>💡 核心文法技巧 (Grammar Tip)</h3>
            <p><b>主題:</b> ${lesson.beginner.grammarTipTitle}</p>
            <p>${lesson.beginner.grammarTipContent}</p>
            
            <h3>📝 關鍵單字與例句 (Vocabulary Worksheet)</h3>
            <table>
              <thead>
                <tr>
                  <th>單字 (Word)</th>
                  <th>中文 (Chinese)</th>
                  <th>英文解釋 (Definition)</th>
                  <th>精選例句 (Example Sentence)</th>
                </tr>
              </thead>
              <tbody>
                ${vocabularyRows}
              </tbody>
            </table>

            <h3>🔍 閱讀主旨理解問題 (Reading Comprehension)</h3>
            <p><b>Q:</b> ${lesson.beginner.mainIdeaQuestion}</p>
            <ul>
              ${lesson.beginner.mainIdeaOptions.map((opt, idx) => `
                <li>[${idx === lesson.beginner.mainIdeaAnswer ? "✔ 正確答案" : " "}] ${opt}</li>
              `).join('')}
            </ul>

            <h3>✍ 翻譯寫作聯網挑戰 (Translation Challenge)</h3>
            <p><b>中文句子 1:</b> ${lesson.beginner.translationChallenge.chineseSentence1}</p>
            <p><b>參考英文 1:</b> ${lesson.beginner.translationChallenge.correctEnglish1}</p>
            <p><b>中文句子 2:</b> ${lesson.beginner.translationChallenge.chineseSentence2}</p>
            <p><b>參考英文 2:</b> ${lesson.beginner.translationChallenge.correctEnglish2}</p>
            <p><b>寫作提示:</b> ${lesson.beginner.translationChallenge.hints.join(', ')}</p>
          </div>

          <!-- 2. INTERMEDIATE LEVEL -->
          <div class="section">
            <h2>🧭 中級班 (Essential Level Lesson)</h2>
            <h3>📖 閱讀文章 (Reading Passage)</h3>
            <div class="reading-text">${lesson.intermediate.text}</div>
            
            <h3>💡 核心文法技巧 (Grammar Tip)</h3>
            <p><b>主題:</b> ${lesson.intermediate.grammarTipTitle}</p>
            <p>${lesson.intermediate.grammarTipContent}</p>
            
            <h3>🔗 實用語塊搭配 (Collocations Worksheet)</h3>
            <table>
              <thead>
                <tr>
                  <th>常用搭配 (Phrase)</th>
                  <th>中文意思 (Chinese Translation)</th>
                  <th>語句結構成分 (Composition)</th>
                </tr>
              </thead>
              <tbody>
                ${collocationRows}
              </tbody>
            </table>

            <h3>🔬 微觀細節問答 (Reading Detailed QA)</h3>
            <ul>
              ${lesson.intermediate.readingDetails?.map(d => `
                <li><b>問:</b> ${d.question}<br><b>答:</b> ${d.answer}</li>
              `).join('') || '無'}
            </ul>

            <h3>🔍 閱讀主旨理解問題 (Reading Comprehension)</h3>
            <p><b>Q:</b> ${lesson.intermediate.mainIdeaQuestion}</p>
            <ul>
              ${lesson.intermediate.mainIdeaOptions.map((opt, idx) => `
                <li>[${idx === lesson.intermediate.mainIdeaAnswer ? "✔ 正確答案" : " "}] ${opt}</li>
              `).join('')}
            </ul>

            <h3>✍ 翻譯寫作聯網挑戰 (Translation Challenge)</h3>
            <p><b>中文句子 1:</b> ${lesson.intermediate.translationChallenge.chineseSentence1}</p>
            <p><b>參考英文 1:</b> ${lesson.intermediate.translationChallenge.correctEnglish1}</p>
            <p><b>中文句子 2:</b> ${lesson.intermediate.translationChallenge.chineseSentence2}</p>
            <p><b>參考英文 2:</b> ${lesson.intermediate.translationChallenge.correctEnglish2}</p>
            <p><b>寫作提示:</b> ${lesson.intermediate.translationChallenge.hints.join(', ')}</p>
          </div>

          <!-- 3. ADVANCED LEVEL -->
          <div class="section">
            <h2>🧭 高級班 (Advanced Level Lesson)</h2>
            <h3>📖 閱讀文章 (Reading Passage)</h3>
            <div class="reading-text">${lesson.advanced.text}</div>
            
            <h3>💡 核心文法技巧 (Grammar Tip)</h3>
            <p><b>主題:</b> ${lesson.advanced.grammarTipTitle}</p>
            <p>${lesson.advanced.grammarTipContent}</p>
            
            <h3>🎓 進階句型與特殊文法 (Advanced Sentence Structures)</h3>
            <table>
              <thead>
                <tr>
                  <th>類型 (Type)</th>
                  <th>文法規則與解析 (Rule & Explanation)</th>
                  <th>文學範例句 (Aesthetic Example)</th>
                </tr>
              </thead>
              <tbody>
                ${advancedGrammarRows}
              </tbody>
            </table>

            <h3>🧠 理性思辨研討 (Critical Thinking Seminar)</h3>
            <p><b>討論發想：</b> ${lesson.advanced.criticalThinkingQuestion}</p>

            ${gsatPrompt}

            <h3 style="margin-top: 25px;">✍ 翻譯寫作聯網挑戰 (Translation Challenge)</h3>
            <p><b>中文句子 1:</b> ${lesson.advanced.translationChallenge.chineseSentence1}</p>
            <p><b>參考英文 1:</b> ${lesson.advanced.translationChallenge.correctEnglish1}</p>
            <p><b>中文句子 2:</b> ${lesson.advanced.translationChallenge.chineseSentence2}</p>
            <p><b>參考英文 2:</b> ${lesson.advanced.translationChallenge.correctEnglish2}</p>
            <p><b>寫作提示:</b> ${lesson.advanced.translationChallenge.hints.join(', ')}</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlString], { type: 'application/msword;charset=utf-8' });
      const docUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", docUrl);
      downloadAnchor.setAttribute("download", `Differentiated_Lesson_${lesson.topic.replace(/\s+/g, '_')}_杜老師英文分級講堂.doc`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(docUrl);
    } catch (e) {
      console.error(e);
      alert("下載 DOC 講義失敗。");
    }
  };

  // Download Lesson in PDF format by leveraging browser native print layout
  const handleDownloadPdf = () => {
    try {
      playTapSound();
      alert("💡 杜老師精裝 PDF 提示：\n接下來將啟動您的系統列印介面。為了匯出完美無暇、高解析且含配色的精裝學術講義：\n1. 請在印表機目標中選擇「另存為 PDF (Save as PDF)」\n2. 務必確認展開「更多設定」選項並勾選「背景圖形 (Background Graphics / Colors)」以自動套用講義色彩！");
      window.print();
    } catch (e) {
      console.error(e);
      alert("啟動 PDF 講義列印失敗。");
    }
  };

  // Drag-and-drop parsing handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const convertFileToBase64AndStore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64String = btoa(binary);
      
      let mimeType = file.type;
      if (!mimeType) {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (ext === ".pdf") mimeType = "application/pdf";
        else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (ext === ".doc") mimeType = "application/msword";
        else if (ext === ".png") mimeType = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      }

      setUploadedFile({
        name: file.name,
        mimeType,
        base64: base64String
      });
      setUploadedText(`[已成功載入上傳文件附件: ${file.name}]`);
      setCustomTopicInput(file.name.replace(/\.[^/.]+$/, "") || file.name);
      playTapSound();
    };
    reader.readAsArrayBuffer(file);
  };

  const processUploadedFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (ext === ".txt" || ext === ".md") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === "string" && text.trim() !== "") {
          setUploadedText(text);
          setUploadedFile(null);
          setCustomTopicInput(file.name.replace(/\.[^/.]+$/, "") || file.name);
          playTapSound();
        }
      };
      reader.readAsText(file);
    } else {
      convertFileToBase64AndStore(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Generate dynamic custom Lesson version from input using Gemini/OpenAI backend endpoints
  const handleCreateCustomVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim() && !uploadedText.trim()) {
      alert("請提供「研讀主題」或「上傳教材內容」（或兩者皆提供）！");
      return;
    }
    
    playTapSound();
    setIsGeneratingLesson(true);
    setGenerationError(null);

    const targetTopic = customTopicInput.trim() || uploadedText.substring(0, 30).trim() + "...";

    try {
      const resp = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: targetTopic,
          materialText: uploadedText.trim(),
          fileData: uploadedFile ? {
            mimeType: uploadedFile.mimeType,
            base64: uploadedFile.base64,
            name: uploadedFile.name
          } : null
        }),
      });

      if (!resp.ok) {
        throw new Error("伺服器連線有限，已轉換為「本地極速微分重組」授課模式！");
      }

      const newLesson: LessonVersion = await resp.json();
      
      // Append to list without overwriting previous versions!
      const updatedList = [newLesson, ...lessons];
      saveLessons(updatedList);
      setActiveLessonId(newLesson.id);
      setCustomTopicInput("");
      setUploadedText("");
      setUploadedFile(null);
      playLevelUpSound();
      alert(`🎉 杜老師專屬分級課程 "${newLesson.topic}" 規劃成功！可於左側隨時切換與下載。`);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "連線逾時，為您啟用在地仿真微分演算模組。");
      
      // Fallback custom lesson generator
      const simulatedNewLesson: LessonVersion = {
        id: `sim-${Date.now()}`,
        topic: targetTopic + " (模擬版)",
        createdAt: new Date().toLocaleDateString(),
        beginner: {
          text: uploadedText.trim().substring(0, 150) || `Learning about ${targetTopic} is incredibly fun. Beginners often look at simple words. This dynamic method is excellent because study helper systems can guide us to feel safe.`,
          mainIdeaQuestion: "What is highlighted when studying this custom educational lesson?",
          mainIdeaOptions: ["The core concepts are ignored.", "Understanding custom uploaded details step-by-step is helpful.", "Only computers can memorize words.", "The topic is complete nonsense."],
          mainIdeaAnswer: 1,
          grammarTipTitle: "Conjunctions of Cause and Reason",
          grammarTipContent: "Use 'because' or 'since' to seamlessly link active assertions with objective evidence.",
          vocabulary: [
            { word: "incredibly", definition: "To a great degree; extremely.", chinese: "極度地", example: "Learning grammar is incredibly rewarding." },
            { word: "fun", definition: "Enjoyment, amusement, or lighthearted pleasure.", chinese: "有趣的", example: "The vocabulary matching puzzle is very fun." },
            { word: "simple", definition: "Easily understood or done; presenting no difficulty.", chinese: "簡單的", example: "This is a simple sentence structure." },
            { word: "excellent", definition: "Extremely good; outstanding.", chinese: "優秀的", example: "Your translation score is excellent!" },
            { word: "safe", definition: "Unlikely to cause or object to danger.", chinese: "安全的", example: "We are in safe educational hands." }
          ],
          translationChallenge: {
            chineseSentence1: `這分關於「${targetTopic}」的講義非常有趣。`,
            chineseSentence2: "它幫助我們安全地學習許多新詞意。",
            correctEnglish1: `This lesson about "${targetTopic}" is very interesting.`,
            correctEnglish2: "It helps us learn many new meanings safely.",
            prompt: "Translate simple connected phrases",
            hints: ["Use 'very interesting'", "Use 'helps us'", "Use 'safely'"]
          }
        },
        intermediate: {
          text: `With study of ${targetTopic} entering our daily routines, researchers must develop strong critical thinking. Although fully streamlining these workflows takes dedication, the resulting breakthroughs raise global awareness for all modern scholars.`,
          mainIdeaQuestion: "What requirement does the narrator emphasis for researchers?",
          mainIdeaOptions: ["To ignore critical analysis and trust systems.", "To develop robust critical thinking and raise awareness of breakthroughs.", "To cease writing any educational materials.", "To ignore daily workflow changes."],
          mainIdeaAnswer: 1,
          grammarTipTitle: "Introducing Concession with 'Although'",
          grammarTipContent: "'Although' creates contrast in a dependent clause. Avoid adding 'but' in the main clause.",
          collocations: [
            { phrase: "daily routine", verb: "enter", noun: "routines", chinese: "融入日常生活" },
            { phrase: "critical thinking", verb: "develop", noun: "thinking", chinese: "培養批判性思維" },
            { phrase: "streamline workflow", verb: "streamline", noun: "workflows", chinese: "簡化工作流程" },
            { phrase: "raise awareness", verb: "raise", noun: "awareness", chinese: "提升公眾意識" }
          ],
          readingDetails: [
            { question: "What should researchers develop?", answer: "They must build strong critical thinking habits." },
            { question: "What do innovations raise?", answer: "They raise global awareness." }
          ],
          translationChallenge: {
            chineseSentence1: "我們需要對上傳的教材培養批判性思維。",
            chineseSentence2: "這樣的研究有助於提高我們的思維效率。",
            correctEnglish1: "We need to develop critical thinking toward uploaded materials.",
            correctEnglish2: "Such study helps raise our cognitive efficiency.",
            prompt: "Translate core connected sentences",
            hints: ["Use 'critical thinking'", "Use 'uploaded materials'", "Use 'helps raise'"]
          }
        },
        advanced: {
          text: `Seldom do modern scholars examine ${targetTopic} without encountering deep intellectual friction. Not only does this subject query our current ethical matrices, but it also compels us to formulate systemic regulations. Were communities to abandon rigorous inquiry, progress would quickly dissolve into algorithmic apathy.`,
          mainIdeaQuestion: "Evaluate the primary consequence described in this advanced segment:",
          mainIdeaOptions: ["Strategic frameworks can effortlessly succeed.", "Abandoning rigorous inquiry halts progress and breeds public apathy.", "Philosophers are rarely concerned with ethical debate.", "The subject does not query ethical guidelines."],
          mainIdeaAnswer: 1,
          grammarTipTitle: "Structuring Formal Subject-Verb Inversions",
          grammarTipContent: "Utilizes negative fronting ('Seldom do...') and hypothetical unreal inversion ('Were communities to...').",
          advancedGrammar: [
            { type: "inversion", rule: "Seldom + Aux + Subj + Verb", example: "Seldom does she write essays.", explanation: "Sophisticated literary fronting." },
            { type: "inversion", rule: "Not only... but also", example: "Not only is he smart, but he is active.", explanation: "Coordinates details." },
            { type: "conditional", rule: "Were + Subj + to + Verb", example: "Were you to join, you would thrive.", explanation: "Replaces 'If you were to...'" }
          ],
          graphicOrganizer: [
            { id: "s-root", label: "Theme: Complexities of " + targetTopic, type: "thesis", description: "Evaluating critical social friction and ethical query standards.", children: ["s-br-1"] },
            { id: "s-br-1", label: "Rigorous Inquiry Mandate", type: "point", description: "Abandonment leads to algorithmic apathy.", children: ["s-leaf"] },
            { id: "s-leaf", label: "Social Progress Erosion", type: "evidence", description: "Progress dissolves into automated quietness." }
          ],
          criticalThinkingQuestion: "Discuss how deep personalization limits balanced perspectives on complex subjects. Present a futuristic solution.",
          translationChallenge: {
            chineseSentence1: "我們很少遇到像這個主題這樣引人深思的事物。",
            chineseSentence2: "要是我們忽視它，進步就會停止。",
            correctEnglish1: "Seldom do we encounter anything as thought-provoking as this topic.",
            correctEnglish2: "Were we to ignore it, progress would cease.",
            prompt: "Translate with advanced double inversion structures",
            hints: ["Start with: 'Seldom do we encounter...'", "Use 'thought-provoking' for 引人深思.", "Start second with: 'Were we to ignore it...'"]
          },
          gsatWritingPrompt: {
            title: "學測英文作文高分挑戰題目：" + targetTopic,
            promptText: `近年來，「${targetTopic}」在社會大眾及教育學術界引起了層出不窮的論證。請根據此現象，撰寫一篇字數約150-180個單字的英文作文。`,
            paragraph1Prompt: `第一段：針對「${targetTopic}」的興起與影響進行扼要描述與概念總結，點出本主題在現代生活上的兩面刃本質。`,
            paragraph2Prompt: `第二段：陳述你個人的觀點、立場或相關的日常生活經歷。深入剖析我們該如何以理性的思辨，安全地與此議題共處甚至提出創造性解方。`,
            guidelines: [
              "第一段須能客觀引述「" + targetTopic + "」的雙向作用與時代特徵，要求文法結構完善、用詞高雅。",
              "第二段應以知性感性兼具的筆觸，敘述具體生活歷練或切身見聞，引述思辨邏輯與具體適應方針。",
              "作文全篇宜靈活調用倒裝句 (Not only / Seldom) 或 inverted third condition (Were we to...) 作為寫作句型亮點。"
            ],
            sampleEssay: `Rarely do modern thinkers confront an issue as multidimensional as ${targetTopic}. Initially, it plays an indispensable role in streamlining intellectual tasks and optimizing daily solutions. However, were societies to abuse its applications, severe ethical compromises would undoubtedly follow.\n\nFrom my standpoint, we must navigate ${targetTopic} with extreme caution and critical inquiry. On a personal level, I have learned to cross-examine digital sources rather than trust them blindly. Only when we establish rigorous ethical parameters can we safely harvest its monumental power while conserving humanity's core values.`
          }
        }
      };

      const updatedList = [simulatedNewLesson, ...lessons];
      saveLessons(updatedList);
      setActiveLessonId(simulatedNewLesson.id);
      setCustomTopicInput("");
      setUploadedText("");
      setUploadedFile(null);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Find currently active lesson structure
  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-indigo-150" id="academy-root">
      
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-800 flex items-center justify-center text-white font-serif text-lg font-bold shadow-md">
            Ω
          </div>
          <div>
            <h1 className="font-serif font-extrabold text-2xl md:text-3xl tracking-tight text-slate-900 leading-tight">
              Shirley Du's Differentiated English Academy (杜老師英文分級講堂)
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-tight mt-1 flex items-center gap-15">
              <span>Professional Differentiated Online Instruction Designed by Shirley Du</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span className="text-emerald-600 font-bold">Online Active</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Layout Block */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column (col-span-3): Lesson Versions list and generator */}
        <aside className="lg:col-span-3 space-y-6">

          {/* Differentiated Lesson List Section */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" id="lesson-history-list">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> 選擇授課教案
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {lessons.map((l) => {
                const isActive = l.id === activeLessonId;
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      playTapSound();
                      setActiveLessonId(l.id);
                    }}
                    type="button"
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col gap-0.5 border cursor-pointer ${
                      isActive 
                        ? "bg-indigo-50/80 text-indigo-900 border-indigo-200/60 shadow-xs" 
                        : "text-slate-600 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <span className="truncate w-full block">{l.topic}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{l.createdAt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* File Upload & Input Panel */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" id="lesson-versions-selector">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Upload className="w-4 h-4 text-indigo-500" /> 匯入與分析英文素材
            </h3>
            
            {/* Drag & Drop Upload Zone */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                📂 匯入英文素材 (Upload Material)
              </span>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-xl p-3 text-center transition-all ${
                  dragActive 
                    ? "border-indigo-500 bg-indigo-50/20 scale-[0.98]" 
                    : "border-slate-200 bg-slate-50 hover:border-indigo-300"
                }`}
                id="materials-drag-drop"
              >
                <Upload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                <span className="text-[10px] text-slate-500 block">
                  拖曳講義 (PDF、Word、圖片或文本) 至此或
                </span>
                <label htmlFor="file-upload-input" className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer block mt-1">
                  點擊選擇檔案
                  <input
                    type="file"
                    id="file-upload-input"
                    name="fileUploadInput"
                    accept=".txt,.md,.json,.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploadedFile && (
                <div className="bg-emerald-50 text-emerald-800 text-[10px] p-2 rounded-lg border border-emerald-200 font-bold animate-pulse flex items-center justify-between">
                  <span className="truncate">📎 附屬教材：{uploadedFile.name}</span>
                  <button 
                    type="button" 
                    onClick={() => { setUploadedFile(null); setUploadedText(""); }} 
                    className="text-emerald-950 font-black hover:text-red-500 px-1 ml-1"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* AI Dynamic custom lesson version generator */}
            <form onSubmit={handleCreateCustomVersion} className="pt-4 mt-2 space-y-2.5">
              <div>
                <label htmlFor="custom-topic-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  ✍️ 教材主題/或手動貼上
                </label>
                <input
                  type="text"
                  name="customTopicInput"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="輸入課堂主題 (e.g. AI Technology...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-400 text-slate-800 placeholder:text-slate-400"
                  id="custom-topic-input"
                  disabled={isGeneratingLesson}
                />
              </div>

              <div>
                <label htmlFor="uploaded-text-textarea" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  📖 手動貼上英文教材
                </label>
                <textarea
                  id="uploaded-text-textarea"
                  name="uploadedText"
                  value={uploadedText}
                  onChange={(e) => setUploadedText(e.target.value)}
                  placeholder="或直接貼上長篇英文素材（將自動轉化切分為初/中/高三級教案、文法提示與寫作翻譯配對）"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-400 text-slate-800 placeholder:text-slate-400 resize-none font-mono"
                  disabled={isGeneratingLesson}
                />
                {uploadedText && (
                  <span className="text-[9px] text-slate-400 text-right block">
                    載入長度: {uploadedText.length} 字元
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-300 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                id="submit-custom-topic-btn"
                disabled={isGeneratingLesson}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                {isGeneratingLesson ? "AI 正在分析微分中..." : "AI 開始分析生成三級版本"}
              </button>

              {isGeneratingLesson && (
                <div className="mt-2 text-[10px] text-indigo-600 font-bold flex items-center gap-2">
                  <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>正在智慧微分文句，精準重組文法結構與字彙練習中...</span>
                </div>
              )}

              {generationError && (
                <div className="mt-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{generationError}</span>
                </div>
              )}
            </form>
          </section>

          {/* Helpful references */}
          <div className="bg-slate-100/60 p-4 border border-slate-200 rounded-2xl space-y-2">
            <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> 本校翻譯寫作標準</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              翻譯大師在進階（Advanced）評估中，將嚴格對比英語中的「主語助動詞倒裝」與「Were / Had 條件句」，拼寫不符會予以文法扣分，引導最正統的寫作風格！
            </p>
          </div>
        </aside>

        {/* Center / Middle Column containing main level content (col-span-9) */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Active Lesson Topic Information Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" id="topic-intro-card">
            <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-tr from-slate-100 to-indigo-50/40 rounded-full blur-3xl -z-10" />
            
            <div className="space-y-1">
              <span className="text-[10px] bg-slate-900 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Current Learning Lesson (當前授課版)
              </span>
              <h2 className="font-serif font-black text-2xl text-slate-900 tracking-tight mt-1">{activeLesson?.topic || "Loading Topic..."}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-sans">
                <Calendar className="w-3.5 h-3.5" /> 生成自: {activeLesson?.createdAt}
              </p>

              {/* Directly Downloadable versions bar */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-100" id="direct-download-row">
                <span className="text-[10px] font-sans text-slate-400 font-bold block">教材直接下載:</span>
                <button
                  onClick={() => downloadLessonMarkdown(activeLesson)}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer"
                  title="將此課堂的所有版本輸出為通用 markdown 講義"
                  id="direct-download-md-button"
                >
                  <FileText className="w-3 h-3 text-emerald-600" /> Markdown 講義 (.md)
                </button>
                <button
                  onClick={() => downloadLessonDoc(activeLesson)}
                  className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer"
                  title="匯出適合 Microsoft Word 編輯的通用精裝格式講義"
                  id="direct-download-doc-button"
                >
                  <FileText className="w-3 h-3 text-sky-600" /> 下載 Word (.doc)
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer"
                  title="將本節課堂的所有精細難度分級板，打包匯出為精裝列印 PDF"
                  id="direct-download-pdf-button"
                >
                  <Download className="w-3 h-3 text-rose-600" /> 匯出 PDF 講義 (.pdf)
                </button>
                <button
                  onClick={() => downloadLessonJSON(activeLesson)}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-850 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer"
                  title="匯出此課堂的完整 JSON 設計數據"
                  id="direct-download-json-button"
                >
                  <Download className="w-3 h-3 text-indigo-600" /> 下載 JSON 版本 (.json)
                </button>
              </div>
            </div>

            {/* Level selection tabs aligned horizontal */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
              {[
                { id: "beginner", zh: "基礎 (Basic)" },
                { id: "intermediate", zh: "中級 (Essential)" },
                { id: "advanced", zh: "高級 (Advanced)" }
              ].map((lvl) => {
                const isActive = activeLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      playTapSound();
                      setActiveLevel(lvl.id as any);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                    id={`lvl-tab-${lvl.id}`}
                  >
                    {lvl.zh}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Differentiated level workspace wrapper */}
          <div className="space-y-2">
            {/* Level metadata sub-header badge explaining focus areas */}
            {activeLevel === "beginner" && (
              <div className="bg-sky-50 border border-sky-100 p-3 rounded-2xl flex items-start gap-2.5 text-sky-950 font-sans text-xs">
                <span className="bg-sky-600 text-white rounded-full p-1 text-[10px]">✨</span>
                <div>
                  <strong>初級班專注大綱：</strong> 首重基礎核心文法 (Subject-Verb agreement)、主題基本單词 (Words match-pair puzzle) 的配對熟練度及翻譯大意！
                </div>
              </div>
            )}
            {activeLevel === "intermediate" && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex items-start gap-2.5 text-indigo-950 font-sans text-xs">
                <span className="bg-indigo-600 text-white rounded-full p-1 text-[10px]">📈</span>
                <div>
                  <strong>中級班專注大綱：</strong> 重點檢析英語母語者常用「Verb-Noun 搭配詞（Collocations）」、引導分詞構句，並對照文章事實探討微觀大意！
                </div>
              </div>
            )}
            {activeLevel === "advanced" && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-start gap-2.5 text-rose-955 font-sans text-xs animate-pulse">
                <span className="bg-rose-600 text-white rounded-full p-1 text-[10px]">🎓</span>
                <div>
                  <strong>高級班專注大綱：</strong> 論著思辨。熟稔負面否定倒裝句型（Not until/Seldom）、虛擬倒裝，利用 Graphic Organizer 分析論文骨架及進行思辨寫作！
                </div>
              </div>
            )}

            {/* Display correct view */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeLesson?.id}-${activeLevel}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeLevel === "beginner" && activeLesson && (
                  <BeginnerView
                    lesson={activeLesson.beginner}
                    onAddPoints={handleAddPoints}
                    topic={activeLesson.topic}
                  />
                )}
                {activeLevel === "intermediate" && activeLesson && (
                  <IntermediateView
                    lesson={activeLesson.intermediate}
                    onAddPoints={handleAddPoints}
                    topic={activeLesson.topic}
                  />
                )}
                {activeLevel === "advanced" && activeLesson && (
                  <AdvancedView
                    lesson={activeLesson.advanced}
                    onAddPoints={handleAddPoints}
                    topic={activeLesson.topic}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>



        </main>
      </div>

      {/* Global Academic Footer */}
      <footer className="bg-slate-900 text-slate-450 border-t border-slate-800 py-6 text-center text-xs mt-12 space-y-1">
        <p className="text-slate-200 font-serif font-bold flex items-center justify-center gap-1">
          Differentiated English Online Instruction Platform 
        </p>
        <p className="text-xs text-slate-500 font-sans">
          Powered by Google Gemini-3.5-Flash & OpenAI & High-Contrast Web Audio FX • Traditional Chinese (繁體中文) Support
        </p>
      </footer>

      {/* Printable PDF Lesson Pack - HIDDEN on screen, visible only when printing */}
      <div className="hidden print:block font-sans p-8 bg-white text-black" id="printable-pdf-pack">
        <div className="text-center pb-4 border-b-2 border-slate-950">
          <h1 className="text-3xl font-serif font-extrabold tracking-tight">杜老師英文分級講堂 - 完整分級教學資源包</h1>
          <p className="text-sm text-slate-500 font-sans mt-2">
            主題：<span className="font-bold text-slate-800">{activeLesson?.topic}</span> &bull; 
            設計導師：<span className="font-bold text-slate-800">Shirley Du</span> &bull; 
            日期：{activeLesson?.createdAt}
          </p>
        </div>

        {/* Beginner Section */}
        <section className="space-y-4 break-after-page mt-8">
          <h2 className="text-xl font-serif font-black border-b border-slate-400 pb-1 text-slate-900">學程 1：基礎班教材 (Basic Level Lesson)</h2>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">📖 閱讀文章 (Reading Passage)</h3>
            <p className="text-sm leading-relaxed p-4 bg-slate-50 border-l-4 border-slate-400 text-justify font-serif italic">{activeLesson?.beginner.text}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">💡 核心文法技巧 (Grammar Tip)</h3>
            <p className="text-xs font-bold text-slate-800">主題: {activeLesson?.beginner.grammarTipTitle}</p>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{activeLesson?.beginner.grammarTipContent}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">📝 關鍵單字與例句 (Vocabulary Review)</h3>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">單字 (Word)</th>
                  <th className="p-2 border-r border-slate-200">中文 (Chinese)</th>
                  <th className="p-2 border-r border-slate-200">英文定義 (Definition)</th>
                  <th className="p-2">精選例句 (Example Sentence)</th>
                </tr>
              </thead>
              <tbody>
                {activeLesson?.beginner.vocabulary?.map((v) => (
                  <tr key={v.word} className="border-b border-slate-200">
                    <td className="p-2 font-bold border-r border-slate-200">{v.word}</td>
                    <td className="p-2 border-r border-slate-200">{v.chinese}</td>
                    <td className="p-2 border-r border-slate-200 italic text-slate-600">{v.definition}</td>
                    <td className="p-2 leading-tight text-slate-700">{v.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">🔍 主旨理解測試 (Comprehension MCQ)</h3>
            <p className="text-xs font-semibold">Q: {activeLesson?.beginner.mainIdeaQuestion}</p>
            <ul className="text-xs space-y-1 list-disc list-inside pl-2">
              {activeLesson?.beginner.mainIdeaOptions.map((opt, idx) => (
                <li key={idx} className={idx === activeLesson?.beginner.mainIdeaAnswer ? "font-bold text-black" : "text-slate-600"}>
                  {opt} {idx === activeLesson?.beginner.mainIdeaAnswer ? "(✔ 參考答案)" : ""}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Intermediate Section */}
        <section className="space-y-4 break-after-page mt-8 pt-8 border-t border-slate-300">
          <h2 className="text-xl font-serif font-black border-b border-slate-400 pb-1 text-slate-900">學程 2：中級班教材 (Essential Level Lesson)</h2>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">📖 閱讀文章 (Reading Passage)</h3>
            <p className="text-sm leading-relaxed p-4 bg-slate-50 border-l-4 border-slate-400 text-justify font-serif italic">{activeLesson?.intermediate.text}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">💡 核心文法技巧 (Grammar Tip)</h3>
            <p className="text-xs font-bold text-slate-800">主題: {activeLesson?.intermediate.grammarTipTitle}</p>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{activeLesson?.intermediate.grammarTipContent}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">🔗 實用語塊搭配 (Collocations)</h3>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">常用搭配語 (Phrase)</th>
                  <th className="p-2 border-r border-slate-200">中文 (Chinese Translation)</th>
                  <th className="p-2">配對組成結構 (Composition)</th>
                </tr>
              </thead>
              <tbody>
                {activeLesson?.intermediate.collocations?.map((c) => (
                  <tr key={c.phrase} className="border-b border-slate-200">
                    <td className="p-2 font-bold border-r border-slate-200">{c.phrase}</td>
                    <td className="p-2 border-r border-slate-200">{c.chinese}</td>
                    <td className="p-2 text-slate-600">{c.verb} (v) + {c.noun} (n)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">🔬 課文細節探微 (Reading Detailed QA)</h3>
            <ul className="text-xs space-y-2">
              {activeLesson?.intermediate.readingDetails?.map((d, idx) => (
                <li key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-150">
                  <strong>問：</strong> {d.question}<br/>
                  <strong className="text-slate-700">答：</strong> {d.answer}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Advanced Section */}
        <section className="space-y-4 mt-8 pt-8 border-t border-slate-300">
          <h2 className="text-xl font-serif font-black border-b border-slate-400 pb-1 text-slate-900">學程 3：高級班教材 (Advanced Level Lesson)</h2>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">📖 閱讀文章 (Reading Passage)</h3>
            <p className="text-sm leading-relaxed p-4 bg-slate-50 border-l-4 border-slate-400 text-justify font-serif italic">{activeLesson?.advanced.text}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">💡 核心文法技巧 (Grammar Tip)</h3>
            <p className="text-xs font-bold text-slate-800">主題: {activeLesson?.advanced.grammarTipTitle}</p>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">{activeLesson?.advanced.grammarTipContent}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-700">🎓 進階句型與特殊文法 (Advanced Structs)</h3>
            <table className="w-full text-left text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200">結構類型 (Type)</th>
                  <th className="p-2 border-r border-slate-200">文法規則與解析 (Rule & Explanation)</th>
                  <th className="p-2">範例說明句 (Sentence Example)</th>
                </tr>
              </thead>
              <tbody>
                {activeLesson?.advanced.advancedGrammar?.map((g, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 font-bold border-r border-slate-200 text-indigo-700 uppercase">{g.type}</td>
                    <td className="p-2 border-r border-slate-200">{g.rule}<br/><span className="text-[10px] text-slate-500 font-sans">{g.explanation}</span></td>
                    <td className="p-2 italic text-slate-700 leading-tight">{g.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-700">🧠 批判思辨討論 (Critical Thinking Seminar)</h3>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-150 leading-relaxed font-serif italic">“{activeLesson?.advanced.criticalThinkingQuestion}”</p>
          </div>

          {activeLesson?.advanced.gsatWritingPrompt && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 mt-4">
              <h4 className="font-bold text-sm text-amber-900">🎯 台灣學測英文寫作挑戰 (Taiwan GSAT Writing Prompt)</h4>
              <p className="text-xs text-slate-800 leading-relaxed"><b>作文題目說明：</b>{activeLesson.advanced.gsatWritingPrompt.promptText}</p>
              <div className="text-xs grid grid-cols-2 gap-4 pt-1 border-t border-dashed border-amber-200">
                <div>
                  <strong>第一段 (Paragraph 1) 規劃：</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">{activeLesson.advanced.gsatWritingPrompt.paragraph1Prompt}</p>
                </div>
                <div>
                  <strong>第二段 (Paragraph 2) 規劃：</strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">{activeLesson.advanced.gsatWritingPrompt.paragraph2Prompt}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed border-amber-200">
                <strong>寫作評分重要指南 (Guidelines)：</strong>
                <ul className="text-[11px] list-decimal pl-4 text-slate-700 space-y-0.5 mt-1">
                  {activeLesson.advanced.gsatWritingPrompt.guidelines.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-dashed border-amber-200">
                <strong>高分範文建議 (Model Sample Essay)：</strong>
                <p className="text-xs bg-white p-3 border-l-2 border-amber-400 font-serif italic text-slate-800 whitespace-pre-wrap leading-relaxed mt-1">
                  {activeLesson.advanced.gsatWritingPrompt.sampleEssay}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
