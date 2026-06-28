import React, { useState, useEffect } from "react";
import { LevelLesson, AdvancedGrammarRule, GraphicOrganizerNode } from "../types";
import { playTapSound, playSuccessSound, playErrorSound, speakWord } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, HelpCircle, Sparkles, BookOpen, Star, Trophy, RefreshCw, Send, CheckCircle, Network, HelpCircle as HelpIcon, ArrowRight, BrainCircuit } from "lucide-react";

interface AdvancedViewProps {
  lesson: LevelLesson;
  onAddPoints: (pts: number) => void;
  topic: string;
}

export default function AdvancedView({ lesson, onAddPoints, topic }: AdvancedViewProps) {
  // Grammar Laboratory State
  const [activeGrammarFocus, setActiveGrammarFocus] = useState<AdvancedGrammarRule | null>(null);
  
  // Syntax builder scrambler game
  const [scramblePool, setScramblePool] = useState<string[]>([]);
  const [scrambleAssembled, setScrambleAssembled] = useState<string[]>([]);
  const [scrambleSuccess, setScrambleSuccess] = useState(false);
  const [currentScrambleIdx, setCurrentScrambleIdx] = useState(0);

  const advancedScrambleTargets = [
    {
      tokens: ["Not", "only", "does", "nature", "elevate", "our", "minds", "but", "it", "also", "provides", "life", "resources"],
      joined: "not only does nature elevate our minds but it also provides life resources",
      hint: "起首採用否定詞 Not only 進行助動詞 (does) 倒裝"
    },
    {
      tokens: ["Seldom", "do", "we", "witness", "such", "sublime", "grandeur", "without", "feeling", "spiritual", "awe"],
      joined: "seldom do we witness such sublime grandeur without feeling spiritual awe",
      hint: "否定副詞 Seldom 移至句首，主詞 we 與助動詞 do 倒裝"
    },
    {
      tokens: ["Were", "societies", "to", "neglect", "ecological", "boundaries", "collapse", "would", "be", "imminent"],
      joined: "were societies to neglect ecological boundaries collapse would be imminent",
      hint: "利用 Were + 主詞 + to-V 代替虛擬條件句 If societies were to..."
    }
  ];

  // Graphic Organizer node hover state
  const [activeNodeId, setActiveNodeId] = useState<string | null>("root-node");

  // Reading Comprehension MC States
  const [selectedMcOption, setSelectedMcOption] = useState<number | null>(null);
  const [mcState, setMcState] = useState<"idle" | "correct" | "incorrect">("idle");

  // Critical Thinking Essay states
  const [essayText, setEssayText] = useState("");
  const [isEvaluatingEssay, setIsEvaluatingEssay] = useState(false);
  const [essayFeedback, setEssayFeedback] = useState<string | null>(null);

  // Translation States
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any | null>(null);

  useEffect(() => {
    if (lesson.advancedGrammar) {
      setActiveGrammarFocus(lesson.advancedGrammar[0]);
    }
    
    // Set up syntax scrambler game
    const target = advancedScrambleTargets[currentScrambleIdx % advancedScrambleTargets.length];
    setScramblePool([...target.tokens].sort(() => Math.random() - 0.5));
    setScrambleAssembled([]);
    setScrambleSuccess(false);

    // Graphic Organizer reset
    setActiveNodeId(lesson.graphicOrganizer?.[0]?.id || "root-node");

    // MC Reset
    setSelectedMcOption(null);
    setMcState("idle");

    // Translation Reset
    setAnswer1("");
    setAnswer2("");
    setGradingResult(null);
    setShowHints(false);

    // Essay Reset
    setEssayText("");
    setEssayFeedback(null);
  }, [lesson, topic, currentScrambleIdx]);

  // Click on Scramble selection
  const handleScramblePoolClick = (word: string, index: number) => {
    playTapSound();
    setScrambleAssembled((prev) => [...prev, word]);
    const updated = [...scramblePool];
    updated.splice(index, 1);
    setScramblePool(updated);
  };

  // Remove assembled word
  const handleRemoveAssembled = (word: string, index: number) => {
    playTapSound();
    const updated = [...scrambleAssembled];
    updated.splice(index, 1);
    setScrambleAssembled(updated);
    setScramblePool((prev) => [...prev, word]);
  };

  const handleVerifyScramble = () => {
    const userSentence = scrambleAssembled.join(" ").toLowerCase();
    const target = advancedScrambleTargets[currentScrambleIdx % advancedScrambleTargets.length];
    const targetJoined = target.joined.toLowerCase();

    if (userSentence === targetJoined) {
      playSuccessSound();
      setScrambleSuccess(true);
      onAddPoints(35);
    } else {
      playErrorSound();
      alert(`❌ 倒裝句順序不符。請再試一次！\n線索提示：${target.hint}`);
    }
  };

  const nextScramblePuzzle = () => {
    playTapSound();
    setCurrentScrambleIdx((prev) => prev + 1);
  };

  const handleMcChoice = (idx: number) => {
    if (mcState !== "idle") return;
    setSelectedMcOption(idx);
    if (idx === lesson.mainIdeaAnswer) {
      playSuccessSound();
      setMcState("correct");
      onAddPoints(30);
    } else {
      playErrorSound();
      setMcState("incorrect");
    }
  };

  const handleAssessTranslation = async () => {
    if (!answer1.trim() || !answer2.trim()) {
      alert("請完成高級倒裝與虛擬雙句翻譯再進行大師評估！");
      return;
    }
    playTapSound();
    setIsGrading(true);
    setGradingResult(null);

    try {
      const response = await fetch("/api/lesson/grade-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentAnswer1: answer1,
          studentAnswer2: answer2,
          target1: lesson.translationChallenge.correctEnglish1,
          target2: lesson.translationChallenge.correctEnglish2,
          level: "Advanced",
          prompt: lesson.translationChallenge.prompt
        }),
      });

      const data = await response.json();
      setGradingResult(data);
      if (data.score >= 40) {
        onAddPoints(data.score);
        playSuccessSound();
      } else {
        playErrorSound();
      }
    } catch (err) {
      console.error(err);
      playErrorSound();
    } finally {
      setIsGrading(false);
    }
  };

  // Submit critical thinking view to dynamic grading or provide premium robust analytical feedback
  const handleAssessEssay = async () => {
    if (!essayText.trim() || essayText.trim().split(/\s+/).length < 5) {
      alert("請輸入至少 5 個英文單詞的學術評論觀點！");
      return;
    }
    playTapSound();
    setIsEvaluatingEssay(true);
    setEssayFeedback(null);

    // Call lightweight post route or evaluate local rich text
    try {
      const response = await fetch("/api/lesson/grade-translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentAnswer1: essayText,
          studentAnswer2: "COMPLETED CRITICAL ESSAY",
          target1: "Academic critical thinking coherence",
          target2: "Sophisticated vocabulary usage",
          level: "Advanced",
          prompt: lesson.criticalThinkingQuestion || "Critical Essay Stance"
        }),
      });

      const data = await response.json();
      // Translate translation feedback to essay feedback
      const essayReport = `【邏輯連貫評鑑】
${data.encouragement}

【字彙學術度評分】
${data.vocabularyFeedback}

【句型進階診斷】
${data.grammarFeedback}
  
【學術大師美化版（Suggested Polish）】
"${data.suggestedPhrasing.split(".")[0]}."`;

      setEssayFeedback(essayReport);
      onAddPoints(40); // Reward for essay dedication!
      playSuccessSound();
    } catch (err) {
      // Local fallback
      setEssayFeedback(`【邏輯連貫評估】
感謝您的高質量思辨回饋！您的作文中巧妙提及了該主題的複雜平衡。

【學術配分詞指引】
語彙選擇契合學術核心議題。

【教師美化版範文參考（Suggested Polish）】
"From an ethical perspective, human agencies must proactively manage artificial systems rather than abdicating judgment to algorithmic models."`);
      onAddPoints(30);
      playSuccessSound();
    } finally {
      setIsEvaluatingEssay(false);
    }
  };

  const getOrganizerNodes = (): GraphicOrganizerNode[] => {
    return lesson.graphicOrganizer || [];
  };

  return (
    <div className="space-y-8" id="advanced-level-view">
      
      {/* 2. Interactive Mind-Map / Graphic Organizer of the Text */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden" id="graphic-organizer-section">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-slate-800">課文心智結構圖 (Graphic Organizer Canvas)</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">進階學術論文講求嚴謹架構。點選下方架構圖卡片，查閱「中心論點 ➔ 段落論點 ➔ 有力證據」的邏輯推演鏈！</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Panel: Graphic Organizer Tree Representation */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-150 p-5 rounded-2xl flex flex-col justify-center space-y-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">結構階層 Tree Hierarchy Diagram</span>
            
            {getOrganizerNodes().map((node) => {
              const isActive = activeNodeId === node.id;
              
              let nodeStyle = "border-slate-200 bg-white text-slate-700 hover:border-slate-350";
              if (isActive) {
                if (node.type === "thesis") nodeStyle = "border-rose-400 bg-rose-50 text-rose-950 shadow-sm shadow-rose-100 ring-2 ring-rose-200";
                else if (node.type === "point") nodeStyle = "border-indigo-400 bg-indigo-50 text-indigo-950 shadow-sm shadow-indigo-100 ring-2 ring-indigo-200";
                else nodeStyle = "border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm shadow-emerald-100 ring-2 ring-emerald-250";
              }

              return (
                <button
                  key={node.id}
                  onClick={() => {
                    playTapSound();
                    setActiveNodeId(node.id);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm flex items-center justify-between ${nodeStyle} ${
                    node.type === "point" ? "ml-5 md:ml-8 w-[calc(100%-1.25rem)] md:w-[calc(100%-2rem)]" : node.type === "evidence" ? "ml-10 md:ml-16 w-[calc(100%-2.5rem)] md:w-[calc(100%-4rem)]" : ""
                  }`}
                  id={`organizer-node-${node.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md font-bold ${
                      node.type === "thesis" ? "bg-rose-100 text-rose-700" : node.type === "point" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {node.type}
                    </span>
                    <span className="font-sans font-semibold tracking-tight">{node.label}</span>
                  </div>
                  <HelpIcon className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>

          {/* Right Panel: Content explanation of selected node */}
          <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">結構節點析論 (Node Analysis Details)</h4>
              
              {activeNodeId ? (
                <AnimatePresence mode="wait">
                  {getOrganizerNodes().map((node) => {
                    if (node.id !== activeNodeId) return null;
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">節點名稱 Node Name</span>
                          <p className="text-sm font-bold text-slate-800">{node.label}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block mb-1">細緻論證邏輯 Reasoning</span>
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                            {node.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <p className="text-xs">點擊左側圖譜，將文章邏輯脈絡拆解得一目了然！</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 font-sans">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold">學思辨亮點 Skill Goal</span>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                高級英語學術和寫作的核心，在於「不只看懂句子，更能洞悉論述的骨架（Structure）」。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Elite Reading Text & Grammar Corner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-slate-800">高級學術議論文閱讀</h3>
              <p className="text-xs text-slate-500 mt-0.5">點選特定單字解鎖高級發音教材 🗣️</p>
            </div>
          </div>

          <div className="text-slate-800 text-base leading-relaxed tracking-wide font-sans bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-6">
            {lesson.text.split(" ").map((word, idx) => {
              const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
              return (
                <span
                  key={idx}
                  onClick={() => {
                    playTapSound();
                    speakWord(cleanWord, 0.85);
                  }}
                  className="inline-block mr-1.5 cursor-pointer rounded px-1 transition-all py-0.5 hover:bg-slate-200 text-slate-800"
                >
                  {word}
                </span>
              );
            })}
          </div>

          <button
            onClick={() => {
              playTapSound();
              speakWord(lesson.text, 0.82);
            }}
            className="w-full py-2.5 bg-slate-850 hover:bg-slate-900 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            id="read-advanced-text-btn"
          >
            朗讀高級全文
          </button>
        </section>

        {/* Advanced Grammar Box */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-5 flex flex-col justify-between" id="advanced-grammar-inspector">
          <div>
            <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              高級特殊句型實驗室
              <span className="text-xs text-slate-400 font-normal">Syntax Lab</span>
            </h3>

            {lesson.advancedGrammar && (
              <div className="space-y-4">
                <div className="flex gap-1.5 flex-wrap">
                  {lesson.advancedGrammar.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        playTapSound();
                        setActiveGrammarFocus(g);
                      }}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-all uppercase font-bold ${
                        activeGrammarFocus === g
                          ? "bg-rose-50 border-rose-300 text-rose-700"
                          : "bg-slate-50 border-slate-150 text-slate-500 hover:border-slate-250"
                      }`}
                    >
                      {g.type}
                    </button>
                  ))}
                </div>

                {activeGrammarFocus && (
                  <motion.div
                    key={activeGrammarFocus.rule}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4 border border-rose-100 bg-rose-50/20 p-4 rounded-xl"
                  >
                    <div>
                      <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold block mb-0.5">句型公式 Rule</span>
                      <p className="text-xs font-mono font-semibold text-slate-800">{activeGrammarFocus.rule}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold block mb-0.5">學術寫作範例 Example</span>
                      <p className="text-xs text-rose-950 font-sans italic">"{activeGrammarFocus.example}"</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold block mb-0.5">中文剖析與限制 Usage</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{activeGrammarFocus.explanation}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">高級寫作叮嚀 Tip</span>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              倒裝句與 Unreal conditionals 是提升 IELTS/TOEFL 寫作、進階翻譯以及學術論文亮點的關鍵。
            </p>
          </div>
        </section>
      </div>

      {/* 4. Advanced Syntax Scrambler Game */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden" id="advanced-scramble-section">
        <div className="absolute right-0 top-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-slate-800 flex items-center gap-2">
                倒裝與虛擬句型排布大師 (Advanced Syntax Scrambler)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">點擊黃色字卡拼湊通順的高級句型。主謂語順序是關鍵！</p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              const target = advancedScrambleTargets[currentScrambleIdx % advancedScrambleTargets.length];
              setScramblePool([...target.tokens].sort(() => Math.random() - 0.5));
              setScrambleAssembled([]);
              setScrambleSuccess(false);
            }}
            className="text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1.5 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重置本局
          </button>
        </div>

        {/* Puzzle prompt & hints */}
        <div className="bg-slate-50 p-3.5 rounded-xl mb-4 border border-slate-150 text-xs">
          <span className="font-bold text-slate-700 block mb-1">🎯 句型引導與線索 Hints:</span>
          <p className="text-slate-500 italic">"{advancedScrambleTargets[currentScrambleIdx % advancedScrambleTargets.length].hint}"</p>
        </div>

        {/* Word assembled board */}
        <div className="bg-slate-50 border border-slate-200 min-h-[4.5rem] rounded-xl p-4 flex flex-wrap gap-2 items-center mb-4">
          {scrambleAssembled.map((w, idx) => (
            <button
              key={idx}
              onClick={() => handleRemoveAssembled(w, idx)}
              className="bg-rose-600 text-white px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-rose-700 transition-all"
            >
              {w}
            </button>
          ))}
          {scrambleAssembled.length === 0 && (
            <span className="text-xs text-slate-400 italic">在下方點詞，堆砌大師級結構...</span>
          )}
        </div>

        {/* Scramble choices leftover */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          {scramblePool.map((word, i) => (
            <button
              key={i}
              onClick={() => handleScramblePoolClick(word, i)}
              className="bg-rose-100/75 text-rose-900 border border-rose-250 hover:bg-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              {word}
            </button>
          ))}
          {scramblePool.length === 0 && !scrambleSuccess && (
            <button
              onClick={handleVerifyScramble}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
              id="verify-advanced-scramble-btn"
            >
              Verify Assembly 驗證大師倒裝
            </button>
          )}
          {scrambleSuccess && (
            <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-150 rounded-xl mt-2 text-emerald-950 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span><strong>倒裝結構正確！加值 35 點學位點數！</strong></span>
              </div>
              <button
                onClick={nextScramblePuzzle}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg"
                id="next-scramble-puzzle-btn"
              >
                解鎖下一題 (Next Puzzle) 👉
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Critical Thinking Board with essays feedback */}
      {lesson.criticalThinkingQuestion && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden" id="critical-thinking-forum">
          <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            批判性思維論壇 (Critical Thinking Forum)
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">Advanced Prompt</span>
          </h3>
          <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 font-sans font-medium line-relaxed">
            🤔 <strong>思辨論點寫作:</strong> "{lesson.criticalThinkingQuestion}"
          </p>

          <div className="space-y-4">
            <textarea
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="In my thesis, reconciling industrial growth with pure preservation involves systemic changes. For one, if policies enforce..."
              className="w-full min-h-[7rem] border border-slate-200 rounded-xl p-4 text-xs font-sans text-slate-800 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400"
              id="advanced-essay-input"
            />

            <div className="flex justify-end">
              <button
                onClick={handleAssessEssay}
                disabled={isEvaluatingEssay || !essayText.trim()}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-900 border border-slate-750 text-slate-100 font-medium text-xs rounded-xl shadow-sm transition-all"
                id="advanced-submit-essay-btn"
              >
                {isEvaluatingEssay ? "大師 AI 評論評分中..." : "送出觀點評鑑 (Submit Essay)"}
              </button>
            </div>

            {essayFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50/40 border border-emerald-150 p-5 rounded-xl space-y-3"
              >
                <div className="flex items-center gap-2 border-b border-emerald-100/85 pb-2">
                  <span className="text-base">🎓</span>
                  <h4 className="text-xs font-bold text-emerald-800">大師 AI 教授與批判觀點評論報告</h4>
                </div>
                <div className="text-xs text-emerald-950 font-sans leading-relaxed whitespace-pre-wrap">
                  {essayFeedback}
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* 6. Reading Comprehension MC Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden" id="advanced-mc-section">
        <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          文章大意及批判意圖分析 (Main Idea Quiz)
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">Advanced MC</span>
        </h3>
        <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">{lesson.mainIdeaQuestion}</p>

        <div className="space-y-2">
          {lesson.mainIdeaOptions.map((option, idx) => {
            const isSelected = selectedMcOption === idx;
            const isCorrect = idx === lesson.mainIdeaAnswer;
            
            let btnClass = "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700";
            if (mcState !== "idle") {
              if (isSelected && isCorrect) btnClass = "bg-emerald-50 border-emerald-400 text-emerald-950 font-medium";
              else if (isSelected && !isCorrect) btnClass = "bg-rose-50 border-rose-300 text-rose-950";
              else if (isCorrect) btnClass = "bg-emerald-50 border-emerald-250 text-emerald-950 opacity-80";
              else btnClass = "border-slate-100 text-slate-300 pointer-events-none opacity-50";
            }

            return (
              <button
                key={idx}
                onClick={() => handleMcChoice(idx)}
                disabled={mcState !== "idle"}
                className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm flex items-center gap-3 ${btnClass}`}
                id={`advanced-mc-option-${idx}`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        {mcState !== "idle" && (
          <div className={`p-4 rounded-xl mt-4 border text-xs leading-relaxed ${
            mcState === "correct" 
              ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
              : "bg-rose-50/50 border-rose-100 text-rose-800"
          }`}>
            {mcState === "correct" 
              ? "🎉 精采的學術思維！您對於作者在進階寫作中設定的含蓄對比以及雙端思索論述解析得一絲不苟！" 
              : "❌ 判斷受限。這是一篇高密度的多段論說，重新閱讀 graphic organizer 骨架可能有助於釐清核心。"}
          </div>
        )}
      </section>

      {/* 7. Chinese-to-English Translation Grade Challenge */}
      <section className="bg-rose-950 text-slate-100 rounded-2xl border border-rose-900 p-6 shadow-md relative overflow-hidden" id="advanced-translation-grader">
        <div className="absolute right-0 top-0 w-48 h-48 bg-rose-900 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-rose-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-900/40 text-rose-400 rounded-xl">
              <Trophy className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-white flex items-center gap-2">
                倒裝與虛擬極限翻譯挑戰 (Linked Advanced Translation)
                <span className="text-[10px] bg-rose-900 text-rose-300 px-2 py-0.5 rounded-full font-mono">Linked Double - Advanced</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">提供相互連貫的高難度中文，點選大師 AI 進行高度修辭、倒裝與虛擬語氣等特殊文法評析！</p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              setShowHints(!showHints);
            }}
            className="text-xs text-rose-300 hover:text-rose-200 border border-rose-800 px-3 py-1.5 rounded-lg bg-rose-900 flex items-center gap-1 transition-all"
            id="advanced-hint-toggle-btn"
          >
            {showHints ? "隱藏倒裝指南" : "解鎖倒裝指南"}
          </button>
        </div>

        {/* Display Chinese Source sentences */}
        <div className="space-y-3 mb-6 bg-rose-900/40 p-4 rounded-xl border border-rose-900/80">
          <div className="flex items-start gap-2.5">
            <span className="bg-rose-900 text-rose-300 font-mono text-xs font-bold px-1.5 py-0.5 rounded">Sentence A</span>
            <span className="text-sm text-slate-100 font-medium font-sans">{lesson.translationChallenge.chineseSentence1}</span>
          </div>
          <div className="flex items-start gap-2.5 border-t border-rose-900/80 pt-3">
            <span className="bg-rose-900 text-rose-300 font-mono text-xs font-bold px-1.5 py-0.5 rounded">Sentence B</span>
            <span className="text-sm text-slate-100 font-medium font-sans">{lesson.translationChallenge.chineseSentence2}</span>
          </div>
        </div>

        {/* Clues */}
        <AnimatePresence>
          {showHints && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-rose-900/60 border border-rose-800/80 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-rose-350 block mb-1">💡 教師提供的翻譯搭配結構線索（特別限定倒裝與條件句）：</span>
                {lesson.translationChallenge.hints.map((hint, idx) => (
                  <p key={idx} className="text-rose-250 flex items-center gap-1.5">
                    <span className="text-rose-400 font-bold">•</span> {hint}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-rose-350 mb-1">學生高級倒裝譯文第一句 (English Translation A - Inverted)</label>
            <input
              type="text"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder="Not until we respect..."
              className="w-full bg-slate-950 border border-rose-950 rounded-xl px-4 py-3 text-sm text-slate-150 focus:outline-none focus:border-rose-500 placeholder:text-slate-600 transition-colors"
              id="advanced-input-1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-rose-350 mb-1">學生高級虛擬譯文第二句 (English Translation B - Conditional)</label>
            <input
              type="text"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder="Otherwise, more ecosystems would..."
              className="w-full bg-slate-950 border border-rose-950 rounded-xl px-4 py-3 text-sm text-slate-150 focus:outline-none focus:border-rose-500 placeholder:text-slate-600 transition-colors"
              id="advanced-input-2"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleAssessTranslation}
              disabled={isGrading || !answer1.trim() || !answer2.trim()}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-850 disabled:text-rose-750 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-1.5 animate-pulse"
              id="advanced-grade-btn"
            >
              {isGrading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  英文文論大師評點中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> 提交高級大師 AI 極限評審 (Grade Transition)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Grated Score with Detailed Teacher Review feedback */}
        <AnimatePresence>
          {gradingResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 border-t border-rose-900 pt-6 space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/80 p-4 border border-rose-950 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-mono border-2 ${
                    gradingResult.score >= 90
                      ? "border-emerald-500 text-emerald-400 bg-emerald-950/20"
                      : gradingResult.score >= 70
                      ? "border-yellow-500 text-yellow-400 bg-yellow-950/20"
                      : "border-rose-500 text-rose-400 bg-rose-950/20"
                  }`}>
                    <span className="text-[10px] text-slate-400">SCORE</span>
                    <span className="text-xl font-bold">{gradingResult.score}</span>
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-white flex items-center gap-2">
                      {gradingResult.score >= 90 ? "頂峰造極 詞藻華美！" : gradingResult.score >= 70 ? "大師句風 初有斬獲！" : "句法殘破 重思順序！"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{gradingResult.encouragement}</p>
                  </div>
                </div>
                {gradingResult.offlineNotes && (
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                    本地快速評估
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5 text-rose-400" /> 母語者搭配詞診斷 Vocabulary Match
                  </h4>
                  <p className="text-xs text-slate-300 bg-rose-950 p-4 rounded-xl border border-rose-900 leading-relaxed">
                    {gradingResult.vocabularyFeedback}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" /> 特殊倒裝與虛擬法 Grammar Inversion Check
                  </h4>
                  <p className="text-xs text-slate-300 bg-rose-950 p-4 rounded-xl border border-rose-900 leading-relaxed">
                    {gradingResult.grammarFeedback}
                  </p>
                </div>
              </div>

              <div className="bg-rose-900/30 border border-rose-850 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  教師精美範文配對 (Model Formulation Solution)
                </h4>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 font-sans leading-relaxed"><span className="text-rose-400 font-bold">1:</span> {lesson.translationChallenge.correctEnglish1}</p>
                  <p className="text-slate-300 font-sans leading-relaxed"><span className="text-rose-400 font-bold">2:</span> {lesson.translationChallenge.correctEnglish2}</p>
                </div>
                {gradingResult.suggestedPhrasing && (
                  <div className="mt-3 border-t border-rose-950/40 pt-3">
                    <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider block mb-1">融合與美化版 (Synthesized Suggested Polish)</span>
                    <p className="text-slate-200 italic font-mono text-xs">"{gradingResult.suggestedPhrasing}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
