# Implementation Plan

- [x] 1. Create new directory structure





  - Create `frontend/` and `backend/` directories
  - Prepare for separate frontend and backend management (no root workspace)
  - _Requirements: 1.1, 1.4_
-

- [-] 2. Migrate frontend code and configuration


- [x] 2.1 Move client code to frontend directory






- [-] 2.1 Move client code to frontend directory

  - Copy all files from `client/` to `frontend/` directory
  - Preserve all existing file structure and permissions
  - _Requirements: 1.1, 1.3_

- [x] 2.2 Update frontend Vite configuration





  - Modify `frontend/vite.config.js` to ensure proper proxy configuration
  - Add build output directory configuration
  - Update any path references for the new structure


  - _Requirements: 2.1, 2.2, 2.3_



- [-] 2.3 Update frontend package.json scripts

  - Verify all npm scripts work with new directory structure
  - Update any path references in scripts if needed
  - _Requirements: 3.1, 4.1_

- [x] 3. Migrate backend code and configuration



- [x] 3.1 Move API code to backend directory



  - Copy all files from `api/` to `backend/` directory
  - Preserve all existing file structure and permissions
  - _Requirements: 1.1, 1.3_

- [x] 3.2 Create backend package.json


  - Extract backend dependencies from root package.json
  - Create new backend/package.json with server-specific dependencies
  - Set up proper start and dev scripts for backend
  - _Requirements: 3.1, 3.2, 4.1_



- [x] 3.3 Update backend static file serving paths

  - Modify backend/index.js to serve frontend build files from correct path
  - Update static file middleware to reference `../frontend/dist`
  - Update SPA fallback route to serve from new frontend location


  - _Requirements: 1.3, 2.3, 4.2_

- [x] 3.4 Update backend environment loading

  - Modify .env file loading logic to work with new directory structure
  - Update environment path resolution in backend/index.js
  - Test environment variable loading from multiple locations
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Update environment configuration and cleanup root




- [x] 4.1 Update environment configuration files


  - Move .env to backend directory for backend-specific variables
  - Create .env.local template for frontend if needed
  - Update .env.example to reflect new structure and document which variables go where
  - _Requirements: 5.1, 5.4_

- [x] 4.2 Clean up root directory


  - Remove root package.json (backend dependencies now in backend/package.json)
  - Keep only essential root files (.gitignore, README, .env.example)
  - Update .gitignore if needed for new structure
  - _Requirements: 3.2, 4.4_

- [ ] 5. Clean up old structure and verify functionality
- [ ] 5.1 Remove old client and api directories
  - Delete original `client/` directory after verifying frontend works
  - Delete original `api/` directory after verifying backend works
  - Clean up any remaining references to old paths
  - _Requirements: 1.3_

- [ ] 5.2 Test development workflow
  - Verify `cd frontend && npm run dev` starts frontend development server
  - Verify `cd backend && npm run dev` starts backend development server  
  - Test running both servers in separate terminals
  - Verify API proxy works correctly between frontend and backend
  - _Requirements: 2.2, 4.1, 4.2_

- [ ] 5.3 Test production build process
  - Run `cd frontend && npm run build` and verify frontend assets are generated
  - Test backend serving of frontend static files in production mode
  - Verify all existing API endpoints work with new structure
  - _Requirements: 4.2, 4.3, 1.3_

- [ ] 6. Update project documentation
- [ ] 6.1 Update README and development instructions
  - Document new directory structure in README
  - Update development setup instructions (cd frontend && npm run dev, cd backend && npm run dev)
  - Add deployment instructions for separate frontend/backend
  - Document environment variable setup for both parts
  - _Requirements: 4.4_