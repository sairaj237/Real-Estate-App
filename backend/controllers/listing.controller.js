import { errorHandler } from '../utils/error.js';
import {
  createListingService,
  deleteListingService,
  updateListingService,
  getListingService,
  getListingsService,
} from '../services/listing.service.js';

// CREATE
export const createListing = async (req, res, next) => {
  try {
    const listing = await createListingService(req.body);
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

// DELETE
export const deleteListing = async (req, res, next) => {
  try {
    await deleteListingService(req.params.id);
    res.status(200).json('Listing deleted');
  } catch (error) {
    next(error);
  }
};

// UPDATE
export const updateListing = async (req, res, next) => {
  try {
    const updated = await updateListingService(req.params.id, req.body);
    if (!updated) return next(errorHandler(404, 'Listing not found'));
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

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

  const listings = await Listing.find(/* filters */);

  await redis.setex(key, TTL, JSON.stringify(listings));
  return { data: listings, cache: 'MISS' };
};
