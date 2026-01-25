# JoGigs API Documentation

**Base URL**: `http://localhost:3000/api`

## Authentication (`/auth`)

### 1. Register User
- **Endpoint**: `POST /auth/signup`
- **Access**: Public
- **Body**:
  ```json
  {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "securePassword123",
    "accountType": "customer" // or "professional"
  }
  ```
- **Response**: Created User object (excluding password).

### 2. Login
- **Endpoint**: `POST /auth/signin`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securePassword123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Success",
    "user": { ...userObject... }
  }
  ```
- **Cookies Set**:
  - `access_token` (HttpOnly, 15 min)
  - `refresh_token` (HttpOnly, 7 days)

### 3. Log Out
- **Endpoint**: `GET /auth/logout`
- **Access**: Authenticated (Any Role)
- **Effect**: Clears cookies and invalidates the specific session in the database.

### 4. Refresh Token
- **Endpoint**: `GET /auth/refresh`
- **Access**: Public (requires valid `refresh_token` cookie)
- **Effect**: Rotates tokens. Issues new `access_token` and `refresh_token`.

---

## Service Listings (`/services`)

### 1. Get All Services (Feed)
- **Endpoint**: `GET /services`
- **Access**: Public
- **Response**: Array of Service objects with Professional details.
  ```json
  [
    {
      "id": 1,
      "title": "Fixing Faucets",
      "description": "...",
      "price": 50.00,
      "rating": 0,
      "professional": { ...userObject... }
    }
  ]
  ```

### 2. Create Service
- **Endpoint**: `POST /services`
- **Access**: **Professional Only**
- **Body**:
  ```json
  {
    "title": "Home Cleaning",
    "description": "Full house cleaning service.",
    "price": 100.00
  }
  ```

### 3. Get My Services (Dashboard)
- **Endpoint**: `GET /services/my`
- **Access**: **Professional Only**
- **Response**: Array of services created by the logged-in user.

### 4. Delete Service
- **Endpoint**: `DELETE /services/:id`
- **Access**: **Professional Only** (Can only delete own services)
- **Response**: Deletion result.

---

## Types

### User Type Enum
- `customer`
- `professional`
