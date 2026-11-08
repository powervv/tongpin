import { chemistryTemplates } from "@/lib/bank/chemistry";
import { englishTemplates } from "@/lib/bank/english";
import { mathTemplates } from "@/lib/bank/math";
import { physicsTemplates } from "@/lib/bank/physics";
import type { Template } from "@/lib/bank/types";
import type { SubjectId } from "@/lib/types";

export const TEMPLATES: Template[] = [
  ...mathTemplates,
  ...physicsTemplates,
  ...chemistryTemplates,
  ...englishTemplates,
];

const byId = new Map(TEMPLATES.map((template) => [template.id, template]));

export function getTemplate(id: string): Template {
  const found = byId.get(id);
  if (!found) throw new Error(`未知题模 ${id}`);
  return found;
}

export function templatesFor(subject: SubjectId): Template[] {
  return TEMPLATES.filter((template) => template.subject === subject);
}
