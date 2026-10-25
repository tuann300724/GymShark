export function serializeJsonText(value: unknown): string | null {
  if (value === undefined || value === null) return null;

  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError('Value cannot be serialized as JSON.');
  }
  return serialized;
}

export function parseJsonText<T>(value: string | null | undefined): T | null {
  if (value === undefined || value === null) return null;
  return JSON.parse(value) as T;
}
