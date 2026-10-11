import { useRef, useState } from 'react';
import { platformRequest } from '@/lib/platform-api';
export function SampleResponse({
  kind,
  contentId,
}: {
  kind: 'contact' | 'event_interest' | 'job_application';
  contentId?: number;
}) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [message, setMessage] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [receipt, setReceipt] = useState<{ reference: string } | null>(null),
    key = useRef(crypto.randomUUID());
  return (
    <section className="em-m-form">
      <h2>
        {kind === 'contact'
          ? 'Send a sample message.'
          : kind === 'event_interest'
            ? 'Try expressing interest.'
            : 'Try a sample application.'}
      </h2>
      <p>
        Fictional details only. This saves a sample receipt for the manager; it
        sends no email and{' '}
        {kind === 'event_interest'
          ? 'creates no booking'
          : kind === 'job_application'
            ? 'is not sent to a real employer'
            : 'does not contact an external team'}
        .
      </p>
      {receipt ? (
        <div className="em-m-state" role="status">
          <h3>Sample received · {receipt.reference}</h3>
          <p>
            Saved in the private review workspace.{' '}
            {kind === 'event_interest'
              ? 'No attendance or reservation is confirmed.'
              : kind === 'job_application'
                ? 'No real job application has been made.'
                : 'No email has been sent.'}
          </p>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError('');
            try {
              setReceipt(
                await platformRequest('/responses', 'POST', {
                  kind,
                  ...(contentId ? { contentId } : {}),
                  name,
                  email,
                  message,
                  sampleOnly: confirmed,
                  requestKey: key.current,
                }),
              );
            } catch (f) {
              setError(
                f instanceof Error
                  ? f.message
                  : 'The sample could not be saved.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy}>
            <label className="em-m-field">
              Sample name
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sample neighbour"
                autoComplete="off"
              />
            </label>
            <label className="em-m-field">
              Sample email
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="neighbour@example.invalid"
                autoComplete="off"
              />
              <small>Use an address ending in .invalid</small>
            </label>
            <label className="em-m-field">
              {kind === 'job_application'
                ? 'Sample introduction'
                : 'Sample message'}
              <textarea
                required
                minLength={2}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Fictional details only. Do not include a CV or personal information."
              />
            </label>
            <label className="em-m-checkbox">
              <input
                required
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              These are fictional details for this sample preview.
            </label>
            {error && (
              <p className="em-m-state--error" role="alert">
                {error}
              </p>
            )}
            <button className="em-m-button" type="submit">
              {busy ? 'Saving…' : 'Save sample response'}
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
export function ReportForm({ id }: { id: number }) {
  const [reason, setReason] = useState(''),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(''),
    [error, setError] = useState(''),
    key = useRef(crypto.randomUUID());
  return (
    <details className="em-m-report">
      <summary>Report this sample listing</summary>
      {feedback ? (
        <p role="status">{feedback}</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const receipt = await platformRequest<{ reference: string }>(
                `/content/${id}/reports`,
                'POST',
                { reason, sampleOnly: confirmed, requestKey: key.current },
              );
              setFeedback(
                `Sample report ${receipt.reference} saved for the manager.`,
              );
            } catch (f) {
              setError(
                f instanceof Error ? f.message : 'Report could not be saved.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="em-m-field">
            Reason
            <textarea
              required
              minLength={5}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="em-m-checkbox">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={busy}
            />
            This is a sample report.
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="em-m-button">
            {busy ? 'Saving…' : 'Submit sample report'}
          </button>
        </form>
      )}
    </details>
  );
}
