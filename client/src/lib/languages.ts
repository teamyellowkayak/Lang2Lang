// @/lib/languages.ts

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { API_BASE_URL } from '../config'; // Ensure this path is correct if moved
import type { Language } from '@shared/schema';

export const _useFetchAllLanguages = (): UseQueryResult<Language[], Error> => {
  return useQuery<Language[], Error>({
    queryKey: ['/api/languages'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/languages`);
      if (!response.ok) {
        throw new Error('Failed to fetch languages: ' + response.statusText);
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
  });
};