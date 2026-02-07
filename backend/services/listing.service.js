// backend/services/listing.service.js
import Listing from '../models/listing.model.js';
import { redis } from '../utils/redis.js';

const TTL = 60;

export const getListingService = async (id) => {
  const key = `listing:${id}`;

  const cached = await redis.get(key);
  if (cached) {
    console.log('🔥 Redis HIT:', key);
    return JSON.parse(cached);
  }

  console.log('❄️ Redis MISS:', key);
  const listing = await Listing.findById(id);
  if (!listing) return null;

  await redis.setex(key, TTL, JSON.stringify(listing));
  return listing;
};

export const getListingsService = async (query) => {
  const key = `listings:${JSON.stringify(query)}`;

  const cached = await redis.get(key);
  if (cached) {
    console.log('🔥 Redis HIT:', key);
    return JSON.parse(cached);
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
  return listings;
};

export const clearListingCache = async () => {
  const keys = await redis.keys('listing:*');
  const listKeys = await redis.keys('listings:*');
  await redis.del([...keys, ...listKeys]);
};
