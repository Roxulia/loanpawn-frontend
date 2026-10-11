import type { MutableRefObject } from "react";

export type IdempotencyKeyState = {
  fingerprint: string;
  key: string;
} | null;

const fileIds = new WeakMap<File, number>();
let nextFileId = 1;

export function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function idempotencyKeyForPayload(
  state: MutableRefObject<IdempotencyKeyState>,
  payload: unknown,
) {
  const fingerprint = JSON.stringify(normalizePayload(payload));
  if (state.current?.fingerprint !== fingerprint) {
    state.current = { fingerprint, key: createIdempotencyKey() };
  }
  return state.current.key;
}

export function clearIdempotencyKey(state: MutableRefObject<IdempotencyKeyState>) {
  state.current = null;
}

function normalizePayload(value: unknown): unknown {
  if (value instanceof FormData) {
    return Array.from(value.entries()).map(([key, entry]) => [key, normalizePayload(entry)]);
  }
  if (typeof File !== "undefined" && value instanceof File) {
    let fileId = fileIds.get(value);
    if (fileId === undefined) {
      fileId = nextFileId++;
      fileIds.set(value, fileId);
    }
    return { fileId, name: value.name, size: value.size, type: value.type, lastModified: value.lastModified };
  }
  if (Array.isArray(value)) return value.map(normalizePayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizePayload(entry)]),
    );
  }
  return value;
}
