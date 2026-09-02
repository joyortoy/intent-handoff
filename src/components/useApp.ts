import { useEffect, useState } from "react";
import { getSnapshot, subscribe } from "../core/store";
import type { AppSnapshot } from "../core/types";

export function useApp(): AppSnapshot {
  const [snap, setSnap] = useState(getSnapshot);
  useEffect(() => {
    setSnap(getSnapshot());
    return subscribe(() => setSnap(getSnapshot()));
  }, []);
  return snap;
}

export function isDebug(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "true";
}
