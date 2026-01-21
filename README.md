# MERN Estate Application

A full-stack real estate application built with MongoDB, Express, React, and Node.js.

## Project Structure

```
project-root/
├── frontend/        # React application (Vite + TailwindCSS)
├── backend/         # Express API server
├── .env.example     # Environment configuration template
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
2. Set up environment variables:
   ```bash
   # Copy and configure backend environment
   cp .env.example backend/.env
   # Edit backend/.env with your actual values
   
   # Copy and configure frontend environment (if needed)
   cp .env.example frontend/.env.local
   # Edit frontend/.env.local with your actual values
   ```

3. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend && npm install
   
   # Install backend dependencies
   cd ../backend && npm install
   ```

### Running the Application

#### Development Mode

Run frontend and backend separately in different terminals:

```bash
# Terminal 1: Start frontend development server
cd frontend
npm run dev

# Terminal 2: Start backend development server
cd backend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:3000`.

#### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves frontend static files)
cd ../backend
npm start
```

## Environment Variables

### Backend (.env)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `OPENROUTER_API_KEY` - OpenRouter API key
- `PINECONE_API_KEY` - Pinecone vector database API key
- `PINECONE_ENVIRONMENT` - Pinecone environment
- `PINECONE_INDEX` - Pinecone index name
- `PORT` - Server port (default: 3000)

### Frontend (.env.local)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000)

## Features

- User authentication and authorization
- Property listings and search
- AI-powered property recommendations
- Vector-based property matching
- Responsive design with TailwindCSS

## Technology Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Redux Toolkit
- React Router

### Backend
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- OpenAI Integration
- Pinecone Vector Database
- Winston Logging

## API Documentation

The API is available at `/api/*` routes when running the backend server. Key endpoints include:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/properties` - Get property listings
- `POST /api/properties` - Create new property
- `GET /api/search` - Search properties with AI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.