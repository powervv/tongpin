import type { SectionStatus, SubjectId } from "@/lib/types";

export type Section = {
  id: string;
  subject: SubjectId;
  chapter: string;
  title: string;
  defaultStatus: SectionStatus;
};

export type KnowledgePoint = {
  id: string;
  sectionId: string;
  subject: SubjectId;
  title: string;
};

function section(
  id: string,
  subject: SubjectId,
  chapter: string,
  title: string,
  defaultStatus: SectionStatus,
): Section {
  return { id, subject, chapter, title, defaultStatus };
}

export const SECTIONS: Section[] = [
  section("math-1-1", "math", "第一章 集合与常用逻辑用语", "1.1 集合的概念", "learned"),
  section("math-1-2", "math", "第一章 集合与常用逻辑用语", "1.2 集合间的基本关系", "learned"),
  section("math-1-3", "math", "第一章 集合与常用逻辑用语", "1.3 集合的基本运算", "learned"),
  section("math-1-4", "math", "第一章 集合与常用逻辑用语", "1.4 充分条件与必要条件", "learned"),
  section("math-1-5", "math", "第一章 集合与常用逻辑用语", "1.5 全称量词与存在量词", "learned"),
  section("math-2-1", "math", "第二章 一元二次函数、方程和不等式", "2.1 等式性质与不等式性质", "learned"),
  section("math-2-2", "math", "第二章 一元二次函数、方程和不等式", "2.2 基本不等式", "learned"),
  section("math-2-3", "math", "第二章 一元二次函数、方程和不等式", "2.3 二次函数与一元二次方程、不等式", "learned"),
  section("math-3-1", "math", "第三章 函数的概念与性质", "3.1 函数的概念及其表示", "learned"),
  section("math-3-2", "math", "第三章 函数的概念与性质", "3.2 函数的基本性质", "learned"),
  section("math-3-3", "math", "第三章 函数的概念与性质", "3.3 幂函数", "learned"),
  section("math-3-4", "math", "第三章 函数的概念与性质", "3.4 函数的应用（一）", "learned"),
  section("math-4-1", "math", "第四章 指数函数与对数函数", "4.1 指数", "learning"),
  section("math-4-2", "math", "第四章 指数函数与对数函数", "4.2 指数函数", "unlearned"),
  section("math-4-3", "math", "第四章 指数函数与对数函数", "4.3 对数", "unlearned"),
  section("math-4-4", "math", "第四章 指数函数与对数函数", "4.4 对数函数", "unlearned"),
  section("math-4-5", "math", "第四章 指数函数与对数函数", "4.5 函数的应用（二）", "unlearned"),
  section("math-5-1", "math", "第五章 三角函数", "5.1 任意角和弧度制", "unlearned"),
  section("math-5-2", "math", "第五章 三角函数", "5.2 三角函数的概念", "unlearned"),
  section("math-5-3", "math", "第五章 三角函数", "5.3 诱导公式", "unlearned"),
  section("math-5-4", "math", "第五章 三角函数", "5.4 三角函数的图象与性质", "unlearned"),
  section("math-5-5", "math", "第五章 三角函数", "5.5 三角恒等变换", "unlearned"),
  section("math-5-6", "math", "第五章 三角函数", "5.6 函数 y=Asin(ωx+φ)", "unlearned"),
  section("math-5-7", "math", "第五章 三角函数", "5.7 三角函数的应用", "unlearned"),

  section("phys-1-1", "physics", "第一章 运动的描述", "1.1 质点、参考系与位移", "learned"),
  section("phys-1-2", "physics", "第一章 运动的描述", "1.2 速度", "learned"),
  section("phys-1-3", "physics", "第一章 运动的描述", "1.3 加速度", "learned"),
  section("phys-2-1", "physics", "第二章 匀变速直线运动的研究", "2.1 速度与时间的关系", "learned"),
  section("phys-2-2", "physics", "第二章 匀变速直线运动的研究", "2.2 位移与时间的关系", "learned"),
  section("phys-2-3", "physics", "第二章 匀变速直线运动的研究", "2.3 自由落体运动", "learned"),
  section("phys-2-4", "physics", "第二章 匀变速直线运动的研究", "2.4 实验：v-t 图像", "learned"),
  section("phys-3-1", "physics", "第三章 相互作用——力", "3.1 重力与弹力", "learning"),
  section("phys-3-2", "physics", "第三章 相互作用——力", "3.2 摩擦力", "learning"),
  section("phys-3-3", "physics", "第三章 相互作用——力", "3.3 牛顿第三定律", "unlearned"),
  section("phys-3-4", "physics", "第三章 相互作用——力", "3.4 力的合成和分解", "unlearned"),
  section("phys-3-5", "physics", "第三章 相互作用——力", "3.5 共点力的平衡", "unlearned"),
  section("phys-4-1", "physics", "第四章 运动和力的关系", "4.1 牛顿第一定律", "unlearned"),
  section("phys-4-2", "physics", "第四章 运动和力的关系", "4.2 牛顿第二定律", "unlearned"),
  section("phys-4-3", "physics", "第四章 运动和力的关系", "4.3 牛顿运动定律的应用", "unlearned"),
  section("phys-4-4", "physics", "第四章 运动和力的关系", "4.4 超重和失重", "unlearned"),

  section("chem-1-1", "chemistry", "第一章 物质及其变化", "1.1 物质的分类及转化", "learned"),
  section("chem-1-2", "chemistry", "第一章 物质及其变化", "1.2 离子反应", "learned"),
  section("chem-1-3", "chemistry", "第一章 物质及其变化", "1.3 氧化还原反应", "learned"),
  section("chem-2-1", "chemistry", "第二章 海水中的重要元素——钠和氯", "2.1 钠及其化合物", "learning"),
  section("chem-2-2", "chemistry", "第二章 海水中的重要元素——钠和氯", "2.2 氯及其化合物", "learning"),
  section("chem-2-3", "chemistry", "第二章 海水中的重要元素——钠和氯", "2.3 物质的量", "learning"),
  section("chem-3-1", "chemistry", "第三章 铁 金属材料", "3.1 铁及其化合物", "unlearned"),
  section("chem-3-2", "chemistry", "第三章 铁 金属材料", "3.2 金属材料", "unlearned"),

  section("eng-1", "english", "必修第一册", "Unit 1 A new start", "learned"),
  section("eng-2", "english", "必修第一册", "Unit 2 Exploring English", "learned"),
  section("eng-3", "english", "必修第一册", "Unit 3 Family matters", "learned"),
  section("eng-4", "english", "必修第一册", "Unit 4 Friends forever", "learning"),
  section("eng-5", "english", "必修第一册", "Unit 5 Into the wild", "unlearned"),
  section("eng-6", "english", "必修第一册", "Unit 6 At one with nature", "unlearned"),
];

function kp(id: string, sectionId: string, subject: SubjectId, title: string): KnowledgePoint {
  return { id, sectionId, subject, title };
}

export const KNOWLEDGE_POINTS: KnowledgePoint[] = [
  kp("math.set.element", "math-1-1", "math", "集合与元素"),
  kp("math.set.relation", "math-1-2", "math", "子集与相等"),
  kp("math.set.ops", "math-1-3", "math", "交、并、补"),
  kp("math.logic.cond", "math-1-4", "math", "充分条件与必要条件"),
  kp("math.logic.quant", "math-1-5", "math", "全称量词与存在量词"),
  kp("math.ineq.prop", "math-2-1", "math", "不等式的性质"),
  kp("math.ineq.amgm", "math-2-2", "math", "基本不等式"),
  kp("math.ineq.quad", "math-2-3", "math", "一元二次不等式"),
  kp("math.fn.concept", "math-3-1", "math", "函数的概念"),
  kp("math.fn.prop", "math-3-2", "math", "单调性与奇偶性"),
  kp("math.fn.power", "math-3-3", "math", "幂函数"),
  kp("math.fn.apply", "math-3-4", "math", "函数的应用"),
  kp("math.exp.calc", "math-4-1", "math", "指数幂运算"),
  kp("math.exp.fn", "math-4-2", "math", "指数函数"),
  kp("math.log.calc", "math-4-3", "math", "对数运算"),
  kp("math.log.fn", "math-4-4", "math", "对数函数"),
  kp("math.fn.model", "math-4-5", "math", "函数零点与指数模型"),
  kp("math.rad", "math-5-1", "math", "弧度制"),
  kp("math.trig.def", "math-5-2", "math", "三角函数定义"),
  kp("math.trig.ind", "math-5-3", "math", "诱导公式"),
  kp("math.trig.graph", "math-5-4", "math", "三角函数图象与性质"),
  kp("math.trig.id", "math-5-5", "math", "两角和与差"),
  kp("math.trig.wave", "math-5-6", "math", "正弦型函数"),
  kp("math.trig.app", "math-5-7", "math", "三角函数应用"),

  kp("phys.disp", "phys-1-1", "physics", "位移与路程"),
  kp("phys.speed", "phys-1-2", "physics", "速度"),
  kp("phys.accel", "phys-1-3", "physics", "加速度"),
  kp("phys.vt", "phys-2-1", "physics", "速度公式"),
  kp("phys.xt", "phys-2-2", "physics", "位移公式"),
  kp("phys.fall", "phys-2-3", "physics", "自由落体"),
  kp("phys.graph", "phys-2-4", "physics", "v-t 图像"),
  kp("phys.grav", "phys-3-1", "physics", "重力与弹力"),
  kp("phys.fric", "phys-3-2", "physics", "滑动摩擦力"),
  kp("phys.n3", "phys-3-3", "physics", "牛顿第三定律"),
  kp("phys.comp", "phys-3-4", "physics", "力的合成"),
  kp("phys.bal", "phys-3-5", "physics", "共点力平衡"),
  kp("phys.n1", "phys-4-1", "physics", "牛顿第一定律"),
  kp("phys.n2", "phys-4-2", "physics", "牛顿第二定律"),
  kp("phys.apply", "phys-4-3", "physics", "牛顿定律应用"),
  kp("phys.over", "phys-4-4", "physics", "超重与失重"),

  kp("chem.class", "chem-1-1", "chemistry", "物质分类"),
  kp("chem.ion", "chem-1-2", "chemistry", "离子方程式"),
  kp("chem.redox", "chem-1-3", "chemistry", "氧化还原与化合价"),
  kp("chem.na", "chem-2-1", "chemistry", "钠及其化合物"),
  kp("chem.cl", "chem-2-2", "chemistry", "氯及其化合物"),
  kp("chem.mole", "chem-2-3", "chemistry", "物质的量"),
  kp("chem.fe", "chem-3-1", "chemistry", "铁及其化合物"),
  kp("chem.alloy", "chem-3-2", "chemistry", "金属材料"),

  kp("eng.u1.sentence", "eng-1", "english", "基本句型"),
  kp("eng.u1.vocab", "eng-1", "english", "Unit 1 词汇"),
  kp("eng.u1.reading", "eng-1", "english", "Unit 1 阅读"),
  kp("eng.u2.word", "eng-2", "english", "构词法"),
  kp("eng.u2.vocab", "eng-2", "english", "Unit 2 词汇"),
  kp("eng.u2.reading", "eng-2", "english", "Unit 2 阅读"),
  kp("eng.u3.tense", "eng-3", "english", "时态"),
  kp("eng.u3.vocab", "eng-3", "english", "Unit 3 词汇"),
  kp("eng.u3.reading", "eng-3", "english", "Unit 3 阅读"),
  kp("eng.u4.clause", "eng-4", "english", "定语从句（关系代词）"),
  kp("eng.u4.vocab", "eng-4", "english", "Unit 4 词汇"),
  kp("eng.u4.reading", "eng-4", "english", "Unit 4 阅读"),
  kp("eng.u5.clause", "eng-5", "english", "定语从句（关系副词）"),
  kp("eng.u5.vocab", "eng-5", "english", "Unit 5 词汇"),
  kp("eng.u5.reading", "eng-5", "english", "Unit 5 阅读"),
  kp("eng.u6.clause", "eng-6", "english", "介词+关系代词"),
  kp("eng.u6.vocab", "eng-6", "english", "Unit 6 词汇"),
  kp("eng.u6.reading", "eng-6", "english", "Unit 6 阅读"),
];

const sectionMap = new Map(SECTIONS.map((item) => [item.id, item]));
const kpMap = new Map(KNOWLEDGE_POINTS.map((item) => [item.id, item]));

export function getSection(id: string): Section {
  const found = sectionMap.get(id);
  if (!found) throw new Error(`未知章节 ${id}`);
  return found;
}

export function getKnowledgePoint(id: string): KnowledgePoint {
  const found = kpMap.get(id);
  if (!found) throw new Error(`未知知识点 ${id}`);
  return found;
}

export function sectionsFor(subject: SubjectId): Section[] {
  return SECTIONS.filter((item) => item.subject === subject);
}

export function knowledgeFor(subject: SubjectId): KnowledgePoint[] {
  return KNOWLEDGE_POINTS.filter((item) => item.subject === subject);
}

export function defaultProgress(): Record<string, SectionStatus> {
  return Object.fromEntries(SECTIONS.map((item) => [item.id, item.defaultStatus]));
}

export function isTaught(status: SectionStatus | undefined): boolean {
  return status === "learned" || status === "learning";
}

export function frontierText(subject: SubjectId, progress: Record<string, SectionStatus>): string {
  const sections = sectionsFor(subject);
  const learning = sections.filter((item) => progress[item.id] === "learning");
  if (learning.length > 0) return learning.map((item) => item.title).join("、");
  const learned = sections.filter((item) => progress[item.id] === "learned");
  if (learned.length === 0) return "还没有标出已学章节";
  return `已学到 ${learned[learned.length - 1]!.title}`;
}
