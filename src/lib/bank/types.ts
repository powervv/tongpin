import type { GeneratedItem, ItemType, Rng, SubjectId } from "@/lib/types";

export type Template = {
  id: string;
  kpId: string;
  sectionId: string;
  subject: SubjectId;
  types: ItemType[];
  difficulty: 1 | 2 | 3;
  generate: (rng: Rng, type: ItemType) => GeneratedItem;
};
