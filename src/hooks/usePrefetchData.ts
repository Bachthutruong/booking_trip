import { useQuery, useQueryClient } from '@tanstack/react-query';

export function usePrefetchData<T>(key: string, fetchFn: () => Promise<T>) {
  const queryClient = useQueryClient();

  // Prefetch data
  const prefetch = async () => {
    await queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: fetchFn,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get data
  const { data, isLoading, error } = useQuery({
    queryKey: [key],
    queryFn: fetchFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data,
    isLoading,
    error,
    prefetch,
  };
} 