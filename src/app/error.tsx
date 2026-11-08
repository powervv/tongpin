"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-10">
      <h1 className="font-heading text-3xl">这一页没有打开</h1>
      <p className="text-sm leading-6 text-muted-foreground">记录还在。可以再试一次，或回到首页继续出卷。</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="h-10 rounded-lg bg-primary px-4 text-sm text-primary-foreground">
          再试一次
        </button>
        <Link href="/" className="inline-flex h-10 items-center text-sm text-primary">
          回首页
        </Link>
      </div>
    </div>
  );
}
