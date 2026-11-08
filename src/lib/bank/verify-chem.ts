import {
  alloyStatementOk,
  chlorineAlkali,
  ionColor,
  ionEquationOk,
  type IonEquation,
  oxidationNumber,
  reactionIsRedox,
  sodiumProduct,
  SUBSTANCE_CLASS,
  type CountedFormula,
} from "@/lib/bank/chem-check";
import { fmt } from "@/lib/bank/helpers";
import type { Answer, ItemType } from "@/lib/types";

type Option = { id: string; text: string };

function choiceMatching(options: Option[] | undefined, text: string): Answer {
  const hits = (options ?? []).filter((option) => option.text === text);
  if (hits.length !== 1) throw new Error(`化学选项无法唯一对应「${text}」`);
  return { kind: "choice", id: hits[0]!.id };
}

function numericAnswer(params: { options?: Option[] }, type: ItemType, value: number, tolerance = 1e-6): Answer {
  if (type === "choice") return choiceMatching(params.options, fmt(value));
  return { kind: "numeric", value, tolerance };
}

export function verifyChemistry(id: string, raw: unknown, type: ItemType): Answer {
  const params = raw as {
    options?: Option[];
    cat?: string;
    equations?: { text: string; left: IonEquation["left"]; right: IonEquation["right"] }[];
    formula?: string;
    element?: string;
    reactions?: { text: string; left: CountedFormula[]; right: CountedFormula[] }[];
    mass?: number;
    condition?: "burn" | "room";
    temp?: "cold" | "hot";
    molar?: number;
    volumeMl?: number;
    ion?: "Fe2+" | "Fe3+" | "Cu2+";
    nCl2?: number;
  };
  switch (id) {
    case "chem.class": {
      const hits = (params.options ?? []).filter((option) => SUBSTANCE_CLASS[option.text] === params.cat);
      if (hits.length !== 1) throw new Error("物质分类的正确项不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    case "chem.ion": {
      const hits = (params.options ?? []).filter((option) => {
        const equation = (params.equations ?? []).find((item) => item.text === option.text);
        return equation ? ionEquationOk({ left: equation.left, right: equation.right }) : false;
      });
      if (hits.length !== 1) throw new Error("离子方程式的正确项不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    case "chem.oxnum":
      return numericAnswer(params, type, oxidationNumber(String(params.formula), String(params.element)));
    case "chem.redox.which": {
      const hits = (params.options ?? []).filter((option) => {
        const reaction = (params.reactions ?? []).find((item) => item.text === option.text);
        return reaction ? reactionIsRedox(reaction.left, reaction.right) : false;
      });
      if (hits.length !== 1) throw new Error("氧化还原反应的正确项不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    case "chem.na.gas":
      return numericAnswer(params, type, (Number(params.mass) / 23 / 2) * 22.4, 0.02);
    case "chem.na.product":
      return choiceMatching(params.options, sodiumProduct(params.condition ?? "burn"));
    case "chem.cl.amount":
      return numericAnswer(params, type, Number(params.mass) / 71);
    case "chem.cl.alkali":
      return choiceMatching(params.options, chlorineAlkali(params.temp ?? "cold"));
    case "chem.mole":
      return numericAnswer(
        params,
        type,
        Number(params.mass) / Number(params.molar) / (Number(params.volumeMl) / 1000),
        0.001,
      );
    case "chem.fe.color":
      return choiceMatching(params.options, ionColor(params.ion ?? "Fe2+"));
    case "chem.fe.ox":
      return numericAnswer(params, type, Number(params.nCl2) * 2);
    case "chem.alloy": {
      const hits = (params.options ?? []).filter((option) => alloyStatementOk(option.text));
      if (hits.length !== 1) throw new Error("合金说法的正确项不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    default:
      throw new Error(`没有化学验算 ${id}`);
  }
}
