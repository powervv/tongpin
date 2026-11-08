export type SubjectId = "math" | "physics" | "chemistry" | "english";

export type SectionStatus = "unlearned" | "learning" | "learned";

export type ExamType = "weekly" | "monthly" | "midterm" | "final";

export type ItemType = "choice" | "numeric" | "fill";

export type ErrorCause =
  | "concept"
  | "formula"
  | "calculation"
  | "misread"
  | "unit"
  | "incomplete"
  | "vocab"
  | "grammar"
  | "meaning"
  | "detail";

export type Choice = {
  id: string;
  text: string;
  cause: ErrorCause | null;
};

export type Answer =
  | { kind: "choice"; id: string }
  | { kind: "numeric"; value: number; tolerance: number }
  | { kind: "fill"; accept: string[] };

export type GeneratedItem = {
  templateId: string;
  kpId: string;
  sectionId: string;
  subject: SubjectId;
  type: ItemType;
  difficulty: 1 | 2 | 3;
  stem: string;
  choices: Choice[] | null;
  answer: Answer;
  solution: string;
  signature: string;
  params: unknown;
};

export type Rng = () => number;
