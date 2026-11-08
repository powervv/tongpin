import { answersEqual } from "@/lib/bank/helpers";
import { TEMPLATES } from "@/lib/bank/index";
import type { Template } from "@/lib/bank/types";
import { verifyItem } from "@/lib/bank/verify";
import { isTaught } from "@/lib/curriculum";
import { isBlindSpot, type MasteryState } from "@/lib/mastery";
import { BLUEPRINTS, paperTotal, type Slot } from "@/lib/paper/blueprints";
import { mulberry32 } from "@/lib/rng";
import type { ExamType, GeneratedItem, SectionStatus, SubjectId } from "@/lib/types";

export type ComposeInput = {
  subject: SubjectId;
  examType: ExamType;
  progress: Record<string, SectionStatus>;
  mastery: MasteryState[];
  recentSignatures: string[];
  seed: number;
};

export type ComposedPaper = {
  minutes: number;
  total: number;
  items: Array<GeneratedItem & { points: number; display: Slot["display"] }>;
};

function usableType(template: Template, slot: Slot): GeneratedItem["type"] | null {
  if (template.types.includes(slot.type)) return slot.type;
  if ((slot.display === "填空" || slot.display === "解答") && template.types.includes("numeric")) return "numeric";
  if (slot.type === "fill" && template.types.includes("numeric")) return "numeric";
  return null;
}

export function composePaper(input: ComposeInput): ComposedPaper | { error: string } {
  const blueprint = BLUEPRINTS[input.subject][input.examType];
  const taught = new Set(
    Object.entries(input.progress)
      .filter(([, status]) => isTaught(status))
      .map(([id]) => id),
  );
  if (taught.size === 0) return { error: "这科还没有已学或在学的章节。先到进度里标出学校讲到哪里。" };
  const masteryByKp = new Map(input.mastery.map((state) => [state.kpId, state]));
  const weakKps = new Set(
    TEMPLATES.filter((template) => taught.has(template.sectionId) && isBlindSpot(masteryByKp.get(template.kpId) ?? null)).map(
      (template) => template.kpId,
    ),
  );
  const pool = TEMPLATES.filter((template) => template.subject === input.subject && taught.has(template.sectionId));
  if (pool.length === 0) return { error: "已学范围内还没有可用题目。" };

  const weakTarget = weakKps.size === 0 ? 0 : Math.round(blueprint.slots.length * 0.4);
  const weakTypes = new Set(
    pool.filter((template) => weakKps.has(template.kpId)).flatMap((template) => template.types),
  );
  const preferred = blueprint.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.type === "choice" && weakTypes.has("choice") || weakTypes.has(slot.type) || (slot.type === "fill" && weakTypes.has("numeric")));
  const weakIndices = new Set<number>();
  for (const item of preferred) {
    if (weakIndices.size >= weakTarget) break;
    weakIndices.add(item.index);
  }
  for (let index = 0; index < blueprint.slots.length && weakIndices.size < weakTarget; index += 1) {
    weakIndices.add(index);
  }

  const rng = mulberry32(input.seed);
  const used = new Set(input.recentSignatures);
  const sectionCounts = new Map<string, number>();
  const items: ComposedPaper["items"] = [];

  for (const [index, slot] of blueprint.slots.entries()) {
    const generated = pickItem({
      pool,
      slot,
      rng,
      used,
      sectionCounts,
      weakKps,
      preferWeak: weakIndices.has(index),
    });
    if (!generated) return { error: "这个范围里的题目不够组一套卷。可以把进度再放宽一节，或先做周练。" };
    used.add(generated.signature);
    sectionCounts.set(generated.sectionId, (sectionCounts.get(generated.sectionId) ?? 0) + 1);
    items.push({ ...generated, points: slot.points, display: slot.display });
  }

  return { minutes: blueprint.minutes, total: paperTotal(blueprint.slots), items };
}

function pickItem(input: {
  pool: Template[];
  slot: Slot;
  rng: () => number;
  used: Set<string>;
  sectionCounts: Map<string, number>;
  weakKps: Set<string>;
  preferWeak: boolean;
}): (GeneratedItem & { points?: never }) | null {
  const candidates = input.pool.filter((template) => usableType(template, input.slot));
  const narrow = (list: Template[]) => {
    if (!input.preferWeak) {
      if (list.length === 0) return list;
      const min = Math.min(...list.map((template) => input.sectionCounts.get(template.sectionId) ?? 0));
      const covered = list.filter((template) => (input.sectionCounts.get(template.sectionId) ?? 0) === min);
      return covered.length > 0 ? covered : list;
    }
    const weak = list.filter((template) => input.weakKps.has(template.kpId));
    return weak.length > 0 ? weak : list;
  };
  const primary = narrow(candidates);
  const found = search(primary, input.slot, input.rng, input.used, false) ?? search(candidates, input.slot, input.rng, input.used, false);
  if (found) return found;
  const repeated = search(candidates, input.slot, input.rng, input.used, true);
  if (repeated) return repeated;
  const relaxed = input.preferWeak
    ? input.pool.filter((template) => input.weakKps.has(template.kpId))
    : input.pool;
  return searchLoose(relaxed.length > 0 ? relaxed : input.pool, input.rng, input.used);
}

function searchLoose(list: Template[], rng: () => number, used: Set<string>): GeneratedItem | null {
  if (list.length === 0) return null;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const template = list[Math.floor(rng() * list.length)]!;
    const type = template.types[Math.floor(rng() * template.types.length)]!;
    try {
      const item = template.generate(rng, type);
      if (used.has(item.signature)) continue;
      const verdict = verifyItem(template.id, item.params, item.type);
      if (!answersEqual(verdict, item.answer)) continue;
      return item;
    } catch {
      continue;
    }
  }
  return null;
}

function search(
  list: Template[],
  slot: Slot,
  rng: () => number,
  used: Set<string>,
  allowRepeat: boolean,
): GeneratedItem | null {
  if (list.length === 0) return null;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const template = list[Math.floor(rng() * list.length)]!;
    const type = usableType(template, slot);
    if (!type) continue;
    try {
      const item = template.generate(rng, type);
      if (!allowRepeat && used.has(item.signature)) continue;
      const verdict = verifyItem(template.id, item.params, item.type);
      if (!answersEqual(verdict, item.answer)) continue;
      return item;
    } catch {
      continue;
    }
  }
  return null;
}

export function similarItems(input: {
  kpId: string;
  count: number;
  avoid: string[];
  seed: number;
}): GeneratedItem[] {
  const rng = mulberry32(input.seed);
  const templates = TEMPLATES.filter((template) => template.kpId === input.kpId);
  const used = new Set(input.avoid);
  const items: GeneratedItem[] = [];
  let guard = 0;
  while (items.length < input.count && guard < 50) {
    guard += 1;
    if (templates.length === 0) break;
    const template = templates[Math.floor(rng() * templates.length)]!;
    const type = template.types[Math.floor(rng() * template.types.length)]!;
    try {
      const item = template.generate(rng, type);
      if (used.has(item.signature)) continue;
      const verdict = verifyItem(template.id, item.params, item.type);
      if (!answersEqual(verdict, item.answer)) continue;
      used.add(item.signature);
      items.push(item);
    } catch {
      continue;
    }
  }
  if (items.length < input.count) {
    for (const template of templates) {
      if (items.length >= input.count) break;
      const type = template.types[0]!;
      try {
        const item = template.generate(rng, type);
        if (items.some((existing) => existing.signature === item.signature)) continue;
        const verdict = verifyItem(template.id, item.params, item.type);
        if (!answersEqual(verdict, item.answer)) continue;
        items.push(item);
      } catch {
        continue;
      }
    }
  }
  return items;
}
