import { convertAsciiMathToLatex } from "mathlive/ssr";

import { convertAsciiMathToExpr, parseExpr } from "./math-core";

import type { DirectMeasurement, CompositeMeasurement, Output } from "../types";

const geneId = () => Math.floor(Math.random() * 16 ** 8).toString(16);

export const createDirectMeasurement = (
  name: string = "",
  unit: string = "",
  ...uB: string[]
): DirectMeasurement => ({
  id: geneId(),
  type: "direct",
  name,
  values: [],
  unit,
  uncertaintyB: uB.concat(Array(2 - uB.length).fill("")).map((u) => ({
    value: u,
    distribution: "normal",
  })),
  mean: null,
  u2: null,
});

export const createCompositeMeasurement = (
  name: string = "",
  expr: string = "",
): CompositeMeasurement => ({
  id: geneId(),
  type: "composite",
  name,
  latex: expr ? convertAsciiMathToLatex(expr) : "",
  expr: convertAsciiMathToExpr(expr),
  parsedExpr: expr ? parseExpr(convertAsciiMathToExpr(expr)) : null,
});

export const createOutput = (
  name: string = "",
  displayUnit: string | null = null,
): Output => ({
  id: geneId(),
  type: "uvalue",
  name,
  displayUnit,
});
