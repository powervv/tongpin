import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { startSimilar } from "@/app/actions";
import { RichText } from "@/components/rich-text";
import { answerText, groupItems } from "@/lib/display";
import { getKnowledgePoint } from "@/lib/curriculum";
import { CAUSE_LABEL, formatScore, formatWhen } from "@/lib/labels";
import { getAttempt } from "@/lib/repo";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在打开解析…</p>}>
      <ReviewContent params={params} />
    </Suspense>
  );
}

async function ReviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await getAttempt(id);
  if (!attempt) notFound();
  if (attempt.status === "in_progress") {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-3xl">{attempt.title}</h1>
        <p className="text-sm text-muted-foreground">这张卷还没交，答案先不打开。</p>
        <Link href={`/attempts/${id}`} className="text-sm text-primary">
          继续做
        </Link>
      </div>
    );
  }
  const groups = groupItems(attempt.items);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl">{attempt.title}</h1>
        <p className="text-sm text-muted-foreground">
          {attempt.score === null ? "学校卷记录" : `${formatScore(attempt.score)} / ${formatScore(attempt.total ?? 0)}`}
          {attempt.submittedAt ? ` · ${formatWhen(attempt.submittedAt)}` : ""}
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/attempts/${id}/print?key=1`} className="text-primary">
            打印试卷和答案
          </Link>
          <Link href="/papers/new" className="text-primary">
            再出一套
          </Link>
        </div>
      </header>
      {groups.map((group) => (
        <section key={group.display} className="space-y-4">
          <h2 className="font-heading text-xl">{group.label}</h2>
          {group.items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  第 {item.position} 题 · {getKnowledgePoint(item.kpId).title}
                </span>
                <span className={item.correct ? "text-primary" : "text-destructive"}>
                  {item.correct ? `正确 +${formatScore(item.earned ?? 0)}` : "错误"}
                </span>
              </div>
              <RichText text={item.stem} className="mt-2 text-sm leading-7" />
              <dl className="mt-3 space-y-1 text-sm">
                <div>
                  <dt className="inline text-muted-foreground">孩子的答案 </dt>
                  <dd className="inline">{item.studentAnswer || "（空）"}</dd>
                </div>
                <div>
                  <dt className="inline text-muted-foreground">正确答案 </dt>
                  <dd className="inline">
                    <RichText text={answerText(item.answer, item.choices)} className="inline" />
                  </dd>
                </div>
                {item.errorCause ? (
                  <div>
                    <dt className="inline text-muted-foreground">错因 </dt>
                    <dd className="inline">{CAUSE_LABEL[item.errorCause]}</dd>
                  </div>
                ) : null}
              </dl>
              <RichText text={item.solution} className="mt-3 text-sm leading-7 text-muted-foreground" />
              {item.correct ? null : (
                <form action={startSimilar} className="mt-3">
                  <input type="hidden" name="kpId" value={item.kpId} />
                  <button type="submit" className="text-sm text-primary">
                    做 3 道同类题
                  </button>
                </form>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
