export const ADMIN_USER = "22RP00155";
export const ADMIN_PASS = "admin123";
export const EXAM_DURATION_SECONDS = 30 * 60; // 30 minutes

export type Question = {
  id: number;
  question: string;
  type: "MCQ" | "TF" | "MATCH" | "LONG";
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  match_left: string | null;
  match_right: string | null;
  ord: number | null;
};

export function gradeAnswer(q: Question, ans: string | undefined): boolean {
  if (!ans || !q.correct_answer) return false;
  return ans.trim().toUpperCase() === q.correct_answer.trim().toUpperCase();
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}
