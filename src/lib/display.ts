import { fmt } from "@/lib/bank/helpers";
import type { Answer } from "@/lib/types";

export function answerText(
  answer: Answer,
  choices: { id: string; text: string }[] | null,
): string {
  if (answer.kind === "choice") {
    const choice = choices?.find((item) => item.id === answer.id);
    return choice ? `${answer.id}. ${choice.text}` : answer.id;
  }
  if (answer.kind === "numeric") return fmt(answer.value);
  return answer.accept[0] ?? "";
}

export function todayInShanghai(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

const GROUP_ORDER = ["选择", "填空", "解答", "错题"];
const GROUP_INDEX = ["一", "二", "三", "四"];

export function groupItems<T extends { display: string }>(items: T[]): Array<{ display: string; label: string; items: T[] }> {
  return GROUP_ORDER.map((display) => ({
    display,
    items: items.filter((item) => item.display === display),
  }))
    .filter((group) => group.items.length > 0)
    .map((group, index) => ({
      ...group,
      label: `${GROUP_INDEX[index] ?? String(index + 1)}、${group.display}题`,
    }));
}

export function paperDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${month}月${day}日`;
}
