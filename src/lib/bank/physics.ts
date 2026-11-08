import { asChoiceOrNumeric, choiceItem } from "@/lib/bank/helpers";
import type { Template } from "@/lib/bank/types";
import { intBetween, pickOne } from "@/lib/rng";
import type { GeneratedItem, ItemType, Rng } from "@/lib/types";

const G = 10;

function triple(rng: Rng): [number, number, number] {
  const scale = pickOne(rng, [1, 2, 3]);
  const base = pickOne(rng, [
    [3, 4, 5],
    [5, 12, 13],
    [8, 15, 17],
  ] as const);
  return [base[0] * scale, base[1] * scale, base[2] * scale];
}

function calc(
  template: Pick<Template, "id" | "kpId" | "sectionId" | "difficulty">,
  rng: Rng,
  type: ItemType,
  input: {
    stem: string;
    value: number;
    traps: { value: number; cause: "concept" | "formula" | "calculation" | "misread" | "unit" }[];
    solution: string;
    params: unknown;
  },
): GeneratedItem {
  return asChoiceOrNumeric(type, rng, {
    templateId: template.id,
    kpId: template.kpId,
    sectionId: template.sectionId,
    subject: "physics",
    difficulty: template.difficulty,
    ...input,
  });
}

export const physicsTemplates: Template[] = [
  {
    id: "phys.disp",
    kpId: "phys.disp",
    sectionId: "phys-1-1",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 1,
    generate(rng, type) {
      const [east, north, hyp] = triple(rng);
      const ask = pickOne(rng, ["displacement", "distance"] as const);
      const value = ask === "displacement" ? hyp : east + north;
      return calc(this, rng, type, {
        stem: `同学从教学楼出发，先向东走 ${east} m，再向北走 ${north} m。${ask === "displacement" ? "位移的大小" : "路程"}是多少米？`,
        value,
        traps: [
          { value: ask === "displacement" ? east + north : hyp, cause: "concept" },
          { value: east, cause: "misread" },
          { value: north, cause: "misread" },
        ],
        solution:
          ask === "displacement"
            ? `两段互相垂直，位移大小是 $\\sqrt{${east}^2+${north}^2}=${hyp}$ m。路程是两段相加，不要和位移混在一起。`
            : `路程把轨迹长度相加，是 ${east}+${north}=${east + north} m。位移大小则是 ${hyp} m。`,
        params: { east, north, ask },
      });
    },
  },
  {
    id: "phys.velocity",
    kpId: "phys.speed",
    sectionId: "phys-1-2",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 1,
    generate(rng, type) {
      const speed = intBetween(rng, 2, 12);
      const time = intBetween(rng, 2, 8);
      const dx = speed * time;
      return calc(this, rng, type, {
        stem: `质点沿直线做单向运动，${time} s 内位移 ${dx} m。这段时间的平均速度大小是多少 m/s？`,
        value: speed,
        traps: [
          { value: dx, cause: "formula" },
          { value: dx * time, cause: "formula" },
          { value: dx + time, cause: "calculation" },
        ],
        solution: `平均速度大小 $v=\\dfrac{\\Delta x}{\\Delta t}=\\dfrac{${dx}}{${time}}=${speed}$ m/s。`,
        params: { dx, time },
      });
    },
  },
  {
    id: "phys.accel",
    kpId: "phys.accel",
    sectionId: "phys-1-3",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const time = pickOne(rng, [2, 4, 5]);
      const accel = intBetween(rng, -4, 6);
      const v0 = intBetween(rng, 0, 12);
      const v = v0 + accel * time;
      return calc(this, rng, type, {
        stem: `物体初速度 ${v0} m/s，经过 ${time} s 后速度变为 ${v} m/s，速度方向取初速度方向为正。加速度是多少 m/s²？`,
        value: accel,
        traps: [
          { value: (v + v0) / time, cause: "formula" },
          { value: v / time, cause: "misread" },
          { value: -accel || accel + 1, cause: "unit" },
        ],
        solution: `$a=\\dfrac{v-v_0}{t}=\\dfrac{${v}-${v0}}{${time}}=${accel}$ m/s²。负号表示与正方向相反。`,
        params: { v0, v, time },
      });
    },
  },
  {
    id: "phys.vt",
    kpId: "phys.vt",
    sectionId: "phys-2-1",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const v0 = intBetween(rng, 0, 10);
      const a = intBetween(rng, 1, 5);
      const t = intBetween(rng, 2, 6);
      const value = v0 + a * t;
      return calc(this, rng, type, {
        stem: `匀加速直线运动的初速度是 ${v0} m/s，加速度是 ${a} m/s²。${t} s 末的速度是多少 m/s？`,
        value,
        traps: [
          { value: v0 - a * t, cause: "unit" },
          { value: v0 + a, cause: "misread" },
          { value: v0 * a * t || value + 2, cause: "formula" },
        ],
        solution: `$v=v_0+at=${v0}+${a}\\times${t}=${value}$ m/s。`,
        params: { v0, a, t },
      });
    },
  },
  {
    id: "phys.xt",
    kpId: "phys.xt",
    sectionId: "phys-2-2",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 3,
    generate(rng, type) {
      const v0 = intBetween(rng, 0, 8);
      const a = pickOne(rng, [2, 4, 6]);
      const t = intBetween(rng, 2, 5);
      const value = v0 * t + (a * t * t) / 2;
      return calc(this, rng, type, {
        stem: `物体以 ${v0} m/s 的初速度、${a} m/s² 的加速度沿直线匀加速运动。${t} s 内的位移是多少米？`,
        value,
        traps: [
          { value: v0 * t + a * t * t, cause: "formula" },
          { value: v0 * t, cause: "misread" },
          { value: (a * t * t) / 2, cause: "misread" },
        ],
        solution: `$x=v_0t+\\dfrac{1}{2}at^2=${v0}\\times${t}+\\dfrac{1}{2}\\times${a}\\times${t}^2=${value}$ m。`,
        params: { v0, a, t },
      });
    },
  },
  {
    id: "phys.fall",
    kpId: "phys.fall",
    sectionId: "phys-2-3",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const t = intBetween(rng, 1, 5);
      const ask = pickOne(rng, ["height", "speed"] as const);
      const value = ask === "height" ? (G * t * t) / 2 : G * t;
      return calc(this, rng, type, {
        stem: `物体由静止自由下落，取 $g=${G}\\ \\mathrm{m/s^2}$，不计空气阻力。下落 ${t} s 时，${ask === "height" ? "下落高度" : "速度大小"}是多少${ask === "height" ? "米" : " m/s"}？`,
        value,
        traps:
          ask === "height"
            ? [
                { value: G * t * t, cause: "formula" },
                { value: (G * t) / 2, cause: "formula" },
                { value: G * t, cause: "concept" },
              ]
            : [
                { value: (G * t * t) / 2, cause: "formula" },
                { value: G, cause: "misread" },
                { value: t, cause: "concept" },
              ],
        solution:
          ask === "height"
            ? `$h=\\dfrac{1}{2}gt^2=\\dfrac{1}{2}\\times${G}\\times${t}^2=${value}$ m。`
            : `$v=gt=${G}\\times${t}=${value}$ m/s。`,
        params: { t, ask },
      });
    },
  },
  {
    id: "phys.graph",
    kpId: "phys.graph",
    sectionId: "phys-2-4",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const time = pickOne(rng, [2, 4, 6]);
      const speed = time * pickOne(rng, [1, 2, 3]);
      const ask = pickOne(rng, ["area", "slope"] as const);
      const value = ask === "area" ? (time * speed) / 2 : speed / time;
      return calc(this, rng, type, {
        stem: `v-t 图像是一条过原点的直线：t=${time} s 时 v=${speed} m/s。${ask === "area" ? "这段位移" : "加速度"}是多少${ask === "area" ? "米" : " m/s²"}？`,
        value,
        traps:
          ask === "area"
            ? [
                { value: time * speed, cause: "formula" },
                { value: speed / time, cause: "concept" },
                { value: time + speed, cause: "calculation" },
              ]
            : [
                { value: (time * speed) / 2, cause: "concept" },
                { value: speed, cause: "misread" },
                { value: time / speed, cause: "formula" },
              ],
        solution:
          ask === "area"
            ? `直线与时间轴围成三角形，面积 $x=\\dfrac{1}{2}\\times${time}\\times${speed}=${value}$ m。`
            : `斜率就是加速度，$a=\\dfrac{${speed}}{${time}}=${value}$ m/s²。`,
        params: { time, speed, ask },
      });
    },
  },
  {
    id: "phys.gravity",
    kpId: "phys.grav",
    sectionId: "phys-3-1",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 1,
    generate(rng, type) {
      const mass = intBetween(rng, 1, 8);
      const value = mass * G;
      return calc(this, rng, type, {
        stem: `取 $g=${G}\\ \\mathrm{m/s^2}$。质量 ${mass} kg 的书包受到的重力是多少牛？`,
        value,
        traps: [
          { value: mass, cause: "formula" },
          { value: G, cause: "misread" },
          { value: mass * G * G, cause: "calculation" },
        ],
        solution: `$G=mg=${mass}\\times${G}=${value}$ N。`,
        params: { mass },
      });
    },
  },
  {
    id: "phys.hooke",
    kpId: "phys.grav",
    sectionId: "phys-3-1",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const k = pickOne(rng, [100, 150, 200, 250]);
      const xCm = pickOne(rng, [2, 4, 6, 8]);
      const value = (k * xCm) / 100;
      return calc(this, rng, type, {
        stem: `弹簧劲度系数 ${k} N/m，在弹性限度内被拉长 ${xCm} cm。弹力是多少牛？`,
        value,
        traps: [
          { value: k * xCm, cause: "unit" },
          { value: k / xCm, cause: "formula" },
          { value: xCm, cause: "concept" },
        ],
        solution: `先把伸长量化成米：$${xCm}\\ \\mathrm{cm}=${xCm / 100}\\ \\mathrm{m}$。$F=kx=${k}\\times${xCm / 100}=${value}$ N。`,
        params: { k, xCm },
      });
    },
  },
  {
    id: "phys.friction",
    kpId: "phys.fric",
    sectionId: "phys-3-2",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const [muNum, muDen] = pickOne(rng, [
        [1, 5],
        [1, 4],
        [1, 2],
        [2, 5],
      ] as const);
      const mass = muDen * intBetween(rng, 1, 3);
      const value = ((muNum / muDen) * mass * G);
      return calc(this, rng, type, {
        stem: `取 $g=${G}\\ \\mathrm{m/s^2}$。质量 ${mass} kg 的木块在水平地面上滑动，动摩擦因数是 $\\dfrac{${muNum}}{${muDen}}$。滑动摩擦力是多少牛？`,
        value,
        traps: [
          { value: (muNum / muDen) * mass, cause: "formula" },
          { value: mass * G, cause: "misread" },
          { value: (muNum / muDen) * G, cause: "misread" },
        ],
        solution: `水平面上压力等于重力。$f=\\mu mg=\\dfrac{${muNum}}{${muDen}}\\times${mass}\\times${G}=${value}$ N。`,
        params: { muNum, muDen, mass },
      });
    },
  },
  {
    id: "phys.newton3",
    kpId: "phys.n3",
    sectionId: "phys-3-3",
    subject: "physics",
    types: ["choice"],
    difficulty: 2,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const truth = pickOne(rng, [
        "作用力和反作用力大小相等、方向相反",
        "作用力和反作用力同时产生、同时消失",
        "作用力和反作用力是同一种性质的力",
      ]);
      const falses = [
        "作用力和反作用力作用在同一个物体上",
        "作用力和反作用力等大反向，所以互相抵消",
        "质量大的物体施加的作用力更大",
      ];
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "physics",
        difficulty: 2,
        stem: "关于作用力和反作用力，下列说法正确的是",
        correct: truth,
        traps: falses.map((text) => ({ text, cause: "concept" as const })),
        solution: "作用力和反作用力作用在两个物体上，所以不能抵消；它们等大、反向、同时、同性质。",
        params: { truth },
      });
    },
  },
  {
    id: "phys.compose",
    kpId: "phys.comp",
    sectionId: "phys-3-4",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const [a, b, c] = triple(rng);
      return calc(this, rng, type, {
        stem: `两个力互相垂直，大小分别是 ${a} N 和 ${b} N。它们的合力大小是多少牛？`,
        value: c,
        traps: [
          { value: a + b, cause: "formula" },
          { value: Math.abs(a - b), cause: "formula" },
          { value: a * b, cause: "calculation" },
        ],
        solution: `垂直的两个力用勾股定理，$F=\\sqrt{${a}^2+${b}^2}=${c}$ N。`,
        params: { a, b },
      });
    },
  },
  {
    id: "phys.balance",
    kpId: "phys.bal",
    sectionId: "phys-3-5",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const right = intBetween(rng, 8, 20);
      const left = intBetween(rng, 1, right - 1);
      const value = right - left;
      return calc(this, rng, type, {
        stem: `水平面上一个物体受三个共点力处于静止。已知向右 ${right} N、向左 ${left} N，第三个力的大小是多少牛？`,
        value,
        traps: [
          { value: right + left, cause: "formula" },
          { value: right, cause: "misread" },
          { value: left, cause: "misread" },
        ],
        solution: `静止时合力为 0。向右比向左大 ${value} N，第三个力大小就是 ${value} N，方向向左。`,
        params: { left, right },
      });
    },
  },
  {
    id: "phys.newton1",
    kpId: "phys.n1",
    sectionId: "phys-4-1",
    subject: "physics",
    types: ["choice"],
    difficulty: 1,
    generate(rng, type) {
      if (type !== "choice") throw new Error(type);
      const truth = pickOne(rng, ["质量越大，惯性越大", "不受外力时，物体保持静止或匀速直线运动"]);
      const falses = ["速度越大，惯性越大", "惯性是一种力", "只有静止物体才有惯性"];
      return choiceItem({
        rng,
        templateId: this.id,
        kpId: this.kpId,
        sectionId: this.sectionId,
        subject: "physics",
        difficulty: 1,
        stem: "关于惯性和牛顿第一定律，下列说法正确的是",
        correct: truth,
        traps: falses.map((text) => ({ text, cause: "concept" as const })),
        solution: "惯性由质量决定，与速度无关，也不是力。不受力或合力为零时，运动状态不变。",
        params: { truth },
      });
    },
  },
  {
    id: "phys.newton2",
    kpId: "phys.n2",
    sectionId: "phys-4-2",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 2,
    generate(rng, type) {
      const mass = pickOne(rng, [2, 3, 4, 5]);
      const accel = intBetween(rng, 1, 6);
      const force = mass * accel;
      return calc(this, rng, type, {
        stem: `质量 ${mass} kg 的物体受到的合力是 ${force} N。加速度大小是多少 m/s²？`,
        value: accel,
        traps: [
          { value: force * mass, cause: "formula" },
          { value: force, cause: "misread" },
          { value: accel * G, cause: "concept" },
        ],
        solution: `$a=\\dfrac{F}{m}=\\dfrac{${force}}{${mass}}=${accel}$ m/s²。`,
        params: { force, mass },
      });
    },
  },
  {
    id: "phys.apply",
    kpId: "phys.apply",
    sectionId: "phys-4-3",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 3,
    generate(rng, type) {
      const mass = pickOne(rng, [2, 4, 5]);
      const accel = intBetween(rng, 1, 4);
      const friction = pickOne(rng, [2, 4, 6]);
      const force = mass * accel + friction;
      return calc(this, rng, type, {
        stem: `水平地面上，质量 ${mass} kg 的箱子受到向前的拉力 ${force} N、向后的摩擦力 ${friction} N。加速度大小是多少 m/s²？`,
        value: accel,
        traps: [
          { value: (force + friction) / mass, cause: "unit" },
          { value: force / mass, cause: "misread" },
          { value: (force - friction) * mass, cause: "formula" },
        ],
        solution: `合力 $F-f=${force}-${friction}=${force - friction}$ N。$a=\\dfrac{${force - friction}}{${mass}}=${accel}$ m/s²。`,
        params: { force, friction, mass },
      });
    },
  },
  {
    id: "phys.apparent",
    kpId: "phys.over",
    sectionId: "phys-4-4",
    subject: "physics",
    types: ["choice", "numeric"],
    difficulty: 3,
    generate(rng, type) {
      const mass = pickOne(rng, [2, 4, 5, 10]);
      const accel = intBetween(rng, 1, 4);
      const dir = pickOne(rng, ["up", "down"] as const);
      const value = dir === "up" ? mass * (G + accel) : mass * (G - accel);
      return calc(this, rng, type, {
        stem: `取 $g=${G}\\ \\mathrm{m/s^2}$。质量 ${mass} kg 的人站在电梯里，电梯以 ${accel} m/s² 的加速度${dir === "up" ? "加速上升" : "加速下降"}。人对地板的压力是多少牛？`,
        value,
        traps: [
          { value: dir === "up" ? mass * (G - accel) : mass * (G + accel), cause: "unit" },
          { value: mass * G, cause: "concept" },
          { value: mass * accel, cause: "formula" },
        ],
        solution:
          dir === "up"
            ? `加速上升时超重，$N=m(g+a)=${mass}\\times(${G}+${accel})=${value}$ N。`
            : `加速下降时失重，$N=m(g-a)=${mass}\\times(${G}-${accel})=${value}$ N。`,
        params: { mass, accel, dir },
      });
    },
  },
];
