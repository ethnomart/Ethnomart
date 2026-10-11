import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { type User } from '@workspace/api-client-react';
import {
  onboardingRequest,
  tokenFromFragment,
  usePilotSignIn,
} from '@/lib/onboarding-api';
import '@/styles/pilot-onboarding.css';
export default function ManagerAccessPage() {
  const [token] = useState(tokenFromFragment),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const signIn = usePilotSignIn(),
    [, navigate] = useLocation();
  useEffect(() => {
    document.title = 'Local manager access | EthnoMart';
  }, []);
  const open = async () => {
    setBusy(true);
    setError('');
    try {
      signIn(
        await onboardingRequest<User>('/auth/manager-access', 'POST', {
          token,
        }),
      );
      navigate('/admin/merchant-pilot', { replace: true });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The workspace could not open.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="em-pilot-page em-pilot-invitation-page">
      <div className="em-pilot-demo">Local trial · Trusted manager access</div>
      <section className="em-pilot-invitation-panel">
        <p className="em-pilot-eyebrow">Manage the merchant trial</p>
        <h1>
          A clear place
          <br />
          to review.
        </h1>
        <p>
          Review sample shop requests, create their invitations and manage
          catalogue visibility.
        </p>
        {token ? (
          <button
            className="em-pilot-button"
            disabled={busy}
            onClick={() => {
              void open();
            }}
          >
            {busy ? 'Opening manager workspace…' : 'Open manager workspace'}
          </button>
        ) : (
          <p className="em-pilot-small">
            Open the private one-time link generated for the local manager.
            Public visitors cannot create manager access.
          </p>
        )}
        {error && (
          <p className="em-pilot-error" role="alert">
            {error}
          </p>
        )}
        <Link className="em-pilot-text-link" href="/for-shops">
          Back to the pilot
        </Link>
      </section>
    </div>
  );
}
