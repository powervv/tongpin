import { ENGLISH_TRUTH } from "@/lib/bank/english-key";
import type { Answer, ItemType } from "@/lib/types";
import { verifyChemistry } from "@/lib/bank/verify-chem";
import { verifyMath } from "@/lib/bank/verify-math";
import { verifyPhysics } from "@/lib/bank/verify-physics";

type Option = { id: string; text: string };

export function verifyItem(templateId: string, params: unknown, type: ItemType): Answer {
  if (templateId.startsWith("math.")) return verifyMath(templateId, params, type);
  if (templateId.startsWith("phys.")) return verifyPhysics(templateId, params, type);
  if (templateId.startsWith("chem.")) return verifyChemistry(templateId, params, type);
  if (templateId.startsWith("eng.")) {
    const text = ENGLISH_TRUTH[templateId];
    if (!text) throw new Error(`没有英语答案 ${templateId}`);
    const options = (params as { options?: Option[] }).options ?? [];
    const hits = options.filter((option) => option.text === text);
    if (hits.length !== 1) throw new Error(`英语选项无法唯一对应「${text}」`);
    return { kind: "choice", id: hits[0]!.id };
  }
  throw new Error(`无法验算 ${templateId}`);
}
