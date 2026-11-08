import Link from "next/link";
import { Suspense } from "react";
import { startSimilar } from "@/app/actions";
import { RichText } from "@/components/rich-text";
import { getKnowledgePoint } from "@/lib/curriculum";
import { CAUSE_LABEL, formatWhen, SUBJECT_META } from "@/lib/labels";
import { wrongItems } from "@/lib/repo";

export default function MistakesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在读取错题…</p>}>
      <MistakesContent />
    </Suspense>
  );
}

async function MistakesContent() {
  const items = await wrongItems(40);
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">错题本</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            这里放同频批改过的错题，和从学校卷登记进来的错题。点同类题，会按同一知识点再出新题。
          </p>
        </div>
        <Link href="/mistakes/new" className="h-10 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
          登记学校错题
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          还没有错题。做完第一套卷后，做错的题会出现在这里；学校月考发下来，也可以逐道登记。
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                {SUBJECT_META[item.subject].name} · {item.title} · {getKnowledgePoint(item.kpId).title}
                {item.submittedAt ? ` · ${formatWhen(item.submittedAt)}` : ""}
              </p>
              <RichText text={item.stem} className="mt-2 text-sm leading-7" />
              <p className="mt-2 text-sm">
                孩子的答案：{item.studentAnswer || "（空）"}
                {item.errorCause ? ` · 错因 ${CAUSE_LABEL[item.errorCause]}` : ""}
              </p>
              <form action={startSimilar} className="mt-2">
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
  );
}
