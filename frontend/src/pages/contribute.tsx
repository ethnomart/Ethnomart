import { useRef, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { PreviewNote, QueryState } from '@/components/platform';
import { platformRequest, useMeta, usePageMeta } from '@/lib/platform-api';
export default function Contribute() {
  const initial = new URLSearchParams(useSearch()).get('kind'),
    [kind, setKind] = useState(
      initial === 'job' || initial === 'notice' ? initial : 'event',
    ),
    [values, setValues] = useState<Record<string, string>>({}),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [receipt, setReceipt] = useState<{ reference: string } | null>(null),
    meta = useMeta(),
    key = useRef(crypto.randomUUID());
  usePageMeta(
    'Contribute',
    'Submit fictional community content to the local manager review queue.',
  );
  const field = (
    name: string,
    label: string,
    multi = false,
    max = 100,
    required = true,
    type = 'text',
  ) => (
    <label className="em-m-field" key={name}>
      {label}
      {multi ? (
        <textarea
          required={required}
          maxLength={max}
          value={values[name] || ''}
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        />
      ) : (
        <input
          required={required}
          maxLength={max}
          type={type}
          value={values[name] || ''}
          placeholder={
            name === 'email' ? 'organiser@example.invalid' : undefined
          }
          onChange={(e) => setValues({ ...values, [name]: e.target.value })}
        />
      )}
    </label>
  );
  const select = (
    name: string,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="em-m-field">
      {label}
      <select
        required
        value={values[name] || ''}
        onChange={(e) => setValues({ ...values, [name]: e.target.value })}
      >
        <option value="">Choose an option</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="em-m-page">
      <PreviewNote />
      <p className="em-m-eyebrow">A story worth sharing.</p>
      <h1>Add to the neighbourhood.</h1>
      <p className="em-m-lead">
        Try submitting a sample event, job or notice. Nothing goes public until
        the current manager reviews it.
      </p>
      <QueryState
        loading={meta.isLoading}
        error={meta.error}
        retry={() => void meta.refetch()}
      />
      {receipt ? (
        <div className="em-m-state" role="status">
          <h2>In the review queue · {receipt.reference}</h2>
          <p>
            Your fictional content is saved privately. No real activity or
            vacancy has been advertised.
          </p>
          <Link className="em-m-button" href="/explore">
            Keep exploring
          </Link>
        </div>
      ) : (
        meta.data &&
        !meta.isError && (
          <section
            className="em-m-form"
            style={{ maxWidth: 850, marginTop: 35 }}
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (busy) return;
                setBusy(true);
                setError('');
                try {
                  const payload: Record<string, unknown> = {
                    kind,
                    title: values.title,
                    summary: values.summary,
                    description: values.description,
                    category:
                      kind === 'notice' ? 'Community notice' : values.category,
                    cityId: Number(values.cityId),
                    communityId: Number(values.communityId),
                    name: values.name,
                    email: values.email,
                    sampleOnly: confirmed,
                    requestKey: key.current,
                  };
                  if (kind === 'event') {
                    for (const f of ['venue', 'organiser', 'accessibility'])
                      payload[f] = values[f];
                    payload.startsAt = new Date(values.startsAt).toISOString();
                    payload.endsAt = new Date(values.endsAt).toISOString();
                  }
                  if (kind === 'job') {
                    for (const f of [
                      'organisation',
                      'employmentType',
                      'requirements',
                    ])
                      payload[f] = values[f];
                    payload.closesAt = new Date(values.closesAt).toISOString();
                  }
                  setReceipt(
                    await platformRequest('/contributions', 'POST', payload),
                  );
                } catch (f) {
                  setError(
                    f instanceof Error
                      ? f.message
                      : 'Content could not be saved.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <fieldset disabled={busy}>
                <label className="em-m-field">
                  What would you like to share?
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="event">Event</option>
                    <option value="job">Job opportunity</option>
                    <option value="notice">Community notice</option>
                  </select>
                </label>
                {field('title', 'Sample title')}
                {field('summary', 'Short summary', true, 240)}
                {field('description', 'Description', true, 3000)}
                <div className="em-m-form-pair">
                  {select(
                    'cityId',
                    'City',
                    meta.data.cities.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    })),
                  )}
                  {select(
                    'communityId',
                    'Community interest',
                    meta.data.communities.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    })),
                  )}
                </div>
                {kind !== 'notice' &&
                  select(
                    'category',
                    'Category',
                    meta.data.categories[kind as 'event' | 'job'].map((c) => ({
                      value: c,
                      label: c,
                    })),
                  )}
                {kind === 'event' && (
                  <>
                    {field('organiser', 'Sample organiser')}
                    {field(
                      'venue',
                      'Sample venue (no real address)',
                      false,
                      200,
                    )}
                    <p className="em-m-small">
                      Enter times in your device’s time zone. They are stored in
                      UTC and displayed in UK time.
                    </p>
                    <div className="em-m-form-pair">
                      {field(
                        'startsAt',
                        'Start time',
                        false,
                        100,
                        true,
                        'datetime-local',
                      )}
                      {field(
                        'endsAt',
                        'End time',
                        false,
                        100,
                        true,
                        'datetime-local',
                      )}
                    </div>
                    {field(
                      'accessibility',
                      'Sample access information',
                      true,
                      500,
                    )}
                  </>
                )}
                {kind === 'job' && (
                  <>
                    {field('organisation', 'Sample employer')}
                    {select(
                      'employmentType',
                      'Employment type',
                      ['Full-time', 'Part-time', 'Contract'].map((v) => ({
                        value: v,
                        label: v,
                      })),
                    )}
                    {field(
                      'requirements',
                      'Example responsibilities & requirements',
                      true,
                      1000,
                    )}
                    {field(
                      'closesAt',
                      'Closing time (device time zone)',
                      false,
                      100,
                      true,
                      'datetime-local',
                    )}
                    <p className="em-m-small">
                      No real pay, sponsorship or employment promise should be
                      entered in this sample.
                    </p>
                  </>
                )}
                <h2>Fictional contact details</h2>
                <div className="em-m-form-pair">
                  {field('name', 'Sample contact name')}
                  {field(
                    'email',
                    'Sample .invalid email',
                    false,
                    254,
                    true,
                    'email',
                  )}
                </div>
                <label className="em-m-checkbox">
                  <input
                    required
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  All details are fictional. I am testing the local review
                  process.
                </label>
                {error && (
                  <p role="alert" className="em-m-state--error">
                    {error}
                  </p>
                )}
                <button type="submit" className="em-m-button">
                  {busy ? 'Saving to review…' : 'Submit for sample review'}
                </button>
              </fieldset>
            </form>
          </section>
        )
      )}
    </div>
  );
}
