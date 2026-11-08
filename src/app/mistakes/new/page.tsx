import { Suspense } from "react";
import { connection } from "next/server";
import { SchoolForm } from "@/components/school-form";
import { getSection, KNOWLEDGE_POINTS } from "@/lib/curriculum";
import { todayInShanghai } from "@/lib/display";
import { SUBJECT_META } from "@/lib/labels";
import { getAttempt } from "@/lib/repo";
import type { SubjectId } from "@/lib/types";

export default function NewMistakePage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string; notice?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开登记表…</p>}>
      <NewMistakeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NewMistakeContent({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string; notice?: string }>;
}) {
  await connection();
  const query = await searchParams;
  const attempt = query.attempt ? await getAttempt(query.attempt) : null;
  const school = attempt && attempt.kind === "school" ? attempt : null;
  const points = KNOWLEDGE_POINTS.map((point) => ({
    id: point.id,
    subject: point.subject,
    title: point.title,
    sectionTitle: getSection(point.sectionId).title,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl">{school ? "继续登记错题" : "登记学校卷"}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          学校卷上的题不自动批改。写下原题、孩子的答案和正确答案，选知识点和错因。如果两边都是数字，系统会提示一种可能的错因，仍由你确认。
        </p>
        {school ? (
          <p className="text-sm">
            正在记到「{school.title}」· {SUBJECT_META[school.subject as SubjectId].name} · 已记 {school.items.length} 道
          </p>
        ) : null}
      </header>
      <SchoolForm
        points={points}
        attemptId={school?.id}
        lockedSubject={school?.subject}
        title={school?.title}
        schoolDate={school?.schoolDate ?? todayInShanghai()}
        score={school?.score ?? undefined}
        total={school?.total ?? undefined}
        notice={query.notice}
      />
    </div>
  );
}
