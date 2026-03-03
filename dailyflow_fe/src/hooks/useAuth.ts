import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types/api';

export function useAuth() {
  return useQuery<User>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get<User>('/auth/me');
      return res.data;
    },
    staleTime: Infinity,
    retry: false,
  });
}
