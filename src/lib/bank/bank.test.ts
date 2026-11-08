import { ENGLISH_CARDS } from "@/lib/bank/english";
import { ENGLISH_TRUTH } from "@/lib/bank/english-key";
import { oxidationNumber } from "@/lib/bank/chem-check";
import { answersEqual } from "@/lib/bank/helpers";
import { TEMPLATES } from "@/lib/bank/index";
import { verifyItem } from "@/lib/bank/verify";
import { KNOWLEDGE_POINTS, SECTIONS, defaultProgress } from "@/lib/curriculum";
import { applyOutcomes, isBlindSpot } from "@/lib/mastery";
import { composePaper } from "@/lib/paper/compose";
import { gradeAnswer, suggestCause } from "@/lib/paper/grade";
import { mulberry32 } from "@/lib/rng";
import type { Answer } from "@/lib/types";
import { describe, expect, it } from "vitest";

describe("题库", () => {
  it("每个章节和知识点都有题", () => {
    for (const section of SECTIONS) {
      expect(TEMPLATES.some((template) => template.sectionId === section.id)).toBe(true);
    }
    for (const point of KNOWLEDGE_POINTS) {
      expect(TEMPLATES.some((template) => template.kpId === point.id)).toBe(true);
    }
  });

  it("化合价验算覆盖常见物质", () => {
    expect(oxidationNumber("H2SO4", "S")).toBe(6);
    expect(oxidationNumber("SO2", "S")).toBe(4);
    expect(oxidationNumber("H2S", "S")).toBe(-2);
    expect(oxidationNumber("NaClO", "Cl")).toBe(1);
    expect(oxidationNumber("Fe2O3", "Fe")).toBe(3);
    expect(oxidationNumber("Na2O2", "O")).toBe(-1);
    expect(oxidationNumber("Cl2", "Cl")).toBe(0);
    expect(oxidationNumber("H2O", "O")).toBe(-2);
  });

  it("生成答案和独立验算一致", () => {
    for (const template of TEMPLATES) {
      for (let seed = 1; seed <= 6; seed += 1) {
        for (const type of template.types) {
          const item = template.generate(mulberry32(seed * 97 + template.id.length * 13), type);
          expect(item.sectionId).toBe(template.sectionId);
          expect(item.kpId).toBe(template.kpId);
          const verdict = verifyItem(template.id, item.params, item.type);
          expect(answersEqual(verdict, item.answer), `${template.id} seed ${seed} ${type}`).toBe(true);
          if (item.answer.kind === "choice") {
            expect(item.choices).toHaveLength(4);
            const correct = item.choices?.filter((choice) => choice.cause === null) ?? [];
            expect(correct).toHaveLength(1);
            expect(correct[0]?.id).toBe(item.answer.id);
            expect(new Set(item.choices?.map((choice) => choice.text)).size).toBe(4);
          }
        }
      }
    }
  });

  it("英语答案键和原文线索对得上", () => {
    expect(Object.keys(ENGLISH_TRUTH).sort()).toEqual(ENGLISH_CARDS.map((card) => card.id).sort());
    for (const card of ENGLISH_CARDS) {
      expect(card.correct).toBe(ENGLISH_TRUTH[card.id]);
      if (card.clue) expect(card.stem).toContain(card.clue);
    }
  });
});

describe("组卷", () => {
  it("默认进度的数学月考不出现未学内容，题干不重复", () => {
    const paper = composePaper({
      subject: "math",
      examType: "monthly",
      progress: defaultProgress(),
      mastery: [],
      recentSignatures: [],
      seed: 7,
    });
    expect("error" in paper).toBe(false);
    if ("error" in paper) return;
    expect(paper.items.length).toBeGreaterThan(8);
    const stems = paper.items.map((item) => item.stem);
    expect(new Set(stems).size).toBe(stems.length);
    for (const item of paper.items) {
      const section = SECTIONS.find((entry) => entry.id === item.sectionId);
      expect(section && section.defaultStatus !== "unlearned").toBe(true);
    }
  });

  it("只开放一节时，题目都来自那一节", () => {
    const progress = defaultProgress();
    for (const id of Object.keys(progress)) {
      if (id.startsWith("math-")) progress[id] = "unlearned";
    }
    progress["math-1-1"] = "learned";
    const paper = composePaper({
      subject: "math",
      examType: "weekly",
      progress,
      mastery: [],
      recentSignatures: [],
      seed: 3,
    });
    expect("error" in paper).toBe(false);
    if ("error" in paper) return;
    expect(paper.items.every((item) => item.sectionId === "math-1-1")).toBe(true);
  });

  it("盲点大约占四成", () => {
    const progress = defaultProgress();
    const paper = composePaper({
      subject: "math",
      examType: "monthly",
      progress,
      mastery: [
        {
          kpId: "math.set.element",
          score: 30,
          attempts: 3,
          correctCount: 0,
          lastErrorCause: "concept",
          recent: [false, false, false],
          nextReviewAt: null,
          reviewStage: 0,
        },
      ],
      recentSignatures: [],
      seed: 11,
    });
    expect("error" in paper).toBe(false);
    if ("error" in paper) return;
    const weakCount = paper.items.filter((item) => item.kpId === "math.set.element").length;
    expect(weakCount).toBeGreaterThanOrEqual(3);
  });
});

describe("批改和复习", () => {
  it("符号相反时记为单位或符号", () => {
    const answer: Answer = { kind: "numeric", value: 12, tolerance: 1e-6 };
    expect(gradeAnswer("numeric", answer, null, "-12").cause).toBe("unit");
    expect(suggestCause("-4", "4", "physics")).toBe("unit");
    expect(suggestCause("3.9", "4", "math")).toBe("calculation");
  });

  it("错题按 1 天、3 天、7 天推进", () => {
    const now = new Date("2026-11-08T08:00:00+08:00");
    const wrong = applyOutcomes(null, "math.set.element", [{ correct: false, cause: "concept", difficulty: 2 }], now);
    expect(isBlindSpot(wrong)).toBe(true);
    expect(wrong.reviewStage).toBe(1);
    const day = 24 * 60 * 60 * 1000;
    expect(new Date(wrong.nextReviewAt ?? 0).getTime() - now.getTime()).toBe(day);
    const second = applyOutcomes(wrong, wrong.kpId, [{ correct: true, cause: null, difficulty: 2 }], now);
    expect(second.reviewStage).toBe(2);
    expect(new Date(second.nextReviewAt ?? 0).getTime() - now.getTime()).toBe(3 * day);
    const third = applyOutcomes(second, second.kpId, [{ correct: true, cause: null, difficulty: 2 }], now);
    expect(third.reviewStage).toBe(3);
    expect(new Date(third.nextReviewAt ?? 0).getTime() - now.getTime()).toBe(7 * day);
    const done = applyOutcomes(third, third.kpId, [{ correct: true, cause: null, difficulty: 2 }], now);
    expect(done.nextReviewAt).toBeNull();
  });
});
