import { Suspense } from "react";
import { startSimilar } from "@/app/actions";
import { isTaught, knowledgeFor, sectionsFor } from "@/lib/curriculum";
import { formatScore, formatWhen, SUBJECT_IDS, SUBJECT_META } from "@/lib/labels";
import { isBlindSpot } from "@/lib/mastery";
import { getMastery, getProgress } from "@/lib/repo";

function labelFor(score: number | null, blind: boolean): { text: string; className: string } {
  if (score === null) return { text: "未测", className: "text-muted-foreground" };
  if (blind) return { text: "盲点", className: "text-destructive" };
  if (score >= 80) return { text: "稳", className: "text-primary" };
  return { text: "一般", className: "text-muted-foreground" };
}

export default function MasteryPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在读取掌握度…</p>}>
      <MasteryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MasteryContent({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const query = await searchParams;
  const [progress, mastery] = await Promise.all([getProgress(), getMastery()]);
  const byId = new Map(mastery.map((item) => [item.kpId, item]));
  const anyWrong = mastery.some((item) => item.attempts > item.correctCount);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl">盲点</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          已学或在学、并且掌握度低于 60，或近三次里有错，就算盲点。还没做过的知识点标成未测，不会被当成盲点。
        </p>
        {query.notice === "empty" ? <p className="text-sm">这个知识点暂时组不出新的同类题。</p> : null}
        {anyWrong ? null : (
          <p className="text-sm text-muted-foreground">还没有错题，做完第一套卷后这里会标出薄弱知识点。</p>
        )}
      </header>
      {SUBJECT_IDS.map((subject) => (
        <section key={subject} className="space-y-3">
          <h2 className="font-heading text-2xl">{SUBJECT_META[subject].name}</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {knowledgeFor(subject)
              .filter((point) => isTaught(progress[point.sectionId]))
              .map((point) => {
                const state = byId.get(point.id) ?? null;
                const blind = isBlindSpot(state);
                const mark = labelFor(state ? state.score : null, blind);
                const section = sectionsFor(subject).find((item) => item.id === point.sectionId);
                return (
                  <li key={point.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm">{point.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {section?.title}
                        {state ? ` · 做过 ${state.attempts} 次 · 掌握度 ${formatScore(state.score)}` : ""}
                        {state?.nextReviewAt ? ` · 复习 ${formatWhen(state.nextReviewAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${mark.className}`}>{mark.text}</span>
                      {blind ? (
                        <form action={startSimilar}>
                          <input type="hidden" name="kpId" value={point.id} />
                          <button type="submit" className="text-sm text-primary">
                            同类题
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
