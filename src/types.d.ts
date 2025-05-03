import type { MathNode } from "mathjs";

export type Distribution = "normal" | "uniform" | "triangular" | "none";

interface BaseMeasurement {
  id: string;
  type: string;
  name: string;
}

export interface UncertaintyB {
  value: string;
  distribution: Distribution;
}

export interface DirectMeasurement extends BaseMeasurement {
  type: "direct";
  values: number[];
  unit: string;
  uncertaintyB: UncertaintyB[];
  mean: number?;
  u2: number?;
}

export interface CompositeMeasurement extends BaseMeasurement {
  type: "composite";
  latex: string;
  expr: string;
  parsedExpr: MathNode?;
}

export type Measurement = DirectMeasurement | CompositeMeasurement;

export interface Output {
  id: string;
  type: "uvalue";
  name: string;
  displayUnit: string?;
}
