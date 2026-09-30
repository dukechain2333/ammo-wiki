"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { UnitSystem } from "@/lib/units";

const KEY = "ammo-wiki:units";

const UnitsContext = createContext<{ units: UnitSystem; setUnits: (u: UnitSystem) => void }>({
  units: "imperial",
  setUnits: () => {},
});

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setState] = useState<UnitSystem>("imperial");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved choice only exists in the browser
      if (saved === "metric" || saved === "imperial") setState(saved);
    } catch {
      // Storage blocked: stay on the default.
    }
  }, []);
  const setUnits = useCallback((u: UnitSystem) => {
    setState(u);
    try {
      localStorage.setItem(KEY, u);
    } catch {
      // Not remembered, still applied.
    }
  }, []);
  return <UnitsContext.Provider value={{ units, setUnits }}>{children}</UnitsContext.Provider>;
}

export const useUnits = () => useContext(UnitsContext);

export function UnitsToggle() {
  const { units, setUnits } = useUnits();
  return (
    <div className="seg" role="group" aria-label="Units">
      <button type="button" aria-pressed={units === "imperial"} onClick={() => setUnits("imperial")}>
        Imperial
      </button>
      <button type="button" aria-pressed={units === "metric"} onClick={() => setUnits("metric")}>
        Metric
      </button>
    </div>
  );
}
