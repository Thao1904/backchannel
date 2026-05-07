export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function frequencyWeight(
  frequency: "rarely" | "sometimes" | "everyday" | "constantly",
) {
  switch (frequency) {
    case "rarely":
      return 1;
    case "sometimes":
      return 2;
    case "everyday":
      return 4;
    case "constantly":
      return 5;
    default:
      return 1;
  }
}

export function sortByMetric<T>(items: T[], metric: (item: T) => number) {
  return [...items].sort((left, right) => metric(right) - metric(left));
}

export function formatList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}
