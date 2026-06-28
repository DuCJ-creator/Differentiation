import React, { useState, useEffect } from "react";
import { LevelLesson, VocabularyWord } from "../types";
import { playTapSound, playSuccessSound, playErrorSound, speakWord } from "../utils/audio";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, HelpCircle, Sparkles, BookOpen, Star, Trophy, RefreshCw, Send, CheckCircle, BrainCircuit } from "lucide-react";

interface BeginnerViewProps {
  lesson: LevelLesson;
  onAddPoints: (pts: number) => void;
  topic: string;
}

export default function BeginnerView({ lesson, onAddPoints, topic }: BeginnerViewProps) {
  // Vocabulary Game States
  const [vocabWords, setVocabWords] = useState<VocabularyWord[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<{ id: string; text: string; chinese: string }[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]); // stores words that are matched
  const [vocabGameComplete, setVocabGameComplete] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  // Reader States
  const [activeVocabFocus, setActiveVocabFocus] = useState<VocabularyWord | null>(null);

  // Scrambler States
  const [scrambleWords, setScrambleWords] = useState<string[]>([]);
  const [userScrambleChoice, setUserScrambleChoice] = useState<string[]>([]);
  const [scrambleComplete, setScrambleComplete] = useState(false);
  const [scrambleAttempts, setScrambleAttempts] = useState(0);

  // Main Idea MC States
  const [selectedMcOption, setSelectedMcOption] = useState<number | null>(null);
  const [mcState, setMcState] = useState<"idle" | "correct" | "incorrect">("idle");

  // Translation States
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any | null>(null);

  // Initialize games when lesson changes
  useEffect(() => {
    if (lesson.vocabulary) {
      setVocabWords(lesson.vocabulary);
      
      // Shuffle definitions
      const defs = lesson.vocabulary.map((v, i) => ({
        id: v.word,
        text: v.definition,
        chinese: v.chinese
      }));
      setShuffledDefs([...defs].sort(() => Math.random() - 0.5));
    }
    
    // Initialize scrambler with a sentence based on vocabulary and basic grammar
    const targetSentence = "Many people keep dogs at home because they make us feel happy";
    // We clean and split the sentence
    const tokens = targetSentence.split(" ").sort(() => Math.random() - 0.5);
    setScrambleWords(tokens);
    setUserScrambleChoice([]);
    setScrambleComplete(false);
    setScrambleAttempts(0);
    
    // Reset other states
    setSelectedMcOption(null);
    setMcState("idle");
    setAnswer1("");
    setAnswer2("");
    setGradingResult(null);
    setShowHints(false);
    setMatchedPairs([]);
    setVocabGameComplete(false);
    setGameScore(0);
  }, [lesson, topic]);

  // Click handler for Vocab Game word card
  const handleWordSelect = (word: string) => {
    playTapSound();
    if (matchedPairs.includes(word)) return;
    setSelectedWord(word);
    checkMatch(word, selectedDefId);
  };

  // Click handler for Vocab Game definition card
  const handleDefSelect = (defId: string) => {
    playTapSound();
    if (matchedPairs.includes(defId)) return;
    setSelectedDefId(defId);
    checkMatch(selectedWord, defId);
  };

  const checkMatch = (word: string | null, defId: string | null) => {
    if (word && defId) {
      if (word === defId) {
        // MATCHED!
        setMatchedPairs((prev) => [...prev, word]);
        playSuccessSound();
        setGameScore((prev) => prev + 20);
        onAddPoints(20);
        setSelectedWord(null);
        setSelectedDefId(null);
        
        // check if complete
        if (matchedPairs.length + 1 === (lesson.vocabulary?.length || 5)) {
          setVocabGameComplete(true);
        }
      } else {
        // MISMATCH (temporary shake/reset red indicator)
        setSelectedWord(word);
        setSelectedDefId(defId);
        setTimeout(() => {
          setSelectedWord(null);
          setSelectedDefId(null);
          playErrorSound();
        }, 600);
      }
    }
  };

  const resetVocabGame = () => {
    playTapSound();
    setMatchedPairs([]);
    setSelectedWord(null);
    setSelectedDefId(null);
    setVocabGameComplete(false);
    setGameScore(0);
    if (lesson.vocabulary) {
      const defs = lesson.vocabulary.map((v) => ({
        id: v.word,
        text: v.definition,
        chinese: v.chinese
      }));
      setShuffledDefs([...defs].sort(() => Math.random() - 0.5));
    }
  };

  // Click word token in scramble game
  const handleScrambleTokenClick = (wordToken: string, index: number) => {
    playTapSound();
    // Add to user choice
    setUserScrambleChoice((prev) => [...prev, wordToken]);
    // Remove from choices left
    const updated = [...scrambleWords];
    updated.splice(index, 1);
    setScrambleWords(updated);
  };

  // Remove word token from user selection and return to pool
  const handleRemoveUserToken = (wordToken: string, index: number) => {
    playTapSound();
    const updated = [...userScrambleChoice];
    updated.splice(index, 1);
    setUserScrambleChoice(updated);
    setScrambleWords((prev) => [...prev, wordToken]);
  };

  const verifyScramble = () => {
    const userSentence = userScrambleChoice.join(" ").toLowerCase();
    const cleanWordSet = "many people keep dogs at home because they make us feel happy".toLowerCase();

    if (userSentence === cleanWordSet) {
      playSuccessSound();
      setScrambleComplete(true);
      onAddPoints(30);
    } else {
      playErrorSound();
      setScrambleAttempts((prev) => prev + 1);
      alert("❌ 語序不正確。再試一次！請確認主詞與動詞的位置搭配。");
    }
  };

  const resetScrambleGame = () => {
    playTapSound();
    const targetSentence = "Many people keep dogs at home because they make us feel happy";
    setScrambleWords(targetSentence.split(" ").sort(() => Math.random() - 0.5));
    setUserScrambleChoice([]);
    setScrambleComplete(false);
    setScrambleAttempts(0);
  };

  // Handle Main Idea choice click
  const handleMcChoice = (idx: number) => {
    if (mcState !== "idle") return; // can't change
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

  // Handle online Translation Grade action
  const handleAssessTranslation = async () => {
    if (!answer1.trim() || !answer2.trim()) {
      alert("請填寫完兩句話的完整答覆再進行評估！");
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
          level: "Beginner",
          prompt: lesson.translationChallenge.prompt
        }),
      });

      const data = await response.json();
      setGradingResult(data);
      if (data.score >= 40) {
        onAddPoints(data.score); // Award the graded points instantly!
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

  return (
    <div className="space-y-8" id="beginner-level-view">
      
      {/* 1. Vocabulary Game Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Star className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-lg text-slate-800 flex items-center gap-2">
                單字配配看：拼圖遊戲
                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-normal">Game: Match Pair</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">點選左側英文單字，再點選右側相符的繁體中文解釋，獲取金幣！</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
              得分 Points: <span className="text-sky-600 font-bold">{gameScore} / 100</span>
            </span>
            <button
              onClick={resetVocabGame}
              className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-500 transition-all border border-slate-200"
              title="重新洗牌"
              id="reset-match-game-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {vocabGameComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center"
          >
            <Trophy className="w-16 h-16 text-yellow-500 mb-3 animate-bounce" />
            <h3 className="font-sans font-semibold text-emerald-800 text-lg">太厲害了！全部配對成功</h3>
            <p className="text-xs text-emerald-600/80 max-w-sm mt-1">您精準掌握了基礎的實用單字，順利加值 100 點學分！</p>
            <button
              onClick={resetVocabGame}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              id="replay-vocab-game-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 再玩一次
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Word Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">英文單字 Words</h4>
              {vocabWords.map((v) => {
                const isMatched = matchedPairs.includes(v.word);
                const isSelected = selectedWord === v.word;
                return (
                  <button
                    key={v.word}
                    onClick={() => handleWordSelect(v.word)}
                    disabled={isMatched}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm flex items-center justify-between ${
                      isMatched
                        ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none"
                        : isSelected
                        ? "bg-sky-50 border-sky-400 text-sky-700 shadow-sm shadow-sky-100 font-medium"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                    id={`vocab-word-${v.word}`}
                  >
                    <span>{v.word}</span>
                    {isMatched ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Chinese & Definition Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">中文定義 Definitions</h4>
              {shuffledDefs.map((def) => {
                const isMatched = matchedPairs.includes(def.id);
                const isSelected = selectedDefId === def.id;
                return (
                  <button
                    key={def.id}
                    onClick={() => handleDefSelect(def.id)}
                    disabled={isMatched}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                      isMatched
                        ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none"
                        : isSelected
                        ? "bg-sky-50 border-sky-400 text-sky-700 shadow-sm shadow-sky-100 font-medium"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                    id={`vocab-def-${def.id}`}
                  >
                    <span className="font-semibold text-slate-800">{def.chinese}</span>
                    <span className="text-slate-500">{def.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 2. Reading Text Board with Click Pronounce */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-7 relative overflow-hidden" id="beginner-reading-section">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-pink-50 rounded-full blur-3xl -z-10" />
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl animate-pulse">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-semibold text-slate-800">基礎英文講讀主題</h3>
              <p className="text-xs text-slate-500 mt-0.5">點選英文單字聽發音與細緻解釋 🗣️</p>
            </div>
          </div>

          <div className="text-slate-800 text-base leading-relaxed tracking-wide font-sans bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-6">
            {lesson.text.split(" ").map((word, idx) => {
              const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
              const isTargetVocab = lesson.vocabulary?.find((v) => v.word.toLowerCase() === cleanWord.toLowerCase());

              return (
                <span
                  key={idx}
                  onClick={() => {
                    playTapSound();
                    speakWord(cleanWord, 0.85);
                    if (isTargetVocab) {
                      setActiveVocabFocus(isTargetVocab);
                    }
                  }}
                  className={`inline-block mr-1.5 cursor-pointer rounded px-1 transition-all py-0.5 select-none ${
                    isTargetVocab
                      ? "bg-sky-100 text-sky-800 hover:bg-sky-200 font-semibold border-b-2 border-sky-400"
                      : "hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title={isTargetVocab ? `點擊聽發音: ${isTargetVocab.chinese}` : "點擊聽發音"}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {/* Quick interactive pronunciation trainer widget */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🗣️</span>
              <div>
                <h4 className="text-xs font-semibold text-amber-800">點讀發音功能</h4>
                <p className="text-[11px] text-amber-600/90 mt-0.5">上方亮藍色代表本課重點單字。點選任何單字即可讓線上英語老師精準讀出發音！</p>
              </div>
            </div>
            <button
              onClick={() => {
                playTapSound();
                speakWord(lesson.text, 0.85);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              id="read-entire-text-btn"
            >
              <Volume2 className="w-3.5 h-3.5" /> 朗讀全文
            </button>
          </div>
        </section>

        {/* Selected target word details or default instructions in card interface */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm lg:col-span-5 flex flex-col justify-between" id="beginner-vocab-dictionary">
          <div>
            <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              詞彙小辭典
              <span className="text-xs text-slate-400 font-normal">Vocabulary Inspector</span>
            </h3>

            {activeVocabFocus ? (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center bg-sky-50 p-3.5 rounded-xl border border-sky-100">
                  <div>
                    <h4 className="font-sans font-bold text-lg text-sky-850">{activeVocabFocus.word}</h4>
                    <span className="text-xs text-sky-650 bg-sky-100/60 px-2 py-0.5 rounded-full font-medium">{activeVocabFocus.chinese}</span>
                  </div>
                  <button
                    onClick={() => {
                      playTapSound();
                      speakWord(activeVocabFocus.word, 0.82);
                    }}
                    className="p-2 bg-white rounded-lg shadow-sm border border-sky-200 active:scale-95 text-sky-600 hover:text-sky-700"
                    title="重新發音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">英文解釋 Definition</h5>
                    <p className="text-xs text-slate-650 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{activeVocabFocus.definition}</p>
                  </div>
                  <div>
                    <h5 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">例句實踐 Example Sentence</h5>
                    <p className="text-xs italic text-slate-700 bg-amber-50/20 p-2.5 rounded-lg border border-amber-100/50 font-sans leading-relaxed">
                      "{activeVocabFocus.example}"
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <HelpCircle className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-xs max-w-[15rem] mx-auto leading-relaxed">
                  點擊左側短文中有 <span className="bg-sky-100 px-1 text-sky-800 font-semibold rounded">高亮底色</span> 的單字，此處將自動呈現精細發音、中英詞典與造句例句！
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-pink-500" /> 微文法小講堂
            </h4>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mt-2">
              <h5 className="text-xs font-bold text-slate-700">{lesson.grammarTipTitle}</h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-wrap">{lesson.grammarTipContent}</p>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Word Scrambler Sentence Reconstruction Game */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden" id="beginner-scramble-section">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-10" />
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-slate-800 flex items-center gap-2">
                英文克漏字重組挑戰
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-normal">Sentence Workshop</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">點擊下方亂序的黃色字卡，重新組合文意通順的完整複句，增長拼裝感！</p>
            </div>
          </div>

          <button
            onClick={resetScrambleGame}
            className="p-1 px-2 hover:bg-slate-100 active:scale-95 rounded-lg text-slate-500 transition-all border border-slate-200 text-xs flex items-center gap-1.5"
            id="reset-scramble-btn"
          >
            <RefreshCw className="w-3 h-3" /> 重置重組
          </button>
        </div>

        {/* Board 1: User Assembled Sentence */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 min-h-[4rem] flex flex-wrap gap-2 items-center mb-4">
          {userScrambleChoice.length === 0 ? (
            <span className="text-xs text-slate-400 italic">在下方點卡來排列您的文法大作...</span>
          ) : (
            userScrambleChoice.map((w, idx) => (
              <motion.button
                layoutId={`scramble-${w}`}
                key={idx}
                onClick={() => handleRemoveUserToken(w, idx)}
                className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer shadow-sm transition-all"
              >
                {w}
              </motion.button>
            ))
          )}
        </div>

        {/* Board 2: Scrambled tokens choices left */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          {scrambleWords.length === 0 && !scrambleComplete ? (
            <button
              onClick={verifyScramble}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              id="verify-scramble-btn"
            >
              Verify Assembly 驗證重組時態
            </button>
          ) : scrambleComplete ? (
            <div className="flex items-center gap-3 w-full p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold">非常優秀！完美文法拼圖成功！</span>
                <p className="text-[11px] text-emerald-600/85 mt-0.5">"Many people keep dogs at home because they make us feel happy."</p>
              </div>
            </div>
          ) : (
            scrambleWords.map((word, i) => (
              <button
                key={i}
                onClick={() => handleScrambleTokenClick(word, i)}
                className="bg-amber-100/80 hover:bg-amber-200 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-transform active:scale-95"
              >
                {word}
              </button>
            ))
          )}
        </div>
      </section>

      {/* 4. Reading Comprehension MC Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden" id="beginner-mc-section">
        <h3 className="font-sans font-semibold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
          大意理解挑戰 (Main Idea Quiz)
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">Beginner MC</span>
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
                id={`beginner-mc-option-${idx}`}
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
              ? "🎉 回答完全正確！您順利解析出了基礎文章的主要核心理念，獲取點數 +25！" 
              : "❌ 答案不正確。別灰心，重新回到讀講板看一看，狗狗和人類建立的緊密關係是文章的核心！"}
          </div>
        )}
      </section>

      {/* 5. Chinese-to-English Translation Grade Challenge */}
      <section className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-md relative overflow-hidden" id="beginner-translation-grader">
        <div className="absolute right-0 top-0 w-48 h-48 bg-sky-950 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-900/40 text-sky-400 rounded-xl">
              <Trophy className="w-5 h-5 text-sky-400 animate-pulse" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-white flex items-center gap-2">
                情境雙句翻译大作戰
                <span className="text-[10px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded-full font-mono">Linked Double - Beginner</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">提供相互連貫的中文，試圖拼寫。點選「大師 AI 閱卷」獲得最精闢解析與多達 100 分學分！</p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              setShowHints(!showHints);
            }}
            className="text-xs text-sky-300 hover:text-sky-200 border border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-850 bg-slate-800 flex items-center gap-1 transition-all"
            id="beginner-hint-toggle-btn"
          >
            {showHints ? "隱藏文法錦囊" : "解鎖翻譯錦囊"}
          </button>
        </div>

        {/* Display Chinese Source sentences */}
        <div className="space-y-3 mb-6 bg-slate-850 p-4 rounded-xl border border-slate-800">
          <div className="flex items-start gap-2.5">
            <span className="bg-sky-900/60 text-sky-300 font-mono text-xs font-bold px-1.5 py-0.5 rounded">Sentence A</span>
            <span className="text-sm text-slate-100 font-medium font-sans">{lesson.translationChallenge.chineseSentence1}</span>
          </div>
          <div className="flex items-start gap-2.5 border-t border-slate-800/80 pt-3">
            <span className="bg-sky-900/60 text-sky-300 font-mono text-xs font-bold px-1.5 py-0.5 rounded">Sentence B</span>
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
              <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-slate-350 block mb-1">💡 教師提供的拼字線索 & 句型引導：</span>
                {lesson.translationChallenge.hints.map((hint, idx) => (
                  <p key={idx} className="text-slate-300 flex items-center gap-1.5">
                    <span className="text-sky-400 font-bold">•</span> {hint}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">學生英文答題句子 A (English Translation A)</label>
            <input
              type="text"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder="Dogs are very..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 transition-colors"
              id="beginner-input-1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">學生英文答題句子 B (English Translation B)</label>
            <input
              type="text"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder="They make..."
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 transition-colors"
              id="beginner-input-2"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleAssessTranslation}
              disabled={isGrading || !answer1.trim() || !answer2.trim()}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              id="beginner-grade-btn"
            >
              {isGrading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  大師 AI 閱卷中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> 送出大師 AI 閱卷 (Grade Translation)
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
              className="mt-8 border-t border-slate-800 pt-6 space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/80 p-4 border border-slate-850 rounded-2xl">
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
                      {gradingResult.score >= 90 ? "頂級學位 卓越成就！" : gradingResult.score >= 70 ? "實力穩健 展露鋒芒！" : "初露頭角 漸入佳境！"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{gradingResult.encouragement}</p>
                  </div>
                </div>
                {gradingResult.offlineNotes && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    本地快速評估
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> 特色詞彙分析 Vocabulary Match
                  </h4>
                  <p className="text-xs text-slate-300 bg-slate-850 p-4 rounded-xl border border-slate-800 leading-relaxed">
                    {gradingResult.vocabularyFeedback}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" /> 微文法句法診斷 Grammar Check
                  </h4>
                  <p className="text-xs text-slate-300 bg-slate-850 p-4 rounded-xl border border-slate-800 leading-relaxed">
                    {gradingResult.grammarFeedback}
                  </p>
                </div>
              </div>

              <div className="bg-sky-950/30 border border-sky-850 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                  教師精美範文配對 (Model Formulation Solution)
                </h4>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 font-sans leading-relaxed"><span className="text-sky-400 font-bold">1:</span> {lesson.translationChallenge.correctEnglish1}</p>
                  <p className="text-slate-300 font-sans leading-relaxed"><span className="text-sky-400 font-bold">2:</span> {lesson.translationChallenge.correctEnglish2}</p>
                </div>
                {gradingResult.suggestedPhrasing && (
                  <div className="mt-3 border-t border-sky-950/40 pt-3">
                    <span className="text-[11px] text-sky-400 font-bold uppercase tracking-wider block mb-1">融合與美化版 (Synthesized Suggested Polish)</span>
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
