import React, { useState, useEffect } from "react";
import { LevelLesson, CollocationItem } from "../types";
import { playTapSound, playSuccessSound, playErrorSound, speakWord } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, HelpCircle, Sparkles, BookOpen, Star, Trophy, RefreshCw, Send, CheckCircle, ArrowRight, BrainCircuit } from "lucide-react";

interface IntermediateViewProps {
  lesson: LevelLesson;
  onAddPoints: (pts: number) => void;
  topic: string;
}

export default function IntermediateView({ lesson, onAddPoints, topic }: IntermediateViewProps) {
  // Collocation matching state
  const [collocations, setCollocations] = useState<CollocationItem[]>([]);
  const [shuffledNouns, setShuffledNouns] = useState<{ id: string; noun: string; phrase: string }[]>([]);
  const [selectedVerb, setSelectedVerb] = useState<string | null>(null);
  const [selectedNounId, setSelectedNounId] = useState<string | null>(null);
  const [matchedVocabulary, setMatchedVocabulary] = useState<string[]>([]); // matched verbs
  const [gameComplete, setGameComplete] = useState(false);
  const [collocPoints, setCollocPoints] = useState(0);

  // Clause explorer state
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // Reading Comprehension MC States
  const [selectedMcOption, setSelectedMcOption] = useState<number | null>(null);
  const [mcState, setMcState] = useState<"idle" | "correct" | "incorrect">("idle");

  // Detail Questions State
  const [revealedDetailIdxs, setRevealedDetailIdxs] = useState<number[]>([]);

  // Translation States
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any | null>(null);

  useEffect(() => {
    if (lesson.collocations) {
      setCollocations(lesson.collocations);
      
      const nounsList = lesson.collocations.map((c) => ({
        id: c.verb, // Use verb as key to trace match
        noun: c.noun,
        phrase: c.phrase
      }));
      setShuffledNouns([...nounsList].sort(() => Math.random() - 0.5));
    }

    setMatchedVocabulary([]);
    setSelectedVerb(null);
    setSelectedNounId(null);
    setGameComplete(false);
    setCollocPoints(0);
    setActiveSegmentIndex(null);
    
    // MC reset
    setSelectedMcOption(null);
    setMcState("idle");

    // Details reset
    setRevealedDetailIdxs([]);

    // Translation reset
    setAnswer1("");
    setAnswer2("");
    setGradingResult(null);
    setShowHints(false);
  }, [lesson, topic]);

  // Collocations matcher click verb
  const handleVerbSelect = (verb: string) => {
    playTapSound();
    if (matchedVocabulary.includes(verb)) return;
    setSelectedVerb(verb);
    checkMatch(verb, selectedNounId);
  };

  // Click noun
  const handleNounSelect = (nounId: string) => {
    playTapSound();
    if (matchedVocabulary.includes(nounId)) return;
    setSelectedNounId(nounId);
    checkMatch(selectedVerb, nounId);
  };

  const checkMatch = (v: string | null, nId: string | null) => {
    if (v && nId) {
      if (v === nId) {
        // Matched verb and its corresponding noun ID!
        setMatchedVocabulary((prev) => [...prev, v]);
        playSuccessSound();
        setCollocPoints((prev) => prev + 25);
        onAddPoints(25);
        setSelectedVerb(null);
        setSelectedNounId(null);

        if (matchedVocabulary.length + 1 === (lesson.collocations?.length || 4)) {
          setGameComplete(true);
        }
      } else {
        setSelectedVerb(v);
        setSelectedNounId(nId);
        setTimeout(() => {
          setSelectedVerb(null);
          setSelectedNounId(null);
          playErrorSound();
        }, 600);
      }
    }
  };

  const resetCollocGame = () => {
    playTapSound();
    setMatchedVocabulary([]);
    setSelectedVerb(null);
    setSelectedNounId(null);
    setGameComplete(false);
    setCollocPoints(0);
    if (lesson.collocations) {
      const nounsList = lesson.collocations.map((c) => ({
        id: c.verb,
        noun: c.noun,
        phrase: c.phrase
      }));
      setShuffledNouns([...nounsList].sort(() => Math.random() - 0.5));
    }
  };

  // Comprehension choice click
  const handleMcChoice = (idx: number) => {
    if (mcState !== "idle") return;
    setSelectedMcOption(idx);
    if (idx === lesson.mainIdeaAnswer) {
      playSuccessSound();
      setMcState("correct");
      onAddPoints(25);
    } else {
      playErrorSound();
      setMcState("incorrect");
    }
  };

  const handleAssessTranslation = async () => {
    if (!answer1.trim() || !answer2.trim()) {
      alert("請完成翻譯寫作以提交評鑑！");
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
          level: "Intermediate",
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

  const toggleDetailWord = (idx: number) => {
    playTapSound();
    if (revealedDetailIdxs.includes(idx)) {
      setRevealedDetailIdxs((prev) => prev.filter((i) => i !== idx));
    } else {
      setRevealedDetailIdxs((prev) => [...prev, idx]);
      onAddPoints(10); // Reward for seeking micro details!
    }
  };

  // Splitting reading text into compound segments to hover and analyze complex structure
  const segments = lesson.text.split(/([,.;])/).filter(p=>p.trim().length > 0);

  return (
    <div className="space-y-8" id="intermediate-level-view">
      
      {/* 1. Collocations Connections Game */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Star className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-slate-800 flex items-center gap-2">
                搭配詞拼圖：左右連結！
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-normal">Game: Collocation Match</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">母語者習慣的單字搭配（如 pose + a threat = 構成威脅）。將動詞連結至合適的受詞名詞！</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">
              得分 Points: <span className="text-indigo-600 font-bold">{collocPoints} / 100</span>
            </span>
            <button
              onClick={resetCollocGame}
              className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-500 transition-all border border-slate-200"
              title="洗牌"
              id="reset-colloc-game-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {gameComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center"
          >
            <Trophy className="w-16 h-16 text-yellow-500 mb-3 animate-bounce" />
            <h3 className="font-sans font-semibold text-indigo-800 text-lg">搭配詞大師！全部連接成功</h3>
            <p className="text-xs text-indigo-600/85 max-w-sm mt-1">您精準掌握了中級英文高頻搭配詞，寫作與口說的流暢度大增！額外加值 100 點！</p>
            <button
              onClick={resetCollocGame}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2"
              id="replay-colloc-game-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 重新探索搭配
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Verbs */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">核心動詞 Verbs</h4>
              {collocations.map((item) => {
                const isMatched = matchedVocabulary.includes(item.verb);
                const isSelected = selectedVerb === item.verb;
                return (
                  <button
                    key={item.verb}
                    onClick={() => handleVerbSelect(item.verb)}
                    disabled={isMatched}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm flex items-center justify-between ${
                      isMatched
                        ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none"
                        : isSelected
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm shadow-indigo-100 font-medium scale-[1.01]"
                        : "bg-white border-slate-200 text-slate-755 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className="font-semibold font-mono">{item.verb}</span>
                    {isMatched ? (
                      <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        Matched <CheckCircle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Nouns */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">名詞與介係詞搭配 Nouns</h4>
              {shuffledNouns.map((item) => {
                const isMatched = matchedVocabulary.includes(item.id);
                const isSelected = selectedNounId === item.id;
                
                // Find matching chinese from master list to show as hint
                const fullItem = collocations.find(c => c.verb === item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNounSelect(item.id)}
                    disabled={isMatched}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm flex flex-col gap-1 ${
                      isMatched
                        ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none"
                        : isSelected
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm shadow-indigo-100 font-medium scale-[1.01]"
                        : "bg-white border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span className="font-mono font-medium">{item.noun}</span>
                    {isMatched && fullItem ? (
                      <span className="text-xs text-indigo-500 font-sans border-t border-slate-20% pt-1 mt-1">
                        👉 {fullItem.phrase} ({fullItem.chinese})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-sans">點選與相關動詞咬合...</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 2. Reading Board with hover segments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-slate-800">中級寫作複合短文</h3>
              <p className="text-xs text-slate-500 mt-0.5">點選段句，解析子句與關係代名詞的承接關係 📈</p>
            </div>
          </div>

          <div className="text-slate-800 text-base leading-relaxed tracking-wide font-sans bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-6">
            {segments.map((part, idx) => {
              const trimmed = part.trim();
              if (trimmed.length === 0) return null;
              const isPunctuation = [",", ".", ";"].includes(trimmed);

              if (isPunctuation) {
                return <span key={idx} className="text-slate-500 font-bold mr-1.5">{part}</span>;
              }

              const isHighlighted = activeSegmentIndex === idx;

              return (
                <span
                  key={idx}
                  onClick={() => {
                    playTapSound();
                    setActiveSegmentIndex(isHighlighted ? null : idx);
                  }}
                  className={`inline cursor-pointer px-1 rounded transition-all py-0.5 mr-1 select-none border-b ${
                    isHighlighted
                      ? "bg-indigo-100 text-indigo-900 border-indigo-400 font-bold"
                      : "hover:bg-slate-200 text-slate-800 border-transparent"
                  }`}
                  title="點擊剖析子句功能"
                >
                  {part}
                </span>
              );
            })}
          </div>

          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-150 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-700">聽力與閱讀整合訓練</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">隨時點擊朗讀文字，訓練自然連音與節奏快慢控制。</p>
              </div>
            </div>
            <button
              onClick={() => {
                playTapSound();
                speakWord(lesson.text, 0.88);
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
              id="read-intermediate-text-btn"
            >
              朗讀中級課文
            </button>
          </div>
        </section>

        {/* Compound phrase explanation or grammar card */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              子句句型剖析鏡
              <span className="text-xs text-slate-400 font-normal">Clause Inspector</span>
            </h3>

            {activeSegmentIndex !== null ? (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold block mb-1">SELECTED CLAUSE 所選句子區塊</span>
                  <p className="text-xs font-mono font-medium text-indigo-950 leading-relaxed">
                    "{segments[activeSegmentIndex].trim()}"
                  </p>
                  <button
                    onClick={() => speakWord(segments[activeSegmentIndex].trim(), 0.85)}
                    className="mt-2 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold underline flex items-center gap-1"
                  >
                    🗣️ 發音此子句
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">細微句法作用 Syntax Action</h5>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {segments[activeSegmentIndex].includes("posing") 
                        ? "這是一個分詞構句分流。利用 posing 作為現在分詞代替 'which poses'，簡短連接結果。"
                        : segments[activeSegmentIndex].includes("rapidly")
                        ? "rapidly 作為修飾動詞 rising 的地方副詞，強調氣溫上升的劇烈與對環境迫害的急促性。"
                        : segments[activeSegmentIndex].includes("making it critical")
                        ? "making it critical 藉由 it 當虛受詞，把真正的受詞 that nations... 後置，屬於高頻寫作句型。"
                        : "此處在複句中扮演主句或連接附屬子句的關鍵承接橋樑，注意子句中主動詞的單複數以及時態。"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <BrainCircuit className="w-12 h-12 stroke-1 mx-auto" />
                <p className="text-xs max-w-[15rem] mx-auto leading-relaxed">
                  點擊左側短文中的任何 <span className="underline decoration-indigo-400">特定句子段落</span>，此處將自動解析引導其在複合句中的微觀文法功能！
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> 中級複句深化文法閣
            </h4>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <h5 className="text-xs font-bold text-slate-700">{lesson.grammarTipTitle}</h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{lesson.grammarTipContent}</p>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Detailed Fact Spotter */}
      {lesson.readingDetails && (
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden">
          <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            文章細節偵探鏡 (Reading Details Inspector)
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">Active Reading</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">點擊以下疑點卡片解鎖文章深處隱藏的具體事實，累積偵查點數！</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.readingDetails.map((detail, idx) => {
              const isRevealed = revealedDetailIdxs.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleDetailWord(idx)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isRevealed
                      ? "bg-emerald-50/40 border-emerald-250 text-emerald-950"
                      : "bg-slate-50/80 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-100/50"
                  }`}
                  id={`detail-card-${idx}`}
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">🕵️ 細節疑問 Fact Query {idx + 1}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {isRevealed ? "已解鎖 +10" : "點擊探索揭密"}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800">{detail.question}</h4>
                  
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-3 border-t border-slate-200/60 pt-2.5 text-xs text-emerald-800/90 leading-relaxed font-sans font-medium"
                      >
                        ✅ 關鍵事實答案：<br /> {detail.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Reading Comprehension MC Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden" id="intermediate-mc-section">
        <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          大意綜整判斷 (Main Idea Quiz)
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">Details Focus</span>
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
                id={`intermediate-mc-option-${idx}`}
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
              ? "🎉 完美總結！您對於中級學術短文的脈絡與大局觀點揣摩得淋漓盡致！" 
              : "❌ 解析尚未精準。請注意：中級文本強調需要人類開發出批判性思維來與之調和。"}
          </div>
        )}
      </section>

      {/* 5. Chinese-to-English Translation Grade Challenge */}
      <section className="bg-indigo-950 text-slate-100 rounded-2xl border border-indigo-900 p-6 shadow-md relative overflow-hidden" id="intermediate-translation-grader">
        <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-900 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-900/40 text-indigo-400 rounded-xl">
              <Trophy className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-white flex items-center gap-2">
                搭配與複合翻譯挑戰 (Sub-Sentence Transition)
                <span className="text-[10px] bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full font-mono">Linked Double - Mid</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">提供相互連貫的三級複合中文，點選大師 AI 進行智慧型句法與動詞搭配評析！</p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              setShowHints(!showHints);
            }}
            className="text-xs text-indigo-300 hover:text-indigo-200 border border-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-900 flex items-center gap-1 transition-all"
            id="intermediate-hint-toggle-btn"
          >
            {showHints ? "隱藏搭配指南" : "解鎖搭配指南"}
          </button>
        </div>

        {/* Display Chinese Source sentences */}
        <div className="space-y-3 mb-6 bg-indigo-900/40 p-4 rounded-xl border border-indigo-900/80">
          <div className="flex items-start gap-2.5">
            <span className="bg-indigo-900 text-indigo-300 font-mono text-xs font-bold px-1.5 py-0.5 rounded">Sentence A</span>
            <span className="text-sm text-slate-100 font-medium font-sans">{lesson.translationChallenge.chineseSentence1}</span>
          </div>
          <div className="flex items-start gap-2.5 border-t border-indigo-900/80 pt-3">
            <span className="bg-indigo-900 text-indigo-300 font-mono text-xs font-bold px-1.5 py-0.5 rounded">Sentence B</span>
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
              <div className="bg-indigo-900/60 border border-indigo-800/80 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-indigo-350 block mb-1">💡 教師提供的翻譯搭配結構線索：</span>
                {lesson.translationChallenge.hints.map((hint, idx) => (
                  <p key={idx} className="text-indigo-250 flex items-center gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span> {hint}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-indigo-350 mb-1">學生中級譯文句子 A (English Translation A)</label>
            <input
              type="text"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder="Global temperatures are..."
              className="w-full bg-slate-950 border border-indigo-950 rounded-xl px-4 py-3 text-sm text-slate-150 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors"
              id="intermediate-input-1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-indigo-350 mb-1">學生中級譯文句子 B (English Translation B)</label>
            <input
              type="text"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder="This poses a..."
              className="w-full bg-slate-950 border border-indigo-950 rounded-xl px-4 py-3 text-sm text-slate-150 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors"
              id="intermediate-input-2"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleAssessTranslation}
              disabled={isGrading || !answer1.trim() || !answer2.trim()}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-850 disabled:text-indigo-700 text-white font-medium text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
              id="intermediate-grade-btn"
            >
              {isGrading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  英文專家評估中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> 提交中級 AI 精細評量 (Grade Transition)
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
              className="mt-8 border-t border-indigo-900 pt-6 space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/80 p-4 border border-indigo-950 rounded-2xl">
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
                      {gradingResult.score >= 90 ? "搭配大作 流暢無比！" : gradingResult.score >= 70 ? "大局觀佳 實力不凡！" : "詞不達意 再接再厲！"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{gradingResult.encouragement}</p>
                  </div>
                </div>
                {gradingResult.offlineNotes && (
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                    本地快速評估
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-305 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> 母語者搭配詞診斷 Collocation Check
                  </h4>
                  <p className="text-xs text-slate-300 bg-indigo-950 p-4 rounded-xl border border-indigo-900 leading-relaxed">
                    {gradingResult.vocabularyFeedback}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-305 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 連接詞及動詞時態 Grammar Check
                  </h4>
                  <p className="text-xs text-slate-300 bg-indigo-950 p-4 rounded-xl border border-indigo-900 leading-relaxed">
                    {gradingResult.grammarFeedback}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-900/30 border border-indigo-850 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  教師精美範文配對 (Model Formulation Solution)
                </h4>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 font-sans leading-relaxed"><span className="text-indigo-400 font-bold">1:</span> {lesson.translationChallenge.correctEnglish1}</p>
                  <p className="text-slate-300 font-sans leading-relaxed"><span className="text-indigo-400 font-bold">2:</span> {lesson.translationChallenge.correctEnglish2}</p>
                </div>
                {gradingResult.suggestedPhrasing && (
                  <div className="mt-3 border-t border-indigo-950/40 pt-3">
                    <span className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">融合與美化版 (Synthesized Suggested Polish)</span>
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
