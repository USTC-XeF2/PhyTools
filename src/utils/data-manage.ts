import { useCallback, useEffect, useState } from "react";
import { convertLatexToAsciiMath } from "mathlive/ssr";

import {
  createDirectMeasurement,
  createCompositeMeasurement,
  createOutput,
} from "./create-data";

import type { Measurement, Output } from "../types";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? { ...initialValue, ...JSON.parse(item) } : initialValue;
    } catch (e) {
      console.error(e);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(e);
      }
    },
    [key],
  );

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

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
