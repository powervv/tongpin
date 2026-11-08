export type Species = { id: string; coeff: number };

export type IonEquation = { left: Species[]; right: Species[] };

const FORMULAS: Record<string, { atoms: Record<string, number>; charge: number }> = {
  "H+": { atoms: { H: 1 }, charge: 1 },
  "OH-": { atoms: { O: 1, H: 1 }, charge: -1 },
  H2O: { atoms: { H: 2, O: 1 }, charge: 0 },
  "Na+": { atoms: { Na: 1 }, charge: 1 },
  "Cl-": { atoms: { Cl: 1 }, charge: -1 },
  CaCO3: { atoms: { Ca: 1, C: 1, O: 3 }, charge: 0 },
  "Ca2+": { atoms: { Ca: 1 }, charge: 2 },
  CO2: { atoms: { C: 1, O: 2 }, charge: 0 },
  "Ba2+": { atoms: { Ba: 1 }, charge: 2 },
  "SO4^2-": { atoms: { S: 1, O: 4 }, charge: -2 },
  BaSO4: { atoms: { Ba: 1, S: 1, O: 4 }, charge: 0 },
  Fe: { atoms: { Fe: 1 }, charge: 0 },
  "Fe2+": { atoms: { Fe: 1 }, charge: 2 },
  "Fe3+": { atoms: { Fe: 1 }, charge: 3 },
  H2: { atoms: { H: 2 }, charge: 0 },
  "Cu2+": { atoms: { Cu: 1 }, charge: 2 },
  Cu: { atoms: { Cu: 1 }, charge: 0 },
  "Ag+": { atoms: { Ag: 1 }, charge: 1 },
  "ClO-": { atoms: { Cl: 1, O: 1 }, charge: -1 },
  Cl2: { atoms: { Cl: 2 }, charge: 0 },
  O2: { atoms: { O: 2 }, charge: 0 },
};

function tally(side: Species[]): { atoms: Record<string, number>; charge: number } {
  const atoms: Record<string, number> = {};
  let charge = 0;
  for (const species of side) {
    const formula = FORMULAS[species.id];
    if (!formula) throw new Error(`未知微粒 ${species.id}`);
    charge += formula.charge * species.coeff;
    for (const [element, count] of Object.entries(formula.atoms)) {
      atoms[element] = (atoms[element] ?? 0) + count * species.coeff;
    }
  }
  return { atoms, charge };
}

export function ionEquationOk(equation: IonEquation): boolean {
  let left: { atoms: Record<string, number>; charge: number };
  let right: { atoms: Record<string, number>; charge: number };
  try {
    left = tally(equation.left);
    right = tally(equation.right);
  } catch {
    return false;
  }
  if (left.charge !== right.charge) return false;
  const elements = new Set([...Object.keys(left.atoms), ...Object.keys(right.atoms)]);
  for (const element of elements) {
    if ((left.atoms[element] ?? 0) !== (right.atoms[element] ?? 0)) return false;
  }
  return true;
}

export function parseCounts(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const pattern = /([A-Z][a-z]?)(\d*)/g;
  let matched = false;
  for (const hit of formula.matchAll(pattern)) {
    matched = true;
    const element = hit[1]!;
    const count = hit[2] ? Number(hit[2]) : 1;
    counts[element] = (counts[element] ?? 0) + count;
  }
  if (!matched || formula.replace(/([A-Z][a-z]?\d*)/g, "") !== "") {
    throw new Error(`无法解析化学式 ${formula}`);
  }
  return counts;
}

export function oxidationNumber(formula: string, element: string): number {
  if (formula === "Na2O2" || formula === "H2O2") {
    if (element === "O") return -1;
    if (element === "Na") return 1;
    if (element === "H") return 1;
  }
  const counts = parseCounts(formula);
  if (Object.keys(counts).length === 1) return 0;
  const known: Record<string, number | null> = {};
  for (const name of Object.keys(counts)) known[name] = null;
  if ("H" in known) known.H = 1;
  if ("O" in known) known.O = -2;
  if ("Na" in known) known.Na = 1;
  if ("K" in known) known.K = 1;
  const unknown = Object.entries(known).filter(([, value]) => value === null);
  if (unknown.length === 1) {
    const target = unknown[0]![0];
    let rest = 0;
    for (const [name, value] of Object.entries(known)) {
      if (name !== target && value !== null) rest += value * (counts[name] ?? 0);
    }
    const solved = -rest / (counts[target] ?? 1);
    if (!Number.isInteger(solved)) throw new Error(`化合价不是整数 ${formula}`);
    known[target] = solved;
  } else if (unknown.length > 1) {
    throw new Error(`化合价无法确定 ${formula}`);
  } else {
    let sum = 0;
    for (const [name, value] of Object.entries(known)) sum += (value ?? 0) * (counts[name] ?? 0);
    if (sum !== 0) throw new Error(`化合价之和不为 0 ${formula}`);
  }
  const result = known[element];
  if (result === null || result === undefined) throw new Error(`${formula} 不含 ${element}`);
  return result;
}

export type CountedFormula = { formula: string; coeff: number };

export function reactionIsRedox(left: CountedFormula[], right: CountedFormula[]): boolean {
  const before = new Map<string, number>();
  const after = new Map<string, number>();
  const absorb = (side: CountedFormula[], into: Map<string, number>) => {
    for (const item of side) {
      const counts = parseCounts(item.formula);
      for (const element of Object.keys(counts)) {
        into.set(element, oxidationNumber(item.formula, element));
      }
    }
  };
  absorb(left, before);
  absorb(right, after);
  for (const [element, value] of before) {
    if (after.get(element) !== value) return true;
  }
  return false;
}

export const SUBSTANCE_CLASS: Record<string, string> = {
  "Fe(OH)₃ 胶体": "胶体",
  泥水: "浊液",
  NaCl: "电解质",
  蔗糖: "非电解质",
  CaO: "氧化物",
  "Na₂CO₃": "盐",
  酒精: "非电解质",
  食盐水: "混合物",
  NaOH: "碱",
  盐酸: "酸",
};

export function sodiumProduct(condition: "burn" | "room"): string {
  return condition === "burn" ? "淡黄色固体 Na₂O₂" : "白色固体 Na₂O";
}

export function chlorineAlkali(temp: "cold" | "hot"): string {
  return temp === "cold" ? "NaCl 和 NaClO" : "NaCl 和 NaClO₃";
}

export function ionColor(ion: "Fe2+" | "Fe3+" | "Cu2+"): string {
  if (ion === "Fe2+") return "浅绿色";
  if (ion === "Fe3+") return "棕黄色";
  return "蓝色";
}

export function alloyStatementOk(text: string): boolean {
  return text === "合金属于混合物" || text === "钢是铁和碳的合金";
}
