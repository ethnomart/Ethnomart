import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';
import { onboardingRequest, tokenFromFragment } from '@/lib/onboarding-api';
import '@/styles/pilot-onboarding.css';
interface InvitationPreview {
  shopName: string;
  ownerName: string;
  email: string;
  cityName?: string;
  expiresAt: string;
}
export default function MerchantInvitationPage() {
  const [token] = useState(tokenFromFragment),
    [preview, setPreview] = useState<InvitationPreview | null>(null),
    [loading, setLoading] = useState(true);
  const [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [accepted, setAccepted] = useState(false);
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setPreview(
        await onboardingRequest('/onboarding/invitations/preview', 'POST', {
          token,
        }),
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The invitation could not open.',
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    document.title = 'Merchant invitation | EthnoMart';
    let live = true;
    if (!token) {
      setError('Open the invitation link provided by the local manager.');
      setLoading(false);
      return;
    }
    onboardingRequest<InvitationPreview>(
      '/onboarding/invitations/preview',
      'POST',
      { token },
    )
      .then((value) => {
        if (live) setPreview(value);
      })
      .catch((failure) => {
        if (live) setError(failure.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token]);
  const accept = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password.length < 12 || password !== confirmation) {
      setError('Use at least 12 characters and enter the same password twice.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onboardingRequest('/onboarding/invitations/accept', 'POST', {
        token,
        password,
        passwordConfirmation: confirmation,
      });
      setPassword('');
      setConfirmation('');
      setAccepted(true);
      window.history.replaceState(null, '', window.location.pathname);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The invitation could not be accepted.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="em-pilot-page em-pilot-invitation-page">
      <div className="em-pilot-demo">
        Local trial · Sample account · This link can be used once
      </div>
      <section className="em-pilot-invitation-panel">
        <p className="em-pilot-eyebrow">Your shop’s next step</p>
        {loading ? (
          <p role="status">Checking your invitation…</p>
        ) : accepted ? (
          <>
            <span className="em-pilot-receipt-icon">
              <Check size={30} aria-hidden="true" />
            </span>
            <h1>
              Ready for
              <br />
              your catalogue.
            </h1>
            <p>
              Your sample account and assigned shop have been created. Sign in
              with <strong>{preview?.email}</strong> and the password you just
              chose.
            </p>
            <Link className="em-pilot-button" href="/login">
              Merchant sign in <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </>
        ) : preview ? (
          <>
            <h1>{preview.shopName}</h1>
            <p>
              {preview.cityName} · Invited sample operator: {preview.ownerName}
            </p>
            <div className="em-pilot-invite-recipient">
              <span>Sample account</span>
              <strong>{preview.email}</strong>
            </div>
            <form
              onSubmit={(event) => {
                void accept(event);
              }}
              noValidate
            >
              <fieldset disabled={busy}>
                <div className="em-pilot-field">
                  <label htmlFor="invite-password">Choose a password</label>
                  <input
                    id="invite-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    maxLength={64}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <small>
                    Use at least 12 characters. Keep this sample password
                    separate from real accounts.
                  </small>
                </div>
                <div className="em-pilot-field">
                  <label htmlFor="invite-confirmation">Repeat password</label>
                  <input
                    id="invite-confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    maxLength={64}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </div>
                {error && (
                  <p role="alert" className="em-pilot-error">
                    {error}
                  </p>
                )}
                <button type="submit" className="em-pilot-button">
                  {busy
                    ? 'Opening your workspace…'
                    : 'Accept sample invitation'}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </fieldset>
            </form>
          </>
        ) : (
          <>
            <h1>
              The invitation
              <br />
              couldn’t open.
            </h1>
            <p className="em-pilot-error" role="alert">
              {error}
            </p>
            {token && (
              <button
                className="em-pilot-text-link"
                onClick={() => {
                  void load();
                }}
              >
                Try again
              </button>
            )}
            <Link className="em-pilot-button" href="/for-shops">
              Back to the pilot
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
