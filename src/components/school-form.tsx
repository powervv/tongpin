"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recordSchool, type FormState } from "@/app/actions";
import { CAUSE_LABEL, causesFor, SUBJECT_IDS, SUBJECT_META } from "@/lib/labels";
import { suggestCause } from "@/lib/paper/grade";
import type { SubjectId } from "@/lib/types";

export type SchoolPoint = {
  id: string;
  subject: SubjectId;
  title: string;
  sectionTitle: string;
};

function SubmitRow() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="submit"
        name="next"
        value="more"
        disabled={pending}
        className="h-10 rounded-lg border border-border bg-card px-4 text-sm disabled:opacity-60"
      >
        保存并再记一道
      </button>
      <button
        type="submit"
        name="next"
        value="similar"
        disabled={pending}
        className="h-10 rounded-lg bg-primary px-4 text-sm text-primary-foreground disabled:opacity-60"
      >
        保存并出同类题
      </button>
    </div>
  );
}

export function SchoolForm({
  points,
  attemptId,
  lockedSubject,
  title,
  schoolDate,
  score,
  total,
  notice,
}: {
  points: SchoolPoint[];
  attemptId?: string;
  lockedSubject?: SubjectId;
  title?: string;
  schoolDate: string;
  score?: number;
  total?: number;
  notice?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(recordSchool, {});
  const [subject, setSubject] = useState<SubjectId>(lockedSubject ?? "math");
  const [studentAnswer, setStudentAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const visible = points.filter((point) => point.subject === subject);
  const hint = useMemo(
    () => suggestCause(studentAnswer, correctAnswer, subject),
    [studentAnswer, correctAnswer, subject],
  );
  const causes = causesFor(subject);

  return (
    <form action={action} className="space-y-4">
      {attemptId ? <input type="hidden" name="attemptId" value={attemptId} /> : null}
      {lockedSubject ? <input type="hidden" name="subject" value={lockedSubject} /> : null}
      {notice === "empty" ? (
        <p className="text-sm text-muted-foreground">这道错题已记下。这个知识点暂时组不出新的同类题。</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm sm:col-span-2">
          <span>试卷名称</span>
          <input
            name="title"
            required
            defaultValue={title}
            placeholder="例如：10月月考"
            className="h-10 w-full rounded-lg border border-input bg-card px-2.5"
          />
        </label>
        {lockedSubject ? null : (
          <label className="space-y-1.5 text-sm">
            <span>科目</span>
            <select
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value as SubjectId)}
              className="h-10 w-full rounded-lg border border-input bg-card px-2.5"
            >
              {SUBJECT_IDS.map((id) => (
                <option key={id} value={id}>
                  {SUBJECT_META[id].name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="space-y-1.5 text-sm">
          <span>考试日期</span>
          <input
            type="date"
            name="schoolDate"
            defaultValue={schoolDate}
            className="h-10 w-full rounded-lg border border-input bg-card px-2.5"
          />
        </label>
        {attemptId ? (
          <>
            <input type="hidden" name="score" value={score ?? 0} />
            <input type="hidden" name="total" value={total ?? 0} />
          </>
        ) : (
          <>
            <label className="space-y-1.5 text-sm">
              <span>卷面得分</span>
              <input name="score" inputMode="decimal" required defaultValue="" className="h-10 w-full rounded-lg border border-input bg-card px-2.5" />
            </label>
            <label className="space-y-1.5 text-sm">
              <span>满分</span>
              <input name="total" inputMode="decimal" required defaultValue="100" className="h-10 w-full rounded-lg border border-input bg-card px-2.5" />
            </label>
          </>
        )}
      </div>
      <label className="block space-y-1.5 text-sm">
        <span>错题原文</span>
        <textarea name="stem" required rows={4} className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span>孩子的答案</span>
          <input
            name="studentAnswer"
            required
            value={studentAnswer}
            onChange={(event) => setStudentAnswer(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-2.5"
          />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>正确答案</span>
          <input
            name="correctAnswer"
            required
            value={correctAnswer}
            onChange={(event) => setCorrectAnswer(event.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-card px-2.5"
          />
        </label>
      </div>
      {hint ? <p className="text-sm text-muted-foreground">按数值看起来像「{CAUSE_LABEL[hint]}」，请再确认。</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span>知识点</span>
          <select name="kpId" className="h-10 w-full rounded-lg border border-input bg-card px-2.5">
            {visible.map((point) => (
              <option key={point.id} value={point.id}>
                {point.sectionTitle} · {point.title}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span>错因</span>
          <select name="cause" className="h-10 w-full rounded-lg border border-input bg-card px-2.5" key={subject}>
            {causes.map((cause) => (
              <option key={cause} value={cause}>
                {CAUSE_LABEL[cause]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitRow />
    </form>
  );
}
