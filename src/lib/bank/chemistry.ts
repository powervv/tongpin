import type { CountedFormula, IonEquation, Species } from "@/lib/bank/chem-check";
import { oxidationNumber, reactionIsRedox } from "@/lib/bank/chem-check";
import { asChoiceOrNumeric, choiceItem, fmt } from "@/lib/bank/helpers";
import type { Template } from "@/lib/bank/types";
import { pickOne, shuffle } from "@/lib/rng";
import type { ErrorCause, GeneratedItem, ItemType, Rng } from "@/lib/types";

const SUBSTANCES: { name: string; cat: string }[] = [
  { name: "Fe(OH)₃ 胶体", cat: "胶体" },
  { name: "泥水", cat: "浊液" },
  { name: "NaCl", cat: "电解质" },
  { name: "蔗糖", cat: "非电解质" },
  { name: "CaO", cat: "氧化物" },
  { name: "Na₂CO₃", cat: "盐" },
  { name: "酒精", cat: "非电解质" },
  { name: "食盐水", cat: "混合物" },
  { name: "NaOH", cat: "碱" },
  { name: "盐酸", cat: "酸" },
];

const ION_OK: IonEquation[] = [
  { left: [{ id: "H+", coeff: 1 }, { id: "OH-", coeff: 1 }], right: [{ id: "H2O", coeff: 1 }] },
  {
    left: [{ id: "CaCO3", coeff: 1 }, { id: "H+", coeff: 2 }],
    right: [{ id: "Ca2+", coeff: 1 }, { id: "CO2", coeff: 1 }, { id: "H2O", coeff: 1 }],
  },
  { left: [{ id: "Ba2+", coeff: 1 }, { id: "SO4^2-", coeff: 1 }], right: [{ id: "BaSO4", coeff: 1 }] },
  { left: [{ id: "Fe", coeff: 1 }, { id: "H+", coeff: 2 }], right: [{ id: "Fe2+", coeff: 1 }, { id: "H2", coeff: 1 }] },
  {
    left: [{ id: "Cl2", coeff: 1 }, { id: "OH-", coeff: 2 }],
    right: [{ id: "Cl-", coeff: 1 }, { id: "ClO-", coeff: 1 }, { id: "H2O", coeff: 1 }],
  },
  { left: [{ id: "Cu2+", coeff: 1 }, { id: "Fe", coeff: 1 }], right: [{ id: "Fe2+", coeff: 1 }, { id: "Cu", coeff: 1 }] },
];

const ION_BAD: IonEquation[] = [
  { left: [{ id: "Fe", coeff: 1 }, { id: "H+", coeff: 1 }], right: [{ id: "Fe3+", coeff: 1 }, { id: "H2", coeff: 1 }] },
  { left: [{ id: "H+", coeff: 1 }, { id: "OH-", coeff: 1 }], right: [{ id: "H2", coeff: 1 }, { id: "O2", coeff: 1 }] },
  {
    left: [{ id: "Ba2+", coeff: 1 }, { id: "SO4^2-", coeff: 1 }],
    right: [{ id: "Ba2+", coeff: 1 }, { id: "SO4^2-", coeff: 1 }, { id: "H2O", coeff: 1 }],
  },
  { left: [{ id: "CaCO3", coeff: 1 }, { id: "H+", coeff: 2 }], right: [{ id: "Ca2+", coeff: 1 }, { id: "CO2", coeff: 1 }] },
  { left: [{ id: "Ag+", coeff: 1 }, { id: "Cl-", coeff: 1 }], right: [{ id: "Ag+", coeff: 1 }, { id: "Cl2", coeff: 1 }] },
];

const ION_NAME: Record<string, string> = {
  "H+": "H⁺",
  "OH-": "OH⁻",
  H2O: "H₂O",
  "Na+": "Na⁺",
  "Cl-": "Cl⁻",
  CaCO3: "CaCO₃",
  "Ca2+": "Ca²⁺",
  CO2: "CO₂",
  "Ba2+": "Ba²⁺",
  "SO4^2-": "SO₄²⁻",
  BaSO4: "BaSO₄",
  Fe: "Fe",
  "Fe2+": "Fe²⁺",
  "Fe3+": "Fe³⁺",
  H2: "H₂",
  "Cu2+": "Cu²⁺",
  Cu: "Cu",
  "Ag+": "Ag⁺",
  "ClO-": "ClO⁻",
  Cl2: "Cl₂",
  O2: "O₂",
};

type Reaction = { text: string; left: CountedFormula[]; right: CountedFormula[] };

const REACTIONS: Reaction[] = [
  {
    text: "2Na + Cl₂ = 2NaCl",
    left: [{ formula: "Na", coeff: 2 }, { formula: "Cl2", coeff: 1 }],
    right: [{ formula: "NaCl", coeff: 2 }],
  },
  {
    text: "Fe₂O₃ + 3CO = 2Fe + 3CO₂",
    left: [{ formula: "Fe2O3", coeff: 1 }, { formula: "CO", coeff: 3 }],
    right: [{ formula: "Fe", coeff: 2 }, { formula: "CO2", coeff: 3 }],
  },
  {
    text: "2H₂ + O₂ = 2H₂O",
    left: [{ formula: "H2", coeff: 2 }, { formula: "O2", coeff: 1 }],
    right: [{ formula: "H2O", coeff: 2 }],
  },
  {
    text: "CaO + H₂O = Ca(OH)₂",
    left: [{ formula: "CaO", coeff: 1 }, { formula: "H2O", coeff: 1 }],
    right: [{ formula: "CaO2H2", coeff: 1 }],
  },
  {
    text: "NaOH + HCl = NaCl + H₂O",
    left: [{ formula: "NaOH", coeff: 1 }, { formula: "HCl", coeff: 1 }],
    right: [{ formula: "NaCl", coeff: 1 }, { formula: "H2O", coeff: 1 }],
  },
  {
    text: "SO₃ + H₂O = H₂SO₄",
    left: [{ formula: "SO3", coeff: 1 }, { formula: "H2O", coeff: 1 }],
    right: [{ formula: "H2SO4", coeff: 1 }],
  },
];

function showIon(species: Species): string {
  const name = ION_NAME[species.id] ?? species.id;
  return species.coeff === 1 ? name : `${species.coeff}${name}`;
}

function showIonEquation(equation: IonEquation): string {
  const side = (items: Species[]) => items.map(showIon).join(" + ");
  return `${side(equation.left)} = ${side(equation.right)}`;
}

function calc(
  template: Pick<Template, "id" | "kpId" | "sectionId" | "difficulty">,
  rng: Rng,
  type: ItemType,
  input: {
    stem: string;
    value: number;
    traps: { value: number; cause: ErrorCause }[];
    solution: string;
    params: unknown;
    tolerance?: number;
  },
): GeneratedItem {
  return asChoiceOrNumeric(type, rng, {
    templateId: template.id,
    kpId: template.kpId,
    sectionId: template.sectionId,
    subject: "chemistry",
    difficulty: template.difficulty,
    ...input,
  });
}

export const chemistryTemplates: Template[] = [
  {
    id: "chem.class",
    kpId: "chem.class",
    sectionId: "chem-1-1",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const cat = pickOne(rng, [...new Set(SUBSTANCES.map((item) => item.cat))]);
      const correctPool = SUBSTANCES.filter((item) => item.cat === cat);
      const wrongPool = SUBSTANCES.filter((item) => item.cat !== cat);
      const correct = pickOne(rng, correctPool);
      const traps = shuffle(rng, wrongPool).slice(0, 3);
      if (traps.length < 3) return this.generate(rng, type);
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 1,
        stem: `下列物质按高一要求归类，属于「${cat}」的是`,
        correct: correct.name,
        traps: traps.map((item) => ({ text: item.name, cause: "concept" as const })),
        solution: `${correct.name}属于${cat}。食盐水是混合物，氯化钠本身才是电解质；胶体和浊液也不要混成溶液。`,
        params: { cat },
      });
    },
  },
  {
    id: "chem.ion",
    kpId: "chem.ion",
    sectionId: "chem-1-2",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 3,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const correctEq = pickOne(rng, ION_OK);
      const wrongEqs = shuffle(rng, ION_BAD).slice(0, 3);
      const correct = showIonEquation(correctEq);
      const equations = [correctEq, ...wrongEqs].map((equation) => ({
        text: showIonEquation(equation),
        left: equation.left,
        right: equation.right,
      }));
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 3,
        stem: "下列离子方程式书写正确的是",
        correct,
        traps: wrongEqs.map((equation) => ({ text: showIonEquation(equation), cause: "formula" as const })),
        solution: `原子个数和电荷都要守恒。正确的是 ${correct}。`,
        params: { equations },
      });
    },
  },
  {
    id: "chem.oxnum",
    kpId: "chem.redox",
    sectionId: "chem-1-3",
    subject: "chemistry",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const sample = pickOne(rng, [
        ["H2SO4", "S", "H₂SO₄"],
        ["SO2", "S", "SO₂"],
        ["H2S", "S", "H₂S"],
        ["S", "S", "S"],
        ["NaCl", "Cl", "NaCl"],
        ["NaClO", "Cl", "NaClO"],
        ["Fe2O3", "Fe", "Fe₂O₃"],
        ["FeO", "Fe", "FeO"],
        ["CO2", "C", "CO₂"],
        ["Na2O2", "O", "Na₂O₂"],
        ["Cl2", "Cl", "Cl₂"],
        ["H2O", "O", "H₂O"],
      ] as const);
      const value = oxidationNumber(sample[0], sample[1]);
      return calc(this, rng, type, {
        stem: `${sample[2]} 中 ${sample[1]} 的化合价是多少？正价填正数，负价填负数，单质填 0。`,
        value,
        traps: [
          { value: -value || 1, cause: "unit" },
          { value: value + 2, cause: "calculation" },
          { value: value === 0 ? 2 : 0, cause: "concept" },
        ],
        solution: `按化合物中化合价代数和为 0 来算，${sample[2]} 中 ${sample[1]} 为 ${value}。过氧化物里氧是 -1，单质是 0。`,
        params: { formula: sample[0], element: sample[1] },
      });
    },
  },
  {
    id: "chem.redox.which",
    kpId: "chem.redox",
    sectionId: "chem-1-3",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const redox = REACTIONS.filter((item) => reactionIsRedox(item.left, item.right));
      const plain = REACTIONS.filter((item) => !reactionIsRedox(item.left, item.right));
      const correct = pickOne(rng, redox);
      const traps = shuffle(rng, plain).slice(0, 3);
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 2,
        stem: "下列反应属于氧化还原反应的是",
        correct: correct.text,
        traps: traps.map((item) => ({ text: item.text, cause: "concept" as const })),
        solution: "有元素化合价变化才是氧化还原反应。复分解和部分化合反应里化合价可以不变。",
        params: {
          reactions: [correct, ...traps].map((item) => ({
            text: item.text,
            left: item.left,
            right: item.right,
          })),
        },
      });
    },
  },
  {
    id: "chem.na.gas",
    kpId: "chem.na",
    sectionId: "chem-2-1",
    subject: "chemistry",
    types: ["choice", "numeric"],
    difficulty: 3,
    generate(rng, type) {
      const mass = pickOne(rng, [23, 46, 92]);
      const value = (mass / 23 / 2) * 22.4;
      return calc(this, rng, type, {
        stem: `标准状况下，${mass} g 钠与足量水完全反应，生成的氢气是多少升？钠的摩尔质量按 23 g/mol，气体摩尔体积按 22.4 L/mol。`,
        value,
        tolerance: 0.02,
        traps: [
          { value: (mass / 23) * 22.4, cause: "formula" },
          { value: mass / 23, cause: "misread" },
          { value: (mass / 46) * 22.4, cause: "calculation" },
        ],
        solution: `$n(\\mathrm{Na})=\\dfrac{${mass}}{23}$ mol。反应 $2\\mathrm{Na}\\sim \\mathrm{H_2}$，氢气 ${fmt(value)} L。`,
        params: { mass },
      });
    },
  },
  {
    id: "chem.na.product",
    kpId: "chem.na",
    sectionId: "chem-2-1",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const condition = pickOne(rng, ["burn", "room"] as const);
      const correct = condition === "burn" ? "淡黄色固体 Na₂O₂" : "白色固体 Na₂O";
      const all = ["淡黄色固体 Na₂O₂", "白色固体 Na₂O", "蓝色固体 Cu(OH)₂", "无色气体 H₂"];
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 1,
        stem: condition === "burn" ? "钠在空气中燃烧，主要固体产物是" : "钠在常温下缓慢氧化，主要固体产物是",
        correct,
        traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
        solution: "常温生成白色 Na₂O，加热燃烧生成淡黄色 Na₂O₂。",
        params: { condition },
      });
    },
  },
  {
    id: "chem.cl.amount",
    kpId: "chem.cl",
    sectionId: "chem-2-2",
    subject: "chemistry",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const mass = pickOne(rng, [71, 142]);
      const value = mass / 71;
      return calc(this, rng, type, {
        stem: `${mass} g 氯气的物质的量是多少摩尔？Cl₂ 的摩尔质量按 71 g/mol。`,
        value,
        traps: [
          { value: mass / 35.5, cause: "formula" },
          { value: mass, cause: "concept" },
          { value: 71 / mass, cause: "calculation" },
        ],
        solution: `$n=\\dfrac{m}{M}=\\dfrac{${mass}}{71}=${value}$ mol。不要把氯原子的摩尔质量 35.5 当成 Cl₂ 的摩尔质量。`,
        params: { mass },
      });
    },
  },
  {
    id: "chem.cl.alkali",
    kpId: "chem.cl",
    sectionId: "chem-2-2",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const temp = pickOne(rng, ["cold", "hot"] as const);
      const correct = temp === "cold" ? "NaCl 和 NaClO" : "NaCl 和 NaClO₃";
      const all = ["NaCl 和 NaClO", "NaCl 和 NaClO₃", "只有 NaCl", "NaOH 和 H₂"];
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 2,
        stem: `氯气与${temp === "cold" ? "冷" : "热"}的 NaOH 溶液反应，主要含氯产物是`,
        correct,
        traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
        solution: "冷碱生成 NaCl 和 NaClO，热碱生成 NaCl 和 NaClO₃。",
        params: { temp },
      });
    },
  },
  {
    id: "chem.mole",
    kpId: "chem.mole",
    sectionId: "chem-2-3",
    subject: "chemistry",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const sample = pickOne(rng, [
        { mass: 4, molar: 40, volumeMl: 500, name: "NaOH" },
        { mass: 8, molar: 40, volumeMl: 200, name: "NaOH" },
        { mass: 10, molar: 40, volumeMl: 250, name: "NaOH" },
        { mass: 98, molar: 98, volumeMl: 500, name: "H₂SO₄" },
      ]);
      const value = (sample.mass / sample.molar) / (sample.volumeMl / 1000);
      return calc(this, rng, type, {
        stem: `把 ${sample.mass} g ${sample.name}（摩尔质量 ${sample.molar} g/mol）溶于水，配成 ${sample.volumeMl} mL 溶液。溶质的物质的量浓度是多少 mol/L？`,
        value,
        tolerance: 0.001,
        traps: [
          { value: sample.mass / sample.volumeMl, cause: "unit" },
          { value: sample.mass / sample.molar, cause: "misread" },
          { value: (sample.mass / sample.molar) / sample.volumeMl, cause: "unit" },
        ],
        solution: `$n=\\dfrac{${sample.mass}}{${sample.molar}}$ mol，体积要换成升，浓度是 ${fmt(value)} mol/L。`,
        params: sample,
      });
    },
  },
  {
    id: "chem.fe.color",
    kpId: "chem.fe",
    sectionId: "chem-3-1",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const ion = pickOne(rng, ["Fe2+", "Fe3+", "Cu2+"] as const);
      const label = ion === "Fe2+" ? "Fe²⁺" : ion === "Fe3+" ? "Fe³⁺" : "Cu²⁺";
      const correct = ion === "Fe2+" ? "浅绿色" : ion === "Fe3+" ? "棕黄色" : "蓝色";
      const all = ["浅绿色", "棕黄色", "蓝色", "无色"];
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 1,
        stem: `${label} 在水溶液中通常呈现的颜色是`,
        correct,
        traps: all.filter((text) => text !== correct).map((text) => ({ text, cause: "concept" as const })),
        solution: "Fe²⁺ 浅绿色，Fe³⁺ 棕黄色，Cu²⁺ 蓝色。",
        params: { ion },
      });
    },
  },
  {
    id: "chem.fe.ox",
    kpId: "chem.fe",
    sectionId: "chem-3-1",
    subject: "chemistry",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const nCl2 = pickOne(rng, [1, 2, 3]);
      const value = nCl2 * 2;
      return calc(this, rng, type, {
        stem: `反应 $2\\mathrm{Fe^{2+}}+\\mathrm{Cl_2}=2\\mathrm{Fe^{3+}}+2\\mathrm{Cl^-}$ 中，${nCl2} mol Cl₂ 最多氧化多少摩尔 Fe²⁺？`,
        value,
        traps: [
          { value: nCl2, cause: "formula" },
          { value: nCl2 * 3, cause: "calculation" },
          { value: nCl2 / 2, cause: "formula" },
        ],
        solution: `计量数是 2 mol Fe²⁺ 对 1 mol Cl₂，所以 ${nCl2} mol Cl₂ 氧化 ${value} mol Fe²⁺。`,
        params: { nCl2 },
      });
    },
  },
  {
    id: "chem.alloy",
    kpId: "chem.alloy",
    sectionId: "chem-3-2",
    subject: "chemistry",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const truth = pickOne(rng, ["合金属于混合物", "钢是铁和碳的合金"]);
      const falses = ["合金属于化合物", "合金的熔点一定高于每一种成分", "纯铁比钢更适合做刀具"];
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "chemistry",
        difficulty: 1,
        stem: "关于金属材料，下列说法正确的是",
        correct: truth,
        traps: falses.map((text) => ({ text, cause: "concept" as const })),
        solution: "合金是混合物。钢含有铁和碳。合金熔点通常低于成分金属，硬度常常更高。",
        params: { truth },
      });
    },
  },
];
