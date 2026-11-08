import type { ExamType, ItemType, SubjectId } from "@/lib/types";

export type Slot = {
  type: ItemType;
  points: number;
  display: "选择" | "填空" | "解答";
};

export type Blueprint = {
  minutes: number;
  slots: Slot[];
};

const choice = (points: number): Slot => ({ type: "choice", points, display: "选择" });
const blank = (points: number): Slot => ({ type: "numeric", points, display: "填空" });
const solve = (points: number): Slot => ({ type: "numeric", points, display: "解答" });
const fill = (points: number): Slot => ({ type: "fill", points, display: "填空" });

function repeat(slot: Slot, count: number): Slot[] {
  return Array.from({ length: count }, () => ({ ...slot }));
}

export const BLUEPRINTS: Record<SubjectId, Record<ExamType, Blueprint>> = {
  math: {
    weekly: { minutes: 30, slots: [...repeat(choice(4), 4), ...repeat(blank(5), 2)] },
    monthly: {
      minutes: 60,
      slots: [...repeat(choice(5), 6), ...repeat(blank(5), 2), fill(5), solve(15)],
    },
    midterm: {
      minutes: 90,
      slots: [...repeat(choice(5), 8), ...repeat(blank(5), 3), fill(5), ...repeat(solve(10), 2)],
    },
    final: {
      minutes: 120,
      slots: [...repeat(choice(5), 8), ...repeat(blank(5), 3), fill(5), ...repeat(solve(10), 3)],
    },
  },
  physics: {
    weekly: { minutes: 30, slots: [...repeat(choice(4), 4), ...repeat(blank(5), 2)] },
    monthly: {
      minutes: 60,
      slots: [...repeat(choice(5), 6), ...repeat(blank(5), 3), solve(15)],
    },
    midterm: {
      minutes: 90,
      slots: [...repeat(choice(5), 8), ...repeat(blank(5), 3), ...repeat(solve(10), 2)],
    },
    final: {
      minutes: 120,
      slots: [...repeat(choice(5), 8), ...repeat(blank(5), 4), ...repeat(solve(10), 3)],
    },
  },
  chemistry: {
    weekly: { minutes: 30, slots: [...repeat(choice(4), 4), ...repeat(blank(5), 2)] },
    monthly: {
      minutes: 60,
      slots: [...repeat(choice(5), 6), ...repeat(blank(5), 3), solve(15)],
    },
    midterm: {
      minutes: 90,
      slots: [...repeat(choice(5), 8), ...repeat(blank(5), 3), ...repeat(solve(10), 2)],
    },
    final: {
      minutes: 120,
      slots: [...repeat(choice(5), 8), ...repeat(blank(5), 4), ...repeat(solve(10), 3)],
    },
  },
  english: {
    weekly: { minutes: 25, slots: repeat(choice(5), 6) },
    monthly: { minutes: 45, slots: repeat(choice(5), 10) },
    midterm: { minutes: 70, slots: repeat(choice(5), 12) },
    final: { minutes: 90, slots: repeat(choice(5), 15) },
  },
};

export function paperTotal(slots: Slot[]): number {
  return slots.reduce((sum, slot) => sum + slot.points, 0);
}
