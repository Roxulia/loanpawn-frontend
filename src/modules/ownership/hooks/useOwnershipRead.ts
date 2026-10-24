import { useEffect, useState } from "react";

type ReadState<T> = { key: string; data: T | null; error: unknown };

/** Only the current resource/filter revision may publish data, errors or completion. */
export function useOwnershipRead<T>(key: string, load: () => Promise<T>, delay = 0) {
  const [state, setState] = useState<ReadState<T> | null>(null);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void load().then(
        (data) => { if (active) setState({ key, data, error: null }); },
        (error: unknown) => { if (active) setState({ key, data: null, error }); },
      );
    }, delay);
    return () => { active = false; window.clearTimeout(timer); };
  }, [key, load, delay]);
  const current = state?.key === key ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: current === null };
}
