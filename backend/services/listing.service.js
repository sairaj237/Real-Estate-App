import Listing from '../models/listing.model.js';
import { redis } from '../utils/redis.js';

const TTL = 60; // cache time in seconds

// ---------- helpers ----------
const buildFilters = (query) => {
  const {
    searchTerm = '',
    offer,
    furnished,
    parking,
    type,
  } = query;

  return {
    name: { $regex: searchTerm, $options: 'i' },
    offer: offer === undefined ? { $in: [true, false] } : offer,
    furnished: furnished === undefined ? { $in: [true, false] } : furnished,
    parking: parking === undefined ? { $in: [true, false] } : parking,
    type:
      type === undefined || type === 'all'
        ? { $in: ['sale', 'rent'] }
        : type,
  };
};

// ---------- READ ----------
export const getListingService = async (id) => {
  const key = `listing:${id}`;

  const cached = await redis.get(key);
  if (cached) {
    return { data: JSON.parse(cached), cache: 'HIT' };
  }

  const listing = await Listing.findById(id);
  if (!listing) return null;

  await redis.setex(key, TTL, JSON.stringify(listing));
  return { data: listing, cache: 'MISS' };
};

export const getListingsService = async (query) => {
  const key = `listings:${JSON.stringify(query)}`;

  const cached = await redis.get(key);
  if (cached) {
    return { data: JSON.parse(cached), cache: 'HIT' };
  }

  const {
    limit = 9,
    startIndex = 0,
    sort = 'createdAt',
    order = 'desc',
  } = query;

  const listings = await Listing.find(buildFilters(query))
    .sort({ [sort]: order })
    .limit(Number(limit))
    .skip(Number(startIndex));

  await redis.setex(key, TTL, JSON.stringify(listings));
  return { data: listings, cache: 'MISS' };
};

// ---------- WRITE (invalidate cache) ----------
export const createListingService = async (payload) => {
  const listing = await Listing.create(payload);
  await clearListingCache();
  return listing;
};

export const updateListingService = async (id, payload) => {
  const updated = await Listing.findByIdAndUpdate(id, payload, { new: true });
  await clearListingCache();
  return updated;
};

export const deleteListingService = async (id) => {
  await Listing.findByIdAndDelete(id);
  await clearListingCache();
};

// ---------- cache invalidation ----------
export const clearListingCache = async () => {
  const keys = await redis.keys('listing:*');
  const listKeys = await redis.keys('listings:*');
  if (keys.length || listKeys.length) {
    await redis.del([...keys, ...listKeys]);
  }
};
