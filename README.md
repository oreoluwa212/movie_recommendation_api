# Movie Recommendation API

## Overview

A comprehensive REST API for a movie recommendation platform with user authentication, movie discovery, watchlists, and reviews.

## Features

- User authentication with JWT
- Movie search and discovery via TMDB API
- Personal watchlists management
- Movie reviews and ratings
- Favorite movies tracking
- User profile management
- Personalized recommendations

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/movie_recommendation
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 2. Installation

```bash
npm install
```

### 3. Database Setup

Ensure MongoDB is running locally or provide a cloud MongoDB URI.

### 4. TMDB API Setup

1. Sign up at https://www.themoviedb.org/
2. Get your API key from account settings
3. Add it to your `.env` file

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Movies

- `GET /api/movies/search` - Search movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/discover/popular` - Get popular movies
- `GET /api/movies/discover/top-rated` - Get top rated movies
- `GET /api/movies/genre/:genreId` - Get movies by genre
- `GET /api/movies/data/genres` - Get all genres
- `GET /api/movies/recommendations/personalized` - Get personalized recommendations

### Users

- `PUT /api/users/profile` - Update user profile
- `POST /api/users/favorites` - Add movie to favorites
- `DELETE /api/users/favorites/:movieId` - Remove from favorites
- `GET /api/users/favorites` - Get user favorites
- `POST /api/users/watched` - Add to watched movies
- `GET /api/users/watched` - Get watched movies

### Watchlists

- `POST /api/watchlists` - Create watchlist
- `GET /api/watchlists` - Get user watchlists
- `GET /api/watchlists/:id` - Get specific watchlist
- `PUT /api/watchlists/:id` - Update watchlist
- `DELETE /api/watchlists/:id` - Delete watchlist
- `POST /api/watchlists/:id/movies` - Add movie to watchlist
- `DELETE /api/watchlists/:id/movies/:movieId` - Remove movie from watchlist
- `GET /api/watchlists/public/all` - Get public watchlists

### Reviews

- `POST /api/reviews` - Create/update review
- `GET /api/reviews/movie/:movieId` - Get movie reviews
- `GET /api/reviews/user/me` - Get user reviews
- `GET /api/reviews/:id` - Get specific review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/user/movie/:movieId` - Get user's review for movie

## Response Format

All endpoints return JSON responses in the following format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

## Error Handling

Errors are returned in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Applied to all `/api/` routes

## Database Models

### User

- Authentication fields (username, email, password)
- User preferences (theme, favorite genres)
- Favorite movies array
- Watched movies array

### Movie

- TMDB movie data cache
- User ratings and reviews aggregation

### Review

- User reviews and ratings for movies
- Spoiler warnings
- One review per user per movie

### Watchlist

- Custom movie lists
- Public/private visibility
- Movies array with metadata

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Request rate limiting
- Input validation
- CORS configuration
- Security headers with Helmet

## Development

The API is built with:

- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- TMDB API integration
- Comprehensive error handling
- Input validation
- Security best practices
