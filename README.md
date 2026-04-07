# Portfolio SignBook API Documentation

A robust, secure REST API for managing user signatures with OAuth integration and admin controls.

## Overview

The Portfolio SignBook API allows users to:
- Authenticate via OAuth (GitHub, Google, LinkedIn)
- Create and manage up to 3 signatures
- View a public registry of all users with signatures
- Admin can pin/unpin users for featured display

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Passport.js** for OAuth authentication
- **JWT** for stateless authentication
- **Helmet**, **CORS**, **Rate Limiting** for security

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/db_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
REFRESH_SECRET=your_refresh_secret_key

# OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Portfolio Owner OAuth ID (for admin access)
PORTFOLIO_OWNER_OAUTH_ID=your_portfolio_owner_oauth_id

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. Start the server:
```bash
npm start
# or for development
npm run dev
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### OAuth Login
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/google` - Initiate Google OAuth  
- `GET /api/auth/linkedin` - Initiate LinkedIn OAuth

#### OAuth Callbacks
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/linkedin/callback` - LinkedIn OAuth callback

#### User Management
- `GET /api/auth/profile` - Get current user profile (protected)
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)

### Registry Routes (`/api/registry`)

#### Public Routes
- `GET /api/registry` - Fetch all users with pagination

#### Protected Routes (require authentication)
- `POST /api/registry/sign` - Add a new signature
- `PUT /api/registry/edit/:sigId` - Update a specific signature

#### Admin Routes (require portfolio owner access)
- `PATCH /api/registry/pin/:userId` - Toggle user pin status

## API Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "message": "Descriptive message",
  "data": {
    // Response data
  },
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Detailed Endpoint Documentation

### GET /api/registry

Fetch all users with pagination and sorting.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of users per page (1-50, default: 10)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "oauthId": "github_123",
        "name": "John Doe",
        "profileImg": "https://example.com/avatar.jpg",
        "provider": "github",
        "isPinned": true,
        "signatures": [
          {
            "id": "sig_uuid",
            "content": "Great portfolio!",
            "timestamp": "2023-12-01T10:00:00.000Z"
          }
        ],
        "createdAt": "2023-12-01T09:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Sorting Logic:**
1. Pinned users first (`isPinned: true`)
2. Then by latest signature timestamp (descending)
3. Users without signatures sort by creation date

### POST /api/registry/sign

Add a new signature for the authenticated user.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "content": "Your signature text (1-256 characters)"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Signature added successfully",
  "data": {
    "user": {
      // Updated user object with new signature
    }
  }
}
```

**Error Responses:**
- `403 Forbidden`: User already has 3 signatures
- `401 Unauthorized`: Invalid or missing JWT token

### PUT /api/registry/edit/:sigId

Update a specific signature.

**Headers:**
- `Authorization: Bearer <jwt_token>`

**URL Parameters:**
- `sigId`: UUID of the signature to update

**Request Body:**
```json
{
  "content": "Updated signature text (1-256 characters)"
}
```

**Error Responses:**
- `404 Not Found`: Signature not found or doesn't belong to user
- `401 Unauthorized`: Invalid or missing JWT token

### PATCH /api/registry/pin/:userId

Toggle pin status for a user (admin only).

**Headers:**
- `Authorization: Bearer <jwt_token>`

**URL Parameters:**
- `userId`: MongoDB ObjectId of the user

**Response Example:**
```json
{
  "success": true,
  "message": "User pinned successfully",
  "data": {
    "user": {
      // Updated user object with new pin status
    }
  }
}
```

**Error Responses:**
- `403 Forbidden`: Not authorized (not portfolio owner)
- `404 Not Found`: User not found

## Data Models

### User Schema

```javascript
{
  oauthId: String (required, unique),
  name: String (required, max 100 chars),
  profileImg: String (required),
  provider: String (required, enum: ['github', 'google', 'linkedin']),
  isPinned: Boolean (default: false),
  signatures: [
    {
      id: String (auto-generated UUID),
      content: String (required, max 256 chars),
      timestamp: Date (default: current date)
    }
  ]
}
```

## Security Features

### Authentication
- OAuth 2.0 integration with GitHub, Google, LinkedIn
- JWT tokens for stateless authentication
- Token expiration and refresh mechanism

### Authorization
- Role-based access control (user vs admin)
- Portfolio owner verification for admin operations
- Signature ownership validation

### Security Middleware
- **Helmet**: Security headers and CSP
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Prevent abuse and spam
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

### Rate Limiting
- Global: 100 requests per 15 minutes per IP
- Signature endpoint: 5 requests per minute per IP

## Error Handling

The API provides comprehensive error handling:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message",
      "value": "submitted_value"
    }
  ]
}
```

### Common Error Codes
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication required/invalid
- `403 Forbidden`: Authorization required
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Development

### Running Tests
```bash
npm test
```

### Environment Variables
The application uses environment variables for configuration. See the `.env.example` file for all available options.

### Database Schema
The MongoDB schema is automatically created on first run. No manual setup required.

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URI
3. Set up OAuth applications for each provider
4. Configure CORS with your production domain
5. Set up SSL/TLS termination

### Security Considerations
- Use HTTPS in production
- Keep JWT secrets secure
- Regularly rotate secrets
- Monitor rate limiting and abuse
- Keep dependencies updated

## Frontend Integration

### OAuth Flow
1. Redirect user to `/api/auth/{provider}`
2. User authenticates with OAuth provider
3. Provider redirects to callback URL with token
4. Frontend receives token and stores it
5. Include token in `Authorization: Bearer <token>` header

### Example Frontend Code
```javascript
// Login with GitHub
window.location.href = '/api/auth/github';

// After callback, extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
localStorage.setItem('jwtToken', token);

// Make authenticated request
fetch('/api/registry/sign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ content: 'Great portfolio!' })
});
```

## Support

For issues and questions, please refer to the API documentation or contact the development team.
