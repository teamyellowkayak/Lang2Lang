// @/lib/languages.ts

import { useQuery, type UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import type { Language } from '@shared/schema';
import { callApiWithAuth } from '@/utils/auth'; 
import { useAuth } from '@/lib/authContext';

type FetchAllLanguagesOptions = Omit<
  UseQueryOptions<Language[], Error, Language[], ['/api/languages']>,
  'queryKey' | 'queryFn'
>;

export const _useFetchAllLanguages = (
  options?: FetchAllLanguagesOptions
): UseQueryResult<Language[], Error> => {
  const { isAuthenticated } = useAuth();
  return useQuery<Language[], Error, Language[], ['/api/languages']>({ 
    queryKey: ['/api/languages'],
    queryFn: async () => {
      // Use callApiWithAuth to ensure authentication header is included
      const response = await callApiWithAuth(`/api/languages`, {
        method: 'GET' // Specify method if not default GET
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch languages: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('API returned non-array data for languages:', data);
        throw new Error('Invalid data format received from API. Expected an array.');
      }

      return data as Language[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: isAuthenticated && (options?.enabled ?? true),
    ...options,
  });
};