import { useEffect, useState } from "react";

import { defaultSettings, GlobalContext } from "./utils/context";
import {
  useLocalStorage,
  parseUrlSearch,
  exportAsUrlSearch,
} from "./utils/data-manage";
import Header from "./components/Header";
import MeasurementList from "./components/MeasurementList";
import OutputList from "./components/OutputList";

import type { Measurement, Output, Settings } from "./types";

const { measurements: initM, outputs: initO } = parseUrlSearch(
  window.location.search,
);

function App() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "phytools_settings",
    defaultSettings,
  );
  const [measurements, setMeasurements] = useState<Measurement[]>(initM);
  const [outputs, setOutputs] = useState<Output[]>(initO);

  useEffect(() => {
    if (settings.firstLoad) {
      setSettings({
        ...settings,
        firstLoad: false,
      });
    }
  }, [settings, setSettings]);

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
    <GlobalContext.Provider value={{ settings, measurements, outputs }}>
      <Header
        getTemplate={() =>
          `${window.location.origin}${window.location.pathname}?${exportAsUrlSearch(measurements, outputs)}`
        }
        setSettings={setSettings}
      />
      <div className="flex max-lg:flex-col h-screen pt-12 lg:divide-x-2 max-lg:divide-y-3 divide-blue-300">
        <div className="lg:basis-2/5 lg:overflow-y-auto">
          <MeasurementList setMeasurements={setMeasurements} />
        </div>
        <div className="lg:basis-3/5 lg:overflow-y-auto">
          <OutputList setOutputs={setOutputs} />
        </div>
      </div>
    </GlobalContext.Provider>
  );
}

export default App;
