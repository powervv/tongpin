import type { ErrorCause, ExamType, SectionStatus, SubjectId } from "@/lib/types";

export const SUBJECT_META: Record<SubjectId, { name: string; book: string }> = {
  math: { name: "数学", book: "人教 A 版必修第一册" },
  physics: { name: "物理", book: "人教版必修第一册" },
  chemistry: { name: "化学", book: "人教版必修第一册" },
  english: { name: "英语", book: "外研版（2019）必修第一册" },
};

export const SUBJECT_IDS: SubjectId[] = ["math", "physics", "chemistry", "english"];

export const EXAM_META: Record<ExamType, { name: string }> = {
  weekly: { name: "周练" },
  monthly: { name: "月考" },
  midterm: { name: "期中" },
  final: { name: "期末" },
};

export const EXAM_IDS: ExamType[] = ["weekly", "monthly", "midterm", "final"];

export const STATUS_META: Record<SectionStatus, { name: string }> = {
  unlearned: { name: "未学" },
  learning: { name: "在学" },
  learned: { name: "已学" },
};

export const CAUSE_LABEL: Record<ErrorCause, string> = {
  concept: "概念不清",
  formula: "公式用错",
  calculation: "计算失误",
  misread: "审题遗漏",
  unit: "单位或符号",
  incomplete: "步骤不完整",
  vocab: "词汇",
  grammar: "语法",
  meaning: "句意理解",
  detail: "细节定位",
};

export const STEM_CAUSES: ErrorCause[] = [
  "concept",
  "formula",
  "calculation",
  "misread",
  "unit",
  "incomplete",
];

export const ENGLISH_CAUSES: ErrorCause[] = [
  "vocab",
  "grammar",
  "meaning",
  "detail",
  "misread",
];

export function causesFor(subject: SubjectId): ErrorCause[] {
  return subject === "english" ? ENGLISH_CAUSES : STEM_CAUSES;
}

export function formatWhen(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
    hourCycle: "h23",
  }).format(date);
}

export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
