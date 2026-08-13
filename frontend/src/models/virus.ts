export interface VirusChapterOption {
  id: number;
  chapter_id: number;
  order_index: number;
  text: string;
  consequence_text: string;
  // is_correct is NOT included — hidden from frontend
}

export interface VirusChapter {
  id: number;
  case_id: number;
  order_index: number;
  title: string;
  narrative_text: string;
  question_text?: string | null;
  is_final?: boolean;
  options: VirusChapterOption[];
}

export interface VirusCase {
  id: number;
  title: string;
  description?: string | null;
  role_description?: string | null;
  success_text?: string | null;
  failure_text?: string | null;
  difficulty: "easy" | "medium" | "hard";
  coins_reward: number;
  order_index: number;
  is_completed?: boolean;
  score?: number | null;
  correct_answers?: number | null;
  coins_earned?: number | null;
  chapters?: VirusChapter[];
}

export interface VirusSubmitAnswerResponse {
  is_correct: boolean;
  consequence_text: string;
  correct_option_id: number;
}

export interface CompleteVirusCaseResponse {
  coins_earned: number;
  score: number;
  is_passed: boolean;
  correct_answers: number;
  total_chapters: number;
}

// Legacy interfaces kept for reference (unused in new game flow)
export interface VirusClue {
  id: number;
  case_id: number;
  order_index: number;
  clue_text: string;
  clue_type: "symptom" | "lab" | "observation";
}

export interface VirusSuspect {
  id: number;
  case_id: number;
  name: string;
  description: string | null;
  order_index: number;
}
