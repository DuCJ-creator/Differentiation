export interface VocabularyWord {
  word: string;
  definition: string;
  chinese: string;
  example: string;
}

export interface CollocationItem {
  phrase: string;
  verb: string;
  noun: string;
  chinese: string;
}

export interface AdvancedGrammarRule {
  type: "inversion" | "conditional" | "subjunctive" | "other";
  rule: string;
  example: string;
  explanation: string;
}

export interface GraphicOrganizerNode {
  id: string;
  label: string;
  type: "thesis" | "point" | "evidence" | "conclusion";
  description: string;
  children?: string[]; // IDs of child nodes
}

export interface TranslationExercise {
  chineseSentence1: string;
  chineseSentence2: string;
  correctEnglish1: string;
  correctEnglish2: string;
  prompt: string;
  hints: string[];
}

export interface GSATWritingPrompt {
  title: string;
  promptText: string;
  paragraph1Prompt: string;
  paragraph2Prompt: string;
  guidelines: string[];
  sampleEssay: string;
}

export interface LevelLesson {
  text: string;
  phonemicMarkup?: string;
  mainIdeaQuestion: string;
  mainIdeaOptions: string[];
  mainIdeaAnswer: number;
  grammarTipTitle: string;
  grammarTipContent: string;
  translationChallenge: TranslationExercise;
  
  // Beginner specific
  vocabulary?: VocabularyWord[];
  
  // Intermediate specific
  collocations?: CollocationItem[];
  readingDetails?: Array<{ question: string; answer: string }>;

  // Advanced specific
  advancedGrammar?: AdvancedGrammarRule[];
  graphicOrganizer?: GraphicOrganizerNode[];
  criticalThinkingQuestion?: string;
  gsatWritingPrompt?: GSATWritingPrompt;
}

export interface LessonVersion {
  id: string;
  topic: string;
  createdAt: string;
  beginner: LevelLesson;
  intermediate: LevelLesson;
  advanced: LevelLesson;
}

export interface ScoreState {
  points: number;
  streak: number;
  completedTasks: string[]; // tracking IDs of completed parts
}
