import { LessonVersion } from "./types";

export const DEFAULT_LESSONS: LessonVersion[] = [
  {
    id: "system-guide",
    topic: "【系統指引】快速建立您專屬的分級英文講義 (System Guide: Differentiated Worksheets)",
    createdAt: "2026-06-15",
    beginner: {
      text: "Welcome to our English learning screen. You can paste any article in the input bar on the left. Our helper will instantly analyze the text. It makes three balanced levels. It is simple, safe, and helpful for students.",
      mainIdeaQuestion: "What is the primary function of this differentiated lesson platform?",
      mainIdeaOptions: [
        "To play vocabulary block games without any reading.",
        "To help teachers convert any uploaded content into customized difficulty levels instantly.",
        "To download random templates from the wild internet.",
        "To prevent students from doing homework."
      ],
      mainIdeaAnswer: 1,
      grammarTipTitle: "Using Simple Present for Structural Directions",
      grammarTipContent: "We use simple present verbs like 'use', 'paste', or 'convert' to convey immediate directions and logical pathways in user manuals. For example, 'It makes three levels' and 'It is helpful'.",
      vocabulary: [
        {
          word: "welcome",
          definition: "To greet or receive with pleasure.",
          chinese: "歡迎",
          example: "We welcome all English teachers to test this differentiated worksspace."
        },
        {
          word: "paste",
          definition: "To insert text or data into a document.",
          chinese: "貼上 / 貼入",
          example: "Please paste your teaching syllabus into the input area on the left."
        },
        {
          word: "analyze",
          definition: "To examine in detail to discover meaning.",
          chinese: "剖析 / 分析",
          example: "The system will analyze and sort academic terms by difficulty."
        },
        {
          word: "simple",
          definition: "Easily understood or done; presenting no complexity.",
          chinese: "簡單的 / 易用的",
          example: "This interactive user interface is simple and clean to navigate."
        },
        {
          word: "helpful",
          definition: "Giving or ready to give help; useful.",
          chinese: "有幫助的",
          example: "Differentiated templates are highly helpful for diverse classes."
        }
      ],
      translationChallenge: {
        chineseSentence1: "歡迎來到我們的英文分級客製化講堂。",
        chineseSentence2: "這是一個能分析並簡化英文教材的實用工具。",
        correctEnglish1: "Welcome to our customized differentiated English classroom.",
        correctEnglish2: "This is a useful tool that can analyze and simplify English materials.",
        prompt: "Translate simple connected phrases detailing platform instructions.",
        hints: [
          "Start with 'Welcome to...'",
          "Use 'customized differentiated English classroom'",
          "Use 'tool that can analyze...'"
        ]
      }
    },
    intermediate: {
      text: "Welcome to our responsive lecture platform, which is specifically designed to reduce teachers' preparation workloads. Rather than spending hours drafting multiple levels from scratch, you can formulate customized worksheets by uploading various formats including PDFs or Word documents. This digital method immediately enhances teaching efficiency and fosters strong cognitive connections among students with varying language competencies.",
      mainIdeaQuestion: "Which statement best describes the educational benefit highlighted in the intermediate text?",
      mainIdeaOptions: [
        "It allows teachers to write shorter tests with fewer questions.",
        "It streamlines class preparation and enhances teaching efficiency through multi-format uploads.",
        "It forces teachers to strictly memorize standard paper templates.",
        "It replaces human language coaches with random speech synthetic engines."
      ],
      mainIdeaAnswer: 1,
      grammarTipTitle: "Understanding Gerunds as Subjects and Objects of Prepositions",
      grammarTipContent: "Gerunds (e.g., 'spending hours drafting', 'uploading various formats') represent ongoing actions or processes. Utilizing gerunds helps encapsulate dynamic workflows smoothly without adding clunky nouns.",
      collocations: [
        {
          phrase: "reduce workload",
          verb: "reduce",
          noun: "workloads",
          chinese: "減輕工作量"
        },
        {
          phrase: "enhance efficiency",
          verb: "enhance",
          noun: "efficiency",
          chinese: "提升效率"
        },
        {
          phrase: "formulate worksheet",
          verb: "formulate",
          noun: "worksheets",
          chinese: "制定學習單"
        },
        {
          phrase: "foster connection",
          verb: "foster",
          noun: "connections",
          chinese: "促進連結"
        }
      ],
      readingDetails: [
        {
          question: "How does the platform assist teachers with different file extensions?",
          answer: "By allowing them to upload multiple formats, including PDFs and Word documents, to generate corresponding handouts."
        },
        {
          question: "What is the primary objective of formulating variable worksheets?",
          answer: "To reduce preparation time, enhance instructional efficiency, and support students of varying proficiency levels."
        }
      ],
      translationChallenge: {
        chineseSentence1: "設計這個平台是為了減輕教師繁重的前置準備工作量。",
        chineseSentence2: "主辦方能夠透過上傳 PDF 來迅速制定分級學習單。",
        correctEnglish1: "Designing this platform aims to reduce the heavy workload of teacher preparation.",
        correctEnglish2: "Organizers can promptly formulate differentiated worksheets by uploading PDFs.",
        prompt: "Translate intermediate instructions regarding lesson compilation.",
        hints: [
          "Use 'aims to reduce heavy workload'",
          "Use 'teacher preparation'",
          "Use 'promptly formulate differentiated worksheets'"
        ]
      }
    },
    advanced: {
      text: "Seldom do language educators acquire a tool that optimizes lesson customization as seamlessly as this differentiated lecture workspace. Not only does this platform generate three distinct tiers of reading texts, but it also creates structured GSAT translation drills and writing prompts to stimulate critical thinking. Were departments to integrate this adaptive workspace, class customization workloads would dissolve, ensuring academic success.",
      mainIdeaQuestion: "Analyze the advanced text's core claim regarding class customization:",
      mainIdeaOptions: [
        "Specialized tools are too expensive and difficult to run.",
        "Integrating this adaptive workspace dramatically simplifies lesson customization and enhances academic outcomes.",
        "We should avoid using technology to streamline translation exercises.",
        "Traditional printing methods are always more reliable than custom websites."
      ],
      mainIdeaAnswer: 1,
      grammarTipTitle: "Advanced Subject-Verb Inversion & Inverted Conditionals",
      grammarTipContent: "Notice how the text achieves a highly elevated academic tone using two advanced inverted structures: \n1. Negative Adverb Fronting: 'Seldom do language educators acquire...' inverts the auxiliary 'do' and subject 'educators'. \n2. Subjunctive Conditional Inversion: 'Were departments to integrate...' stands as an elegant, high-register replacement for 'If departments were to integrate...'.",
      advancedGrammar: [
        {
          type: "inversion",
          rule: "Seldom/Rarely + Auxiliary + Subject + Verb",
          example: "Seldom do teachers find such intuitive digital workspaces.",
          explanation: "Places dramatic emphasis on the uniqueness or rarity of the workspace design."
        },
        {
          type: "inversion",
          rule: "Not only + Auxiliary + Subject ... but also",
          example: "Not only does it save hours, but it also elevates lesson quality.",
          explanation: "Expresses dual benefits sequentially with strong, academic sentence rhythm."
        },
        {
          type: "conditional",
          rule: "Were + Subject + to + Verb",
          example: "Were you to paste English text on the left, the system would render options.",
          explanation: "An elegant subjunctive phrasing used to speculate on hypothetical futures in academic style."
        }
      ],
      graphicOrganizer: [
        {
          id: "welcome-root",
          label: "Core: Adaptive Lesson Customization",
          type: "thesis",
          description: "Evaluating how the differentiated lecture workspace dissolves grading friction and raises academic excellence.",
          children: ["welcome-branch-1", "welcome-branch-2"]
        },
        {
          id: "welcome-branch-1",
          label: "Multi-tiered Handout Compilation",
          type: "point",
          description: "Providing Beginner, Intermediate, and Advanced texts automatically.",
          children: ["welcome-leaf-1"]
        },
        {
          id: "welcome-branch-2",
          label: "Academic Standard Alignments",
          type: "point",
          description: "Formulating GSAT structure translation drills and analytical essays.",
          children: ["welcome-leaf-2"]
        },
        {
          id: "welcome-leaf-1",
          label: "Custom Tier Outputs",
          type: "evidence",
          description: "Generates tailored reading passages with vocabulary and syntax tips in Traditional Chinese."
        },
        {
          id: "welcome-leaf-2",
          label: "Taiwan Exam Blueprints",
          type: "evidence",
          description: "Builds realistic translation tests and detailed sample essays modeled after previous Taiwan GSAT rubrics."
        }
      ],
      criticalThinkingQuestion: "Assess how digital differentiation tools redefine the teacher's role in the modern classroom. Discuss potential challenges and creative solutions.",
      translationChallenge: {
        chineseSentence1: "主辦單位為了將課程完美區別開來，已預先針對這份指南進行修訂。",
        chineseSentence2: "儘管有一些限制，這項技術成功地加強了教師與學生之間的連繫脈絡。",
        correctEnglish1: "In order to distinguish the curriculum perfectly, the organizers have made revisions to this guide in advance.",
        correctEnglish2: "Despite some constraints, this technology has successfully strengthened the connection thread between teachers and students.",
        prompt: "Translate with advanced structure: In order to distinguish ..., and Despite some constraints ...",
        hints: [
          "Start with 'In order to distinguish...'",
          "Use 'made revisions to this guide in advance'",
          "Start the second sentence with 'Despite some constraints...'"
        ]
      },
      gsatWritingPrompt: {
        title: "學測英文作文高分挑戰：數位差異化教材的體驗與省思",
        promptText: "Topic: My Experience with Adaptive Learning\n\nImagine you are using a new digital platform that automatically simplifies or advances English lessons. In paragraph one, describe the 'explosive' benefit of having a personal guide and the 'thoughtful' way you organized your weekly studies. In paragraph two, explain how such personalized learning tools can create a strong academic 'bond' and help students 'from all walks of life' reach their potential.\n\n題目：我對「差異化自主學習」的體驗與反思\n試撰寫一篇約150-180個英文單字之學測作文。第一段請描寫此數位平台所帶來的「極大好處」及你「深思熟慮後」制定的每週學習進度安排方式。第二段請深入申論，這類個人化的自主學習工具，如何能協助「來自各行各業（不同背景）」的學子拉近學術差距，並建立起熱愛知識的「緊密連結」。",
        paragraph1Prompt: "第一段：描述數位差異化平台在學習過程中的效率突破，並具體說明你如何 thoughtful 地安排各難度段落、單字及翻譯挑戰的練習進度。",
        paragraph2Prompt: "第二段：闡明此個人化學習機制對於縮減實力差距的深遠意義，說明它如何引導不同背景 (all walks of life) 的人，共同建立一條學術上的長遠紐帶 (bond)。",
        guidelines: [
          "字數請控制在 150-180 字之間，分為兩段書寫。詞彙應求精準而純熟，文體須流暢且具說服力。",
          "第一段必須巧妙帶入 'explosive'（或 explosive benefit）與 'thoughtful' 作為自我安排與科技協助的描繪重點。",
          "第二段則須運用 'bond' 以及 'from all walks of life'（來自各行各業），展現對教育平權及個人發展的關懷與理性思辨層次。"
        ],
        sampleEssay: "Rarely do modern students encounter a system that makes English learning as incredibly personalized as this differentiated workspace. In the first place, the explosive convenience of having three tailored reading difficulty tiers instantly boosts my comprehension. By adopting a highly thoughtful calendar, I allocate daily slots for beginner vocabulary drills, intermediate collocations, and advanced sentence inversion challenges, creating a perfect study rhythm.\n\nFrom my perspective, this personalized learning technology is invaluable because it consolidates a lifelong academic bond with knowledge. By catering to students from all walks of life, regardless of their initial proficiency level, it democratizes quality education. Were all schools to utilize such balanced digital resources, learning discrepancies would readily diminish, enabling every aspiring learner to reach their highest potential."
      }
    }
  }
];
