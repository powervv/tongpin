import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { submitAttempt } from "@/app/actions";
import { RichText } from "@/components/rich-text";
import { groupItems } from "@/lib/display";
import { getKnowledgePoint } from "@/lib/curriculum";
import { formatScore } from "@/lib/labels";
import { getAttempt } from "@/lib/repo";

export default function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开试卷…</p>}>
      <AttemptContent params={params} />
    </Suspense>
  );
}

async function AttemptContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await getAttempt(id);
  if (!attempt) notFound();
  if (attempt.status !== "in_progress") redirect(`/attempts/${id}/review`);
  const groups = groupItems(attempt.items);
  const action = submitAttempt.bind(null, id);

  return (
    <form action={action} className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {attempt.durationMin ? `${attempt.durationMin} 分钟` : "不限时"} · 满分 {formatScore(attempt.total ?? 0)}
        </p>
        <h1 className="font-heading text-3xl">{attempt.title}</h1>
        <p className="text-sm text-muted-foreground">提交前看不到答案。空着的题按审题遗漏计。解答题填写最终结果，步骤在解析里对照。</p>
        <Link href={`/attempts/${id}/print`} className="inline-block text-sm text-primary">
          打印空白卷
        </Link>
      </header>
      {groups.map((group) => (
        <section key={group.display} className="space-y-5">
          <h2 className="font-heading text-xl">{group.label}</h2>
          {group.items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                第 {item.position} 题 · {formatScore(item.points)} 分 · {getKnowledgePoint(item.kpId).title}
              </p>
              <RichText text={item.stem} className="mt-2 text-sm leading-7" />
              {item.itemType === "choice" && item.choices ? (
                <div className="mt-3 space-y-2">
                  {item.choices.map((choice) => (
                    <label key={choice.id} className="flex items-start gap-2 text-sm leading-6">
                      <input type="radio" name={`q-${item.id}`} value={choice.id} className="mt-1.5" />
                      <span>
                        {choice.id}. <RichText text={choice.text} className="inline" />
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <label className="mt-3 block text-sm">
                  <span className="text-muted-foreground">答案</span>
                  <input name={`q-${item.id}`} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-2.5 sm:max-w-xs" />
                </label>
              )}
            </article>
          ))}
        </section>
      ))}
      <div className="no-print sticky bottom-3 flex justify-end">
        <button type="submit" className="h-11 rounded-lg bg-primary px-5 text-sm text-primary-foreground shadow">
          交卷
        </button>
      </div>
    </form>
  );
}
