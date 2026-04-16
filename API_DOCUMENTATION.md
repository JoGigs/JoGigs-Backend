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

## Profiles (`/profile`)

### 1. Get My Profile
- **Endpoint**: `GET /profile`
- **Access**: Authenticated (Any Role)
- **Response**: The authenticated user's object (excluding password).

### 2. Update Profile
- **Endpoint**: `PATCH /profile`
- **Access**: Authenticated (Any Role)
- **Body** (all fields optional):
  ```json
  {
    "fullName": "Jane Doe",
    "location": "New York",
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
  }
  ```
  *Note: If changing the password, both `currentPassword` and `newPassword` must be provided.*

---

## Real-Time Chat (WebSockets)

**Namespace**: `ws://localhost:3000/chat`
**Authentication**: Requires the `access_token` cookie to be present on the handshake (handled automatically by browser).

### WebSocket Events

| Event Direction  | Event Name              | Payload Model                                           | Description                                                |
|------------------|-------------------------|---------------------------------------------------------|------------------------------------------------------------|
| Client -> Server | `sendMessage`           | `{ "receiverId": 2, "content": "Hello!" }`               | Send a message to another user.                            |
| Server -> Client | `messageSent`           | `Message` object (contains `id`, `createdAt`, etc.)      | Confirmation to the sender that the message was saved.     |
| Server -> Client | `newMessage`            | `Message` object                                        | Emitted to the receiver instantly if they are online.      |
| Client -> Server | `getConversation`       | `{ "withUserId": 2 }`                                   | Request chat history with a specific user.                 |
| Server -> Client | `conversationHistory`   | `Message[]`                                             | Array of messages for the requested conversation.          |
| Client -> Server | `getConversationList`   | *(none)*                                                | Request a list of all active conversations.                |
| Server -> Client | `conversationList`      | `Message[]`                                             | The *latest* single message from each distinct chat.       |

---

## Bookings (`/bookings`)

### 1. Create a Booking Request
- **Endpoint**: `POST /bookings`
- **Access**: **Customer Only**
- **Body**:
  ```json
  {
    "serviceListingId": 1
  }
  ```
- **Response**: Created `Booking` object with status `pending`.

### 2. Get My Bookings (Customer)
- **Endpoint**: `GET /bookings/my-bookings`
- **Access**: **Customer Only**
- **Response**: Array of `Booking` objects requested by the customer (includes populated `serviceListing`).

### 3. Get My Jobs (Professional)
- **Endpoint**: `GET /bookings/my-jobs`
- **Access**: **Professional Only**
- **Response**: Array of `Booking` objects placed on the professional's services (includes populated `serviceListing` and `customer`).

### 4. Respond to Booking
- **Endpoint**: `PATCH /bookings/:id/respond`
- **Access**: **Professional Only**
- **Body**:
  ```json
  {
    "status": "accepted" // or "declined"
  }
  ```

### 5. Complete Booking
- **Endpoint**: `PATCH /bookings/:id/complete`
- **Access**: **Professional Only**
- **Effect**: Marks a currently `accepted` job as `completed` (ready for rating).

---

## Types

### 1. User Type Enum
- `customer`
- `professional`

### 2. Booking Status Enum
- `pending`
- `accepted`
- `declined`
- `completed`
