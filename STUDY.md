# Node.js Application Architecture: Component Interactions

## 1. The Request Lifecycle

```
Client Request → Express App → Middleware → Routes → Controllers → Models → Database
       ↑                                                                  ↓
       └────────────────────────── Response ─────────────────────────────┘
```

## 2. Component Breakdown

### 2.1 Models (Database Layer)

**Purpose**: 
- Define data structure and schema
- Handle database operations
- Enforce data validation rules

**Location**: `/models/`

**Example**: `user.model.js`
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};

module.exports = mongoose.model('User', userSchema);
```

**Used By**:
- Controllers (to interact with database)
- Other models (for relationships)

### 2.2 Controllers (Business Logic)

**Purpose**:
- Handle request/response cycle
- Contain business logic
- Process data before/after database operations

**Location**: `/controllers/`

**Example**: `auth.controller.js`
```javascript
const User = require('../models/user.model');
const { generateToken } = require('../utils/auth');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Create user
    const user = await User.create({ username, email, password });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};
```

**Uses**:
- Models (for database operations)
- Utils (for helper functions)

**Used By**:
- Routes (to handle specific endpoints)

### 2.3 Routes (API Endpoints)

**Purpose**:
- Define API endpoints
- Map URLs to controller methods
- Apply middleware

**Location**: `/routes/`

**Example**: `auth.routes.js`
```javascript
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middleware/validate');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
// router.get('/profile', protect, getProfile);

module.exports = router;
```

**Uses**:
- Controllers (to handle requests)
- Middleware (for validation, authentication)

**Used By**:
- Server.js (to register routes)

### 2.4 Middleware

**Purpose**:
- Process requests before they reach controllers
- Handle cross-cutting concerns

**Location**: `/middleware/`

**Types**:
1. **Authentication**
   ```javascript
   // auth.js
   const jwt = require('jsonwebtoken');
   const User = require('../models/user.model');

   exports.protect = async (req, res, next) => {
     try {
       let token;
       if (req.headers.authorization?.startsWith('Bearer')) {
         token = req.headers.authorization.split(' ')[1];
       }
       
       if (!token) {
         throw new Error('Not authorized');
       }

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = await User.findById(decoded.id).select('-password');
       next();
     } catch (error) {
       next(error);
     }
   };
   ```

2. **Validation**
   ```javascript
   // validate.js
   const { body, validationResult } = require('express-validator');

   exports.validateRegister = [
     body('username').notEmpty().withMessage('Username is required'),
     body('email').isEmail().withMessage('Please include a valid email'),
     body('password')
       .isLength({ min: 6 })
       .withMessage('Password must be at least 6 characters'),
     (req, res, next) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
       }
       next();
     }
   ];
   ```

**Used By**:
- Routes (to protect/validate endpoints)

### 2.5 Utils (Utilities)

**Purpose**:
- Reusable helper functions
- Constants and configurations

**Location**: `/utils/`

**Examples**:
1. **Error Handling**
   ```javascript
   // error.js
   class AppError extends Error {
     constructor(message, statusCode) {
       super(message);
       this.statusCode = statusCode;
       this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
       this.isOperational = true;
       Error.captureStackTrace(this, this.constructor);
     }
   }

   module.exports = AppError;
   ```

2. **Authentication**
   ```javascript
   // auth.js
   const jwt = require('jsonwebtoken');
   const { promisify } = require('util');

   exports.generateToken = (id) => {
     return jwt.sign({ id }, process.env.JWT_SECRET, {
       expiresIn: process.env.JWT_EXPIRES_IN
     });
   };

   exports.verifyToken = promisify(jwt.verify);
   ```

**Used By**:
- Controllers
- Middleware
- Other utils

## 3. Complete Flow Example: User Registration

1. **Request Received**
   ```
   POST /api/auth/register
   {
     "username": "johndoe",
     "email": "john@example.com",
     "password": "password123"
   }
   ```

2. **Route Handling** (`/routes/auth.routes.js`)
   ```javascript
   router.post('/register', validateRegister, register);
   ```

3. **Validation Middleware** (`/middleware/validate.js`)
   - Validates request body
   - Returns errors if validation fails

4. **Controller** (`/controllers/auth.controller.js`)
   - Processes the request
   - Uses User model to create new user
   - Returns success response

5. **Response Sent**
   ```json
   {
     "success": true,
     "token": "jwt.token.here",
     "user": {
       "id": "123",
       "username": "johndoe",
       "email": "john@example.com"
     }
   }
   ```

## 4. Best Practices

1. **Separation of Concerns**
   - Each component should have a single responsibility
   - Keep business logic in controllers
   - Keep database logic in models

2. **Error Handling**
   - Use centralized error handling
   - Create custom error classes
   - Log errors appropriately

3. **Security**
   - Validate all inputs
   - Sanitize user data
   - Use environment variables for secrets

4. **Code Organization**
   - Group related files
   - Use consistent naming conventions
   - Document complex logic
