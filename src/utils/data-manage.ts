import { convertLatexToAsciiMath } from "mathlive/ssr";

import {
  createDirectMeasurement,
  createCompositeMeasurement,
  createOutput,
} from "./create-data";

import type { Measurement, Output } from "../types";

export const parseUrlSearch = (search: string) => {
  const queryParams = new URLSearchParams(search);
  const measurements: Measurement[] = [];
  const outputs: Output[] = [];
  queryParams.forEach((value, key) => {
    switch (key) {
      case "d":
        measurements.push(createDirectMeasurement(...value.split(",")));
        break;
      case "c":
        measurements.push(createCompositeMeasurement(...value.split(",")));
        break;
      case "o": {
        const [type, v, u] = value.split(",");
        if (type === "u") outputs.push(createOutput(v, u || null));
        break;
      }
    }
  });
  return { measurements, outputs };
};

export const exportAsUrlSearch = (
  measurements: Measurement[],
  outputs: Output[],
) => {
  const params = new URLSearchParams();
  measurements.forEach((measurement) => {
    const { type, name } = measurement;
    if (!name.latex) return;
    const amName = convertLatexToAsciiMath(name.latex);
    if (type === "direct")
      params.append(
        "d",
        [
          amName,
          measurement.unit,
          ...measurement.uncertaintyB.map((u) => u.value).filter(Boolean),
        ].join(","),
      );
    else if (measurement.formula)
      params.append(
        "c",
        [amName, convertLatexToAsciiMath(measurement.formula.latex)].join(","),
      );
  });
  outputs.forEach((output) => {
    const { name, displayUnit } = output;
    if (!name) return;
    const amName = convertLatexToAsciiMath(name);
    params.append("o", ["u", amName, displayUnit].filter(Boolean).join(","));
  });
  return params.toString();
};
