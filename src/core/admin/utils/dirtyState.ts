import { normalizeForComparison } from './normalize';

export function serializeDirtyState<T>(value: T) {
  return JSON.stringify(normalizeForComparison(value));
}

export function hasDirtyState<T>(current: T, initialSerialized: string) {
  return serializeDirtyState(current) !== initialSerialized;
}
