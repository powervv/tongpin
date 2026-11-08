"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPaper, type FormState } from "@/app/actions";
import { EXAM_IDS, EXAM_META, SUBJECT_IDS, SUBJECT_META } from "@/lib/labels";
import type { ExamType, SubjectId } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-lg bg-primary px-4 text-sm text-primary-foreground disabled:opacity-60"
    >
      {pending ? "正在组卷…" : "生成试卷"}
    </button>
  );
}

export function PaperForm({ subject, examType }: { subject: SubjectId; examType: ExamType }) {
  const [state, action] = useActionState<FormState, FormData>(createPaper, {});
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span>科目</span>
          <select name="subject" defaultValue={subject} className="h-10 w-full rounded-lg border border-input bg-card px-2.5">
            {SUBJECT_IDS.map((id) => (
              <option key={id} value={id}>
                {SUBJECT_META[id].name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span>卷型</span>
          <select name="examType" defaultValue={examType} className="h-10 w-full rounded-lg border border-input bg-card px-2.5">
            {EXAM_IDS.map((id) => (
              <option key={id} value={id}>
                {EXAM_META[id].name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
