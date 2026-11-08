import { shuffle } from "@/lib/rng";
import type {
  Answer,
  Choice,
  ErrorCause,
  GeneratedItem,
  ItemType,
  Rng,
  SubjectId,
} from "@/lib/types";

export function fmt(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${key}:${stable(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function normalizeFill(raw: string): string {
  const compact = raw.trim().replace(/，/g, ",").replace(/\s+/g, "").replace(/[{}]/g, "");
  if (compact === "" || compact === "空集" || compact === "emptyset" || compact === "∅" || compact === "phi") {
    return "∅";
  }
  const parts = compact.split(",").filter((part) => part.length > 0);
  const nums = parts.map((part) => Number(part));
  if (parts.length > 0 && nums.every((num) => Number.isFinite(num))) {
    return [...nums].sort((a, b) => a - b).join(",");
  }
  return compact.toLowerCase();
}

export function parseStudentNumber(raw: string): number | null {
  const text = raw.trim().replace(/，/g, "").replace(/\s+/g, "");
  if (!text) return null;
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return Number(fraction[1]) / denominator;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export function answersEqual(left: Answer, right: Answer): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "choice" && right.kind === "choice") return left.id === right.id;
  if (left.kind === "numeric" && right.kind === "numeric") {
    return Math.abs(left.value - right.value) <= Math.max(left.tolerance, right.tolerance, 1e-6);
  }
  if (left.kind === "fill" && right.kind === "fill") {
    const a = left.accept.map(normalizeFill).sort();
    const b = right.accept.map(normalizeFill).sort();
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return false;
}

type Trap = { text: string; cause: ErrorCause };

function withThreeTraps(correct: string, traps: Trap[]): Trap[] {
  const ready: Trap[] = [];
  const seen = new Set<string>([correct]);
  for (const trap of traps) {
    if (seen.has(trap.text)) continue;
    seen.add(trap.text);
    ready.push(trap);
  }
  const base = Number(correct);
  if (Number.isFinite(base)) {
    let step = 1;
    while (ready.length < 3 && step < 40) {
      for (const candidate of [base + step, base - step]) {
        const text = fmt(candidate);
        if (seen.has(text)) continue;
        seen.add(text);
        ready.push({ text, cause: "calculation" });
        if (ready.length === 3) break;
      }
      step += 1;
    }
  }
  if (ready.length < 3) {
    throw new Error(`选项不足或与正确答案重复：${correct}`);
  }
  return ready.slice(0, 3);
}

export function buildChoices(rng: Rng, correct: string, traps: Trap[]): {
  choices: Choice[];
  answer: Answer;
} {
  const unique = new Set<string>();
  const rows: { text: string; cause: ErrorCause | null }[] = [{ text: correct, cause: null }];
  unique.add(correct);
  for (const trap of traps) {
    if (unique.has(trap.text)) continue;
    unique.add(trap.text);
    rows.push(trap);
  }
  if (rows.length < 4) {
    throw new Error(`选项不足或与正确答案重复：${correct}`);
  }
  const picked = shuffle(rng, rows.slice(0, 4));
  const letters = ["A", "B", "C", "D"];
  const choices = picked.map((row, index) => ({
    id: letters[index]!,
    text: row.text,
    cause: row.cause,
  }));
  const answerId = choices.find((choice) => choice.cause === null)?.id;
  if (!answerId) throw new Error("缺少正确选项");
  return { choices, answer: { kind: "choice", id: answerId } };
}

export function choiceItem(input: {
  rng: Rng;
  templateId: string;
  kpId: string;
  sectionId: string;
  subject: SubjectId;
  difficulty: 1 | 2 | 3;
  stem: string;
  correct: string;
  traps: Trap[];
  solution: string;
  params: unknown;
}): GeneratedItem {
  const built = buildChoices(input.rng, input.correct, withThreeTraps(input.correct, input.traps));
  const source = (input.params ?? {}) as Record<string, unknown>;
  return {
    templateId: input.templateId,
    kpId: input.kpId,
    sectionId: input.sectionId,
    subject: input.subject,
    type: "choice",
    difficulty: input.difficulty,
    stem: input.stem,
    choices: built.choices,
    answer: built.answer,
    solution: input.solution,
    signature: `${input.templateId}:choice:${stable(source)}`,
    params: {
      ...source,
      options: built.choices.map((choice) => ({ id: choice.id, text: choice.text })),
    },
  };
}

export function numericItem(input: {
  templateId: string;
  kpId: string;
  sectionId: string;
  subject: SubjectId;
  difficulty: 1 | 2 | 3;
  stem: string;
  value: number;
  tolerance?: number;
  solution: string;
  params: unknown;
  type?: ItemType;
}): GeneratedItem {
  const type = input.type ?? "numeric";
  return {
    templateId: input.templateId,
    kpId: input.kpId,
    sectionId: input.sectionId,
    subject: input.subject,
    type,
    difficulty: input.difficulty,
    stem: input.stem,
    choices: null,
    answer: { kind: "numeric", value: input.value, tolerance: input.tolerance ?? 1e-6 },
    solution: input.solution,
    signature: `${input.templateId}:${type}:${stable(input.params)}`,
    params: input.params,
  };
}

export function asChoiceOrNumeric(
  type: ItemType,
  rng: Rng,
  base: {
    templateId: string;
    kpId: string;
    sectionId: string;
    subject: SubjectId;
    difficulty: 1 | 2 | 3;
    stem: string;
    value: number;
    traps: { value: number; cause: ErrorCause }[];
    solution: string;
    params: unknown;
    tolerance?: number;
  },
): GeneratedItem {
  if (type !== "choice") return numericItem({ ...base, type });
  const seen = new Set<string>([fmt(base.value)]);
  const traps: Trap[] = [];
  for (const trap of base.traps) {
    const text = fmt(trap.value);
    if (seen.has(text)) continue;
    seen.add(text);
    traps.push({ text, cause: trap.cause });
    if (traps.length === 3) break;
  }
  return choiceItem({
    rng,
    templateId: base.templateId,
    kpId: base.kpId,
    sectionId: base.sectionId,
    subject: base.subject,
    difficulty: base.difficulty,
    stem: base.stem,
    correct: fmt(base.value),
    traps,
    solution: base.solution,
    params: base.params,
  });
}
