import { fmt } from "@/lib/bank/helpers";
import type { Answer, ItemType } from "@/lib/types";

const G = 10;
type Option = { id: string; text: string };

function choiceMatching(params: { options?: Option[] }, text: string): Answer {
  const hits = (params.options ?? []).filter((option) => option.text === text);
  if (hits.length !== 1) throw new Error(`物理选项无法唯一对应「${text}」`);
  return { kind: "choice", id: hits[0]!.id };
}

function answerFor(params: { options?: Option[] }, type: ItemType, value: number): Answer {
  if (type === "choice") return choiceMatching(params, fmt(value));
  return { kind: "numeric", value, tolerance: 1e-6 };
}

const NEWTON3_TRUE = new Set([
  "作用力和反作用力大小相等、方向相反",
  "作用力和反作用力同时产生、同时消失",
  "作用力和反作用力是同一种性质的力",
]);

const NEWTON1_TRUE = new Set(["质量越大，惯性越大", "不受外力时，物体保持静止或匀速直线运动"]);

export function verifyPhysics(id: string, raw: unknown, type: ItemType): Answer {
  const params = raw as Record<string, number | string> & { options?: Option[] };
  switch (id) {
    case "phys.disp": {
      const east = Number(params.east);
      const north = Number(params.north);
      const hyp = Math.sqrt(east * east + north * north);
      const value = params.ask === "displacement" ? hyp : east + north;
      return answerFor(params, type, value);
    }
    case "phys.velocity":
      return answerFor(params, type, Number(params.dx) / Number(params.time));
    case "phys.accel":
      return answerFor(params, type, (Number(params.v) - Number(params.v0)) / Number(params.time));
    case "phys.vt":
      return answerFor(params, type, Number(params.v0) + Number(params.a) * Number(params.t));
    case "phys.xt":
      return answerFor(
        params,
        type,
        Number(params.v0) * Number(params.t) + (Number(params.a) * Number(params.t) ** 2) / 2,
      );
    case "phys.fall":
      return answerFor(
        params,
        type,
        params.ask === "height" ? (G * Number(params.t) ** 2) / 2 : G * Number(params.t),
      );
    case "phys.graph":
      return answerFor(
        params,
        type,
        params.ask === "area"
          ? (Number(params.time) * Number(params.speed)) / 2
          : Number(params.speed) / Number(params.time),
      );
    case "phys.gravity":
      return answerFor(params, type, Number(params.mass) * G);
    case "phys.hooke":
      return answerFor(params, type, (Number(params.k) * Number(params.xCm)) / 100);
    case "phys.friction":
      return answerFor(
        params,
        type,
        (Number(params.muNum) / Number(params.muDen)) * Number(params.mass) * G,
      );
    case "phys.newton3": {
      const hits = (params.options ?? []).filter((option) => NEWTON3_TRUE.has(option.text));
      if (hits.length !== 1) throw new Error("牛顿第三定律正确说法不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    case "phys.compose":
      return answerFor(params, type, Math.sqrt(Number(params.a) ** 2 + Number(params.b) ** 2));
    case "phys.balance":
      return answerFor(params, type, Number(params.right) - Number(params.left));
    case "phys.newton1": {
      const hits = (params.options ?? []).filter((option) => NEWTON1_TRUE.has(option.text));
      if (hits.length !== 1) throw new Error("牛顿第一定律正确说法不唯一");
      return { kind: "choice", id: hits[0]!.id };
    }
    case "phys.newton2":
      return answerFor(params, type, Number(params.force) / Number(params.mass));
    case "phys.apply":
      return answerFor(params, type, (Number(params.force) - Number(params.friction)) / Number(params.mass));
    case "phys.apparent": {
      const mass = Number(params.mass);
      const accel = Number(params.accel);
      return answerFor(params, type, params.dir === "up" ? mass * (G + accel) : mass * (G - accel));
    }
    default:
      throw new Error(`没有物理验算 ${id}`);
  }
}
