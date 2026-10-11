import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getGetMeQueryKey, type User } from '@workspace/api-client-react';
import { useAuthStore } from '@/store/auth';
import { MerchantApiError } from '@/lib/merchant-api';
import '@/styles/merchant-workspace.css';

export function WorkspaceAccess({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const client = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const accessError =
    error instanceof MerchantApiError && [401, 403].includes(error.status);
  const demoLogin = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}api/auth/demo-login`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok)
        throw new Error(
          'The sample workspace could not open. Please try again.',
        );
      return response.json() as Promise<User>;
    },
    onSuccess: (user) => {
      client.removeQueries({ queryKey: ['merchant'] });
      client.setQueryData(getGetMeQueryKey(), user);
      setUser(user);
    },
  });
  return (
    <div className="em-merchant-access">
      <p className="em-merchant-eyebrow">Shopkeeper workspace</p>
      <h1>
        {accessError
          ? 'Your catalogue starts here.'
          : 'The workspace couldn’t load.'}
      </h1>
      <p>
        {accessError
          ? 'Add a product, review the details and try publishing it into a sample catalogue.'
          : 'Your saved demo drafts have not been replaced. Please try loading the workspace again.'}
      </p>
      {accessError && import.meta.env.DEV ? (
        <>
          <button
            type="button"
            className="em-merchant-button"
            disabled={demoLogin.isPending}
            onClick={() => demoLogin.mutate()}
          >
            {demoLogin.isPending
              ? 'Opening sample workspace…'
              : 'Enter sample workspace'}
          </button>
          <p className="em-merchant-small">
            This local demo uses a fictional shopkeeper account. Use sample data
            only. Catalogue changes are saved on this computer.
          </p>
        </>
      ) : accessError ? (
        <Link className="em-merchant-button" href="/login">
          Merchant sign in
        </Link>
      ) : (
        <button type="button" className="em-merchant-button" onClick={retry}>
          Try again
        </button>
      )}
      {demoLogin.isError && <p role="alert">{demoLogin.error.message}</p>}
    </div>
  );
}
