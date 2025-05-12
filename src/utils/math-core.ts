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
import {
  convertAsciiMathToLatex,
  convertLatexToAsciiMath,
  convertLatexToMathMl,
} from "mathlive/ssr";

import type { MathNode, MathType, Unit } from "mathjs";
import type { Measurement, CompositeMeasurement, UTypes } from "../types";

const parseExpr = (expr: string) => {
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

export const isVariable = (node: MathNode | null, latex: string) =>
  node?.type === "SymbolNode" &&
  !convertLatexToMathMl(latex)
    .replace("<mo>&#x2061;</mo>", "")
    .includes("<mo>");

const changeToUnit = (value: MathType) => unit(value.toString());

const getDependency = (
  measurement: CompositeMeasurement,
  measurements: Measurement[],
) => {
  const node = measurement.formula.parsedExpr;
  if (!node) throw measurement.formula.latex ? "表达式解析失败" : "表达式为空";
  return node
    .filter((node) => isVariable(node, node.toString()))
    .reduce((acc, node) => {
      const name = node.toString();
      const meas = measurements.find((m) => m.name.expr === name);
      if (meas && meas !== measurement && !acc.includes(meas)) acc.push(meas);
      return acc;
    }, [] as Measurement[]);
};

const getMeanValues = (
  dependency: Measurement[],
  measurements: Measurement[],
) => {
  const meanValues: Record<string, Unit | number> = {};
  for (const meas of dependency) {
    const value = mean(meas, measurements);
    if (value === null) return null;
    meanValues[meas.name.expr] = value.units.length ? value : value.value;
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
  } catch (e) {
    const match = String(e).match(/Undefined symbol\s+(\w+)/);
    if (match) {
      throw `未定义的测量量：${match[1]}`;
    }
    throw e;
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
  displayUTypes: UTypes,
): Unit | null => {
  if (measurement.type === "direct") {
    let sumU2 = 0;
    if (displayUTypes.typeA) {
      if (measurement.u2 === null) return null;
      sumU2 += measurement.u2;
    }
    if (displayUTypes.typeB) {
      sumU2 += sum(
        measurement.uncertaintyB
          .map(({ value: v, distribution: d }) => {
            const parsedValue = parseUB(v, measurement.unit);
            if (!parsedValue) return 0;
            return parsedValue * distributionCoefficient[d];
          })
          .map((u) => u ** 2),
      );
    }
    return multiply(sumU2, pow(unit(measurement.unit), 2)) as Unit;
  }
  const dependency = getDependency(measurement, measurements);
  const meanValues = getMeanValues(dependency, measurements);
  if (meanValues === null) return null;
  return sum(
    dependency.map(
      (meas) =>
        multiply(
          getU2(meas, measurements, displayUTypes) as Unit,
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
  displayUTypes: UTypes,
) => {
  const u2 = getU2(measurement, measurements, displayUTypes);
  return u2 !== null ? changeToUnit(sqrt(u2)) : null;
};
