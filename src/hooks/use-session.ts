import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAnalytics } from "@/lib/analytics";
import { getProductApi, type SessionUser } from "@/lib/product-api";

export function useProductApi() {
  return getProductApi();
}

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  const api = getProductApi();
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => api.getSession(),
    staleTime: 30_000,
    retry: false,
  });
}

export function useSignIn() {
  const api = getProductApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.signIn(input),
    onSuccess: (user: SessionUser) => {
      queryClient.setQueryData(sessionQueryKey, user);
      getAnalytics().identify(user.id, {
        accountId: user.accountId,
        role: user.role,
        isSampleAccount: user.isSampleAccount,
      });
    },
  });
}

export function useSignOut() {
  const api = getProductApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.signOut(),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.clear();
    },
  });
}

export function can(user: SessionUser | null | undefined, permission: string) {
  return Boolean(user?.permissions.includes(permission));
}
