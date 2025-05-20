import { createContext, useContext } from "react";

import type { Settings, Measurement, Output } from "../types";

export const defaultSettings: Settings = {
  firstLoad: true,
  gravity: 9.8,
};

export const GlobalContext = createContext<{
  settings: Settings;
  measurements: Measurement[];
  outputs: Output[];
}>({
  settings: defaultSettings,
  measurements: [],
  outputs: [],
});

export const useGlobalContext = () => useContext(GlobalContext);
