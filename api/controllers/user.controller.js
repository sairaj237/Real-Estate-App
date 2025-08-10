import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import Listing from '../models/listing.model.js';

export const test = (req, res) => {
  res.json({
    message: 'Api route is working!',
  });
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only update your own account!'));
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, 'You can only delete your own account!'));
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie('access_token');
    res.status(200).json('User has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const getUserListings = async (req, res, next) => {
  try {
    // Verify that the user is requesting their own listings
    if (req.user._id.toString() !== req.params.id) {
      return next(errorHandler(401, 'You can only view your own listings!'));
    }
    
    const listings = await Listing.find({ userRef: req.params.id });
    res.status(200).json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    next(errorHandler(500, 'Failed to fetch listings'));
  }
};

export const getUser = async (req, res, next) => {
  try {
    
    const user = await User.findById(req.params.id);
  
    if (!user) return next(errorHandler(404, 'User not found!'));
  
    const { password: pass, ...rest } = user._doc;
  
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

export const checkAuth = async (req, res, next) => {
  try {
    // If we get here, the verifyToken middleware has already validated the token
    // The user ID is stored in req.user._id (not req.user.id)
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      console.error('User not found in database for ID:', req.user._id);
      return next(errorHandler(404, 'User not found'));
    }
    
    console.log('User found in checkAuth:', { id: user._id, email: user.email });
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Error in checkAuth:', error);
    next(errorHandler(500, 'Error checking authentication status'));
  }
};
