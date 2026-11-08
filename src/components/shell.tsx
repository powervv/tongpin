import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Nav } from "@/components/nav";
import { getStudent } from "@/lib/repo";

export async function Shell({ children }: { children: ReactNode }) {
  const student = await getStudent();
  return (
    <>
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-3">
          <Link href="/" className="font-heading text-xl tracking-wide text-primary">
            同频
          </Link>
          <p className="text-sm text-muted-foreground">
            {student.name} · {student.grade} · {student.city}
          </p>
        </div>
        <Nav />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">正在读取记录…</p>}>{children}</Suspense>
      </main>
    </>
  );
}
