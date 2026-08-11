export function groupBy<T, K extends PropertyKey>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (groups, item) => {
      const groupKey = key(item);
      (groups[groupKey] ??= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );
}
