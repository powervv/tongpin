import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-3 py-10">
      <h1 className="font-heading text-3xl">没有这一页</h1>
      <p className="text-sm text-muted-foreground">试卷可能已经不在，或地址写错了。</p>
      <Link href="/" className="text-sm text-primary">
        回首页
      </Link>
    </div>
  );
}
