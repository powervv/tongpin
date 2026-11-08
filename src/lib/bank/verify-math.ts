import { fmt } from "@/lib/bank/helpers";
import type { Answer, ItemType } from "@/lib/types";

type Option = { id: string; text: string };
type Params = Record<string, unknown> & { options?: Option[] };

function paramsOf(value: unknown): Params {
  return value as Params;
}

function choiceMatching(params: unknown, text: string): Answer {
  const options = paramsOf(params).options ?? [];
  const hits = options.filter((option) => option.text === text);
  if (hits.length !== 1) throw new Error(`数学选项无法唯一对应「${text}」`);
  return { kind: "choice", id: hits[0]!.id };
}

function numeric(value: number, type: ItemType): Answer {
  if (type === "fill") return { kind: "fill", accept: [fmt(value)] };
  return { kind: "numeric", value, tolerance: 1e-6 };
}

function answerFor(params: unknown, type: ItemType, textOrValue: string | number): Answer {
  if (type === "choice") return choiceMatching(params, fmt(Number(textOrValue)));
  return numeric(Number(textOrValue), type);
}

function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

function relation(a: number[], b: number[]): string {
  const as = new Set(a);
  const bs = new Set(b);
  const aInB = [...as].every((value) => bs.has(value));
  const bInA = [...bs].every((value) => as.has(value));
  if (aInB && bInA) return "A = B";
  if (aInB && as.size < bs.size) return "A 是 B 的真子集";
  if (bInA && bs.size < as.size) return "B 是 A 的真子集";
  return "A 与 B 互不包含";
}

function applySetOp(op: string, universe: number[], a: number[], b: number[]): number[] {
  const setA = new Set(a);
  const setB = new Set(b);
  if (op === "inter") return sortedUnique(a.filter((value) => setB.has(value)));
  if (op === "union") return sortedUnique([...a, ...b]);
  if (op === "comp") return sortedUnique(universe.filter((value) => !setA.has(value)));
  throw new Error(op);
}

function setLabel(values: number[]): string {
  const sorted = sortedUnique(values);
  if (sorted.length === 0) return "∅";
  return `{${sorted.join(", ")}}`;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function fracText(num: number, den: number): string {
  const sign = num * den < 0 ? -1 : 1;
  const divisor = gcd(num, den);
  const n = (sign * Math.abs(num)) / divisor;
  const d = Math.abs(den) / divisor;
  if (d === 1) return String(n);
  if (n < 0) return `-${Math.abs(n)}/${d}`;
  return `${n}/${d}`;
}

function parityOf(terms: { c: number; e: number }[]): string {
  const live = terms.filter((term) => term.c !== 0);
  const even = live.every((term) => term.e % 2 === 0);
  const odd = live.every((term) => term.e % 2 === 1);
  if (even && !odd) return "偶函数";
  if (odd && !even) return "奇函数";
  return "既不是奇函数也不是偶函数";
}

function formerLarger(base: number, e1: number, e2: number): string {
  if (e1 === e2 || base === 1) return "一样大";
  return (base > 1 ? e1 > e2 : e1 < e2) ? "前者更大" : "后者更大";
}

function trigTable(fn: string, angle: number): string {
  const table: Record<string, string> = {
    "sin:0": "0",
    "sin:30": "1/2",
    "sin:45": "√2/2",
    "sin:60": "√3/2",
    "sin:90": "1",
    "sin:180": "0",
    "sin:270": "-1",
    "cos:0": "1",
    "cos:30": "√3/2",
    "cos:45": "√2/2",
    "cos:60": "1/2",
    "cos:90": "0",
    "cos:180": "-1",
    "cos:270": "0",
    "tan:0": "0",
    "tan:30": "√3/3",
    "tan:45": "1",
    "tan:60": "√3",
    "tan:135": "-1",
    "tan:180": "0",
  };
  const found = table[`${fn}:${angle}`];
  if (!found) throw new Error(`没有这个三角函数值 ${fn} ${angle}`);
  return found;
}

function radianText(deg: number): string {
  const divisor = gcd(deg, 180);
  const num = deg / divisor;
  const den = 180 / divisor;
  if (num === 1 && den === 1) return "π";
  if (num === 1) return `π/${den}`;
  return `${num}π/${den}`;
}

function periodText(wNum: number, wDen: number): string {
  const divisor = gcd(2 * wDen, wNum);
  const num = (2 * wDen) / divisor;
  const den = wNum / divisor;
  if (den === 1 && num === 1) return "π";
  if (den === 1) return `${num}π`;
  if (num === 1) return `π/${den}`;
  return `${num}π/${den}`;
}

export function verifyMath(id: string, raw: unknown, type: ItemType): Answer {
  const params = paramsOf(raw);
  switch (id) {
    case "math.set.member": {
      const set = new Set(params.set as number[]);
      const hits = (params.options ?? []).filter((option) => set.has(Number(option.text)));
      if (hits.length !== 1) throw new Error("集合元素题的正确选项不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    case "math.set.relation":
      return choiceMatching(params, relation(params.a as number[], params.b as number[]));
    case "math.set.ops": {
      const result = applySetOp(
        String(params.op),
        params.universe as number[],
        params.a as number[],
        params.b as number[],
      );
      if (type === "fill") return { kind: "fill", accept: [setLabel(result)] };
      return choiceMatching(params, setLabel(result));
    }
    case "math.logic.cond": {
      const first = Number(params.first);
      const second = Number(params.second);
      return choiceMatching(params, first > second ? "充分不必要条件" : "必要不充分条件");
    }
    case "math.logic.quant":
      return choiceMatching(params, Number(params.k) <= 0 ? "真命题" : "假命题");
    case "math.ineq.prop": {
      const ask = String(params.ask);
      const c = Number(params.c);
      const text = ask === "recip" ? "小于" : ask === "add" ? "大于" : c > 0 ? "大于" : c < 0 ? "小于" : "等于";
      return choiceMatching(params, text);
    }
    case "math.amgm":
      return answerFor(params, type, 2 * Math.sqrt(Number(params.k)));
    case "math.quad.ineq": {
      const p = Number(params.p);
      const q = Number(params.q);
      const text = params.sign === ">" ? `x < ${p} 或 x > ${q}` : `${p} < x < ${q}`;
      return choiceMatching(params, text);
    }
    case "math.quad.root":
      return answerFor(params, type, Math.max(Number(params.p), Number(params.q)));
    case "math.fn.eval": {
      const t = Number(params.t);
      const value = t < 0 ? t * t + Number(params.c) : Number(params.m) * t + Number(params.b);
      return answerFor(params, type, value);
    }
    case "math.fn.parity":
      return choiceMatching(params, parityOf(params.terms as { c: number; e: number }[]));
    case "math.fn.mono":
      return choiceMatching(params, `[${Number(params.m)}, +∞)`);
    case "math.power":
      return choiceMatching(
        params,
        formerLarger(Number(params.baseNum) / Number(params.baseDen), Number(params.e1), Number(params.e2)),
      );
    case "math.fn.apply": {
      const distance = Number(params.distance);
      const flagKm = Number(params.flagKm);
      const value =
        distance <= flagKm
          ? Number(params.flag)
          : Number(params.flag) + (distance - flagKm) * Number(params.per);
      return answerFor(params, type, value);
    }
    case "math.exp.value":
      return answerFor(params, type, Number(params.inner) ** Number(params.num));
    case "math.exp.solve":
      return answerFor(params, type, Number(params.e1) + Number(params.e2));
    case "math.exp.mono":
      return choiceMatching(params, Number(params.baseNum) > Number(params.baseDen) ? "单调递增" : "单调递减");
    case "math.log.value":
      return answerFor(params, type, Number(params.exp));
    case "math.log.domain":
      return choiceMatching(params, `x > ${Number(params.h)}`);
    case "math.log.compare": {
      const left = Number(params.left);
      const right = Number(params.right);
      return choiceMatching(params, left === right ? "一样大" : left > right ? "前者更大" : "后者更大");
    }
    case "math.model": {
      const steps = Number(params.hours) / Number(params.period);
      if (!Number.isInteger(steps)) throw new Error("细菌模型的时间不是整数个周期");
      return answerFor(params, type, Number(params.n0) * 2 ** steps);
    }
    case "math.zero": {
      const s = Number(params.s);
      const a = Math.floor(Math.sqrt(s));
      return choiceMatching(params, `(${a}, ${a + 1})`);
    }
    case "math.radian":
      return choiceMatching(params, radianText(Number(params.deg)));
    case "math.trig.value":
      return choiceMatching(params, trigTable(String(params.fn), Number(params.angle)));
    case "math.induction": {
      const num = Number(params.num);
      const den = Number(params.den);
      const positive = den === 1 ? String(num) : `${num}/${den}`;
      const text = params.kind === "cos-pi" ? `-${positive}` : positive;
      return choiceMatching(params, text);
    }
    case "math.trig.graph": {
      const ask = String(params.ask);
      return choiceMatching(params, ask === "min" ? "-1" : ask === "max" ? "1" : "2π");
    }
    case "math.ident": {
      const num =
        Number(params.sa) * Number(params.cb) + Number(params.ca) * Number(params.sb);
      const den = Number(params.da) * Number(params.db);
      return choiceMatching(params, fracText(num, den));
    }
    case "math.wave.amp":
      return answerFor(params, type, Math.abs(Number(params.signed)));
    case "math.wave.period":
      return choiceMatching(params, periodText(Number(params.wNum), Number(params.wDen)));
    case "math.trig.app": {
      const quarter = (4 * Number(params.hours)) / Number(params.period);
      const sine = [0, 1, 0, -1][quarter];
      if (sine === undefined) throw new Error("水位时刻不在整刻");
      return answerFor(params, type, Number(params.mid) + Number(params.amp) * sine);
    }
    default:
      throw new Error(`没有数学验算 ${id}`);
  }
}
