// Fictional local fixtures. No real shop enrolment or verified stock claims.
export interface Community {
  id: number;
  name: string;
  slug: string;
  description: string;
  accentColor: string;
  emoji: string;
  imageUrl?: string;
  storeCount?: number;
  sortOrder: number;
}

export interface City {
  id: number;
  name: string;
  slug: string;
}

export interface Store {
  kind?: 'grocery' | 'clothing';
  id: number;
  name: string;
  slug: string;
  description: string;
  communityId: number;
  cityId: number;
  ownerId: number;
  category: string;
  imageUrl?: string;
  logoUrl?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  subscriptionTier: 'basic' | 'standard' | 'premium';
  isApproved: boolean;
  communityName?: string;
  cityName?: string;
  averageRating?: number | null;
  reviewCount?: number;
  createdAt: string;
}

export interface Product {
  sizes?: string;
  fabric?: string;
  availabilityStatus?: 'in_stock' | 'unavailable' | 'unknown';
  id: number;
  storeId: number;
  name: string;
  description: string;
  priceGbp: string;
  category: string;
  inStock: boolean;
  unit?: string;
  imageUrl?: string;
  createdAt: string;
}

export const cities: City[] = [
  { id: 1, name: 'London', slug: 'london' },
  { id: 2, name: 'Manchester', slug: 'manchester' },
  { id: 3, name: 'Birmingham', slug: 'birmingham' },
  { id: 4, name: 'Bradford', slug: 'bradford' },
  { id: 5, name: 'Leeds', slug: 'leeds' },
  { id: 6, name: 'Glasgow', slug: 'glasgow' },
];

export const communities: Community[] = [
  {
    id: 1,
    name: 'Pakistani',
    slug: 'pakistan',
    description:
      'From the rich plains of Punjab to the mountains of KPK — the flavours of home, delivered to your door.',
    accentColor: '#006600',
    emoji: '🇵🇰',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
    sortOrder: 1,
  },
  {
    id: 2,
    name: 'Indian',
    slug: 'india',
    description:
      "A billion stories, a thousand spices. India's culinary tapestry from every state, right in your city.",
    accentColor: '#FF9933',
    emoji: '🇮🇳',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1000&auto=format&fit=crop',
    sortOrder: 2,
  },
  {
    id: 3,
    name: 'Bangladeshi',
    slug: 'bangladesh',
    description:
      "The delta's finest — mustard oil, dried fish, and the warming comfort of daal bhat, now in the UK.",
    accentColor: '#006A4E',
    emoji: '🇧🇩',
    imageUrl:
      'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=1000&auto=format&fit=crop',
    sortOrder: 3,
  },
  {
    id: 4,
    name: 'Nepali',
    slug: 'nepal',
    description:
      'Himalayan warmth in every bite — momos, gundruk, and the taste of the mountains.',
    accentColor: '#DC143C',
    emoji: '🇳🇵',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    sortOrder: 4,
  },
  {
    id: 5,
    name: 'Arab',
    slug: 'arab',
    description:
      'From Levantine mezze to Gulf spices — the generosity of Arabic hospitality in every dish.',
    accentColor: '#CE1126',
    emoji: '🌙',
    imageUrl:
      'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=1000&auto=format&fit=crop',
    sortOrder: 5,
  },
  {
    id: 6,
    name: 'African',
    slug: 'african',
    description:
      "The continent's vibrant cuisines — jollof rice, injera, suya, and so much more.",
    accentColor: '#009A00',
    emoji: '🌍',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
    sortOrder: 6,
  },
];

export const stores: Store[] = [
  {
    id: 1,
    name: 'Al-Madina Superstore',
    slug: 'al-madina-superstore',
    description:
      'The largest Pakistani grocery in London — everything from atta flour to fresh halal meat, imported spices, and ready-made chaat.',
    communityId: 1,
    cityId: 1,
    ownerId: 3,
    category: 'Grocery',
    imageUrl:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1000&auto=format&fit=crop',
    address: '123 Green Street, London E13',
    phone: '+44 20 7946 0123',
    email: 'contact@almadina.co.uk',
    subscriptionTier: 'premium',
    isApproved: true,
    averageRating: 4.8,
    reviewCount: 42,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: 'Karachi Kitchen & Deli',
    slug: 'karachi-kitchen-deli',
    description:
      'Authentic Karachi street food and specialty ingredients. Famous for our biryani spice blends and frozen samosas.',
    communityId: 1,
    cityId: 2,
    ownerId: 3,
    category: 'Food & Deli',
    imageUrl:
      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=1000&auto=format&fit=crop',
    address: '45 Rusholme Road, Manchester M14',
    phone: '+44 161 496 0456',
    subscriptionTier: 'standard',
    isApproved: true,
    averageRating: 4.7,
    reviewCount: 29,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: 'Punjab Halal Butchers',
    slug: 'punjab-halal-butchers',
    description:
      'Premium halal cuts sourced from local farms. Specialising in goat, lamb, and chicken prepared the traditional way.',
    communityId: 1,
    cityId: 4,
    ownerId: 3,
    category: 'Halal Butcher',
    imageUrl:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=1000&auto=format&fit=crop',
    address: '78 Manningham Lane, Bradford BD8',
    phone: '+44 1274 496 789',
    subscriptionTier: 'basic',
    isApproved: true,
    averageRating: 4.9,
    reviewCount: 35,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 4,
    name: 'Bombay Bazaar',
    slug: 'bombay-bazaar',
    description:
      'Your one-stop shop for all Indian groceries — Rajasthani pickles, Kerala coconut oil, Tamil Nadu rice varieties, and much more.',
    communityId: 2,
    cityId: 1,
    ownerId: 3,
    category: 'Grocery',
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000&auto=format&fit=crop',
    address: '56 Southall High Street, London UB1',
    phone: '+44 20 8843 0789',
    subscriptionTier: 'premium',
    isApproved: true,
    averageRating: 4.8,
    reviewCount: 56,
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 5,
    name: 'Udupi Vegetarian Foods',
    slug: 'udupi-vegetarian-foods',
    description:
      'Authentic South Indian vegetarian grocery and ready-made foods. Fresh idli batter, dosai mix, and imported curry leaves.',
    communityId: 2,
    cityId: 3,
    ownerId: 3,
    category: 'Vegetarian',
    imageUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1000&auto=format&fit=crop',
    address: '32 Soho Road, Birmingham B21',
    phone: '+44 121 554 9912',
    subscriptionTier: 'standard',
    isApproved: true,
    averageRating: 4.6,
    reviewCount: 22,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 6,
    name: 'Punjabi Sweet Centre',
    slug: 'punjabi-sweet-centre',
    description:
      'Traditional mithai made fresh daily — jalebi, gulab jamun, barfi, and seasonal sweets for all festive occasions.',
    communityId: 2,
    cityId: 2,
    ownerId: 3,
    category: 'Sweets & Bakery',
    imageUrl:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1000&auto=format&fit=crop',
    address: '14 Wilmslow Road, Manchester M14',
    phone: '+44 161 224 4567',
    subscriptionTier: 'basic',
    isApproved: true,
    averageRating: 4.9,
    reviewCount: 68,
    createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
  },
  {
    id: 7,
    name: 'Sylhet Spice Emporium',
    slug: 'sylhet-spice-emporium',
    description:
      'Bringing the tastes of Sylhet to East London. Specialising in dried fish, mustard oil, and freshwater fish varieties.',
    communityId: 3,
    cityId: 1,
    ownerId: 3,
    category: 'Grocery',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1000&auto=format&fit=crop',
    address: '89 Brick Lane, London E1',
    phone: '+44 20 7247 1122',
    subscriptionTier: 'premium',
    isApproved: true,
    averageRating: 4.7,
    reviewCount: 38,
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 8,
    name: 'Dhaka Fresh Foods',
    slug: 'dhaka-fresh-foods',
    description:
      'Fresh produce and grocery staples from Bangladesh. Weekly shipments of fresh hilsa fish and seasonal vegetables.',
    communityId: 3,
    cityId: 3,
    ownerId: 3,
    category: 'Grocery',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
    address: '23 Lozells Road, Birmingham B19',
    phone: '+44 121 523 7890',
    subscriptionTier: 'standard',
    isApproved: true,
    averageRating: 4.6,
    reviewCount: 19,
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
  {
    id: 9,
    name: 'Cedar of Lebanon Gourmet',
    slug: 'cedar-of-lebanon-gourmet',
    description:
      'Authentic Levantine pantry — zaatar, extra virgin olive oil, fresh labneh, halva, and imported mezze ingredients.',
    communityId: 5,
    cityId: 1,
    ownerId: 3,
    category: 'Deli & Spices',
    imageUrl:
      'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=1000&auto=format&fit=crop',
    address: '15 Edgware Road, London W2',
    phone: '+44 20 7723 9988',
    subscriptionTier: 'premium',
    isApproved: true,
    averageRating: 4.9,
    reviewCount: 45,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 10,
    name: 'Mama Africa Kitchen & Market',
    slug: 'mama-africa-market',
    description:
      'Vibrant West & East African provisions — fresh plantains, yam tubers, jollof seasonings, egusi seeds, and suya spices.',
    communityId: 6,
    cityId: 1,
    ownerId: 3,
    category: 'Grocery',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
    address: '42 Peckham High Street, London SE15',
    phone: '+44 20 7639 3456',
    subscriptionTier: 'premium',
    isApproved: true,
    averageRating: 4.8,
    reviewCount: 31,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 11,
    name: 'Himalayan Spice Market',
    slug: 'himalayan-spice-market-pending',
    description:
      'Nepali and Tibetan ingredients — timur pepper, gundruk, Jimbu herb, and authentic handmade momo wrappers.',
    communityId: 4,
    cityId: 1,
    ownerId: 3,
    category: 'Grocery',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000&auto=format&fit=crop',
    address: '45 Finchley Road, London NW3',
    phone: '+44 20 7431 8899',
    subscriptionTier: 'basic',
    isApproved: false, // Pending admin approval demo!
    averageRating: null,
    reviewCount: 0,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const products: Product[] = [
  // Al-Madina Superstore (1)
  {
    id: 1,
    storeId: 1,
    name: 'Basmati Rice 5kg',
    description:
      'Premium aged extra-long grain basmati rice from Punjab, Pakistan.',
    priceGbp: '8.99',
    category: 'Rice & Grains',
    inStock: true,
    unit: '5kg bag',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    storeId: 1,
    name: 'Shan Biryani Masala',
    description: 'Authentic Shan spice mix for aromatic Sindhi biryani.',
    priceGbp: '1.99',
    category: 'Spices & Masalas',
    inStock: true,
    unit: '50g packet',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    storeId: 1,
    name: 'Fresh Halal Chicken Whole',
    description: 'Fresh free-range grade-A halal chicken, cleaned and prepped.',
    priceGbp: '7.50',
    category: 'Halal Meat',
    inStock: true,
    unit: 'per kg (approx 1.4kg)',
    imageUrl:
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    storeId: 1,
    name: 'Pure Desi Ghee 500g',
    description: 'Traditional clarified butter made with rich buffalo milk.',
    priceGbp: '5.99',
    category: 'Oils & Fats',
    inStock: true,
    unit: '500g tin',
    imageUrl:
      'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    storeId: 1,
    name: 'Elephant Atta Wholewheat 10kg',
    description: 'Stone-ground golden wholewheat flour for soft chapatis.',
    priceGbp: '11.99',
    category: 'Flour & Grains',
    inStock: true,
    unit: '10kg bag',
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    storeId: 1,
    name: 'Chana Daal 2kg',
    description: 'Split baby chickpeas for creamy daal tadka and halwa.',
    priceGbp: '3.49',
    category: 'Lentils & Pulses',
    inStock: true,
    unit: '2kg bag',
    imageUrl:
      'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    storeId: 1,
    name: 'National Mixed Pickle 1kg',
    description: 'Spicy and tangy traditional Punjabi achar.',
    priceGbp: '3.99',
    category: 'Pickles & Sauces',
    inStock: true,
    unit: '1kg jar',
    imageUrl:
      'https://images.unsplash.com/photo-1589135233689-d5602e1b12b5?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    storeId: 1,
    name: 'Fresh Coriander & Mint Bunch',
    description: 'Crisp aromatic herbs picked daily.',
    priceGbp: '1.20',
    category: 'Fresh Produce',
    inStock: true,
    unit: 'bundle',
    imageUrl:
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Karachi Kitchen (2)
  {
    id: 9,
    storeId: 2,
    name: 'Special Chicken Dum Biryani',
    description: 'Hot & ready spiced chicken biryani with raita and salad.',
    priceGbp: '8.50',
    category: 'Hot Street Food',
    inStock: true,
    unit: 'single portion',
    imageUrl:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 10,
    storeId: 2,
    name: 'Beef Shami Kabab Pack (6 pcs)',
    description:
      'Traditional melt-in-mouth spiced beef shami kababs, ready to pan-fry.',
    priceGbp: '6.99',
    category: 'Frozen Specialties',
    inStock: true,
    unit: 'pack of 6',
    imageUrl:
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 11,
    storeId: 2,
    name: 'Crispy Vegetable Samosas (12 pcs)',
    description: 'Spiced potato and pea samosas in flaky pastry.',
    priceGbp: '5.99',
    category: 'Frozen Specialties',
    inStock: true,
    unit: 'pack of 12',
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 12,
    storeId: 2,
    name: 'Pakola Ice Cream Soda 330ml (Can)',
    description: "Pakistan's iconic cream soda soft drink.",
    priceGbp: '1.29',
    category: 'Drinks',
    inStock: true,
    unit: '330ml can',
    imageUrl:
      'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Punjab Halal Butchers (3)
  {
    id: 13,
    storeId: 3,
    name: 'Halal Baby Goat Meat (Curry Cut)',
    description:
      'Fresh tender diced goat meat on the bone, perfect for slow-cooked salan.',
    priceGbp: '11.50',
    category: 'Halal Meat',
    inStock: true,
    unit: 'per kg',
    imageUrl:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 14,
    storeId: 3,
    name: 'Halal Lamb Chops (Marinated)',
    description:
      'Marinated in yogurt, ginger, garlic, and freshly crushed spices.',
    priceGbp: '13.99',
    category: 'Marinated & BBQ',
    inStock: true,
    unit: 'per kg (approx 8 chops)',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 15,
    storeId: 3,
    name: 'Fresh Minced Lamb (Keema)',
    description: 'Double ground lean halal lamb mince for kebabs and curries.',
    priceGbp: '9.99',
    category: 'Halal Meat',
    inStock: true,
    unit: 'per kg',
    imageUrl:
      'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Bombay Bazaar (4)
  {
    id: 16,
    storeId: 4,
    name: 'Ponni Boiled Rice 5kg',
    description:
      'Finest South Indian grain rice, ideal for sambar rice and rasam.',
    priceGbp: '9.49',
    category: 'Rice & Grains',
    inStock: true,
    unit: '5kg bag',
    imageUrl:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 17,
    storeId: 4,
    name: 'KLF Nirmal Coconut Oil 500ml',
    description: 'Pure 100% edible cold-pressed coconut oil from Kerala.',
    priceGbp: '6.99',
    category: 'Oils & Fats',
    inStock: true,
    unit: '500ml bottle',
    imageUrl:
      'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 18,
    storeId: 4,
    name: 'Amul Salted Butter 500g',
    description: 'The taste of India — imported salted cow milk butter.',
    priceGbp: '4.99',
    category: 'Dairy',
    inStock: true,
    unit: '500g slab',
    imageUrl:
      'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 19,
    storeId: 4,
    name: 'MTR Sambar Powder 200g',
    description:
      'Classic Karnataka recipe spice mix for authentic homemade sambar.',
    priceGbp: '3.29',
    category: 'Spices & Masalas',
    inStock: true,
    unit: '200g tin',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 20,
    storeId: 4,
    name: 'Lijjat Papad (Jeera) 200g',
    description: 'Sun-dried cumin lentil papadums, ready to roast or fry.',
    priceGbp: '1.89',
    category: 'Snacks',
    inStock: true,
    unit: '200g pack',
    imageUrl:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Punjabi Sweet Centre (6)
  {
    id: 21,
    storeId: 6,
    name: 'Fresh Hot Jalebi (500g)',
    description:
      'Crispy, syrupy saffron-infused spiral sweets made hot to order.',
    priceGbp: '6.50',
    category: 'Traditional Sweets',
    inStock: true,
    unit: '500g box',
    imageUrl:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 22,
    storeId: 6,
    name: 'Royal Gulab Jamun Box (1kg)',
    description: 'Soft milk dumplings soaked in cardamom and rose syrup.',
    priceGbp: '9.99',
    category: 'Traditional Sweets',
    inStock: true,
    unit: '1kg box',
    imageUrl:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 23,
    storeId: 6,
    name: 'Kaju Katli Diamond Silver (500g)',
    description:
      'Rich cashew fudge diamond slices garnished with edible silver leaf.',
    priceGbp: '12.50',
    category: 'Mithai Gift Boxes',
    inStock: true,
    unit: '500g gift tin',
    imageUrl:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Sylhet Spice Emporium (7)
  {
    id: 24,
    storeId: 7,
    name: 'Radhuni Pure Mustard Oil 1L',
    description:
      'Pungent cold-pressed mustard oil, the soul of Bengali fish cooking.',
    priceGbp: '4.49',
    category: 'Oils & Fats',
    inStock: true,
    unit: '1 litre bottle',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 25,
    storeId: 7,
    name: 'Sun-Dried Hilsa (Ilish Shutki) 250g',
    description: 'Authentic river Hilsa dried fish imported from Bangladesh.',
    priceGbp: '8.99',
    category: 'Fish & Seafood',
    inStock: true,
    unit: '250g pack',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 26,
    storeId: 7,
    name: 'Pitha Rice Flour 1kg',
    description: 'Fine ground fragrant rice flour for seasonal sweet pithas.',
    priceGbp: '2.89',
    category: 'Flour & Grains',
    inStock: true,
    unit: '1kg pack',
    imageUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Cedar of Lebanon (9)
  {
    id: 27,
    storeId: 9,
    name: 'Wild Lebanese Zaatar Blend 250g',
    description:
      'Hand-harvested wild thyme with sumac and toasted sesame seeds.',
    priceGbp: '4.75',
    category: 'Spices & Herbs',
    inStock: true,
    unit: '250g jar',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 28,
    storeId: 9,
    name: 'Jumbo Medjool Dates 1kg',
    description:
      'Premium soft succulent dates imported from Palestine and Jordan.',
    priceGbp: '10.99',
    category: 'Dried Fruits & Nuts',
    inStock: true,
    unit: '1kg box',
    imageUrl:
      'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 29,
    storeId: 9,
    name: 'Al Kanater Tahini 450g',
    description: '100% pure hulled sesame paste for velvety smooth hummus.',
    priceGbp: '3.99',
    category: 'Pantry Essentials',
    inStock: true,
    unit: '450g tub',
    imageUrl:
      'https://images.unsplash.com/photo-1589135233689-d5602e1b12b5?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },

  // Mama Africa Market (10)
  {
    id: 30,
    storeId: 10,
    name: 'Fresh Plantains (Bundle of 4)',
    description: 'Yellow-ripe sweet plantains for alloco and dodo.',
    priceGbp: '3.50',
    category: 'Fresh Produce',
    inStock: true,
    unit: 'bundle (4 pcs)',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 31,
    storeId: 10,
    name: 'Puna White Yam Tuber (Large)',
    description: 'Premium Ghanaian yam tuber, approx 3.5kg.',
    priceGbp: '7.99',
    category: 'Fresh Produce',
    inStock: true,
    unit: 'approx 3.5kg',
    imageUrl:
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 32,
    storeId: 10,
    name: 'Authentic Suya Pepper Spice Mix 150g',
    description:
      'Smoky spiced peanut pepper rub for authentic Nigerian suya skewers.',
    priceGbp: '3.25',
    category: 'Spices & Seasonings',
    inStock: true,
    unit: '150g pouch',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=600&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
  },
];
