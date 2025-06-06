import { useEffect, useMemo, useRef, useState } from "react";
import { mean, variance } from "mathjs";
import { EditableMathField } from "react-mathquill";

import { parseLatex, parseUnit, parseUB, isVariable } from "../utils/math-core";

import type {
  Distribution,
  UncertaintyB,
  DirectMeasurement,
  CompositeMeasurement,
  Measurement,
} from "../types";

type ChangeMeasurementFunc = (measurement: Measurement) => void;

interface UncertaintyBInputProps {
  uncertainty: UncertaintyB;
  isValid: boolean;
  onChange: (value: string, distribution: Distribution) => void;
  onDelete: () => void;
}

interface DirectPanelProps {
  measurement: DirectMeasurement;
  changeMeasurement: ChangeMeasurementFunc;
}

interface CompositePanelProps {
  measurement: CompositeMeasurement;
  changeMeasurement: ChangeMeasurementFunc;
}

interface MeasurementItemProps {
  mIndex: number;
  measurement: Measurement;
  isNameExist: (name: string) => boolean;
  changeMeasurement: ChangeMeasurementFunc;
  deleteMeasurement: () => void;
}

const showRing = (normal: unknown) =>
  normal
    ? "focus-within:z-10 focus-within:ring-1 focus-within:ring-blue-400"
    : "z-9 ring-1 ring-red-400";

const distributions = {
  normal: ["正态分布", "输入值÷3"],
  uniform: ["均匀分布", "输入值÷√3"],
  triangular: ["三角分布", "输入值÷√6"],
  none: ["无", "不对输入值进行处理"],
};

const nameUnitMap: Record<string, string> = {
  l: "cm",
  L: "cm",
  t: "s",
  m: "g",
  M: "g",
  F: "N",
  U: "V",
  I: "A",
};

const autoCommands = "alpha beta eta gamma lambda mu phi pi rho theta";

function UncertaintyBInput({
  uncertainty,
  isValid,
  onChange,
  onDelete,
}: UncertaintyBInputProps) {
  const { value, distribution } = uncertainty;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value, distribution);
          setIsOpen(!!e.target.value);
        }}
        onClick={() => setIsOpen(!!value)}
        onKeyDown={(e) => {
          if (e.key === "Backspace" && e.currentTarget.value === "") {
            e.preventDefault();
            onDelete();
          }
        }}
        className={`plain-ipt w-20 ${showRing(isValid)}`}
      />
      <div
        className={`absolute z-50 w-20 mt-1 border border-gray-200 rounded divide-y divide-gray-200 shadow-lg text-gray-500 bg-white
          ${isOpen ? "" : "hidden"}`}
      >
        {Object.entries(distributions).map(([key, val]) => (
          <div
            key={key}
            title={val[1]}
            className={`p-1.5 cursor-pointer text-center text-sm
              ${distribution === key ? "bg-blue-100" : "hover:bg-gray-100"}`}
            onClick={() => {
              onChange(value, key as Distribution);
              setIsOpen(false);
            }}
          >
            {val[0]}
          </div>
        ))}
      </div>
    </div>
  );
}

function DirectPanel({ measurement, changeMeasurement }: DirectPanelProps) {
  const { values, unit, uncertaintyB, minDigits } = measurement;
  const [inputValues, setInputValues] = useState(
    values.length ? values.map(String) : [""],
  );
  const [inputUnit, setInputUnit] = useState(unit);
  const [zeroError, setZeroError] = useState("");

  const { unitValid, showZeroError } = useMemo(() => {
    const u = parseUnit(inputUnit);
    const unitValid = u?.value === null;
    const showZeroError =
      unitValid && u.dimensions.every((v, i) => (i === 1 ? v === 1 : v === 0));
    if (!showZeroError) setZeroError("");
    return { unitValid, showZeroError };
  }, [inputUnit]);

  useEffect(() => {
    if (unitValid && inputUnit !== unit) updateValues(null, inputUnit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitValid, inputUnit, unit, zeroError]);

  useEffect(() => {
    if (!unit) {
      const name = measurement.name.latex.trim()[0];
      if (name in nameUnitMap) setInputUnit(nameUnitMap[name]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurement.name.latex]);

  const uBValid = useMemo(
    () => uncertaintyB.map((u) => !u.value || parseUB(u.value, unit) !== null),
    [uncertaintyB, unit],
  );

  function insertInputValue(index: number, ...values: string[]) {
    const newValues = [
      ...inputValues.slice(0, index),
      ...values,
      ...inputValues.slice(index + 1),
    ];
    if (
      index === inputValues.length - 1 &&
      newValues[newValues.length - 1] !== ""
    ) {
      newValues.push("");
    }
    setInputValues(newValues);
  }

  function updateValues(_?: unknown, newUnit: string = unit) {
    const filteredValues = inputValues.filter(
      (v) => v !== "" && !isNaN(Number(v)),
    );
    const zeroErrorValue = showZeroError ? parseFloat(zeroError) || 0 : 0;
    const newValues = filteredValues.map((v) => Number(v) - zeroErrorValue);
    const newMinDigits = filteredValues.length
      ? Math.min(
          ...filteredValues.map((v) => v.split("e")[0].replace(".", "").length),
        )
      : 0;
    if (
      newUnit ||
      minDigits !== newMinDigits ||
      values.length !== newValues.length ||
      values.some((v, i) => v !== newValues[i])
    )
      changeMeasurement({
        ...measurement,
        values: newValues,
        unit: newUnit,
        minDigits: newMinDigits,
        mean: newValues.length ? mean(newValues) : null,
        u2: newValues.length
          ? (variance(...newValues) as number) / newValues.length
          : null,
      });
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (index === inputValues.length - 1) {
        setInputValues([...inputValues, ""]);
      }
      const parentElement = e.currentTarget.parentElement!;
      setTimeout(
        () => (parentElement.children[index + 1] as HTMLInputElement)?.select(),
        0,
      );
    } else if (e.key === "Backspace") {
      if (e.currentTarget.value === "" && index > 0) {
        e.preventDefault();
        const prevInput = e.currentTarget.parentElement?.children[
          index - 1
        ] as HTMLInputElement;
        if (prevInput) {
          prevInput.select();
        }
        updateValues();
        setInputValues(inputValues.filter((_, i) => i !== index));
      } else if (e.currentTarget.selectionEnd === 0) {
        e.preventDefault();
        e.currentTarget.select();
      }
    }
  }

  const valuelist = inputValues.map((value, index) => (
    <input
      key={index}
      type="text"
      value={value}
      placeholder={index === 0 ? "输入测量值" : ""}
      onChange={(e) => insertInputValue(index, e.target.value)}
      onPaste={(e) => {
        const data = e.clipboardData
          .getData("text")
          .split(/[\s,]+/)
          .filter((v) => v.trim());
        if (data.length > 1) {
          e.preventDefault();
          insertInputValue(index, ...data);
        }
      }}
      onBlur={updateValues}
      onKeyDown={(e) => handleKeyDown(index, e)}
      className={`w-22 h-10 border-r border-b border-gray-300 outline-none px-2 py-1 text-center bg-gray-50 placeholder:text-sm
        ${showRing(!isNaN(Number(value)))}`}
    />
  ));

  return (
    <>
      <div className="flex flex-wrap pr-4">{valuelist}</div>
      <div className="flex justify-between items-center h-10 px-2 py-1 bg-gray-100 text-sm">
        <div className="flex items-center gap-2">
          <label className="text-gray-500">单位</label>
          <input
            type="text"
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value)}
            className={`plain-ipt ${showZeroError ? "w-12" : "w-24"} ${showRing(unitValid)}`}
          />
          {showZeroError && (
            <>
              <label className="text-gray-500">零误差</label>
              <input
                type="text"
                value={zeroError}
                onChange={(e) => setZeroError(e.target.value)}
                onBlur={updateValues}
                placeholder="0"
                className={`plain-ipt w-16 ${showRing(!zeroError || !isNaN(Number(zeroError)))}`}
              />
            </>
          )}
        </div>
        <span className="text-gray-500">
          共 {values.filter((v) => v).length} 项
        </span>
      </div>
      <div className="flex items-center gap-2 h-10 px-2 py-1 text-sm">
        <label className="text-gray-500">B类不确定度</label>
        {uncertaintyB.map((uB, idx) => (
          <UncertaintyBInput
            key={idx}
            uncertainty={uB}
            isValid={uBValid[idx]}
            onChange={(value, distribution) =>
              changeMeasurement({
                ...measurement,
                uncertaintyB: uncertaintyB.map((u, i) =>
                  i === idx ? { value, distribution } : u,
                ),
              })
            }
            onDelete={() =>
              changeMeasurement({
                ...measurement,
                uncertaintyB: uncertaintyB.filter((_, i) => i !== idx),
              })
            }
          />
        ))}
        {uncertaintyB.length < 2 && (
          <button
            type="button"
            onClick={() =>
              changeMeasurement({
                ...measurement,
                uncertaintyB: [
                  ...uncertaintyB,
                  { value: "", distribution: "normal" },
                ],
              })
            }
            className="w-5 h-5 rounded select-none cursor-pointer text-gray-500 bg-gray-100 hover:bg-gray-200"
            title="添加B类不确定度"
          >
            +
          </button>
        )}
      </div>
    </>
  );
}

function CompositePanel({
  measurement,
  changeMeasurement,
}: CompositePanelProps) {
  const [iptFormula, setIptFormula] = useState(measurement.formula);
  const { latex, parsedExpr } = iptFormula;
  return (
    <div
      className={`relative min-h-12 rounded-r-lg
        ${showRing(!latex || parsedExpr)}`}
    >
      <EditableMathField
        latex={latex}
        config={{
          supSubsRequireOperand: true,
          autoCommands,
        }}
        onChange={(mathField) => setIptFormula(parseLatex(mathField.latex()))}
        onBlur={() => {
          if (measurement.formula.latex !== iptFormula.latex)
            changeMeasurement({
              ...measurement,
              formula: iptFormula,
            });
        }}
        className="w-full px-2 py-1"
      />
      {!latex && (
        <div className="absolute flex items-center px-2 inset-0 pointer-events-none text-gray-400">
          输入合成测量量表达式
        </div>
      )}
    </div>
  );
}

function MeasurementItem({
  mIndex,
  measurement,
  isNameExist,
  changeMeasurement,
  deleteMeasurement,
}: MeasurementItemProps) {
  const { latex, parsedExpr } = measurement.name;

  return (
    <div className="container-box relative flex">
      <div className="idx-mark rounded-tl-md rounded-br-md px-1">
        {mIndex + 1}
      </div>
      <div
        className={`rounded-l-lg ${showRing(parsedExpr && !isNameExist(latex))}`}
      >
        <EditableMathField
          latex={latex}
          config={{ autoCommands }}
          onChange={(mathField) => {
            const expr = parseLatex(mathField.latex());
            if (!isVariable(expr.parsedExpr, expr.latex))
              expr.parsedExpr = null;
            changeMeasurement({
              ...measurement,
              name: expr,
            });
          }}
          className="w-16 px-1 py-1 text-center"
        />
      </div>
      <div className="flex flex-col w-full border-l-2 border-blue-200 divide-y divide-gray-300">
        {measurement.type === "direct" ? (
          <DirectPanel
            measurement={measurement}
            changeMeasurement={changeMeasurement}
          />
        ) : (
          <CompositePanel
            measurement={measurement}
            changeMeasurement={changeMeasurement}
          />
        )}
      </div>
      <button
        type="button"
        onClick={deleteMeasurement}
        className="del-mark right-0 rounded-tr-md rounded-bl-md px-0.5"
      >
        ×
      </button>
    </div>
  );
}

export default MeasurementItem;
