import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useLocation, useRoute, useSearch } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Package } from 'lucide-react';
import { WorkspaceAccess } from '@/components/merchant/workspace-access';
import {
  merchantRequest,
  MerchantApiError,
  useMerchantListing,
  useMerchantShops,
  useRefreshMerchantCatalogue,
} from '@/lib/merchant-api';
import {
  emptyDraft,
  productCategories,
  clothingCategories,
  packUnits,
  availabilityLabels,
  formatGBP,
  priceInPence,
  validateForReview,
  type DraftFields,
  type MerchantListing,
  type Availability,
} from '@/lib/merchant-listings';
import { prepareProductPhoto } from '@/lib/product-photo';
import '@/styles/merchant-workspace.css';

const steps = ['Photo', 'Details', 'Price & availability', 'Review'];

export default function MerchantProductPage() {
  const [, route] = useRoute('/merchant/products/:id/edit');
  const listingId = Number(route?.id) || 0;
  const search = useSearch();
  const params = new URLSearchParams(search);
  const requestedShop = Number(params.get('shop'));
  const [, navigate] = useLocation();
  const shopsQuery = useMerchantShops();
  const listingQuery = useMerchantListing(
    listingId,
    !!listingId && shopsQuery.isSuccess,
  );
  const shop =
    shopsQuery.data?.find(
      (item) => item.id === (listingQuery.data?.storeId || requestedShop),
    ) || (!requestedShop && !listingId ? shopsQuery.data?.[0] : undefined);
  const storeId = shop?.id || 0;
  const [draft, setDraft] = useState<DraftFields>({ ...emptyDraft });
  const [saved, setSaved] = useState<MerchantListing | null>(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<'save' | 'publish'>('save');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [identityChecked, setIdentityChecked] = useState(false);
  const [priceChecked, setPriceChecked] = useState(false);
  const [published, setPublished] = useState(false);
  const hydrated = useRef(0);
  const requestKey = useRef(crypto.randomUUID());
  const photoSequence = useRef(0);
  const alive = useRef(true);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const refresh = useRefreshMerchantCatalogue();
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(saved?.fields || emptyDraft);

  useEffect(() => {
    document.title = `${listingId ? 'Edit' : 'Add'} sample product | EthnoMart`;
  }, [listingId]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      photoSequence.current++;
    };
  }, []);
  useEffect(() => {
    if (!listingId) {
      hydrated.current = 0;
      requestKey.current = crypto.randomUUID();
      setDraft({ ...emptyDraft });
      setSaved(null);
      setStep(1);
      setPublished(false);
      setMessage('');
      setError('');
      setErrors({});
      setIdentityChecked(false);
      setPriceChecked(false);
    }
  }, [listingId, requestedShop]);
  useEffect(() => {
    if (!listingQuery.data || hydrated.current === listingQuery.data.id) return;
    hydrated.current = listingQuery.data.id;
    setDraft({ ...emptyDraft, ...listingQuery.data.fields });
    setSaved(listingQuery.data);
    setStep(params.get('step') === '4' ? 4 : 1);
    setPublished(false);
    setMessage('');
    setError('');
    setErrors({});
    setIdentityChecked(false);
    setPriceChecked(false);
  }, [listingQuery.data]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (step === 1) return;
    const frame = requestAnimationFrame(() => {
      stepHeading.current?.scrollIntoView({
        block: 'start',
        behavior: 'instant',
      });
      stepHeading.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [step]);

  const change = (key: keyof DraftFields, value: string | boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setIdentityChecked(false);
    setPriceChecked(false);
    setPublished(false);
    setMessage('');
    setError('');
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const sequence = ++photoSequence.current;
    setPhotoBusy(true);
    setError('');
    try {
      const dataUrl = await prepareProductPhoto(file);
      if (!alive.current || sequence !== photoSequence.current) return;
      setDraft((current) => ({
        ...current,
        imageDataUrl: dataUrl,
        imageName: file.name.slice(0, 160),
        imagePermission: false,
      }));
      setIdentityChecked(false);
      setPriceChecked(false);
      setMessage('');
    } catch (failure) {
      if (alive.current && sequence === photoSequence.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'The photo could not open. Try another image.',
        );
    } finally {
      if (alive.current && sequence === photoSequence.current)
        setPhotoBusy(false);
    }
  };
  const save = async (review = false) => {
    if (!storeId || busy || photoBusy) return;
    setBusyAction('save');
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = saved
        ? await merchantRequest<MerchantListing>(
            `/merchant/listings/${saved.id}`,
            'PATCH',
            {
              fields: draft,
              expectedRevision: saved.revision,
            },
          )
        : await merchantRequest<MerchantListing>(
            `/merchant/shops/${storeId}/listings`,
            'POST',
            {
              fields: draft,
              requestKey: requestKey.current,
            },
          );
      setSaved(response);
      setDraft({ ...response.fields });
      setIdentityChecked(false);
      setPriceChecked(false);
      setMessage('Draft saved. It is not visible in the catalogue.');
      refresh(storeId);
      if (!listingId)
        navigate(
          `/merchant/products/${response.id}/edit?shop=${storeId}${review ? '&step=4' : ''}`,
        );
      else if (review) setStep(4);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The draft could not be saved. Your details are still here. Please try again.',
      );
      if (failure instanceof MerchantApiError && failure.fields)
        setErrors(failure.fields);
    } finally {
      setBusy(false);
    }
  };
  const next = () => {
    const checks = validateForReview(draft);
    const relevant =
      step === 1
        ? ['imagePermission']
        : step === 2
          ? [
              'name',
              'category',
              'packAmount',
              'packUnit',
              'aliases',
              'sizes',
              'fabric',
            ]
          : ['price', 'availability'];
    const invalid = Object.fromEntries(
      Object.entries(checks).filter(([key]) => relevant.includes(key)),
    );
    setErrors(invalid);
    setError('');
    if (Object.keys(invalid).length || photoBusy) return;
    if (step === 3) {
      void save(true);
      return;
    }
    setStep((value) => value + 1);
  };
  const publish = async () => {
    if (!saved || !identityChecked || !priceChecked || busy || dirty) return;
    setBusyAction('publish');
    setBusy(true);
    setError('');
    try {
      const response = await merchantRequest<MerchantListing>(
        `/merchant/listings/${saved.id}/publish`,
        'POST',
        {
          expectedRevision: saved.revision,
          reviewConfirmed: identityChecked,
          priceAvailabilityConfirmed: priceChecked,
        },
      );
      setSaved(response);
      setPublished(true);
      setMessage('Product published in the sample catalogue.');
      refresh(storeId);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Publication failed. The draft is still available.',
      );
      if (failure instanceof MerchantApiError && failure.fields)
        setErrors(failure.fields);
    } finally {
      setBusy(false);
    }
  };

  if (shopsQuery.isLoading || (listingId && listingQuery.isLoading))
    return (
      <p className="em-merchant-loading" role="status">
        Loading the product workspace…
      </p>
    );
  if (shopsQuery.isError)
    return (
      <WorkspaceAccess
        error={shopsQuery.error}
        retry={() => {
          void shopsQuery.refetch();
        }}
      />
    );
  if (listingId && listingQuery.isError)
    return (
      <div className="em-merchant-access">
        <h1>The product couldn’t load.</h1>
        <p role="alert">{listingQuery.error.message}</p>
        <Link className="em-merchant-button" href="/merchant">
          Back to workspace
        </Link>
      </div>
    );
  if (!shop)
    return (
      <div className="em-merchant-access">
        <h1>No assigned shop</h1>
        <p>This product workspace isn’t assigned to your sample account.</p>
        <Link className="em-merchant-button" href="/merchant">
          Back to workspace
        </Link>
      </div>
    );

  const field = (
    key: keyof DraftFields,
    label: string,
    options?: {
      placeholder?: string;
      decimal?: boolean;
      multiline?: boolean;
      hint?: string;
    },
  ) => (
    <div className="em-editor-field">
      <label htmlFor={`em-editor-${key}`}>{label}</label>
      {options?.multiline ? (
        <textarea
          id={`em-editor-${key}`}
          value={String(draft[key])}
          rows={3}
          maxLength={900}
          onChange={(event) => change(key, event.target.value)}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `em-error-${key}` : undefined}
        />
      ) : (
        <input
          id={`em-editor-${key}`}
          type="text"
          inputMode={options?.decimal ? 'decimal' : 'text'}
          value={String(draft[key])}
          maxLength={key === 'name' ? 160 : key === 'brand' ? 80 : 50}
          placeholder={options?.placeholder}
          onChange={(event) => change(key, event.target.value)}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `em-error-${key}` : undefined}
        />
      )}
      {options?.hint && <small>{options.hint}</small>}
      {errors[key] && (
        <p id={`em-error-${key}`} className="em-editor-field-error">
          {errors[key]}
        </p>
      )}
    </div>
  );
  return (
    <div className="em-merchant-page em-editor-page">
      <div className="em-merchant-demo-note">
        Local demo · {shop.name} · Use sample products only. Catalogue changes
        are saved on this computer.
      </div>
      <Link className="em-editor-back" href={`/merchant?shop=${storeId}`}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to workspace
      </Link>
      <div className="em-merchant-title-row">
        <div>
          <p className="em-merchant-eyebrow">{shop.name}</p>
          <h1>
            {published
              ? 'Ready for the catalogue.'
              : listingId
                ? 'Review your product.'
                : 'Add a product.'}
          </h1>
        </div>
        {!published && (
          <div className="em-editor-save">
            <span>
              {dirty
                ? 'Unsaved changes'
                : saved
                  ? `Saved ${saved.state} version`
                  : 'New draft'}
            </span>
            <button
              className="em-merchant-button em-merchant-button--outline"
              type="button"
              disabled={busy || photoBusy}
              onClick={() => {
                void save();
              }}
            >
              {busy
                ? busyAction === 'publish'
                  ? 'Publishing…'
                  : 'Saving…'
                : 'Save draft'}
            </button>
          </div>
        )}
      </div>
      {saved?.state === 'published' && !published && (
        <p className="em-merchant-notice">
          Saving changes will hide this product from the sample catalogue until
          you review and publish it again.
        </p>
      )}
      {saved?.moderation?.blocked && (
        <p className="em-merchant-notice" role="status">
          Manager block: {saved.moderation.reason} You can edit and save a
          draft, but the manager must release the block before publication.
        </p>
      )}
      {!shop.isApproved && (
        <p className="em-merchant-notice">
          This shop is paused. Drafts can be saved, but they cannot be
          published.
        </p>
      )}
      {error && (
        <div className="em-merchant-error" role="alert">
          <p>{error}</p>
          {error.includes('newer version') && (
            <button
              type="button"
              onClick={async () => {
                const latest = await listingQuery.refetch();
                if (latest.data) {
                  setSaved(latest.data);
                  setDraft({ ...latest.data.fields });
                  setIdentityChecked(false);
                  setPriceChecked(false);
                  setError('');
                  setMessage('Loaded the latest saved version.');
                }
              }}
            >
              Load latest saved version (replaces these edits)
            </button>
          )}
        </div>
      )}
      {message && (
        <p className="em-merchant-feedback" role="status">
          {message}
        </p>
      )}
      {published ? (
        <div className="em-editor-success">
          <span className="em-editor-success-mark">
            <Check size={30} aria-hidden="true" />
          </span>
          <h2>{draft.name}</h2>
          <p>
            {draft.packAmount} {draft.packUnit} ·{' '}
            {formatGBP(priceInPence(draft.price)!)} ·{' '}
            {availabilityLabels[draft.availability as Availability]}
          </p>
          <p>
            This reviewed demo listing is now visible in the sample shop
            catalogue.
          </p>
          <div>
            <Link className="em-merchant-button" href={`/store/${storeId}`}>
              View sample catalogue <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              className="em-merchant-text-link"
              href={`/merchant?shop=${storeId}`}
            >
              Back to workspace
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ol className="em-editor-steps" aria-label="Product steps">
            {steps.map((label, index) => (
              <li
                key={label}
                aria-current={step === index + 1 ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <section
            className="em-editor-panel"
            aria-labelledby="em-editor-step-heading"
          >
            <div className="em-editor-panel-intro">
              <p className="em-merchant-eyebrow">Step {step} of 4</p>
              <h2 ref={stepHeading} tabIndex={-1} id="em-editor-step-heading">
                {step === 1
                  ? 'Start with the product.'
                  : step === 2
                    ? 'Make the details clear.'
                    : step === 3
                      ? 'Tell shoppers what you know.'
                      : 'Your final say.'}
              </h2>
              <p>
                {step === 1
                  ? 'Choose a clear sample product photo, or continue with manual entry.'
                  : step === 2
                    ? 'Copy the name and pack size from the product. Keep uncertain information blank.'
                    : step === 3
                      ? 'Enter the exact GBP price and reported availability. “Not confirmed” is a valid choice.'
                      : 'This is what shoppers will see. Check the saved details before approving publication.'}
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (step < 4) next();
                else void publish();
              }}
              noValidate
            >
              <fieldset
                className="em-editor-fieldset"
                disabled={busy || photoBusy}
              >
                {step === 1 && (
                  <div className="em-editor-photo-section">
                    <div className="em-editor-photo-preview">
                      {draft.imageDataUrl ? (
                        <img
                          src={draft.imageDataUrl}
                          alt="Selected sample product photo"
                          width={640}
                          height={640}
                        />
                      ) : (
                        <>
                          <ImagePlus
                            size={40}
                            strokeWidth={1.3}
                            aria-hidden="true"
                          />
                          <span>Photo optional</span>
                        </>
                      )}
                    </div>
                    <div className="em-editor-photo-controls">
                      <label
                        className="em-merchant-button em-merchant-button--outline"
                        htmlFor="em-product-photo"
                      >
                        Choose product photo
                      </label>
                      <input
                        id="em-product-photo"
                        className="em-editor-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          void selectPhoto(event);
                        }}
                        disabled={photoBusy || busy}
                      />
                      <p className="em-merchant-small">
                        JPEG, PNG or WebP, up to 5 MB. A plain placeholder is
                        used when you skip the photo.
                      </p>
                      {photoBusy && <p role="status">Preparing the photo…</p>}
                      {draft.imageDataUrl && (
                        <>
                          <p className="em-merchant-small">{draft.imageName}</p>
                          <label className="em-editor-checkbox">
                            <input
                              type="checkbox"
                              checked={draft.imagePermission}
                              onChange={(event) =>
                                change('imagePermission', event.target.checked)
                              }
                            />
                            I have permission to use this sample photo.
                          </label>
                          {errors.imagePermission && (
                            <p className="em-editor-field-error">
                              {errors.imagePermission}
                            </p>
                          )}
                          <button
                            type="button"
                            className="em-merchant-text-link"
                            onClick={() => {
                              photoSequence.current++;
                              setPhotoBusy(false);
                              setDraft((current) => ({
                                ...current,
                                imageDataUrl: '',
                                imageName: '',
                                imagePermission: false,
                              }));
                              setIdentityChecked(false);
                              setPriceChecked(false);
                              setMessage('');
                              setErrors({});
                            }}
                          >
                            Remove photo
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="em-editor-fields">
                    {field('name', 'Product name', {
                      placeholder: 'Example Basmati Rice',
                    })}
                    {field('brand', 'Brand (optional)', {
                      placeholder: 'Copy from the pack if known',
                    })}
                    <div className="em-editor-field">
                      <label htmlFor="em-editor-category">Category</label>
                      <select
                        id="em-editor-category"
                        value={draft.category}
                        onChange={(event) => {
                          change('category', event.target.value);
                          if (
                            (clothingCategories as readonly string[]).includes(
                              event.target.value,
                            )
                          ) {
                            change('packUnit', 'pcs');
                            change('packAmount', '1');
                          }
                        }}
                        aria-invalid={!!errors.category}
                      >
                        <option value="">Choose a category</option>
                        {productCategories.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="em-editor-field-error">
                          {errors.category}
                        </p>
                      )}
                    </div>
                    {(clothingCategories as readonly string[]).includes(
                      draft.category,
                    ) && (
                      <>
                        {field('sizes', 'Sizes (optional)', {
                          placeholder: 'S, M, L or measurements',
                        })}
                        {field('fabric', 'Fabric (optional)', {
                          placeholder: 'Copy known fabric information',
                        })}
                      </>
                    )}
                    <div className="em-editor-pack">
                      {field('packAmount', 'Pack amount', {
                        placeholder: '5',
                        decimal: true,
                      })}
                      <div className="em-editor-field">
                        <label htmlFor="em-editor-packUnit">Unit</label>
                        <select
                          id="em-editor-packUnit"
                          value={draft.packUnit}
                          onChange={(event) =>
                            change('packUnit', event.target.value)
                          }
                        >
                          {packUnits.map((value) => (
                            <option key={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="em-editor-wide">
                      {field('aliases', 'Other product names (optional)', {
                        multiline: true,
                        hint: 'One per line, up to 10. You can use English or Urdu spellings for search.',
                      })}
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="em-editor-fields">
                    {field('price', 'Price (£)', {
                      placeholder: '9.99',
                      decimal: true,
                      hint: 'Sample price in GBP. Do not enter an estimate as a confirmed price.',
                    })}
                    <div className="em-editor-field">
                      <label htmlFor="em-editor-availability">
                        Reported availability
                      </label>
                      <select
                        id="em-editor-availability"
                        value={draft.availability}
                        onChange={(event) =>
                          change('availability', event.target.value)
                        }
                      >
                        {Object.entries(availabilityLabels).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                      {errors.availability && (
                        <p className="em-editor-field-error">
                          {errors.availability}
                        </p>
                      )}
                      <small>
                        Shoppers will be told when availability is not
                        confirmed.
                      </small>
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <div className="em-editor-review">
                    <article className="em-editor-review-card">
                      <div className="em-editor-review-photo">
                        {draft.imageDataUrl ? (
                          <img
                            src={draft.imageDataUrl}
                            alt={draft.name}
                            width={640}
                            height={640}
                          />
                        ) : (
                          <Package
                            size={55}
                            strokeWidth={1.1}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div>
                        <p className="em-merchant-eyebrow">
                          Sample listing · {shop.name}
                        </p>
                        {draft.brand && (
                          <p className="em-merchant-small">{draft.brand}</p>
                        )}
                        <h3>{draft.name}</h3>
                        <p>
                          {draft.packAmount} {draft.packUnit}
                        </p>
                        {draft.sizes && <p>Sizes: {draft.sizes}</p>}
                        {draft.fabric && <p>Fabric: {draft.fabric}</p>}
                        <strong>
                          {priceInPence(draft.price)
                            ? formatGBP(priceInPence(draft.price)!)
                            : 'Price to correct'}
                        </strong>
                        <p>
                          {availabilityLabels[
                            draft.availability as Availability
                          ] || 'Availability to correct'}
                        </p>
                        <button
                          type="button"
                          className="em-merchant-text-link"
                          onClick={() => {
                            setStep(2);
                            setIdentityChecked(false);
                            setPriceChecked(false);
                          }}
                        >
                          Edit these details
                        </button>
                      </div>
                    </article>
                    <div className="em-editor-review-confirmations">
                      <label className="em-editor-checkbox">
                        <input
                          type="checkbox"
                          checked={identityChecked}
                          onChange={(event) =>
                            setIdentityChecked(event.target.checked)
                          }
                        />
                        I checked the product name, pack size and photo
                        permission.
                      </label>
                      <label className="em-editor-checkbox">
                        <input
                          type="checkbox"
                          checked={priceChecked}
                          onChange={(event) =>
                            setPriceChecked(event.target.checked)
                          }
                        />
                        I checked the price and the reported availability above.
                      </label>
                      <p className="em-merchant-small">
                        This approval applies to the saved version shown here.
                        Product details and certification are not guessed or
                        added by this demo.
                      </p>
                      {Object.entries(errors).map(([key, text]) => (
                        <p key={key} className="em-editor-field-error">
                          {text}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="em-editor-actions">
                  {step > 1 ? (
                    <button
                      className="em-merchant-button em-merchant-button--outline"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setStep((value) => value - 1);
                        setErrors({});
                        setError('');
                      }}
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                      Back
                    </button>
                  ) : (
                    <span className="em-merchant-small">
                      Manual entry is always available.
                    </span>
                  )}
                  {step < 4 ? (
                    <button
                      type="submit"
                      className="em-merchant-button"
                      disabled={busy || photoBusy}
                    >
                      {busy
                        ? 'Saving draft…'
                        : step === 3
                          ? 'Save & review'
                          : step === 1 && !draft.imageDataUrl
                            ? 'Continue without photo'
                            : 'Continue'}
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="em-merchant-button"
                      disabled={
                        busy ||
                        !identityChecked ||
                        !priceChecked ||
                        !saved ||
                        dirty ||
                        !shop.isApproved ||
                        !!saved?.moderation?.blocked
                      }
                    >
                      {busy
                        ? busyAction === 'save'
                          ? 'Saving draft…'
                          : 'Publishing…'
                        : 'Approve & publish demo'}
                      <Check size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </fieldset>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
