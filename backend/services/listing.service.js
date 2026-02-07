import Listing from '../models/listing.model.js';
import { redis } from '../utils/redis.js';

const TTL = 60;

// CREATE
export const createListingService = async (data) => {
  const listing = await Listing.create(data);
  await clearListingCache();
  return listing;
};

// DELETE
export const deleteListingService = async (id) => {
  const listing = await Listing.findByIdAndDelete(id);
  await clearListingCache();
  return listing;
};

// UPDATE
export const updateListingService = async (id, data) => {
  const listing = await Listing.findByIdAndUpdate(id, data, { new: true });
  await clearListingCache();
  return listing;
};

// GET ONE
export const getListingService = async (id) => {
  const key = `listing:${id}`;

  const cached = await redis.get(key);
  if (cached) {
    console.log('🔥 Redis HIT:', key);
    return { data: JSON.parse(cached), cache: 'HIT' };
  }

  console.log('❄️ Redis MISS:', key);
  const listing = await Listing.findById(id);
  if (!listing) return null;

  await redis.setex(key, TTL, JSON.stringify(listing));
  return { data: listing, cache: 'MISS' };
};

// GET MANY
export const getListingsService = async (query) => {
  const key = `listings:${JSON.stringify(query)}`;

  const cached = await redis.get(key);
  if (cached) {
    console.log('🔥 Redis HIT:', key);
    return { data: JSON.parse(cached), cache: 'HIT' };
  }

  console.log('❄️ Redis MISS:', key);

  const {
    limit = 9,
    startIndex = 0,
    offer,
    furnished,
    parking,
    type,
    searchTerm = '',
    sort = 'createdAt',
    order = 'desc',
  } = query;

  const filters = {
    name: { $regex: searchTerm, $options: 'i' },
    offer: offer ?? { $in: [true, false] },
    furnished: furnished ?? { $in: [true, false] },
    parking: parking ?? { $in: [true, false] },
    type: type === 'all' || !type ? { $in: ['sale', 'rent'] } : type,
  };

  const listings = await Listing.find(filters)
    .sort({ [sort]: order })
    .limit(Number(limit))
    .skip(Number(startIndex));

  await redis.setex(key, TTL, JSON.stringify(listings));
  return { data: listings, cache: 'MISS' };
};

export const clearListingCache = async () => {
  const keys = await redis.keys('listing:*');
  const listKeys = await redis.keys('listings:*');
  await redis.del([...keys, ...listKeys]);
};
