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
  } catch (err) {
    next(err);
  }
};

// DELETE
export const deleteListing = async (req, res, next) => {
  try {
    await deleteListingService(req.params.id);
    res.status(200).json('Listing deleted');
  } catch (err) {
    next(err);
  }
};

// UPDATE
export const updateListing = async (req, res, next) => {
  try {
    const listing = await updateListingService(req.params.id, req.body);
    if (!listing) return next(errorHandler(404, 'Listing not found'));
    res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
};

// GET ONE
export const getListing = async (req, res, next) => {
  try {
    const result = await getListingService(req.params.id);
    if (!result) return next(errorHandler(404, 'Listing not found'));

    res.setHeader('X-Cache', result.cache);
    res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
};

// GET MANY
export const getListings = async (req, res, next) => {
  try {
    const result = await getListingsService(req.query);
    res.setHeader('X-Cache', result.cache);
    res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
};
