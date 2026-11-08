import { Suspense } from "react";
import { updateName, updateProgress } from "@/app/actions";
import { sectionsFor } from "@/lib/curriculum";
import { STATUS_META, SUBJECT_IDS, SUBJECT_META } from "@/lib/labels";
import { getProgress, getStudent } from "@/lib/repo";
import { cn } from "@/lib/utils";
import type { SectionStatus } from "@/lib/types";

const STATUSES: SectionStatus[] = ["unlearned", "learning", "learned"];

export default function ProgressPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">正在读取进度…</p>}>
      <ProgressContent />
    </Suspense>
  );
}

async function ProgressContent() {
  const [progress, student] = await Promise.all([getProgress(), getStudent()]);
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="font-heading text-3xl">学校讲到哪</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          未学的节不会进卷。在学和已学都会出题。把进度往后拨，期中卷和期末卷的范围跟着变大。
        </p>
      </section>
      <form action={updateName} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="space-y-1.5 text-sm">
          <span>孩子怎么称呼</span>
          <input name="name" defaultValue={student.name} maxLength={20} className="h-10 w-full rounded-lg border border-input bg-card px-2.5 sm:w-48" />
        </label>
        <button type="submit" className="h-10 rounded-lg border border-border px-4 text-sm">
          保存称呼
        </button>
      </form>
      {SUBJECT_IDS.map((subject) => {
        const sections = sectionsFor(subject);
        const chapters = [...new Set(sections.map((section) => section.chapter))];
        return (
          <section key={subject} className="space-y-4">
            <div>
              <h2 className="font-heading text-2xl">{SUBJECT_META[subject].name}</h2>
              <p className="text-xs text-muted-foreground">{SUBJECT_META[subject].book}</p>
            </div>
            {chapters.map((chapter) => (
              <div key={chapter} className="space-y-2">
                <h3 className="text-sm text-muted-foreground">{chapter}</h3>
                <ul className="space-y-2">
                  {sections
                    .filter((section) => section.chapter === chapter)
                    .map((section) => (
                      <li key={section.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm">{section.title}</p>
                        <form action={updateProgress} className="flex gap-1">
                          <input type="hidden" name="sectionId" value={section.id} />
                          {STATUSES.map((status) => (
                            <button
                              key={status}
                              type="submit"
                              name="status"
                              value={status}
                              className={cn(
                                "h-8 rounded-lg px-2.5 text-xs",
                                progress[section.id] === status
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border bg-background",
                              )}
                            >
                              {STATUS_META[status].name}
                            </button>
                          ))}
                        </form>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
