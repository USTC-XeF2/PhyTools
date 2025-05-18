import { useEffect, useMemo, useState } from "react";

import { parseUrlSearch, exportAsUrlSearch } from "./utils/data-manage";
import Header from "./components/Header";
import MeasurementList from "./components/MeasurementList";
import OutputList from "./components/OutputList";

import type { Measurement, Output } from "./types";

function App() {
  const { measurements: initM, outputs: initO } = useMemo(
    () => parseUrlSearch(window.location.search),
    [],
  );
  const [measurements, setMeasurements] = useState<Measurement[]>(initM);
  const [outputs, setOutputs] = useState<Output[]>(initO);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        JSON.stringify(measurements) !== JSON.stringify(initM) ||
        JSON.stringify(outputs) !== JSON.stringify(initO)
      )
        e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  return (
    <>
      <Header
        getTemplate={() =>
          `${window.location.origin}${window.location.pathname}?${exportAsUrlSearch(measurements, outputs)}`
        }
      />
      <div className="flex max-lg:flex-col h-screen pt-12 lg:divide-x-2 max-lg:divide-y-3 divide-blue-300">
        <div className="lg:basis-2/5 lg:overflow-y-auto">
          <MeasurementList
            measurements={measurements}
            setMeasurements={setMeasurements}
          />
        </div>
        <div className="lg:basis-3/5 lg:overflow-y-auto">
          <OutputList
            measurements={measurements}
            outputs={outputs}
            setOutputs={setOutputs}
          />
        </div>
      </div>
    </>
  );
}

export default App;
