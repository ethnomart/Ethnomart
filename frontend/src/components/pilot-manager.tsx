import { useId, useState } from 'react';
import { Link } from 'wouter';
import { OnboardingError } from '@/lib/onboarding-api';
import '@/styles/pilot-onboarding.css';

export function ManagerUnavailable({
  error,
  retry,
}: {
  error: Error | null;
  retry: () => void;
}) {
  const access =
    error instanceof OnboardingError && [401, 403].includes(error.status);
  return (
    <section className="em-pilot-manager-unavailable">
      <p className="em-pilot-eyebrow">Manager workspace</p>
      <h1>
        {access ? (
          <>
            A place for
            <br />
            the local manager.
          </>
        ) : (
          <>
            The workspace
            <br />
            couldn’t load.
          </>
        )}
      </h1>
      <p>
        {access
          ? 'Use the private one-time manager link generated for this local trial. Shopkeepers and public visitors cannot approve requests or change moderation.'
          : error?.message || 'Check the workspace address and try again.'}
      </p>
      {!access && (
        <button className="em-pilot-button" onClick={retry}>
          Try again
        </button>
      )}
      <Link className="em-pilot-text-link" href="/for-shops">
        Back to the pilot
      </Link>
    </section>
  );
}
export function ReasonAction({
  label,
  button,
  busy,
  onSubmit,
  onCancel,
}: {
  label: string;
  button: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(''),
    [error, setError] = useState('');
  const id = useId();
  return (
    <form
      className="em-pilot-reason-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (reason.trim().length < 5) {
          setError('Enter a clear reason, at least five characters.');
          return;
        }
        onSubmit(reason.trim());
      }}
      noValidate
    >
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={3}
        maxLength={500}
        value={reason}
        disabled={busy}
        onChange={(event) => {
          setReason(event.target.value);
          setError('');
        }}
        placeholder="Explain the change for the shopkeeper and trial record."
      />
      {error && (
        <p className="em-pilot-field-error" role="alert">
          {error}
        </p>
      )}
      <div className="em-pilot-actions">
        <button className="em-pilot-button" type="submit" disabled={busy}>
          {busy ? 'Saving decision…' : button}
        </button>
        <button
          className="em-pilot-text-link"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
