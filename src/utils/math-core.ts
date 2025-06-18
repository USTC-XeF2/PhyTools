import {
  derivative,
  mean as meanFn,
  multiply,
  parse,
  pow,
  sqrt,
  sum,
  unit,
  variance,
} from "mathjs";
import {
  convertAsciiMathToLatex,
  convertLatexToAsciiMath,
  convertLatexToMathMl,
} from "mathlive/ssr";

import type { MathNode, MathType, Unit } from "mathjs";
import type { Measurement, CompositeMeasurement, UTypes } from "../types";

type Values = Record<string, Unit | number>;

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
    .replace(/\s*([()])\s*/g, (_, p) => p)
    .replace(/\)(\w)/g, (_, p) => `)*${p}`)
    .replace(/_\((\w+)\)/g, (_, p) => `_${p}`)
    .replace(/([a-zA-Z])\^([a-zA-Z])/g, (_, a, b) => `${a}^(${b})`);
  return {
    latex: latex || convertAsciiMathToLatex(asciiMath),
    expr,
    parsedExpr: parseExpr(expr),
  };
};

export const parseLatex = (latex: string) =>
  parseAM(
    convertLatexToAsciiMath(latex.replace(/\\(\w)/g, "\\ \\$1")).trim(),
    latex,
  );

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
    .filter((node) => {
      let name = node.toString();
      if (name.split("_")[0].length > 1) name = "\\" + name;
      return isVariable(node, name);
    })
    .reduce((acc, node) => {
      const name = node.toString();
      const meas = measurements.find((m) => m.name.expr === name);
      if (meas && meas !== measurement && !acc.includes(meas)) acc.push(meas);
      return acc;
    }, [] as Measurement[]);
};

export const getMinDigits = (
  measurement: Measurement,
  measurements: Measurement[],
): number =>
  measurement.type === "direct"
    ? measurement.minDigits
    : Math.min(
        ...getDependency(measurement, measurements).map((meas) =>
          getMinDigits(meas, measurements),
        ),
      );

const getValues = (
  dependency: Measurement[],
  measurements: Measurement[],
  constants: Values,
) => {
  const meanValues: Values = {};
  for (const meas of dependency) {
    const value = mean(meas, measurements, constants);
    if (value === null) return null;
    meanValues[meas.name.expr] = value.units.length ? value : value.value;
  }
  return { ...constants, ...meanValues };
};

export const mean = (
  measurement: Measurement,
  measurements: Measurement[],
  constants: Values,
) => {
  if (measurement.type === "direct") {
    return measurement.values.length
      ? unit(`${meanFn(measurement.values)} ${measurement.unit}`)
      : null;
  }
  const dependency = getDependency(measurement, measurements);
  const values = getValues(dependency, measurements, constants);
  if (values === null) return null;
  try {
    return changeToUnit(measurement.formula.parsedExpr!.evaluate(values));
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

const derivativeCache: Record<string, MathNode> = {};

const getU2 = (
  measurement: Measurement,
  measurements: Measurement[],
  constants: Values,
  displayUTypes: UTypes,
): Unit | null => {
  if (measurement.type === "direct") {
    let sumU2 = 0;
    if (displayUTypes.typeA) {
      const { values } = measurement;
      if (!values.length) return null;
      sumU2 += (variance(...values) as number) / values.length;
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
  const values = getValues(dependency, measurements, constants);
  if (values === null) return null;
  return sum(
    dependency
      .map((meas) => {
        const node = measurement.formula.parsedExpr!;
        const cacheKey = `${node.toString()}::${meas.name.expr}`;
        if (!derivativeCache[cacheKey])
          derivativeCache[cacheKey] = derivative(node, meas.name.expr);
        return multiply(
          getU2(meas, measurements, constants, displayUTypes) as Unit,
          pow(derivativeCache[cacheKey].evaluate(values), 2),
        ) as Unit;
      })
      .filter((u) => u.value !== 0),
  );
};

export const uncertainty = (
  measurement: Measurement,
  measurements: Measurement[],
  constants: Values,
  displayUTypes: UTypes,
) => {
  const u2 = getU2(measurement, measurements, constants, displayUTypes);
  return u2 !== null ? changeToUnit(sqrt(u2)) : null;
};
