/** Drops empty-string fields so optional values are not sent as "". */
export function compact<T extends Record<string, string>>(values: T): { [K in keyof T]?: string } {
  const out: { [K in keyof T]?: string } = {};
  for (const key of Object.keys(values) as Array<keyof T>) {
    const v = values[key];
    if (v !== '') out[key] = v;
  }
  return out;
}
