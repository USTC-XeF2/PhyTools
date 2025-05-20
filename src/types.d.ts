import type { MathNode } from "mathjs";

export interface Settings {
  firstLoad: boolean;
  gravity: number;
}

interface Expr {
  latex: string;
  expr: string;
  parsedExpr: MathNode?;
}

interface BaseMeasurement {
  id: string;
  type: string;
  name: Expr;
}

export type Distribution = "normal" | "uniform" | "triangular" | "none";

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
  formula: Expr;
}

export type Measurement = DirectMeasurement | CompositeMeasurement;

export interface Output {
  id: string;
  type: "uvalue";
  name: string;
  displayUnit: string?;
}

export interface UTypes {
  typeA: boolean;
  typeB: boolean;
}
