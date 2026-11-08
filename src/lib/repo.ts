import { SECTIONS, getKnowledgePoint, getSection } from "@/lib/curriculum";
import { sql, withTx, type Query } from "@/lib/db";
import { applyOutcomes, type MasteryState, type Outcome } from "@/lib/mastery";
import type { ComposedPaper } from "@/lib/paper/compose";
import { gradeAnswer } from "@/lib/paper/grade";
import type { Answer, Choice, ErrorCause, ExamType, ItemType, SectionStatus, SubjectId } from "@/lib/types";

export type AttemptSummary = {
  id: string;
  kind: string;
  subject: SubjectId;
  examType: string | null;
  title: string;
  createdAt: string;
  submittedAt: string | null;
  score: number | null;
  total: number | null;
  status: string;
  durationMin: number | null;
};

export type StoredItem = {
  id: string;
  attemptId: string;
  position: number;
  kpId: string;
  templateId: string | null;
  sectionId: string;
  subject: SubjectId;
  itemType: ItemType;
  display: string;
  difficulty: number;
  points: number;
  stem: string;
  choices: Choice[] | null;
  answer: Answer;
  solution: string;
  signature: string;
  studentAnswer: string | null;
  correct: boolean | null;
  errorCause: ErrorCause | null;
  earned: number | null;
  source: string;
};

export type StoredAttempt = AttemptSummary & {
  schoolDate: string | null;
  note: string | null;
  items: StoredItem[];
};

let ready: Promise<void> | undefined;

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function asIso(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function asDateOnly(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function asJson<T>(value: unknown): T {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
}

export function ensureReady(): Promise<void> {
  ready ??= seed().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

async function seed(): Promise<void> {
  await sql(
    "insert into student (id, name, grade, city) values (1, '孩子', '高一', '深圳') on conflict (id) do nothing",
  );
  const count = await sql<{ n: number | string }>("select count(*)::int as n from section_progress");
  if (asNumber(count[0]?.n ?? 0) > 0) return;
  for (const section of SECTIONS) {
    await sql("insert into section_progress (section_id, status) values ($1, $2)", [
      section.id,
      section.defaultStatus,
    ]);
  }
}

export async function getStudent(): Promise<{ name: string; grade: string; city: string }> {
  await ensureReady();
  const rows = await sql<{ name: string; grade: string; city: string }>(
    "select name, grade, city from student where id = 1",
  );
  return rows[0] ?? { name: "孩子", grade: "高一", city: "深圳" };
}

export async function setStudentName(name: string): Promise<void> {
  await ensureReady();
  const clean = name.trim().slice(0, 20);
  if (!clean) return;
  await sql("update student set name = $1 where id = 1", [clean]);
}

export async function getProgress(): Promise<Record<string, SectionStatus>> {
  await ensureReady();
  const rows = await sql<{ section_id: string; status: SectionStatus }>(
    "select section_id, status from section_progress",
  );
  const progress: Record<string, SectionStatus> = {};
  for (const section of SECTIONS) progress[section.id] = section.defaultStatus;
  for (const row of rows) progress[row.section_id] = row.status;
  return progress;
}

export async function setSectionStatus(sectionId: string, status: SectionStatus): Promise<void> {
  await ensureReady();
  getSection(sectionId);
  if (!["unlearned", "learning", "learned"].includes(status)) return;
  await sql(
    `insert into section_progress (section_id, status, updated_at) values ($1, $2, now())
     on conflict (section_id) do update set status = excluded.status, updated_at = now()`,
    [sectionId, status],
  );
}

function mapMastery(row: Record<string, unknown>): MasteryState {
  return {
    kpId: String(row.kp_id),
    score: asNumber(row.score),
    attempts: asNumber(row.attempts),
    correctCount: asNumber(row.correct_count),
    lastErrorCause: (row.last_error_cause as ErrorCause | null) ?? null,
    recent: asJson<boolean[]>(row.recent_json ?? "[]"),
    nextReviewAt: row.next_review_at ? asIso(row.next_review_at) : null,
    reviewStage: asNumber(row.review_stage),
  };
}

export async function getMastery(): Promise<MasteryState[]> {
  await ensureReady();
  const rows = await sql<Record<string, unknown>>("select * from mastery");
  return rows.map(mapMastery);
}

export async function recentSignatures(subject: SubjectId, limit: number): Promise<string[]> {
  await ensureReady();
  const rows = await sql<{ signature: string }>(
    `select i.signature from attempt_items i
     join attempts a on a.id = i.attempt_id
     where a.subject = $1
     order by a.created_at desc
     limit $2`,
    [subject, limit],
  );
  return rows.map((row) => row.signature);
}

function mapAttempt(row: Record<string, unknown>): AttemptSummary {
  return {
    id: String(row.id),
    kind: String(row.kind),
    subject: String(row.subject) as SubjectId,
    examType: row.exam_type ? String(row.exam_type) : null,
    title: String(row.title),
    createdAt: asIso(row.created_at),
    submittedAt: row.submitted_at ? asIso(row.submitted_at) : null,
    score: row.score === null || row.score === undefined ? null : asNumber(row.score),
    total: row.total === null || row.total === undefined ? null : asNumber(row.total),
    status: String(row.status),
    durationMin: row.duration_min === null || row.duration_min === undefined ? null : asNumber(row.duration_min),
  };
}

function mapItem(row: Record<string, unknown>): StoredItem {
  return {
    id: String(row.id),
    attemptId: String(row.attempt_id),
    position: asNumber(row.position),
    kpId: String(row.kp_id),
    templateId: row.template_id ? String(row.template_id) : null,
    sectionId: String(row.section_id),
    subject: String(row.subject) as SubjectId,
    itemType: String(row.item_type) as ItemType,
    display: String(row.display),
    difficulty: asNumber(row.difficulty),
    points: asNumber(row.points),
    stem: String(row.stem),
    choices: row.choices_json ? asJson<Choice[]>(row.choices_json) : null,
    answer: asJson<Answer>(row.answer_json),
    solution: String(row.solution),
    signature: String(row.signature),
    studentAnswer: row.student_answer === null || row.student_answer === undefined ? null : String(row.student_answer),
    correct: row.correct === null || row.correct === undefined ? null : Boolean(row.correct),
    errorCause: (row.error_cause as ErrorCause | null) ?? null,
    earned: row.earned === null || row.earned === undefined ? null : asNumber(row.earned),
    source: String(row.source),
  };
}

export async function listAttempts(limit = 8): Promise<AttemptSummary[]> {
  await ensureReady();
  const rows = await sql<Record<string, unknown>>(
    "select * from attempts order by created_at desc limit $1",
    [limit],
  );
  return rows.map(mapAttempt);
}

export async function getAttempt(id: string): Promise<StoredAttempt | null> {
  await ensureReady();
  const rows = await sql<Record<string, unknown>>("select * from attempts where id = $1", [id]);
  const attempt = rows[0];
  if (!attempt) return null;
  const items = await sql<Record<string, unknown>>(
    "select * from attempt_items where attempt_id = $1 order by position asc",
    [id],
  );
  return {
    ...mapAttempt(attempt),
    schoolDate: asDateOnly(attempt.school_date),
    note: attempt.note ? String(attempt.note) : null,
    items: items.map(mapItem),
  };
}

async function insertItems(query: Query, attemptId: string, items: StoredItem[]): Promise<void> {
  for (const item of items) {
    await query(
      `insert into attempt_items (
        id, attempt_id, position, kp_id, template_id, section_id, subject, item_type, display,
        difficulty, points, stem, choices_json, answer_json, solution, signature, student_answer,
        correct, error_cause, earned, source
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )`,
      [
        item.id,
        attemptId,
        item.position,
        item.kpId,
        item.templateId,
        item.sectionId,
        item.subject,
        item.itemType,
        item.display,
        item.difficulty,
        item.points,
        item.stem,
        item.choices ? JSON.stringify(item.choices) : null,
        JSON.stringify(item.answer),
        item.solution,
        item.signature,
        item.studentAnswer,
        item.correct,
        item.errorCause,
        item.earned,
        item.source,
      ],
    );
  }
}

export async function saveComposed(input: {
  kind: "generated" | "similar";
  subject: SubjectId;
  examType: ExamType | null;
  title: string;
  minutes: number;
  total: number;
  paper: ComposedPaper;
}): Promise<string> {
  await ensureReady();
  const id = crypto.randomUUID();
  const items: StoredItem[] = input.paper.items.map((item, index) => ({
    id: crypto.randomUUID(),
    attemptId: id,
    position: index + 1,
    kpId: item.kpId,
    templateId: item.templateId,
    sectionId: item.sectionId,
    subject: item.subject,
    itemType: item.type,
    display: item.display,
    difficulty: item.difficulty,
    points: item.points,
    stem: item.stem,
    choices: item.choices,
    answer: item.answer,
    solution: item.solution,
    signature: item.signature,
    studentAnswer: null,
    correct: null,
    errorCause: null,
    earned: null,
    source: "app",
  }));
  await withTx(async (query) => {
    await query(
      `insert into attempts (id, kind, subject, exam_type, title, duration_min, total, status)
       values ($1,$2,$3,$4,$5,$6,$7,'in_progress')`,
      [id, input.kind, input.subject, input.examType, input.title, input.minutes, input.total],
    );
    await insertItems(query, id, items);
  });
  return id;
}

async function writeMastery(query: Query, state: MasteryState): Promise<void> {
  await query(
    `insert into mastery (
      kp_id, score, attempts, correct_count, last_error_cause, recent_json, next_review_at, review_stage, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8, now())
    on conflict (kp_id) do update set
      score = excluded.score,
      attempts = excluded.attempts,
      correct_count = excluded.correct_count,
      last_error_cause = excluded.last_error_cause,
      recent_json = excluded.recent_json,
      next_review_at = excluded.next_review_at,
      review_stage = excluded.review_stage,
      updated_at = now()`,
    [
      state.kpId,
      state.score,
      state.attempts,
      state.correctCount,
      state.lastErrorCause,
      JSON.stringify(state.recent),
      state.nextReviewAt,
      state.reviewStage,
    ],
  );
}

export async function gradeAttempt(attemptId: string, answers: Record<string, string>): Promise<void> {
  await ensureReady();
  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.status !== "in_progress") return;
  const graded = attempt.items.map((item) => {
    const result = gradeAnswer(item.itemType, item.answer, item.choices, answers[item.id] ?? "");
    return {
      ...item,
      studentAnswer: (answers[item.id] ?? "").trim(),
      correct: result.correct,
      errorCause: result.cause,
      earned: result.correct ? item.points : 0,
    };
  });
  const score = graded.reduce((sum, item) => sum + (item.earned ?? 0), 0);
  const byKp = new Map<string, Outcome[]>();
  for (const item of graded) {
    const list = byKp.get(item.kpId) ?? [];
    list.push({
      correct: Boolean(item.correct),
      cause: item.errorCause,
      difficulty: item.difficulty,
    });
    byKp.set(item.kpId, list);
  }
  await withTx(async (query) => {
    const locked = await query<{ id: string }>(
      `update attempts set status = 'graded', score = $1, submitted_at = now()
       where id = $2 and status = 'in_progress' returning id`,
      [score, attemptId],
    );
    if (locked.length === 0) return;
    for (const item of graded) {
      await query(
        `update attempt_items set student_answer = $1, correct = $2, error_cause = $3, earned = $4 where id = $5`,
        [item.studentAnswer, item.correct, item.errorCause, item.earned, item.id],
      );
    }
    for (const [kpId, outcomes] of byKp) {
      const rows = await query<Record<string, unknown>>("select * from mastery where kp_id = $1", [kpId]);
      const prev = rows[0] ? mapMastery(rows[0]) : null;
      await writeMastery(query, applyOutcomes(prev, kpId, outcomes, new Date()));
    }
  });
}

export async function recordSchoolMistake(input: {
  attemptId?: string;
  subject: SubjectId;
  title: string;
  schoolDate: string;
  score: number;
  total: number;
  stem: string;
  studentAnswer: string;
  correctAnswer: string;
  kpId: string;
  cause: ErrorCause;
}): Promise<string> {
  await ensureReady();
  const point = getKnowledgePoint(input.kpId);
  if (point.subject !== input.subject) throw new Error("知识点和科目不一致");
  const attemptId = input.attemptId || crypto.randomUUID();
  const itemId = crypto.randomUUID();
  await withTx(async (query) => {
    if (!input.attemptId) {
      await query(
        `insert into attempts (
          id, kind, subject, exam_type, title, score, total, status, submitted_at, school_date
        ) values ($1,'school',$2,'school',$3,$4,$5,'recorded', now(), $6)`,
        [attemptId, input.subject, input.title, input.score, input.total, input.schoolDate || null],
      );
    }
    const positions = await query<{ position: number }>(
      "select coalesce(max(position), 0) as position from attempt_items where attempt_id = $1",
      [attemptId],
    );
    const position = asNumber(positions[0]?.position ?? 0) + 1;
    await query(
      `insert into attempt_items (
        id, attempt_id, position, kp_id, template_id, section_id, subject, item_type, display,
        difficulty, points, stem, choices_json, answer_json, solution, signature, student_answer,
        correct, error_cause, earned, source
      ) values (
        $1,$2,$3,$4,null,$5,$6,'fill','错题',2,1,$7,null,$8,$9,$10,$11,false,$12,0,'school'
      )`,
      [
        itemId,
        attemptId,
        position,
        input.kpId,
        point.sectionId,
        input.subject,
        input.stem,
        JSON.stringify({ kind: "fill", accept: [input.correctAnswer] }),
        "这是学校试卷上的错题，同类题会按这个知识点重出。",
        `school:${itemId}`,
        input.studentAnswer,
        input.cause,
      ],
    );
    const rows = await query<Record<string, unknown>>("select * from mastery where kp_id = $1", [input.kpId]);
    const prev = rows[0] ? mapMastery(rows[0]) : null;
    await writeMastery(
      query,
      applyOutcomes(prev, input.kpId, [{ correct: false, cause: input.cause, difficulty: 2 }], new Date()),
    );
  });
  return attemptId;
}

export async function causeStats(): Promise<{ cause: ErrorCause; count: number }[]> {
  await ensureReady();
  const rows = await sql<{ error_cause: ErrorCause; n: number | string }>(
    `select error_cause, count(*)::int as n from attempt_items
     where correct = false and error_cause is not null
     group by error_cause
     order by n desc`,
  );
  return rows.map((row) => ({ cause: row.error_cause, count: asNumber(row.n) }));
}

export async function dueReviews(): Promise<MasteryState[]> {
  await ensureReady();
  const rows = await sql<Record<string, unknown>>(
    `select * from mastery where next_review_at is not null and next_review_at <= now()
     order by next_review_at asc`,
  );
  return rows.map(mapMastery);
}

export async function wrongItems(limit = 30): Promise<
  Array<StoredItem & { title: string; submittedAt: string | null }>
> {
  await ensureReady();
  const rows = await sql<Record<string, unknown>>(
    `select i.*, a.title, a.submitted_at from attempt_items i
     join attempts a on a.id = i.attempt_id
     where i.correct = false
     order by coalesce(a.submitted_at, a.created_at) desc
     limit $1`,
    [limit],
  );
  return rows.map((row) => ({
    ...mapItem(row),
    title: String(row.title),
    submittedAt: row.submitted_at ? asIso(row.submitted_at) : null,
  }));
}
