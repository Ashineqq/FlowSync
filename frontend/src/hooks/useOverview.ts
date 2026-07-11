import { useQuery } from '@tanstack/react-query';
import { getOverview } from '@/api';

export const overviewKeys = {
  all: ['overview'] as const,
};

export function useOverview() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: getOverview,
  });
}
