function normalizePrimitive(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return null;
  }
  return value;
}

export function normalizeForComparison<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForComparison(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, currentValue]) => [key, normalizeForComparison(currentValue)] as const)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

    return Object.fromEntries(entries) as T;
  }

  return normalizePrimitive(value) as T;
}
