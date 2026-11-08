"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getKnowledgePoint } from "@/lib/curriculum";
import { causesFor, EXAM_IDS, EXAM_META, SUBJECT_IDS, SUBJECT_META } from "@/lib/labels";
import { composePaper, similarItems } from "@/lib/paper/compose";
import { BLUEPRINTS } from "@/lib/paper/blueprints";
import { paperDate } from "@/lib/display";
import {
  getAttempt,
  getMastery,
  getProgress,
  gradeAttempt,
  recentSignatures,
  recordSchoolMistake,
  saveComposed,
  setSectionStatus,
  setStudentName,
} from "@/lib/repo";
import type { ErrorCause, ExamType, SubjectId } from "@/lib/types";

export type FormState = { error?: string };

function isSubject(value: string): value is SubjectId {
  return SUBJECT_IDS.includes(value as SubjectId);
}

function isExam(value: string): value is ExamType {
  return EXAM_IDS.includes(value as ExamType);
}

function isCause(value: string, subject: SubjectId): value is ErrorCause {
  return causesFor(subject).includes(value as ErrorCause);
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/mistakes");
  revalidatePath("/mastery");
}

export async function updateName(formData: FormData): Promise<void> {
  await setStudentName(String(formData.get("name") ?? ""));
  refresh();
  redirect("/progress");
}

export async function updateProgress(formData: FormData): Promise<void> {
  const sectionId = String(formData.get("sectionId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status === "unlearned" || status === "learning" || status === "learned") {
    try {
      await setSectionStatus(sectionId, status);
    } catch {
      redirect("/progress");
    }
  }
  refresh();
  redirect("/progress");
}

export async function createPaper(_prev: FormState, formData: FormData): Promise<FormState> {
  const subjectRaw = String(formData.get("subject") ?? "");
  const examRaw = String(formData.get("examType") ?? "");
  if (!isSubject(subjectRaw) || !isExam(examRaw)) return { error: "请选择科目和卷型。" };
  const progress = await getProgress();
  const mastery = await getMastery();
  const recent = await recentSignatures(subjectRaw, 80);
  const paper = composePaper({
    subject: subjectRaw,
    examType: examRaw,
    progress,
    mastery,
    recentSignatures: recent,
    seed: randomInt(1, 1_000_000_000),
  });
  if ("error" in paper) return { error: paper.error };
  const id = await saveComposed({
    kind: "generated",
    subject: subjectRaw,
    examType: examRaw,
    title: `${SUBJECT_META[subjectRaw].name}${EXAM_META[examRaw].name} · ${paperDate()}`,
    minutes: BLUEPRINTS[subjectRaw][examRaw].minutes,
    total: paper.total,
    paper,
  });
  refresh();
  redirect(`/attempts/${id}`);
}

export async function submitAttempt(attemptId: string, formData: FormData): Promise<void> {
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("q-") && typeof value === "string") answers[key.slice(2)] = value;
  }
  await gradeAttempt(attemptId, answers);
  refresh();
  redirect(`/attempts/${attemptId}/review`);
}

export async function startSimilar(formData: FormData): Promise<void> {
  const kpId = String(formData.get("kpId") ?? "");
  let subject: SubjectId;
  let title: string;
  try {
    const point = getKnowledgePoint(kpId);
    subject = point.subject;
    title = point.title;
  } catch {
    redirect("/mastery");
  }
  const recent = await recentSignatures(subject, 60);
  const raw = similarItems({
    kpId,
    count: 3,
    avoid: recent,
    seed: randomInt(1, 1_000_000_000),
  });
  if (raw.length === 0) redirect("/mastery?notice=empty");
  const id = await saveComposed({
    kind: "similar",
    subject,
    examType: null,
    title: `同类题 · ${title}`,
    minutes: 15,
    total: raw.length * 5,
    paper: {
      minutes: 15,
      total: raw.length * 5,
      items: raw.map((item) => ({
        ...item,
        points: 5,
        display: item.type === "choice" ? "选择" : "填空",
      })),
    },
  });
  refresh();
  redirect(`/attempts/${id}`);
}

export async function recordSchool(_prev: FormState, formData: FormData): Promise<FormState> {
  const subjectRaw = String(formData.get("subject") ?? "");
  if (!isSubject(subjectRaw)) return { error: "请选择科目。" };
  const title = String(formData.get("title") ?? "").trim();
  const stem = String(formData.get("stem") ?? "").trim();
  const studentAnswer = String(formData.get("studentAnswer") ?? "").trim();
  const correctAnswer = String(formData.get("correctAnswer") ?? "").trim();
  const kpId = String(formData.get("kpId") ?? "");
  const causeRaw = String(formData.get("cause") ?? "");
  const next = String(formData.get("next") ?? "more");
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  if (!title || !stem || !studentAnswer || !correctAnswer) return { error: "名称、题目、孩子的答案和正确答案都要填。" };
  if (!isCause(causeRaw, subjectRaw)) return { error: "请选择错因。" };
  try {
    const point = getKnowledgePoint(kpId);
    if (point.subject !== subjectRaw) return { error: "这个知识点不属于所选科目。" };
  } catch {
    return { error: "请选择知识点。" };
  }
  if (attemptId) {
    const existing = await getAttempt(attemptId);
    if (!existing || existing.kind !== "school" || existing.subject !== subjectRaw) {
      return { error: "找不到要继续登记的学校卷。" };
    }
  }
  const score = Number(formData.get("score") ?? 0);
  const total = Number(formData.get("total") ?? 0);
  if (!attemptId && (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0)) {
    return { error: "请填写卷面得分和满分。" };
  }
  const id = await recordSchoolMistake({
    attemptId: attemptId || undefined,
    subject: subjectRaw,
    title: title.slice(0, 40),
    schoolDate: String(formData.get("schoolDate") ?? ""),
    score: Number.isFinite(score) ? score : 0,
    total: Number.isFinite(total) ? total : 0,
    stem,
    studentAnswer,
    correctAnswer,
    kpId,
    cause: causeRaw,
  });
  refresh();
  if (next === "similar") {
    const recent = await recentSignatures(subjectRaw, 60);
    const raw = similarItems({
      kpId,
      count: 3,
      avoid: recent,
      seed: randomInt(1, 1_000_000_000),
    });
    if (raw.length === 0) redirect(`/mistakes/new?attempt=${id}&notice=empty`);
    const similarId = await saveComposed({
      kind: "similar",
      subject: subjectRaw,
      examType: null,
      title: `同类题 · ${getKnowledgePoint(kpId).title}`,
      minutes: 15,
      total: raw.length * 5,
      paper: {
        minutes: 15,
        total: raw.length * 5,
        items: raw.map((item) => ({
          ...item,
          points: 5,
          display: item.type === "choice" ? "选择" : "填空",
        })),
      },
    });
    redirect(`/attempts/${similarId}`);
  }
  redirect(`/mistakes/new?attempt=${id}`);
}
