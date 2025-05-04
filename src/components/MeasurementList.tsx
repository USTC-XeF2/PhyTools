import { useCallback } from "react";

import {
  createDirectMeasurement,
  createCompositeMeasurement,
} from "../utils/create-data";
import MeasurementItem from "./MeasurementItem";

import type { Measurement } from "../types";

interface MeasurementListProps {
  measurements: Measurement[];
  setMeasurements: (measurements: Measurement[]) => void;
}

function MeasurementList({
  measurements,
  setMeasurements,
}: MeasurementListProps) {
  const isNameExist = useCallback(
    (latex: string) =>
      measurements.filter((m) => m.name.latex === latex).length > 1,
    [measurements],
  );
  const changeMeasurement = useCallback(
    (index: number, measurement: Measurement) =>
      setMeasurements(
        measurements.map((m, i) => (i === index ? measurement : m)),
      ),
    [measurements, setMeasurements],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {measurements.map((mea, idx) => (
        <MeasurementItem
          key={mea.id}
          mIndex={idx}
          measurement={mea}
          isNameExist={isNameExist}
          changeMeasurement={(m) => changeMeasurement(idx, m)}
          deleteMeasurement={() =>
            setMeasurements(measurements.filter((_, i) => i !== idx))
          }
        />
      ))}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() =>
            setMeasurements([...measurements, createDirectMeasurement()])
          }
          className="container-btn"
        >
          添加直接测量量
        </button>
        <button
          type="button"
          onClick={() =>
            setMeasurements([...measurements, createCompositeMeasurement()])
          }
          className="container-btn"
        >
          添加合成测量量
        </button>
      </div>
    </div>
  );
}

export default MeasurementList;
