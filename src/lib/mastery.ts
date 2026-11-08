import type { ErrorCause } from "@/lib/types";

export type MasteryState = {
  kpId: string;
  score: number;
  attempts: number;
  correctCount: number;
  lastErrorCause: ErrorCause | null;
  recent: boolean[];
  nextReviewAt: string | null;
  reviewStage: number;
};

export type Outcome = { correct: boolean; cause: ErrorCause | null; difficulty: number };

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isBlindSpot(state: MasteryState | null): boolean {
  if (!state || state.attempts === 0) return false;
  return state.score < 60 || state.recent.some((item) => !item);
}

export function applyOutcomes(
  prev: MasteryState | null,
  kpId: string,
  outcomes: Outcome[],
  now: Date,
): MasteryState {
  let score = prev?.score ?? 50;
  let attempts = prev?.attempts ?? 0;
  let correctCount = prev?.correctCount ?? 0;
  const recent = [...(prev?.recent ?? [])];
  let lastErrorCause = prev?.lastErrorCause ?? null;
  for (const outcome of outcomes) {
    const delta = outcome.correct ? 8 + outcome.difficulty * 4 : -(10 + outcome.difficulty * 5);
    score = clamp(score + delta);
    attempts += 1;
    if (outcome.correct) correctCount += 1;
    else if (outcome.cause) lastErrorCause = outcome.cause;
    recent.push(outcome.correct);
  }
  const anyWrong = outcomes.some((outcome) => !outcome.correct);
  let nextReviewAt = prev?.nextReviewAt ?? null;
  let reviewStage = prev?.reviewStage ?? 0;
  if (anyWrong) {
    nextReviewAt = addDays(now, 1);
    reviewStage = 1;
  } else if (nextReviewAt) {
    if (reviewStage <= 1) {
      nextReviewAt = addDays(now, 3);
      reviewStage = 2;
    } else if (reviewStage === 2) {
      nextReviewAt = addDays(now, 7);
      reviewStage = 3;
    } else {
      nextReviewAt = null;
      reviewStage = 0;
    }
  }
  return {
    kpId,
    score,
    attempts,
    correctCount,
    lastErrorCause,
    recent: recent.slice(-3),
    nextReviewAt,
    reviewStage,
  };
}
