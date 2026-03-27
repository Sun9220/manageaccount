const redactedKeys = new Set(['password']);

export const redactSensitive = (obj: Record<string, unknown>) => {
  const cloned: Record<string, unknown> = { ...obj };
  redactedKeys.forEach((key) => {
    if (key in cloned) cloned[key] = '__UPDATED__';
  });
  return cloned;
};

export const buildDiff = (before: Record<string, unknown>, after: Record<string, unknown>) => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, unknown> = {};
  keys.forEach((key) => {
    const prev = before[key];
    const next = after[key];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      diff[key] = key === 'password' ? 'password updated' : { before: prev, after: next };
    }
  });
  return diff;
};
