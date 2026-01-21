# Design Document

## Overview

This design outlines the restructuring of the current MERN estate application from a mixed monorepo structure (`client/` and `api/` folders) to a clean separation with dedicated `frontend/` and `backend/` directories. The restructuring will maintain all existing functionality while providing better organization for production deployment and independent scaling.

## Architecture

### Current Structure
```
project-root/
├── client/          # React frontend
├── api/             # Express backend
├── package.json     # Root package with backend deps
├── .env             # Shared environment
└── .gitignore
```

### Target Structure
```
project-root/
├── frontend/        # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.local
├── backend/         # Express API server
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── scripts/
│   ├── package.json
│   ├── index.js
│   └── .env
├── package.json     # Workspace root
├── .env.example
└── .gitignore
```

## Components and Interfaces

### Frontend Component (React + Vite)
- **Location**: `frontend/` directory
- **Technology Stack**: React 18, Vite 4, TailwindCSS, Redux Toolkit
- **Build Output**: `frontend/dist/` for production assets
- **Development Server**: Vite dev server on port 5173
- **API Communication**: Proxy configuration for `/api/*` routes to backend

### Backend Component (Express API)
- **Location**: `backend/` directory  
- **Technology Stack**: Express, MongoDB/Mongoose, JWT authentication
- **Entry Point**: `backend/index.js`
- **Static Serving**: Serve frontend build files in production
- **API Endpoints**: All routes prefixed with `/api/`

### Workspace Root
- **Purpose**: Coordinate builds and provide shared tooling
- **Package Management**: Root package.json for workspace scripts
- **Environment**: Shared .env.example template

## Data Models

### Package.json Structure

#### Root Package.json
```json
{
  "name": "mern-estate",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev --prefix frontend",
    "dev:backend": "npm run dev --prefix backend", 
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "npm run build --prefix frontend",
    "build:backend": "npm install --prefix backend",
    "start": "npm start --prefix backend",
    "install:all": "npm install && npm install --prefix frontend && npm install --prefix backend"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

#### Frontend Package.json
- Inherits current `client/package.json` structure
- Maintains all React, Vite, and UI dependencies
- Updates build output path if needed

#### Backend Package.json  
- Contains current root dependencies (Express, MongoDB, etc.)
- Maintains all server-side dependencies
- Updates start script to reference correct entry point

### Environment Configuration

#### Frontend Environment (.env.local)
```
VITE_API_URL=http://localhost:3000
```

#### Backend Environment (.env)
```
MONGO_URI=mongodb://localhost:27017/mern-estate
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-pinecone-env
PINECONE_INDEX=your-pinecone-index
PORT=3000
```

## Configuration Updates

### Vite Configuration (frontend/vite.config.js)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

### Backend Static File Serving (backend/index.js)
```javascript
// Update static file path to serve frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

### Environment Loading (backend/index.js)
```javascript
// Update .env path resolution for new structure
const envPaths = [
  resolve(__dirname, '.env'),
  resolve(__dirname, '..', '.env'),
  resolve(process.cwd(), '.env')
];
```

## Error Handling

### Migration Risks
1. **Path Resolution Issues**: File paths in imports and static serving need updates
2. **Environment Variable Loading**: Backend .env loading logic needs adjustment  
3. **Build Script Failures**: Package.json scripts need proper path prefixes
4. **Proxy Configuration**: Vite proxy must maintain correct backend targeting

### Mitigation Strategies
1. **Incremental Migration**: Move files in stages, test at each step
2. **Path Validation**: Verify all relative imports and file references
3. **Environment Testing**: Test .env loading in both development and production
4. **Backup Strategy**: Maintain git commits at each migration milestone

### Rollback Plan
- Git-based rollback to pre-migration state
- Preserve original structure in separate branch during migration
- Document all configuration changes for easy reversal

## Testing Strategy

### Development Environment Testing
1. **Frontend Development Server**: Verify `npm run dev:frontend` starts correctly
2. **Backend Development Server**: Verify `npm run dev:backend` starts correctly  
3. **Concurrent Development**: Test `npm run dev` runs both servers
4. **API Proxy**: Verify frontend can communicate with backend via proxy

### Build Process Testing
1. **Frontend Build**: Verify `npm run build:frontend` generates correct assets
2. **Backend Preparation**: Verify `npm run build:backend` installs dependencies
3. **Full Build**: Test `npm run build` completes successfully
4. **Production Serving**: Verify backend serves frontend static files correctly

### Integration Testing
1. **Authentication Flow**: Test login/logout functionality end-to-end
2. **API Endpoints**: Verify all existing API routes work correctly
3. **File Uploads**: Test any file upload functionality with new paths
4. **Environment Variables**: Verify all environment variables load correctly

### Deployment Testing
1. **Production Build**: Test production build process
2. **Static File Serving**: Verify frontend assets serve correctly from backend
3. **Environment Configuration**: Test production environment variable loading
4. **Performance**: Verify no performance regression from restructuring

## Implementation Phases

### Phase 1: Workspace Setup
- Create new directory structure
- Set up root package.json with workspace scripts
- Configure git to track new structure

### Phase 2: Frontend Migration  
- Move client/ contents to frontend/
- Update Vite configuration for new structure
- Test frontend development server

### Phase 3: Backend Migration
- Move api/ contents to backend/  
- Update backend package.json and entry point
- Update static file serving paths
- Test backend development server

### Phase 4: Integration & Testing
- Update root scripts for concurrent development
- Test full development workflow
- Verify production build process
- Update documentation and README