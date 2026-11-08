import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "同频",
  description: "按深圳高一学校进度出卷，登记错题，补上知识盲点。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">正在打开同频…</p>}>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
