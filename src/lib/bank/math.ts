import { getKnowledgePoint } from "@/lib/curriculum";
import { choiceItem, fmt, numericItem } from "@/lib/bank/helpers";
import type { Template } from "@/lib/bank/types";
import { intBetween, pickOne, shuffle } from "@/lib/rng";
import type { ErrorCause, GeneratedItem, Rng } from "@/lib/types";

function plus(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `-${-value}`;
  return "";
}

function linear(root: number): string {
  if (root === 0) return "x";
  return root > 0 ? `x-${root}` : `x+${-root}`;
}

function coef(value: number): string {
  if (value === 1) return "";
  if (value === -1) return "-";
  return String(value);
}

function ints(rng: Rng, count: number, lo: number, hi: number): number[] {
  const pool: number[] = [];
  for (let value = lo; value <= hi; value += 1) pool.push(value);
  return shuffle(rng, pool).slice(0, count);
}

function relation(a: number[], b: number[]): "equal" | "proper-subset" | "proper-superset" | "neither" {
  const as = new Set(a);
  const bs = new Set(b);
  const aInB = [...as].every((value) => bs.has(value));
  const bInA = [...bs].every((value) => as.has(value));
  if (aInB && bInA) return "equal";
  if (aInB && as.size < bs.size) return "proper-subset";
  if (bInA && bs.size < as.size) return "proper-superset";
  return "neither";
}

function relationText(a: number[], b: number[]): string {
  const kind = relation(a, b);
  if (kind === "equal") return "A = B";
  if (kind === "proper-subset") return "A 是 B 的真子集";
  if (kind === "proper-superset") return "B 是 A 的真子集";
  return "A 与 B 互不包含";
}

function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
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

function showSet(values: number[]): string {
  return `\\{${sortedUnique(values).join(",")}\\}`;
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

function termText(coef: number, exp: number): string {
  if (coef === 0) return "";
  const body = exp === 0 ? "" : exp === 1 ? "x" : `x^${exp}`;
  const abs = Math.abs(coef);
  const mag = abs === 1 && exp !== 0 ? "" : String(abs);
  return `${coef < 0 ? "-" : "+"}${mag}${body}`;
}

function polyText(terms: { c: number; e: number }[]): string {
  const parts = terms
    .filter((term) => term.c !== 0)
    .sort((left, right) => right.e - left.e)
    .map((term) => termText(term.c, term.e));
  const joined = parts.join("");
  return joined.startsWith("+") ? joined.slice(1) : joined || "0";
}

function parityOf(terms: { c: number; e: number }[]): string {
  const live = terms.filter((term) => term.c !== 0);
  const even = live.every((term) => term.e % 2 === 0);
  const odd = live.every((term) => term.e % 2 === 1);
  if (even && !odd) return "偶函数";
  if (odd && !even) return "奇函数";
  return "既不是奇函数也不是偶函数";
}

function baseValue(num: number, den: number): number {
  return num / den;
}

function formerLarger(base: number, e1: number, e2: number): string {
  if (e1 === e2 || base === 1) return "一样大";
  const leftWins = base > 1 ? e1 > e2 : e1 < e2;
  return leftWins ? "前者更大" : "后者更大";
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

function finish(item: GeneratedItem): GeneratedItem {
  getKnowledgePoint(item.kpId);
  return item;
}

export const mathTemplates: Template[] = [
  {
    id: "math.set.member",
    kpId: "math.set.element",
    sectionId: "math-1-1",
    subject: "math",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const set = ints(rng, 4, -4, 12);
      const traps = ints(rng, 3, -6, 14).filter((value) => !set.includes(value)).slice(0, 3);
      if (traps.length < 3) return this.generate(rng, type);
      const correct = pickOne(rng, set);
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 1,
          stem: `集合 $A=${showSet(set)}$。下列哪个数是 $A$ 的元素？`,
          correct: fmt(correct),
          traps: traps.map((value) => ({ text: fmt(value), cause: "concept" as const })),
          solution: `元素必须确实出现在花括号里。${fmt(correct)} 在 $A$ 中，其余三个数不在。`,
          params: { set: sortedUnique(set) },
        }),
      );
    },
  },
  {
    id: "math.set.relation",
    kpId: "math.set.relation",
    sectionId: "math-1-2",
    subject: "math",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const base = ints(rng, 4, 0, 9);
      const mode = pickOne(rng, ["equal", "proper-subset", "proper-superset", "neither"] as const);
      let a = base;
      let b = base;
      if (mode === "equal") b = shuffle(rng, base);
      if (mode === "proper-subset") {
        a = base.slice(0, 2);
        b = base;
      }
      if (mode === "proper-superset") {
        a = base;
        b = base.slice(0, 2);
      }
      if (mode === "neither") {
        a = [base[0]!, base[1]!];
        b = [base[1]!, base[2]!, base[3]!];
      }
      const correct = relationText(a, b);
      const all = ["A = B", "A 是 B 的真子集", "B 是 A 的真子集", "A 与 B 互不包含"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 1,
          stem: `已知 $A=${showSet(a)}$，$B=${showSet(b)}$。$A$ 与 $B$ 的关系是`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution: `把两边的元素逐个对照。相等要完全一样；真子集必须少至少一个元素，并且没有外边的元素。`,
          params: { a: sortedUnique(a), b: sortedUnique(b) },
        }),
      );
    },
  },
  {
    id: "math.set.ops",
    kpId: "math.set.ops",
    sectionId: "math-1-3",
    subject: "math",
    types: ["choice", "fill"],
    difficulty: 2,
    generate(rng, type) {
      const universe = [1, 2, 3, 4, 5, 6, 7, 8];
      const a = sortedUnique(ints(rng, intBetween(rng, 2, 4), 1, 8));
      const b = sortedUnique(ints(rng, intBetween(rng, 2, 4), 1, 8));
      const op = pickOne(rng, ["inter", "union", "comp"] as const);
      const result = applySetOp(op, universe, a, b);
      const name = op === "inter" ? "A\\cap B" : op === "union" ? "A\\cup B" : "\\complement_U A";
      const stem = `设全集 $U=${showSet(universe)}$，$A=${showSet(a)}$，$B=${showSet(b)}$。求 $${name}$。`;
      const params = { op, universe, a, b };
      const solution =
        op === "inter"
          ? "交集只保留两边都有的元素。"
          : op === "union"
            ? "并集保留至少出现一次的元素。"
            : "补集是全集里不属于 A 的元素。";
      if (type === "fill") {
        const label = setLabel(result);
        return finish({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          type: "fill",
          difficulty: 2,
          stem: `${stem} 按从小到大写出元素；若是空集，填 ∅。`,
          choices: null,
          answer: { kind: "fill", accept: [label] },
          solution,
          signature: `${this.id}:fill:${a.join(".")}:${b.join(".")}:${op}`,
          params,
        });
      }
      if (type !== "choice") throw new Error(type);
      const correct = setLabel(result);
      const decoys = [
        setLabel(applySetOp(op === "inter" ? "union" : "inter", universe, a, b)),
        setLabel(a),
        setLabel(b),
        setLabel(universe.filter((value) => !result.includes(value))),
        "∅",
      ].filter((text, index, list) => text !== correct && list.indexOf(text) === index);
      if (decoys.length < 3) return this.generate(rng, type);
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          correct,
          traps: decoys.slice(0, 3).map((text) => ({ text, cause: "concept" as const })),
          solution,
          params,
        }),
      );
    },
  },
  {
    id: "math.logic.cond",
    kpId: "math.logic.cond",
    sectionId: "math-1-4",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const first = intBetween(rng, 1, 8);
      let second = intBetween(rng, 1, 8);
      if (second === first) second = first === 8 ? 1 : first + 1;
      const correct = first > second ? "充分不必要条件" : "必要不充分条件";
      const all = ["充分不必要条件", "必要不充分条件", "充要条件", "既不充分也不必要条件"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `「$x>${first}$」是「$x>${second}$」的`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution:
            first > second
              ? `由 $x>${first}$ 能推出 $x>${second}$，反过来不能，所以是充分不必要条件。`
              : `由 $x>${second}$ 能推出 $x>${first}$，但题目把较宽的条件放在前面，所以前面是必要不充分条件。`,
          params: { first, second },
        }),
      );
    },
  },
  {
    id: "math.logic.quant",
    kpId: "math.logic.quant",
    sectionId: "math-1-5",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const k = intBetween(rng, -3, 5);
      const correct = k <= 0 ? "真命题" : "假命题";
      const all = ["真命题", "假命题", "有时真有时假", "无法判断"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `命题「$\\forall x\\in\\mathbb{R},\\ x^2\\ge ${k}$」是`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution:
            k <= 0
              ? `任意实数的平方都大于等于 0，因而也大于等于 ${k}。这是全称命题，不能说「有时真」。`
              : `取 $x=0$，得到 $0\\ge ${k}$，不成立，所以这个全称命题是假命题。`,
          params: { k },
        }),
      );
    },
  },
  {
    id: "math.ineq.prop",
    kpId: "math.ineq.prop",
    sectionId: "math-2-1",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const b = intBetween(rng, 1, 6);
      const a = b + intBetween(rng, 1, 4);
      const c = intBetween(rng, -3, 5);
      const ask = pickOne(rng, ["recip", "add", "mul"] as const);
      const correct =
        ask === "recip" ? "小于" : ask === "add" ? "大于" : c > 0 ? "大于" : c < 0 ? "小于" : "等于";
      const prompt =
        ask === "recip" ? "$\\dfrac{1}{a}$ 与 $\\dfrac{1}{b}$" : ask === "add" ? "$a+c$ 与 $b+c$" : "$ac$ 与 $bc$";
      const all = ["大于", "小于", "等于", "不能确定"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `已知 $a=${a}$，$b=${b}$，$c=${c}$，且 $a>b>0$。${prompt} 比较，前者`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({
            text,
            cause: ask === "recip" ? ("concept" as const) : ("misread" as const),
          })),
          solution:
            ask === "recip"
              ? "两个正数，较大的那个的倒数更小。"
              : ask === "add"
                ? "不等式两边加同一个数，方向不变。"
                : c > 0
                  ? "两边乘正数，方向不变。"
                  : c < 0
                    ? "两边乘负数，方向改变。"
                    : "乘 0 以后两边都是 0。",
          params: { ask, a, b, c },
        }),
      );
    },
  },
  {
    id: "math.amgm",
    kpId: "math.ineq.amgm",
    sectionId: "math-2-2",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const root = pickOne(rng, [1, 2, 3, 4, 5, 6]);
      const k = root * root;
      const value = 2 * root;
      const params = { k };
      const stem = `当 $x>0$ 时，$x+\\dfrac{${k}}{x}$ 的最小值是多少？`;
      const solution = `由基本不等式，$x+\\dfrac{${k}}{x}\\ge 2\\sqrt{${k}}=${value}$。等号在 $x=${root}$ 时取到。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(root), cause: "formula" },
              { text: fmt(k), cause: "formula" },
              { text: fmt(value + 1), cause: "calculation" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.quad.ineq",
    kpId: "math.ineq.quad",
    sectionId: "math-2-3",
    subject: "math",
    types: ["choice"],
    difficulty: 3,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const p = intBetween(rng, -3, 2);
      const q = p + intBetween(rng, 1, 4);
      const sign = pickOne(rng, [">", "<"] as const);
      const correct = sign === ">" ? `x < ${p} 或 x > ${q}` : `${p} < x < ${q}`;
      const traps = [
        sign === ">" ? `${p} < x < ${q}` : `x < ${p} 或 x > ${q}`,
        sign === ">" ? `x ≤ ${p} 或 x ≥ ${q}` : `${p} ≤ x ≤ ${q}`,
        `x > ${p}`,
      ];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 3,
          stem: `不等式 $(${linear(p)})(${linear(q)}) ${sign} 0$ 的解集是`,
          correct,
          traps: traps.map((text, index) => ({
            text,
            cause: index === 1 ? ("misread" as const) : ("concept" as const),
          })),
          solution: `二次项系数为正，两根是 $${p}$ 和 $${q}$。大于 0 取两根外侧，小于 0 取两根之间，开区间。`,
          params: { p, q, sign },
        }),
      );
    },
  },
  {
    id: "math.quad.root",
    kpId: "math.ineq.quad",
    sectionId: "math-2-3",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const p = intBetween(rng, -4, 3);
      const q = p + intBetween(rng, 1, 5);
      const sum = p + q;
      const product = p * q;
      const value = Math.max(p, q);
      const stem = `方程 $x^2-${sum === 0 ? "" : sum > 0 ? sum : `(${sum})`}x${product >= 0 ? "+" : ""}${product}=0$ 较大的根是多少？`.replace(
        "x^2-x",
        "x^2-1x",
      );
      const cleanStem = `方程 $x^2-(${sum})x+(${product})=0$ 较大的根是多少？`;
      const solution = `方程因式分解为 $(${linear(p)})(${linear(q)})=0$，较大的根是 $${value}$。`;
      const params = { p, q };
      if (type === "choice") {
        const traps = [Math.min(p, q), sum, product].filter((item, index, list) => item !== value && list.indexOf(item) === index);
        while (traps.length < 3) traps.push(value + traps.length + 1);
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem: cleanStem,
            correct: fmt(value),
            traps: traps.slice(0, 3).map((item) => ({ text: fmt(item), cause: "calculation" as const })),
            solution,
            params,
          }),
        );
      }
      void stem;
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 3,
          stem: cleanStem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.fn.eval",
    kpId: "math.fn.concept",
    sectionId: "math-3-1",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const c = intBetween(rng, -3, 4);
      const m = intBetween(rng, -3, 4);
      const b = intBetween(rng, -4, 5);
      const t = intBetween(rng, -4, 5);
      const value = t < 0 ? t * t + c : m * t + b;
      const params = { c, m, b, t };
      const stem = `函数 $f(x)=\\begin{cases} x^2${plus(c)}, & x<0 \\\\ ${coef(m)}x${plus(b)}, & x\\ge 0 \\end{cases}$。$f(${t})$ 等于多少？`;
      const solution = t < 0 ? `$${t}<0$，代入第一段：$(${t})^2${plus(c)}=${value}$。` : `$${t}\\ge 0$，代入第二段：$${coef(m)}\\times${t}${plus(b)}=${value}$。`;
      if (type === "choice") {
        const other = t < 0 ? m * t + b : t * t + c;
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(other), cause: "misread" },
              { text: fmt(value + t), cause: "calculation" },
              { text: fmt(t < 0 ? t + c : m + b), cause: "calculation" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.fn.parity",
    kpId: "math.fn.prop",
    sectionId: "math-3-2",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const kind = pickOne(rng, ["even", "odd", "neither"] as const);
      const terms =
        kind === "even"
          ? [
              { c: intBetween(rng, 1, 4), e: 4 },
              { c: intBetween(rng, -3, 3), e: 2 },
              { c: intBetween(rng, -2, 2), e: 0 },
            ]
          : kind === "odd"
            ? [
                { c: intBetween(rng, 1, 3), e: 3 },
                { c: intBetween(rng, -3, 3) || 1, e: 1 },
              ]
            : [
                { c: intBetween(rng, 1, 3), e: 2 },
                { c: intBetween(rng, 1, 3), e: 1 },
              ];
      const correct = parityOf(terms);
      const all = ["奇函数", "偶函数", "既不是奇函数也不是偶函数", "既是奇函数又是偶函数"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `函数 $f(x)=${polyText(terms)}$ 的定义域是 $\\mathbb{R}$。它是`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution: "把每一项的指数单独看：全是偶数次（含常数）才是偶函数，全是奇数次才是奇函数。",
          params: { terms },
        }),
      );
    },
  },
  {
    id: "math.fn.mono",
    kpId: "math.fn.prop",
    sectionId: "math-3-2",
    subject: "math",
    types: ["choice"],
    difficulty: 3,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const m = pickOne(rng, [-4, -3, -2, -1, 1, 2, 3, 4]);
      const correct = `[${m}, +∞)`;
      const traps = [`(-∞, ${m}]`, "[0, +∞)", "全体实数"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 3,
          stem: `函数 $f(x)=x^2${plus(-2 * m)}x$ 的单调递增区间是`,
          correct,
          traps: traps.map((text) => ({ text, cause: "concept" as const })),
          solution: `配方得 $f(x)=(${linear(m)})^2-${m * m}$，对称轴 $x=${m}$，抛物线开口向上，所以在 $[${m},+\\infty)$ 上递增。`,
          params: { m },
        }),
      );
    },
  },
  {
    id: "math.power",
    kpId: "math.fn.power",
    sectionId: "math-3-3",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const [baseNum, baseDen] = pickOne(rng, [
        [2, 1],
        [3, 1],
        [3, 2],
        [1, 2],
        [1, 3],
        [2, 3],
      ] as const);
      const e1 = intBetween(rng, 1, 5);
      let e2 = intBetween(rng, 1, 5);
      if (e2 === e1) e2 = e1 === 5 ? 1 : e1 + 1;
      const correct = formerLarger(baseValue(baseNum, baseDen), e1, e2);
      const all = ["前者更大", "后者更大", "一样大", "无法比较"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `比较 $\\left(\\dfrac{${baseNum}}{${baseDen}}\\right)^{${e1}}$ 与 $\\left(\\dfrac{${baseNum}}{${baseDen}}\\right)^{${e2}}$。`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution: "底数大于 1 时，指数越大值越大；底数在 0 和 1 之间时，指数越大值越小。",
          params: { baseNum, baseDen, e1, e2 },
        }),
      );
    },
  },
  {
    id: "math.fn.apply",
    kpId: "math.fn.apply",
    sectionId: "math-3-4",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const flag = pickOne(rng, [8, 10, 12]);
      const flagKm = pickOne(rng, [2, 3]);
      const per = pickOne(rng, [2, 3]);
      const distance = intBetween(rng, 1, 10);
      const value = distance <= flagKm ? flag : flag + (distance - flagKm) * per;
      const params = { flag, flagKm, per, distance };
      const stem = `某校门口的出租车：${flagKm} 千米以内 ${flag} 元，超出部分每千米 ${per} 元。行驶 ${distance} 千米的车费是多少元？`;
      const solution =
        distance <= flagKm
          ? `${distance} 千米没有超出起步里程，车费就是 ${flag} 元。`
          : `超出 ${distance - flagKm} 千米，车费为 $${flag}+${distance - flagKm}\\times${per}=${value}$ 元。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(flag + distance * per), cause: "misread" },
              { text: fmt(distance * per), cause: "formula" },
              { text: fmt(flag + flagKm * per), cause: "calculation" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.exp.value",
    kpId: "math.exp.calc",
    sectionId: "math-4-1",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const inner = intBetween(rng, 2, 4);
      const den = pickOne(rng, [2, 3]);
      const num = intBetween(rng, 1, 3);
      const base = inner ** den;
      const value = inner ** num;
      if (base > 4096) return this.generate(rng, type);
      const params = { inner, den, num };
      const stem = `计算 $${base}^{${num}/${den}}$。`;
      const solution = `$${base}=${inner}^{${den}}$，所以 $${base}^{${num}/${den}}=${inner}^{${num}}=${value}$。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(inner), cause: "formula" },
              { text: fmt(base), cause: "concept" },
              { text: fmt(inner * num), cause: "calculation" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.exp.solve",
    kpId: "math.exp.fn",
    sectionId: "math-4-2",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const base = pickOne(rng, [2, 3, 5]);
      const e1 = intBetween(rng, 1, 4);
      const e2 = intBetween(rng, 1, 4);
      const value = e1 + e2;
      const params = { base, e1, e2 };
      const stem = `若 $${base}^{x}=${base}^{${e1}}\\times ${base}^{${e2}}$，则 $x$ 等于多少？`;
      const solution = `同底数幂相乘，指数相加，$x=${e1}+${e2}=${value}$。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(e1 * e2), cause: "formula" },
              { text: fmt(Math.abs(e1 - e2)), cause: "formula" },
              { text: fmt(value + base), cause: "calculation" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.exp.mono",
    kpId: "math.exp.fn",
    sectionId: "math-4-2",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const [baseNum, baseDen] = pickOne(rng, [
        [2, 1],
        [3, 1],
        [1, 2],
        [1, 3],
      ] as const);
      const correct = baseNum > baseDen ? "单调递增" : "单调递减";
      const all = ["单调递增", "单调递减", "先增后减", "不单调"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `函数 $y=\\left(\\dfrac{${baseNum}}{${baseDen}}\\right)^{x}$ 在 $\\mathbb{R}$ 上`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution: "指数函数的底数大于 1 时递增，底数在 0 和 1 之间时递减。",
          params: { baseNum, baseDen },
        }),
      );
    },
  },
  {
    id: "math.log.value",
    kpId: "math.log.calc",
    sectionId: "math-4-3",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const base = pickOne(rng, [2, 3, 4, 5]);
      const exp = intBetween(rng, 1, 4);
      const argument = base ** exp;
      const params = { base, exp };
      const stem = `计算 $\\log_{${base}}${argument < 10 ? argument : `{${argument}}`}$。`;
      const solution = `因为 $${base}^{${exp}}=${argument}$，所以对数等于 $${exp}$。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(exp),
            traps: [
              { text: fmt(base), cause: "concept" },
              { text: fmt(argument), cause: "concept" },
              { text: fmt(exp + 1), cause: "calculation" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value: exp,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.log.domain",
    kpId: "math.log.fn",
    sectionId: "math-4-4",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const h = intBetween(rng, -2, 5);
      const inside = h === 0 ? "x" : h > 0 ? `x-${h}` : `x+${-h}`;
      const correct = `x > ${h}`;
      const traps = [`x ≥ ${h}`, `x < ${h}`, "全体实数"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `函数 $y=\\log_{2}(${inside})$ 的定义域是`,
          correct,
          traps: traps.map((text) => ({ text, cause: "concept" as const })),
          solution: "真数必须大于 0，底数 2 已经符合要求，所以只解这个不等式，结果是开区间。",
          params: { h },
        }),
      );
    },
  },
  {
    id: "math.log.compare",
    kpId: "math.log.fn",
    sectionId: "math-4-4",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const base = pickOne(rng, [2, 3, 10]);
      const left = intBetween(rng, 2, 8);
      let right = intBetween(rng, 2, 8);
      if (right === left) right = left === 8 ? 2 : left + 1;
      const correct = left === right ? "一样大" : left > right ? "前者更大" : "后者更大";
      const all = ["前者更大", "后者更大", "一样大", "无法比较"];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `比较 $\\log_{${base}}${left}$ 与 $\\log_{${base}}${right}$。`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution: `底数 ${base} 大于 1，对数函数递增，真数大的对数值更大。`,
          params: { base, left, right },
        }),
      );
    },
  },
  {
    id: "math.model",
    kpId: "math.fn.model",
    sectionId: "math-4-5",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 2,
    generate(rng, type) {
      const n0 = pickOne(rng, [20, 50, 100, 200]);
      const period = pickOne(rng, [2, 3, 4]);
      const steps = intBetween(rng, 1, 4);
      const hours = steps * period;
      const value = n0 * 2 ** steps;
      const params = { n0, period, hours };
      const stem = `培养液中的细菌每 ${period} 小时数量翻倍。开始有 ${n0} 个，${hours} 小时后有多少个？`;
      const solution = `${hours} 小时刚好翻倍 ${steps} 次，数量为 $${n0}\\times 2^{${steps}}=${value}$。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 2,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(n0 * steps * 2), cause: "formula" },
              { text: fmt(n0 * 2), cause: "misread" },
              { text: fmt(n0 + steps * period), cause: "concept" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.zero",
    kpId: "math.fn.model",
    sectionId: "math-4-5",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const s = pickOne(rng, [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]);
      const a = Math.floor(Math.sqrt(s));
      const correct = `(${a}, ${a + 1})`;
      const traps = [`[${a}, ${a + 1}]`, `(${Math.max(0, a - 1)}, ${a})`, `(${a + 1}, ${a + 2})`];
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `函数 $f(x)=x^2-${s}$ 的一个零点所在的区间是`,
          correct,
          traps: traps.map((text) => ({ text, cause: "concept" as const })),
          solution: `$f(${a})=${a * a - s}<0$，$f(${a + 1})=${(a + 1) * (a + 1) - s}>0$，零点在开区间 $(${a},${a + 1})$ 内。`,
          params: { s },
        }),
      );
    },
  },
  {
    id: "math.radian",
    kpId: "math.rad",
    sectionId: "math-5-1",
    subject: "math",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const degrees = [30, 45, 60, 90, 120, 135, 150, 180, 270, 360];
      const deg = pickOne(rng, degrees);
      const correct = radianText(deg);
      const traps = shuffle(rng, degrees.filter((item) => item !== deg))
        .slice(0, 3)
        .map((item) => radianText(item));
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 1,
          stem: `${deg}° 等于多少弧度？`,
          correct,
          traps: traps.map((text) => ({ text, cause: "formula" as const })),
          solution: `弧度 = 角度 × π / 180。${deg}° = ${correct}。`,
          params: { deg },
        }),
      );
    },
  },
  {
    id: "math.trig.value",
    kpId: "math.trig.def",
    sectionId: "math-5-2",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const pair = pickOne(rng, [
        ["sin", 0],
        ["sin", 30],
        ["sin", 45],
        ["sin", 60],
        ["sin", 90],
        ["sin", 180],
        ["cos", 0],
        ["cos", 60],
        ["cos", 90],
        ["cos", 180],
        ["tan", 0],
        ["tan", 45],
        ["tan", 30],
        ["tan", 135],
      ] as const);
      const correct = trigTable(pair[0], pair[1]);
      const pool = ["0", "1", "-1", "1/2", "√2/2", "√3/2", "√3", "√3/3"];
      const traps = shuffle(rng, pool.filter((text) => text !== correct)).slice(0, 3);
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `$\\${pair[0]} ${pair[1]}^\\circ$ 的值是`,
          correct,
          traps: traps.map((text) => ({ text, cause: "formula" as const })),
          solution: `这是特殊角。$\\${pair[0]} ${pair[1]}^\\circ=${correct}$。`,
          params: { fn: pair[0], angle: pair[1] },
        }),
      );
    },
  },
  {
    id: "math.induction",
    kpId: "math.trig.ind",
    sectionId: "math-5-3",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const kind = pickOne(rng, ["sin-pi", "cos-pi", "sin-half"] as const);
      const [num, den] = pickOne(rng, [
        [3, 5],
        [5, 13],
        [8, 17],
        [1, 2],
      ] as const);
      const positive = `${num}/${den}`;
      const negative = `-${positive}`;
      const correct = kind === "cos-pi" ? negative : positive;
      const given = kind === "sin-half" ? `\\cos\\alpha=${positive}` : kind === "cos-pi" ? `\\cos\\alpha=${positive}` : `\\sin\\alpha=${positive}`;
      const asked = kind === "sin-half" ? "\\sin\\left(\\dfrac{\\pi}{2}-\\alpha\\right)" : kind === "cos-pi" ? "\\cos(\\pi-\\alpha)" : "\\sin(\\pi-\\alpha)";
      const traps = [kind === "cos-pi" ? positive : negative, `${den}/${num}`, "0"].filter((text) => text !== correct);
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `已知 $${given}$，且 $\\alpha$ 为锐角。$${asked}$ 等于`,
          correct,
          traps: traps.slice(0, 3).map((text) => ({ text, cause: "formula" as const })),
          solution:
            kind === "cos-pi"
              ? "cos(π-α) = -cos α。"
              : kind === "sin-half"
                ? "sin(π/2-α) = cos α。"
                : "sin(π-α) = sin α。",
          params: { kind, num, den },
        }),
      );
    },
  },
  {
    id: "math.trig.graph",
    kpId: "math.trig.graph",
    sectionId: "math-5-4",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const fn = pickOne(rng, ["sin", "cos"] as const);
      const ask = pickOne(rng, ["min", "max", "period"] as const);
      const correct = ask === "min" ? "-1" : ask === "max" ? "1" : "2π";
      const all = ["-1", "1", "0", "2π"];
      const prompt = ask === "min" ? "最小值" : ask === "max" ? "最大值" : "最小正周期";
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `函数 $y=\\${fn} x$ 的${prompt}是`,
          correct,
          traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
          solution: "正弦、余弦的值域都是 [-1,1]，最小正周期都是 2π。",
          params: { fn, ask },
        }),
      );
    },
  },
  {
    id: "math.ident",
    kpId: "math.trig.id",
    sectionId: "math-5-5",
    subject: "math",
    types: ["choice"],
    difficulty: 3,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const triples = [
        [3, 4, 5],
        [5, 12, 13],
        [8, 15, 17],
      ] as const;
      const [first, second] = shuffle(rng, triples).slice(0, 2) as [(typeof triples)[number], (typeof triples)[number]];
      const sa = first[0];
      const ca = first[1];
      const da = first[2];
      const sb = second[0];
      const cb = second[1];
      const db = second[2];
      const den = da * db;
      const correct = fracText(sa * cb + ca * sb, den);
      const traps = [fracText(ca * cb - sa * sb, den), fracText(sa * cb - ca * sb, den), fracText(sa * cb, den)];
      if (new Set([correct, ...traps]).size < 4) return this.generate(rng, type);
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 3,
          stem: `锐角 $\\alpha,\\beta$ 满足 $\\sin\\alpha=\\dfrac{${sa}}{${da}}$，$\\cos\\alpha=\\dfrac{${ca}}{${da}}$，$\\sin\\beta=\\dfrac{${sb}}{${db}}$，$\\cos\\beta=\\dfrac{${cb}}{${db}}$。$\\sin(\\alpha+\\beta)$ 等于`,
          correct,
          traps: traps.map((text, index) => ({ text, cause: index === 0 ? ("formula" as const) : ("calculation" as const) })),
          solution: `$\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta=${correct}$。`,
          params: { sa, ca, da, sb, cb, db },
        }),
      );
    },
  },
  {
    id: "math.wave.amp",
    kpId: "math.trig.wave",
    sectionId: "math-5-6",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 1,
    generate(rng, type) {
      const signed = pickOne(rng, [-4, -3, -2, 2, 3, 4]);
      const w = pickOne(rng, [1, 2, 3]);
      const value = Math.abs(signed);
      const params = { signed, w };
      const stem = `函数 $y=${signed}\\sin(${w}x)$ 的振幅是多少？`;
      const solution = `振幅是系数的绝对值，等于 $${value}$。它不是角速度 ${w}。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 1,
            stem,
            correct: fmt(value),
            traps: [
              { text: fmt(signed), cause: "unit" },
              { text: fmt(w), cause: "concept" },
              { text: fmt(value * w), cause: "formula" },
            ],
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 1,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
  {
    id: "math.wave.period",
    kpId: "math.trig.wave",
    sectionId: "math-5-6",
    subject: "math",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const [wNum, wDen] = pickOne(rng, [
        [1, 1],
        [2, 1],
        [1, 2],
        [3, 1],
      ] as const);
      const correct = periodText(wNum, wDen);
      const all = ["π", "2π", "4π", "3π", "π/2", "2π/3"].filter((text) => text !== correct);
      const omega = wDen === 1 ? String(wNum) : `\\dfrac{${wNum}}{${wDen}}`;
      return finish(
        choiceItem({
          rng,
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 2,
          stem: `函数 $y=\\sin\\left(${omega}x\\right)$ 的最小正周期是`,
          correct,
          traps: all.slice(0, 3).map((text) => ({ text, cause: "formula" as const })),
          solution: `$T=\\dfrac{2\\pi}{\\omega}=${correct}$。`,
          params: { wNum, wDen },
        }),
      );
    },
  },
  {
    id: "math.trig.app",
    kpId: "math.trig.app",
    sectionId: "math-5-7",
    subject: "math",
    types: ["numeric", "choice"],
    difficulty: 3,
    generate(rng, type) {
      const mid = intBetween(rng, 2, 6);
      const amp = intBetween(rng, 1, 4);
      const period = pickOne(rng, [4, 8, 12]);
      const quarter = intBetween(rng, 0, 3);
      const hours = (quarter * period) / 4;
      const sine = [0, 1, 0, -1][quarter]!;
      const value = mid + amp * sine;
      const params = { mid, amp, period, hours };
      const stem = `港口水位（米）可写成 $h=${mid}+${amp}\\sin\\dfrac{2\\pi t}{${period}}$，其中 $t$ 为小时。$t=${hours}$ 时水位是多少米？`;
      const solution = `此时角度为 $${quarter}\\times\\dfrac{\\pi}{2}$，$\\sin$ 的值是 $${sine}$，所以 $h=${value}$。`;
      if (type === "choice") {
        return finish(
          choiceItem({
            rng,
            templateId: this.id,
            kpId: this.kpId,
            sectionId: this.sectionId,
            subject: "math",
            difficulty: 3,
            stem,
            correct: fmt(value),
            traps: (
              [
                { text: fmt(mid + amp), cause: "misread" },
                { text: fmt(mid - amp), cause: "unit" },
                { text: fmt(mid), cause: "calculation" },
              ] satisfies Array<{ text: string; cause: ErrorCause }>
            ).filter((trap) => trap.text !== fmt(value)),
            solution,
            params,
          }),
        );
      }
      return finish(
        numericItem({
          templateId: this.id,
          kpId: this.kpId,
          sectionId: this.sectionId,
          subject: "math",
          difficulty: 3,
          stem,
          value,
          solution,
          params,
          type,
        }),
      );
    },
  },
];

export function listMathTemplates(): Template[] {
  return mathTemplates;
}
