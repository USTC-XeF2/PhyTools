import { EditableMathField } from "react-mathquill";

import { parseLatex } from "../utils/math-core";

import type { Expr } from "../types";

const showRing = (normal: boolean) =>
  normal
    ? "focus-within:z-10 focus-within:ring-1 focus-within:ring-blue-400"
    : "z-9 ring-1 ring-red-400";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  normalRing?: boolean;
  className?: string;
}

export function TextInput({
  value,
  normalRing = true,
  className = "",
  ...rest
}: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      className={`${className} ${showRing(normalRing)}`}
      {...rest}
    />
  );
}

interface MathInputProps {
  children?: React.ReactNode;
  latex: string;
  onChange: (expr: Expr) => void;
  onBlur?: () => void;
  normalRing?: boolean;
  fieldClassName?: string;
  className?: string;
}

export function MathInput({
  children,
  latex,
  onChange,
  onBlur,
  normalRing = true,
  className = "",
  fieldClassName = "",
}: MathInputProps) {
  return (
    <div className={`${className} ${showRing(normalRing)}`}>
      <EditableMathField
        latex={latex}
        config={{
          supSubsRequireOperand: true,
          autoCommands: "alpha beta eta gamma lambda mu phi pi rho theta",
        }}
        onChange={(mathField) => onChange(parseLatex(mathField.latex()))}
        onBlur={onBlur}
        className={fieldClassName}
      />
      {children}
    </div>
  );
}
