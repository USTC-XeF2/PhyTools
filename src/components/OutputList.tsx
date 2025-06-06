import { useGlobalContext } from "../utils/context";
import { createOutput } from "../utils/create-data";
import OutputItem from "./OutputItem";

import type { Output } from "../types";

interface OutputListProps {
  setOutputs: (outputs: Output[]) => void;
}

function OutputList({ setOutputs }: OutputListProps) {
  const { outputs } = useGlobalContext();
  return (
    <div className="flex flex-col gap-4 p-4">
      {outputs.map((output, index) => (
        <OutputItem
          key={output.id}
          output={output}
          changeOutput={(newOutput) => {
            setOutputs(outputs.map((o, i) => (i === index ? newOutput : o)));
          }}
          onRemove={() => setOutputs(outputs.filter((_, i) => i !== index))}
        />
      ))}
      <div>
        <button
          type="button"
          onClick={() => setOutputs([...outputs, createOutput()])}
          className="container-btn"
        >
          添加输出
        </button>
      </div>
    </div>
  );
}

export default OutputList;
