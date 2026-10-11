// Immutable sample-image assignments. Names protect against reused IDs and user-created records.
// Existing database records, publication controls and uploaded-photo permissions remain authoritative.
const shopPhotos: Record<string, string> = {
  'Al-Madina Superstore': 'shop-1',
  'Karachi Kitchen & Deli': 'shop-2',
  'Punjab Halal Butchers': 'shop-3',
  'Bombay Bazaar': 'shop-4',
  'Udupi Vegetarian Foods': 'shop-5',
  'Punjabi Sweet Centre': 'shop-6',
  'Sylhet Spice Emporium': 'shop-7',
  'Dhaka Fresh Foods': 'shop-8',
  'Cedar of Lebanon Gourmet': 'shop-9',
  'Mama Africa Kitchen & Market': 'shop-10',
  'Himalayan Spice Market': 'shop-11',
  'Sample Threads & Traditions': 'shop-12',
  'Sample Woven Stories': 'shop-13',
  'Sample Heritage Studio': 'shop-14',
};
const productPhotos: Record<string, string> = {
  'Al-Madina Superstore|Basmati Rice 5kg': 'product-1',
  'Al-Madina Superstore|Shan Biryani Masala': 'product-2',
  'Al-Madina Superstore|Pure Desi Ghee 500g': 'product-4',
  'Al-Madina Superstore|Elephant Atta Wholewheat 10kg': 'product-5',
  'Al-Madina Superstore|Chana Daal 2kg': 'product-6',
  'Al-Madina Superstore|National Mixed Pickle 1kg': 'product-7',
  'Karachi Kitchen & Deli|Special Chicken Dum Biryani': 'product-9',
  'Karachi Kitchen & Deli|Beef Shami Kabab Pack (6 pcs)': 'product-10',
  'Karachi Kitchen & Deli|Crispy Vegetable Samosas (12 pcs)': 'product-11',
  'Karachi Kitchen & Deli|Pakola Ice Cream Soda 330ml (Can)': 'product-12',
  'Punjab Halal Butchers|Halal Lamb Chops (Marinated)': 'product-14',
  'Bombay Bazaar|Ponni Boiled Rice 5kg': 'product-16',
  'Bombay Bazaar|KLF Nirmal Coconut Oil 500ml': 'product-17',
  'Bombay Bazaar|Amul Salted Butter 500g': 'product-18',
  'Bombay Bazaar|MTR Sambar Powder 200g': 'product-19',
  'Bombay Bazaar|Lijjat Papad (Jeera) 200g': 'product-20',
  'Punjabi Sweet Centre|Fresh Hot Jalebi (500g)': 'product-21',
  'Punjabi Sweet Centre|Royal Gulab Jamun Box (1kg)': 'product-22',
  'Punjabi Sweet Centre|Kaju Katli Diamond Silver (500g)': 'product-23',
  'Sylhet Spice Emporium|Radhuni Pure Mustard Oil 1L': 'product-24',
  'Sylhet Spice Emporium|Pitha Rice Flour 1kg': 'product-26',
  'Cedar of Lebanon Gourmet|Wild Lebanese Zaatar Blend 250g': 'product-27',
  'Cedar of Lebanon Gourmet|Jumbo Medjool Dates 1kg': 'product-28',
  'Cedar of Lebanon Gourmet|Al Kanater Tahini 450g': 'product-29',
  'Mama Africa Kitchen & Market|Authentic Suya Pepper Spice Mix 150g':
    'product-32',
  'Sample Threads & Traditions|Sample embroidered tunic': 'product-33',
  'Sample Threads & Traditions|Sample woven shawl': 'product-34',
  'Sample Threads & Traditions|Sample everyday kurta': 'product-35',
  'Sample Woven Stories|Sample embroidered tunic': 'product-36',
  'Sample Woven Stories|Sample woven shawl': 'product-37',
  'Sample Woven Stories|Sample everyday kurta': 'product-38',
  'Sample Heritage Studio|Sample embroidered tunic': 'product-39',
  'Sample Heritage Studio|Sample woven shawl': 'product-40',
  'Sample Heritage Studio|Sample everyday kurta': 'product-41',
};
const contentPhotos: Record<string, string> = {
  'event:neighbourhood-craft-table': 'event-neighbourhood-craft-table',
  'event:woven-stories-market': 'event-woven-stories-market',
  'event:tea-and-local-stories': 'event-tea-and-local-stories',
  'job:sample-shop-assistant': 'job-sample-shop-assistant',
  'job:sample-community-coordinator': 'job-sample-community-coordinator',
};
export const sampleShopPhoto = (name: string) =>
  Object.hasOwn(shopPhotos, name) ? shopPhotos[name] : '';
export const sampleProductPhoto = (shopName: string, name: string) =>
  Object.hasOwn(productPhotos, shopName + '|' + name)
    ? productPhotos[shopName + '|' + name]
    : '';
export const sampleContentPhoto = (kind: string, slug: string) =>
  Object.hasOwn(contentPhotos, kind + ':' + slug)
    ? contentPhotos[kind + ':' + slug]
    : '';
export const sampleCommunityPhoto = (slug: string) =>
  ['pakistani', 'indian', 'bangladeshi', 'nepali', 'arab', 'african'].includes(
    slug,
  )
    ? 'hub-' + slug
    : '';
export const samplePhotoUrl = (key?: string) =>
  key ? '/images/individual/' + key + '-960.webp' : undefined;
