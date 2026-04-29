import { useQuery, UseQueryOptions } from "@tanstack/react-query";

/**
 * Generic safe query wrapper.
 * Fetches raw data, passes it through a mapper, and returns only safe data.
 * Use this for NEW hooks. For existing hooks, add a `select` option instead.
 *
 * @example
 * export function useCoins() {
 *   return useSafeQuery(
 *     { queryKey: ["coins"], queryFn: fetchCoins },
 *     (raw) => raw.map(mapCoin),
 *   );
 * }
 */
export function useSafeQuery<TRaw, TSafe>(
  options: UseQueryOptions<TRaw, Error, TRaw>,
  mapper: (raw: TRaw) => TSafe
) {
  return useQuery<TRaw, Error, TSafe>({
    ...options,
    select: (data) => mapper(data),
  });
}
