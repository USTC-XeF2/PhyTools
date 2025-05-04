import {
  derivative,
  evaluate,
  multiply,
  parse,
  pow,
  sqrt,
  sum,
  unit,
} from "mathjs";
import { convertAsciiMathToLatex, convertLatexToAsciiMath } from "mathlive/ssr";

import type { MathType, Unit } from "mathjs";
import type { Measurement, CompositeMeasurement } from "../types";

const MATH_CONSTANTS = ["pi", "e", "sin", "cos", "ln"];

export const parseExpr = (expr: string) => {
  if (!expr) return null;
  try {
    return parse(expr);
  } catch {
    return null;
  }
};

export const parseAM = (asciiMath: string, latex?: string) => {
  const expr = asciiMath
    .replace(/_\((\w+)\)/g, (_, p) => `_${p}`)
    .replace(/([a-zA-Z])\^([a-zA-Z])/g, (_, a, b) => `${a}^(${b})`);
  return {
    latex: latex || convertAsciiMathToLatex(asciiMath),
    expr,
    parsedExpr: parseExpr(expr),
  };
};

export const parseLatex = (latex: string) =>
  parseAM(convertLatexToAsciiMath(latex), latex);

export const parseUnit = (s: string) => {
  try {
    return unit(s);
  } catch {
    return null;
  }
};

export const parseUB = (value: string, unit: string) => {
  if (!value) return null;
  const parsedValue = parseUnit(value);
  if (parsedValue === null || !parsedValue.value) return null;
  if (parsedValue.units.length) {
    if (!unit) return null;
    try {
      return parsedValue.toNumber(unit);
    } catch {
      return null;
    }
  }
  return parsedValue.value;
};

const changeToUnit = (value: MathType) => unit(value.toString());

// 要处理循环引用的问题
const getDependency = (
  measurement: CompositeMeasurement,
  measurements: Measurement[],
) => {
  const node = measurement.formula.parsedExpr;
  if (!node) throw "未解析的表达式";
  return node
    .filter((node) => node.type === "SymbolNode")
    .reduce((acc, node) => {
      const name = node.toString();
      if (!MATH_CONSTANTS.includes(name)) {
        const meas = measurements.find((m) => m.name.expr === name);
        if (meas && meas !== measurement) {
          acc.push(meas);
        } else {
          throw `未定义的测量量: ${name}`;
        }
      }
      return acc;
    }, [] as Measurement[]);
};

const getMeanValues = (
  dependency: Measurement[],
  measurements: Measurement[],
) => {
  const meanValues: Record<string, Unit> = {};
  for (const meas of dependency) {
    const value = mean(meas, measurements);
    if (value === null) return null;
    meanValues[meas.name.expr] = value;
  }
  return meanValues;
};

export const mean = (measurement: Measurement, measurements: Measurement[]) => {
  if (measurement.type === "direct") {
    return measurement.mean !== null
      ? unit(`${measurement.mean} ${measurement.unit}`)
      : null;
  }
  const dependency = getDependency(measurement, measurements);
  const meanValues = getMeanValues(dependency, measurements);
  if (meanValues === null) return null;
  try {
    return changeToUnit(evaluate(measurement.formula.expr, meanValues));
  } catch {
    throw "表达式单位不一致";
  }
};

const distributionCoefficient = {
  normal: 1 / 3,
  uniform: 1 / Math.sqrt(3),
  triangular: 1 / Math.sqrt(6),
  none: 1,
};

const getU2 = (
  measurement: Measurement,
  measurements: Measurement[],
): Unit | null => {
  if (measurement.type === "direct") {
    if (measurement.u2 === null) return null;
    const sumUB2 = sum(
      measurement.uncertaintyB
        .map(({ value: v, distribution: d }) => {
          const parsedValue = parseUB(v, measurement.unit);
          if (!parsedValue) return 0;
          return parsedValue * distributionCoefficient[d];
        })
        .map((u) => u ** 2),
    );
    return multiply(
      measurement.u2 + sumUB2,
      pow(unit(measurement.unit), 2),
    ) as Unit;
  }
  const dependency = getDependency(measurement, measurements);
  const meanValues = getMeanValues(dependency, measurements);
  if (meanValues === null) return null;
  return sum(
    dependency.map(
      (meas) =>
        multiply(
          getU2(meas, measurements) as Unit, // 由于mean存在，u2i不可能为null
          pow(
            derivative(measurement.formula.expr, meas.name.expr).evaluate(
              meanValues,
            ),
            2,
          ),
        ) as Unit,
    ),
  );
};

export const uncertainty = (
  measurement: Measurement,
  measurements: Measurement[],
) => {
  const u2 = getU2(measurement, measurements);
  return u2 !== null ? changeToUnit(sqrt(u2)) : null;
};
