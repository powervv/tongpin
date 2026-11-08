import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RichText } from "@/components/rich-text";
import { answerText, groupItems } from "@/lib/display";
import { formatScore } from "@/lib/labels";
import { getAttempt } from "@/lib/repo";

export default function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开试卷…</p>}>
      <PrintContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PrintContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const attempt = await getAttempt(id);
  if (!attempt) notFound();
  const showKey = query.key === "1" && attempt.status !== "in_progress";
  const groups = groupItems(attempt.items);

  return (
    <article className="paper-sheet mx-auto max-w-3xl space-y-8 bg-white text-black">
      <header className="space-y-1 border-b border-black/10 pb-4">
        <p className="text-sm">同频 · {attempt.durationMin ? `${attempt.durationMin} 分钟` : ""}</p>
        <h1 className="font-heading text-3xl">{attempt.title}</h1>
        <p className="text-sm">满分 {formatScore(attempt.total ?? 0)} · 姓名 ________</p>
      </header>
      {groups.map((group) => (
        <section key={group.display} className="space-y-5">
          <h2 className="text-lg">{group.label}</h2>
          {group.items.map((item) => (
            <div key={item.id} className="space-y-2">
              <p className="text-sm">
                {item.position}. （{formatScore(item.points)} 分）
              </p>
              <RichText text={item.stem} className="text-sm leading-7" />
              {item.choices ? (
                <ol className="space-y-1 text-sm">
                  {item.choices.map((choice) => (
                    <li key={choice.id}>
                      {choice.id}. <RichText text={choice.text} className="inline" />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="pt-6 text-sm text-black/50">答：____________________</p>
              )}
            </div>
          ))}
        </section>
      ))}
      {showKey ? (
        <section className="print-break space-y-4 border-t border-black/10 pt-6">
          <h2 className="font-heading text-2xl">参考答案</h2>
          {attempt.items.map((item) => (
            <div key={item.id} className="text-sm leading-7">
              <p>
                {item.position}. <RichText text={answerText(item.answer, item.choices)} className="inline" />
              </p>
              <RichText text={item.solution} className="text-black/70" />
            </div>
          ))}
        </section>
      ) : null}
    </article>
  );
}
