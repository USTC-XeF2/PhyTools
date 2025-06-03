import { useMemo, useState } from "react";
import { unit } from "mathjs";

import { useGlobalContext } from "../utils/context";
import { getMinDigits, mean, uncertainty } from "../utils/math-core";

import type { Output, UTypes } from "../types";

interface OutputItemProps {
  output: Output;
  changeOutput: (output: Output) => void;
  onRemove: () => void;
}

const getExp = (v: number) =>
  v === 0 ? 0 : Math.floor(Math.log10(Math.abs(v)));

function formatUncertainty(mean: number, uncertainty: number, n: number) {
  const meanExp = getExp(mean);
  const uExp = getExp(uncertainty);
  if (meanExp <= uExp) return mean.toPrecision(n);

  const coeffExp = n - uExp - 1;
  let meanPart,
    exponentPart = "";
  if (meanExp >= 3 || meanExp <= -3) {
    meanPart = (mean / 10 ** meanExp).toFixed(meanExp + coeffExp);
    exponentPart = `×10<sup>${meanExp}</sup>`;
  } else {
    meanPart = mean.toFixed(Math.max(coeffExp, 0));
  }
  const uMain = Math.ceil(uncertainty * 10 ** coeffExp);
  return `${meanPart}(${uMain})${exponentPart}`;
}

const displayUTypeList = [
  { type: "typeA", label: "A类" },
  { type: "typeB", label: "B类" },
];

const precisionList = [
  [4, 1, 6],
  [3, 1, 4],
  [2, 1, 3],
  [3, 1, 4],
];

function OutputItem({ output, changeOutput, onRemove }: OutputItemProps) {
  const { settings, measurements } = useGlobalContext();
  const measurement =
    measurements.find((m) => m.name.expr && m.name.expr === output.name) ||
    null;
  const [precisions, setPrecisions] = useState(precisionList.map((l) => l[0]));
  const [displayUTypes, setDisplayUTypes] = useState<UTypes>({
    typeA: true,
    typeB: true,
  });

  const constants = useMemo(
    () => ({
      g: unit(settings.gravity, "m/s^2"),
    }),
    [settings],
  );

  const calcRes = useMemo(() => {
    if (!measurement) return null;
    try {
      return {
        meanValue: mean(measurement, measurements, constants),
        uncValue: uncertainty(
          measurement,
          measurements,
          constants,
          displayUTypes,
        ),
      };
    } catch (e) {
      let error = String(e);
      if (error.includes("Units do not match")) {
        error = "表达式单位不一致";
      } else if (error.includes("Maximum call stack size exceeded")) {
        error = "表达式存在循环引用";
      }
      return error;
    }
  }, [measurement, measurements, constants, displayUTypes]);

  const [meanNum, uncNum, unitStr, error] = useMemo(() => {
    if (!calcRes) return [null, null, "", null];
    if (typeof calcRes === "string") return [null, null, "", calcRes];
    const { meanValue, uncValue } = calcRes;
    if (meanValue === null || uncValue === null) return [null, null, "", null];
    try {
      const mainUnit = (
        (output.displayUnit && unit(output.displayUnit)) ||
        meanValue
      ).formatUnits();
      return [
        meanValue.toNumber(mainUnit),
        uncValue.value === 0 ? null : uncValue.toNumber(mainUnit),
        mainUnit.replace(/\s\/\s/g, "/"),
        null,
      ];
    } catch {
      return [null, null, meanValue.formatUnits(), "输出单位指定错误"];
    }
  }, [calcRes, output.displayUnit]);

  const unitStrWithSup = unitStr
    ? " " +
      unitStr.replace(/([a-zA-Z]+)(\^([-\d]+))/g, (_, unit, __, exponent) => {
        return `${unit}<sup>${exponent}</sup>`;
      })
    : "";
  const minDigits = useMemo(
    () =>
      measurement && !error
        ? Math.min(10, getMinDigits(measurement, measurements))
        : 0,
    [measurement, error, measurements],
  );
  const outputValues = [
    {
      label: "均值",
      getValue: (p: number) =>
        meanNum !== null && meanNum.toPrecision(p) + unitStrWithSup,
      autoPrecision: minDigits,
    },
    {
      label: "不确定度",
      getValue: (p: number) =>
        uncNum !== null && uncNum.toPrecision(p) + unitStrWithSup,
      autoPrecision: Math.min(minDigits, 3),
    },
    {
      label: "格式化结果",
      getValue: (p: number) =>
        uncNum !== null &&
        formatUncertainty(meanNum, uncNum, p) + unitStrWithSup,
      autoPrecision: Math.max(
        Math.min(minDigits - getExp(meanNum || 0) + getExp(uncNum || 0), 2),
        1,
      ),
    },
    {
      label: "相对不确定度",
      getValue: (p: number) => {
        if (uncNum === null) return false;
        const relativeU = uncNum / Math.abs(meanNum);
        return relativeU < 1
          ? (relativeU * 100).toPrecision(p) + "%"
          : relativeU.toPrecision(p);
      },
      autoPrecision: Math.min(minDigits, 3),
    },
  ];

  const outputList = error ? (
    <div className="output-item text-red-500">{error}</div>
  ) : (
    outputValues.map(({ label, getValue, autoPrecision }, index) => {
      const value = getValue(
        settings.autoAdjustDigits ? autoPrecision : precisions[index],
      );
      return (
        <div
          key={index}
          className={`output-item p-2 ${index % 2 ? "" : "bg-gray-100"}`}
        >
          <div className="w-24 text-gray-500 text-sm">{label}</div>
          <div
            dangerouslySetInnerHTML={{ __html: value || "-" }}
            className="flex-1"
          />
          {value && !settings.autoAdjustDigits && (
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={precisionList[index][1]}
                max={precisionList[index][2]}
                step={1}
                value={precisions[index]}
                onChange={(e) => {
                  const newPrecisions = [...precisions];
                  newPrecisions[index] = parseInt(e.target.value);
                  setPrecisions(newPrecisions);
                }}
                className="w-14"
                title="显示位数"
              />
              <span className="w-4 text-center text-xs text-gray-500">
                {precisions[index]}
              </span>
            </div>
          )}
        </div>
      );
    })
  );

  return (
    <div className="container-box relative flex flex-col">
      <div className="flex items-center">
        <select
          value={output.name}
          onChange={(e) =>
            changeOutput({ ...output, name: e.target.value, displayUnit: "" })
          }
          className="w-26 h-10 border-r border-gray-300 rounded-tl-lg outline-none px-2 py-1 bg-gray-50"
        >
          <option value="">选择变量</option>
          {measurements.map(
            (m) =>
              m.name.parsedExpr && (
                <option key={m.id} value={m.name.expr}>
                  {m.name.expr}
                </option>
              ),
          )}
        </select>
        {(unitStr || output.displayUnit) && (
          <input
            type="text"
            value={output.displayUnit || ""}
            onChange={(e) =>
              changeOutput({ ...output, displayUnit: e.target.value })
            }
            placeholder={unitStr}
            className="w-24 h-10 border-r border-gray-300 outline-none px-2 py-1 bg-gray-50 text-sm"
            title="输出显示单位"
          />
        )}
        {measurement && (
          <div className="flex items-center ml-auto pr-6 space-x-2 text-gray-500 text-sm">
            {displayUTypeList.map(({ type, label }) => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayUTypes[type as keyof UTypes]}
                  onChange={() =>
                    setDisplayUTypes((prev) => ({
                      ...prev,
                      [type]: !prev[type as keyof UTypes],
                    }))
                  }
                  className="mr-1 cursor-pointer"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
      {measurement && outputList}
      <button
        type="button"
        onClick={onRemove}
        className="del-mark right-0 rounded-tr-md rounded-bl-md px-0.5"
      >
        ×
      </button>
    </div>
  );
}

export default OutputItem;
