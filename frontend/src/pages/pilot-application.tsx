import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useListCities, useListCommunities } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { onboardingRequest, OnboardingError } from '@/lib/onboarding-api';
import '@/styles/pilot-onboarding.css';

export default function PilotApplicationPage() {
  const cities = useListCities({
    query: { queryKey: ['/api/cities'], retry: false },
  });
  const communities = useListCommunities({
    query: { queryKey: ['/api/communities'], retry: false },
  });
  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    cityId: '',
    communityId: '',
    kind: 'grocery',
    sampleOnly: false,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fields, setFields] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<{
    reference: string;
    receivedAt: string;
  } | null>(null);
  const requestKey = useRef(crypto.randomUUID());
  useEffect(() => {
    document.title = 'Try the merchant pilot | EthnoMart';
  }, []);
  const change = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFields((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError('');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const checks: Record<string, string> = {};
    if (form.shopName.trim().length < 2)
      checks.shopName = 'Enter a sample shop name.';
    if (form.ownerName.trim().length < 2)
      checks.ownerName = 'Enter a sample contact name.';
    if (!/^[a-z0-9._+-]+@(?:[a-z0-9-]+\.)+invalid$/i.test(form.email.trim()))
      checks.email = 'Use a sample email, such as grocer@example.invalid.';
    if (!form.cityId) checks.cityId = 'Choose a city.';
    if (!form.communityId) checks.communityId = 'Choose a community.';
    if (!form.sampleOnly)
      checks.sampleOnly = 'Confirm you are using fictional sample details.';
    setFields(checks);
    if (Object.keys(checks).length) {
      setError('Check the highlighted details.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setReceipt(
        await onboardingRequest('/onboarding/requests', 'POST', {
          ...form,
          cityId: Number(form.cityId),
          communityId: Number(form.communityId),
          requestKey: requestKey.current,
        }),
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The request could not be saved.',
      );
      if (failure instanceof OnboardingError && failure.fields)
        setFields(failure.fields);
    } finally {
      setBusy(false);
    }
  };
  const input = (
    key: 'shopName' | 'ownerName' | 'email',
    label: string,
    placeholder: string,
  ) => (
    <div className="em-pilot-field">
      <label htmlFor={`pilot-${key}`}>{label}</label>
      <input
        id={`pilot-${key}`}
        type={key === 'email' ? 'email' : 'text'}
        value={form[key]}
        maxLength={key === 'email' ? 254 : 100}
        placeholder={placeholder}
        onChange={(event) => change(key, event.target.value)}
        aria-invalid={!!fields[key]}
        aria-describedby={fields[key] ? `pilot-error-${key}` : undefined}
      />
      {fields[key] && (
        <p className="em-pilot-field-error" id={`pilot-error-${key}`}>
          {fields[key]}
        </p>
      )}
    </div>
  );
  return (
    <div className="em-pilot-page">
      <Link className="em-pilot-back" href="/for-shops">
        <ArrowLeft size={17} aria-hidden="true" />
        For shop owners
      </Link>
      <div className="em-pilot-demo">
        Local trial · Fictional details only · No emails are sent
      </div>
      {receipt ? (
        <section className="em-pilot-receipt">
          <span className="em-pilot-receipt-icon">
            <Check size={32} aria-hidden="true" />
          </span>
          <p className="em-pilot-eyebrow">
            Request received · {receipt.reference}
          </p>
          <h1>
            A small start.
            <br />A clear next step.
          </h1>
          <p>
            Your sample request is saved for the local manager to review. It has
            not created a shop or an account. An approved invitation is needed
            to open a workspace.
          </p>
          <div className="em-pilot-actions">
            <Link className="em-pilot-button" href="/shops">
              Explore sample shops <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="em-pilot-text-link" href="/for-shops">
              Back to the pilot
            </Link>
          </div>
        </section>
      ) : (
        <div className="em-pilot-application-layout">
          <section className="em-pilot-application-intro">
            <p className="em-pilot-eyebrow">A catalogue for your shelves</p>
            <h1>
              Let’s start
              <br />
              with your shop.
            </h1>
            <p>
              Try the journey from a shop request to an approved catalogue
              workspace. Keep the details fictional in this local demonstration.
            </p>
            <ol>
              <li>
                <span>01</span>Tell us about the sample shop.
              </li>
              <li>
                <span>02</span>The manager reviews its request.
              </li>
              <li>
                <span>03</span>An invitation opens its workspace.
              </li>
            </ol>
            <p className="em-pilot-small">
              No automatic marketing signup, fees or email delivery. Real
              merchant enrolment is not open yet.
            </p>
          </section>
          <section
            className="em-pilot-application-form"
            aria-labelledby="pilot-form-heading"
          >
            <h2 id="pilot-form-heading">Your sample shop</h2>
            <p>A few details. One request.</p>
            {cities.isError || communities.isError ? (
              <div className="em-pilot-error" role="alert">
                <p>The city and community lists couldn’t load.</p>
                <button
                  className="em-pilot-text-link"
                  onClick={() => {
                    void cities.refetch();
                    void communities.refetch();
                  }}
                >
                  Try again
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  void submit(event);
                }}
                noValidate
              >
                <fieldset
                  disabled={busy || cities.isLoading || communities.isLoading}
                >
                  {input(
                    'shopName',
                    'Shop name',
                    'Example neighbourhood grocer',
                  )}
                  {input('ownerName', 'Contact name', 'Sample shopkeeper')}
                  {input('email', 'Sample email', 'grocer@example.invalid')}
                  <div className="em-pilot-field">
                    <label htmlFor="pilot-kind">Business type</label>
                    <select
                      id="pilot-kind"
                      value={form.kind}
                      onChange={(event) => change('kind', event.target.value)}
                    >
                      <option value="grocery">Groceries</option>
                      <option value="clothing">Clothing & textiles</option>
                    </select>
                  </div>
                  <div className="em-pilot-field-pair">
                    {(['cityId', 'communityId'] as const).map((key) => (
                      <div className="em-pilot-field" key={key}>
                        <label htmlFor={`pilot-${key}`}>
                          {key === 'cityId' ? 'City' : 'Community'}
                        </label>
                        <select
                          id={`pilot-${key}`}
                          value={form[key]}
                          onChange={(event) => change(key, event.target.value)}
                          aria-invalid={!!fields[key]}
                        >
                          <option value="">
                            Choose {key === 'cityId' ? 'a city' : 'a community'}
                          </option>
                          {(key === 'cityId'
                            ? cities.data
                            : communities.data
                          )?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        {fields[key] && (
                          <p className="em-pilot-field-error">{fields[key]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <label className="em-pilot-checkbox">
                    <input
                      type="checkbox"
                      checked={form.sampleOnly}
                      onChange={(event) =>
                        change('sampleOnly', event.target.checked)
                      }
                    />
                    I’m using fictional sample details for this local trial.
                  </label>
                  {fields.sampleOnly && (
                    <p className="em-pilot-field-error">{fields.sampleOnly}</p>
                  )}
                  {error && (
                    <p className="em-pilot-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button type="submit" className="em-pilot-button">
                    {busy ? 'Saving your request…' : 'Submit sample request'}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </fieldset>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
