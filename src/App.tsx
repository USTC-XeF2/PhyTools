import { useEffect, useState } from "react";

import {
  createDirectMeasurement,
  createCompositeMeasurement,
} from "./utils/create-data";
import MeasurementList from "./components/MeasurementList";
import OutputList from "./components/OutputList";

import type { Measurement } from "./types";

function App() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const mList: Measurement[] = [];
    queryParams.forEach((value, key) => {
      if (key === "d") {
        mList.push(createDirectMeasurement(...value.split(",")));
      } else if (key === "c") {
        mList.push(createCompositeMeasurement(...value.split(",")));
      }
    });
    setMeasurements(mList);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        measurements.some(
          (measurement) =>
            measurement.type == "direct" &&
            measurement.name &&
            measurement.values.length > 0,
        )
      )
        e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [measurements]);

  return (
    <>
      <div className="fixed t-0 flex items-center justify-center w-full h-12 z-99 bg-gray-800 text-white">
        <h1 className="text-2xl font-bold">PhyTools</h1>
      </div>
      <div className="flex lg:flex-row flex-col justify-center pt-12 lg:divide-x-2 max-lg:divide-y-3 divide-blue-300">
        <div className="flex-auto basis-2/5 lg:h-[calc(100vh-3rem)] overflow-y-auto">
          <MeasurementList
            measurements={measurements}
            setMeasurements={setMeasurements}
          />
        </div>
        <div className="flex-auto basis-3/5 lg:h-[calc(100vh-3rem)] overflow-y-auto">
          <OutputList measurements={measurements} />
        </div>
      </div>
    </>
  );
}

export default App;
