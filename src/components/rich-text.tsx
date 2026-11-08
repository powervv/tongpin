"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMath(source: string): string {
  const parts = source.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false });
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false });
      }
      return escapeHtml(part).replace(/\n/g, "<br />");
    })
    .join("");
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderMath(text) }} />;
}
