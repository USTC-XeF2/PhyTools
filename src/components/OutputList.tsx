import { useEffect, useState } from "react";

import { createOutput } from "../utils/create-data";
import OutputItem from "./OutputItem";

import type { Measurement, Output } from "../types";

interface OutputListProps {
  measurements: Measurement[];
}

function OutputList({ measurements }: OutputListProps) {
  const [outputList, setOutputList] = useState<Output[]>([]);

  function initParams() {
    const queryParams = new URLSearchParams(window.location.search);
    const oList: Output[] = [];
    queryParams.forEach((value, key) => {
      if (key === "o") {
        const [type, v, u] = value.split(",");
        if (type === "u") oList.push(createOutput(v, u || null));
      }
    });
    setOutputList(oList);
  }

  useEffect(() => {
    initParams();
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {outputList.map((output, index) => (
        <OutputItem
          key={output.id}
          measurements={measurements}
          output={output}
          changeOutput={(newOutput) => {
            setOutputList(
              outputList.map((o, i) => (i === index ? newOutput : o)),
            );
          }}
          onRemove={() =>
            setOutputList(outputList.filter((_, i) => i !== index))
          }
        />
      ))}
      <div>
        <button
          type="button"
          onClick={() => setOutputList([...outputList, createOutput()])}
          className="container-btn"
        >
          添加输出
        </button>
      </div>
    </div>
  );
}

export default OutputList;
