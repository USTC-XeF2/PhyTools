import { parseAM } from "./math-core";

import type { DirectMeasurement, CompositeMeasurement, Output } from "../types";

const geneId = () => Math.floor(Math.random() * 16 ** 8).toString(16);

export const createDirectMeasurement = (
  amName: string = "",
  unit: string = "",
  ...uB: string[]
): DirectMeasurement => ({
  id: geneId(),
  type: "direct",
  name: parseAM(amName),
  values: [],
  unit,
  uncertaintyB: uB.map((u) => ({
    value: u,
    distribution: "normal",
  })),
  minDigits: 0,
  mean: null,
  u2: null,
});

export const createCompositeMeasurement = (
  amName: string = "",
  formula: string = "",
): CompositeMeasurement => ({
  id: geneId(),
  type: "composite",
  name: parseAM(amName),
  formula: parseAM(formula),
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
