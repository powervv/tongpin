import { Suspense } from "react";
import { PaperForm } from "@/components/paper-form";
import { EXAM_IDS, SUBJECT_IDS } from "@/lib/labels";
import type { ExamType, SubjectId } from "@/lib/types";

export default function NewPaperPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; type?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开出卷…</p>}>
      <NewPaperContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewPaperContent({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; type?: string }>;
}) {
  const query = await searchParams;
  const subject = SUBJECT_IDS.includes(query.subject as SubjectId) ? (query.subject as SubjectId) : "math";
  const examType = EXAM_IDS.includes(query.type as ExamType) ? (query.type as ExamType) : "monthly";
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="space-y-2">
        <h1 className="font-heading text-3xl">出一份卷</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          只从已学和在学的章节抽题。大约四成题目对着当前盲点，其余覆盖已经讲过的范围。可以在线做，也可以先打印空白卷。
        </p>
      </section>
      <PaperForm subject={subject} examType={examType} />
    </div>
  );
}
