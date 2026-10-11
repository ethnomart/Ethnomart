export const groceryCategories = [
  'Rice & grains',
  'Flour & pulses',
  'Spices & seasonings',
  'Oils & pantry',
  'Snacks & drinks',
  'Other packaged groceries',
] as const;
export const clothingCategories = [
  'Traditional wear',
  'Everyday clothing',
  'Scarves & accessories',
] as const;
export const productCategories = [...groceryCategories, ...clothingCategories];
export const packUnits = ['g', 'kg', 'ml', 'l', 'pcs'] as const;
export const availabilityLabels = {
  in_stock: 'Reported in stock',
  unavailable: 'Reported unavailable',
  unknown: 'Not confirmed',
} as const;
export type Availability = keyof typeof availabilityLabels;
export type ListingState = 'draft' | 'published' | 'paused';
export interface DraftFields {
  name: string;
  brand: string;
  aliases: string;
  category: string;
  sizes: string;
  fabric: string;
  packAmount: string;
  packUnit: string;
  price: string;
  availability: string;
  imageDataUrl: string;
  imageName: string;
  imagePermission: boolean;
}
export interface ListingEvent {
  type: 'created' | 'edited' | 'published' | 'paused';
  actorId: number;
  revision: number;
  at: string;
}
export interface MerchantListing {
  id: number;
  storeId: number;
  fields: DraftFields;
  state: ListingState;
  revision: number;
  reviewedRevision: number | null;
  reviewedBy: number | null;
  confirmedAt: string | null;
  updatedAt: string;
  events: ListingEvent[];
  moderation?: {
    blocked: boolean;
    reason: string | null;
    revision: number;
    changedAt: string | null;
  };
}
export interface MerchantShop {
  kind?: 'grocery' | 'clothing';
  id: number;
  name: string;
  cityName?: string;
  isApproved: boolean;
  status?: string;
  moderationReason?: string | null;
}
export const emptyDraft: DraftFields = {
  name: '',
  brand: '',
  aliases: '',
  category: '',
  sizes: '',
  fabric: '',
  packAmount: '',
  packUnit: 'g',
  price: '',
  availability: 'unknown',
  imageDataUrl: '',
  imageName: '',
  imagePermission: false,
};

export function priceInPence(value: string): number | null {
  if (!/^\d{1,4}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ''] = value.trim().split('.');
  const pence = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return pence > 0 && pence <= 100_000 ? pence : null;
}

export function validateForReview(fields: DraftFields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (fields.name.trim().length < 2 || fields.name.trim().length > 160)
    errors.name = 'Enter a product name between 2 and 160 characters.';
  if (!(productCategories as readonly string[]).includes(fields.category))
    errors.category = 'Choose a grocery or clothing category.';
  if (
    !/^\d{1,5}(?:\.\d{1,3})?$/.test(fields.packAmount.trim()) ||
    Number(fields.packAmount) <= 0 ||
    Number(fields.packAmount) > 10_000
  )
    errors.packAmount = 'Enter a positive pack amount, up to 10,000.';
  if (!(packUnits as readonly string[]).includes(fields.packUnit))
    errors.packUnit = 'Choose g, kg, ml, l or pcs.';
  if (
    (clothingCategories as readonly string[]).includes(fields.category) &&
    (fields.packUnit !== 'pcs' || !Number.isInteger(Number(fields.packAmount)))
  )
    errors.packUnit = 'Use a whole number of pieces for clothing.';
  if ((fields.sizes || '').length > 160)
    errors.sizes = 'Keep sizes within 160 characters.';
  if ((fields.fabric || '').length > 160)
    errors.fabric = 'Keep fabric within 160 characters.';
  if (priceInPence(fields.price) === null)
    errors.price =
      'Enter a price from £0.01 to £1,000, using at most two decimal places.';
  if (!Object.hasOwn(availabilityLabels, fields.availability))
    errors.availability =
      'Choose the reported availability, or leave it not confirmed.';
  const aliases = fields.aliases
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);
  if (aliases.length > 10 || aliases.some((value) => value.length > 80))
    errors.aliases =
      'Use up to 10 other names, with at most 80 characters each.';
  if (fields.imageDataUrl && !fields.imagePermission)
    errors.imagePermission =
      'Confirm permission to use this photo, or remove it.';
  return errors;
}

export function formatGBP(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}
export function formatConfirmation(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/London',
      }).format(new Date(value))
    : 'Not confirmed yet';
}
