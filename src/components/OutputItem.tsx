import { useMemo, useState } from "react";

import { mean, uncertainty } from "../utils/math-core";

import type { Measurement, Output } from "../types";

interface OutputItemProps {
  measurements: Measurement[];
  output: Output;
  changeOutput: (output: Output) => void;
  onRemove: () => void;
}

function formatUncertainty(mean: number, uncertainty: number, n: number = 2) {
  const meanExp = mean === 0 ? 0 : Math.floor(Math.log10(Math.abs(mean)));
  const uExp = Math.floor(Math.log10(uncertainty));
  if (meanExp < uExp) return mean.toPrecision(n);

  const coeffExp = n - uExp - 1;
  let meanPart,
    exponentPart = "";
  if (meanExp >= 3 || meanExp <= -3) {
    meanPart = (mean / 10 ** meanExp)
      .toFixed(meanExp + coeffExp)
      .replace(/\.?0+$/, "");
    exponentPart = `e${meanExp}`;
  } else {
    meanPart = mean.toFixed(Math.max(coeffExp, 0));
  }
  const uMain = Math.ceil(uncertainty * 10 ** coeffExp);
  return `${meanPart}(${uMain})${exponentPart}`;
}

function OutputItem({
  measurements,
  output,
  changeOutput,
  onRemove,
}: OutputItemProps) {
  const measurement =
    measurements.find((m) => m.name.expr && m.name.expr === output.name) ||
    null;
  const [precisions, setPrecisions] = useState<number[]>([4, 3, 2, 3]);

  const [meanNum, uncNum, unitStr, error] = useMemo(() => {
    if (!measurement) return [null, null, "", null];
    let meanValue, uncValue;
    try {
      meanValue = mean(measurement, measurements);
      uncValue = uncertainty(measurement, measurements);
    } catch (e) {
      let error = String(e);
      if (error.includes("Units do not match")) {
        error = "表达式单位不一致";
      } else if (error.includes("Maximum call stack size exceeded")) {
        error = "表达式存在循环引用";
      }
      return [null, null, "", error];
    }
    if (meanValue === null || uncValue === null) return [null, null, "", null];
    const mainUnit = output.displayUnit || meanValue.formatUnits();
    try {
      return [
        meanValue.toNumber(mainUnit),
        uncValue.value === 0 ? null : uncValue.toNumber(mainUnit),
        mainUnit ? ` ${mainUnit}` : "",
        null,
      ];
    } catch {
      return [null, null, mainUnit, "输出单位指定错误"];
    }
  }, [measurement, measurements, output.displayUnit]);

  const outputValues = [
    {
      label: "均值",
      getValue: (p: number) =>
        meanNum !== null && meanNum.toPrecision(p) + unitStr,
    },
    {
      label: "不确定度",
      getValue: (p: number) =>
        uncNum !== null && uncNum.toPrecision(p) + unitStr,
    },
    {
      label: "格式化结果",
      getValue: (p: number) =>
        uncNum !== null && formatUncertainty(meanNum, uncNum, p) + unitStr,
    },
    {
      label: "相对不确定度",
      getValue: (p: number) =>
        uncNum !== null &&
        ((uncNum / Math.abs(meanNum)) * 100).toPrecision(p) + "%",
    },
  ];

  const outputList = error ? (
    <div className="output-item text-red-500">{error}</div>
  ) : (
    outputValues.map(({ label, getValue }, index) => {
      const value = getValue(precisions[index]);
      return (
        <div key={index} className="output-item">
          <div className="w-28 text-gray-500">{label}</div>
          <div className="flex-1">{value || "-"}</div>
          {value && (
            <input
              type="number"
              min={2}
              max={6}
              value={precisions[index]}
              onChange={(e) => {
                const newPrecisions = [...precisions];
                newPrecisions[index] = e.target.valueAsNumber;
                setPrecisions(newPrecisions);
              }}
              className="w-10 px-1 text-center border border-gray-300 rounded-md outline-none"
            />
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
          className="w-26 h-10 border-r border-gray-300 rounded-tl-lg outline-none px-2 py-1 bg-gray-100"
        >
          <option value="">选择变量</option>
          {measurements.map(
            (m) =>
              m.name.parsedExpr && (
                <option key={m.name.expr} value={m.name.expr}>
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
            placeholder={unitStr.trimStart()}
            className="w-28 h-10 border-r border-gray-300 outline-none px-2 py-1 bg-gray-100"
          />
        )}
      </div>
      {measurement && <div className="flex flex-col">{outputList}</div>}
      <button
        onClick={onRemove}
        className="del-mark right-0 rounded-tr-md rounded-bl-md px-0.5"
      >
        ×
      </button>
    </div>
  );
}

export default OutputItem;
