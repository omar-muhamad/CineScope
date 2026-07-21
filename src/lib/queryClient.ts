import { QueryClient } from "@tanstack/react-query";

/**
 * Single app-wide query client. Defaults match the app's previous behavior:
 * TMDB catalog data changes slowly, so it's cached for a few minutes and we
 * don't refetch on window focus (the Redux version never refetched on focus).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
