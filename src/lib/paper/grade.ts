import { parseStudentNumber } from "@/lib/bank/helpers";
import { normalizeFill } from "@/lib/bank/helpers";
import type { Answer, Choice, ErrorCause, ItemType, SubjectId } from "@/lib/types";

export type GradeResult = {
  correct: boolean;
  cause: ErrorCause | null;
};

function numericCause(given: number, value: number): ErrorCause {
  const scale = Math.max(0.02, Math.abs(value) * 0.02);
  if (Math.abs(given + value) <= scale) return "unit";
  if (value !== 0) {
    const ratio = given / value;
    if ([10, 0.1, 100, 0.01, 1000].some((factor) => Math.abs(ratio - factor) < 0.05)) return "unit";
    if ([2, 0.5].some((factor) => Math.abs(ratio - factor) < 0.05)) return "formula";
  }
  return "calculation";
}

export function gradeAnswer(
  type: ItemType,
  answer: Answer,
  choices: Choice[] | null,
  raw: string,
): GradeResult {
  const text = raw.trim();
  if (!text) return { correct: false, cause: "misread" };
  if (type === "choice" || answer.kind === "choice") {
    if (answer.kind !== "choice") return { correct: false, cause: "concept" };
    const picked = text.toUpperCase();
    if (picked === answer.id) return { correct: true, cause: null };
    const choice = choices?.find((item) => item.id === picked);
    return { correct: false, cause: choice?.cause ?? "concept" };
  }
  if (answer.kind === "fill" || type === "fill") {
    if (answer.kind !== "fill") return { correct: false, cause: "concept" };
    const normalized = normalizeFill(text);
    const correct = answer.accept.some((item) => normalizeFill(item) === normalized);
    return { correct, cause: correct ? null : "concept" };
  }
  const given = parseStudentNumber(text);
  if (answer.kind !== "numeric" || given === null) return { correct: false, cause: "calculation" };
  if (Math.abs(given - answer.value) <= answer.tolerance) return { correct: true, cause: null };
  return { correct: false, cause: numericCause(given, answer.value) };
}

export function suggestCause(student: string, correct: string, subject: SubjectId): ErrorCause | null {
  const given = parseStudentNumber(student);
  const expected = parseStudentNumber(correct);
  if (given === null || expected === null) {
    if (subject === "english" && student.trim() && correct.trim() && student.trim() !== correct.trim()) {
      return "meaning";
    }
    return null;
  }
  if (given === expected) return null;
  return numericCause(given, expected);
}
