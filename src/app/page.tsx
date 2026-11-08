import Link from "next/link";
import { Suspense } from "react";
import { defaultProgress, frontierText, getKnowledgePoint, isTaught, knowledgeFor, SECTIONS } from "@/lib/curriculum";
import { CAUSE_LABEL, EXAM_META, formatScore, formatWhen, SUBJECT_IDS, SUBJECT_META } from "@/lib/labels";
import { isBlindSpot } from "@/lib/mastery";
import { causeStats, dueReviews, getMastery, getProgress, listAttempts } from "@/lib/repo";
import { startSimilar } from "@/app/actions";

export default function HomePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在读取记录…</p>}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [progress, mastery, attempts, causes, due] = await Promise.all([
    getProgress(),
    getMastery(),
    listAttempts(6),
    causeStats(),
    dueReviews(),
  ]);
  const preset = defaultProgress();
  const stillPreset = SECTIONS.every((section) => progress[section.id] === preset[section.id]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="font-heading text-3xl">学校讲到哪，卷子就出到哪</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          先核对四科进度，再出周练、月考、期中或期末。做完自动批改。学校发下来的卷子记进错题本，按知识点和错因出同类题。
        </p>
        {stillPreset ? (
          <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6">
            现在按 2026 年 11 月、高一上学期第 10 周左右的常见进度预置了已学和在学。这只是参考，请按学校实际到进度里改。未学的章节不会进卷。
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">未学的章节不会进卷。进度和学校不一致时，先去改章节状态。</p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {SUBJECT_IDS.map((subject) => {
          const taught = new Set(
            knowledgeFor(subject)
              .filter((point) => isTaught(progress[point.sectionId]))
              .map((point) => point.id),
          );
          const blind = mastery.filter((item) => taught.has(item.kpId) && isBlindSpot(item)).length;
          return (
            <article key={subject} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">{SUBJECT_META[subject].name}</h2>
                  <p className="text-xs text-muted-foreground">{SUBJECT_META[subject].book}</p>
                </div>
                <p className={blind > 0 ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                  {blind > 0 ? `${blind} 个盲点` : "暂无盲点"}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6">学校讲到：{frontierText(subject, progress)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/papers/new?subject=${subject}&type=monthly`} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                  出月考
                </Link>
                <Link href={`/papers/new?subject=${subject}&type=weekly`} className="rounded-lg border border-border px-3 py-1.5 text-sm">
                  出周练
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-xl">到期复习</h2>
          {due.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">今天没有到期的错题。做错的知识点会在 1 天、3 天、7 天后回来。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {due.map((item) => (
                <li key={item.kpId} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2">
                  <div>
                    <p className="text-sm">{getKnowledgePoint(item.kpId).title}</p>
                    <p className="text-xs text-muted-foreground">掌握度 {formatScore(item.score)}</p>
                  </div>
                  <form action={startSimilar}>
                    <input type="hidden" name="kpId" value={item.kpId} />
                    <button type="submit" className="text-sm text-primary">
                      做同类题
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-heading text-xl">错因</h2>
          {causes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">还没有错题。做完第一套卷，或登记学校卷之后，这里会分开「概念没懂」和「算错」。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {causes.map((item) => (
                <li key={item.cause} className="flex items-center justify-between text-sm">
                  <span>{CAUSE_LABEL[item.cause]}</span>
                  <span className="text-muted-foreground">{item.count} 次</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl">最近的卷子</h2>
          <Link href="/mistakes/new" className="text-sm text-primary">
            登记学校错题
          </Link>
        </div>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">还没有试卷。从上面任一科开始出一份月考。</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {attempts.map((attempt) => {
              const href = attempt.status === "in_progress" ? `/attempts/${attempt.id}` : `/attempts/${attempt.id}/review`;
              const label =
                attempt.status === "in_progress"
                  ? "继续做"
                  : attempt.score === null
                    ? "已登记"
                    : `${formatScore(attempt.score)} / ${formatScore(attempt.total ?? 0)}`;
              return (
                <li key={attempt.id}>
                  <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/60">
                    <span>
                      {attempt.title}
                      <span className="ml-2 text-muted-foreground">
                        {attempt.examType && attempt.examType in EXAM_META
                          ? `${EXAM_META[attempt.examType as keyof typeof EXAM_META].name} · `
                          : ""}
                        {formatWhen(attempt.submittedAt ?? attempt.createdAt)}
                      </span>
                    </span>
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
