# Library Management System

## Project Overview

This is a full-stack Library Management System with:
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Vite
- **Authentication**: JWT-based login with role-based authorization

Two user roles are supported:
- **Librarian**: manage inventory and members
- **Member**: browse, borrow, and return books

Default local ports:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JSON Web Token (`jsonwebtoken`)
- `bcryptjs`
- `express-validator`
- `cors`, `helmet`, `morgan`
- `csv-parser` (for seeding books from CSV)

### Frontend
- React
- Vite
- Axios
- React Router DOM
- Custom CSS

## Installation Steps

1. **Clone and enter project**
   ```bash
   git clone <your-repo-url>
   cd "Library Management System - mark anthony"
   ```

2. **Install dependencies (root + workspaces)**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   copy backend\.env.example backend\.env
   ```

4. **Start MongoDB** (local service or Atlas)

5. **Seed books from CSV (optional but recommended)**
   ```bash
   npm run seed
   ```

6. **Run both frontend and backend**
   ```bash
   npm run dev
   ```

### Run separately (optional)

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Environment Variables

Create `backend\.env` using this template:

```env
PORT=5000
DATABASE_URL=mongodb://127.0.0.1:27017/library-management
JWT_SECRET=replace-with-a-strong-secret
CLIENT_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `CLIENT_URL` | Frontend URL for CORS |

## Database Setup

### Option 1: Local MongoDB
1. Install MongoDB Community Server
2. Start MongoDB service
3. Keep `DATABASE_URL` as:
   ```env
   DATABASE_URL=mongodb://127.0.0.1:27017/library-management
   ```

### Option 2: MongoDB Atlas
1. Create a free cluster in MongoDB Atlas
2. Add database user and IP access
3. Replace `DATABASE_URL` with your Atlas URI:
   ```env
   DATABASE_URL=mongodb+srv://<username>:<password>@<cluster-url>/library-management
   ```

### Seed Data
To import books from CSV:
```bash
npm run seed
```

## API Endpoints

Base URL: `http://localhost:5000`

### Health
- `GET /api/health` - Check API status

### Authentication
- `POST /api/auth/register` - Register user (`role`: `member` or `librarian`)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile (protected)

### Books
- `GET /api/books` - List books (protected)
- `GET /api/books/:id` - Get single book (protected)
- `POST /api/books` - Add book (librarian only)
- `PUT /api/books/:id` - Update book (librarian only)
- `DELETE /api/books/:id` - Delete book (librarian only)
- `POST /api/books/:id/borrow` - Borrow book (member only)
- `POST /api/books/:id/return` - Return borrowed record by id (member only)

### Members
- `GET /api/members` - List members with borrowed books (librarian only)
- `DELETE /api/members/:id` - Delete member (librarian only)
- `GET /api/members/me/books` - Get logged-in member borrowed books (member only)

## Authentication Flow

1. User registers via `POST /api/auth/register`
2. User logs in via `POST /api/auth/login`
3. API returns a JWT token and user details
4. Frontend stores token in local storage
5. Frontend sends token in `Authorization` header:
   ```http
   Authorization: Bearer <token>
   ```
6. Backend middleware verifies token and enforces role permissions

## Deployment URL

- **Production URL**: Not deployed yet
- **Local frontend**: `http://localhost:3000`
- **Local backend**: `http://localhost:5000`

> When deployed, update this section with your live frontend and backend URLs.

## Postman Collection

An import-ready Postman collection is included at:

`Library-Management-System.postman_collection.json`

### How to import

1. Open Postman
2. Click **Import**
3. Choose file:
   `Library-Management-System.postman_collection.json`
4. Import into your workspace

### Collection variables included

- `baseUrl` (default: `http://localhost:5000`)
- `token`
- `memberEmail`
- `memberPassword`
- `librarianEmail`
- `librarianPassword`
- `bookId`
- `borrowId`
- `memberId`

### Recommended execution flow

#### Member flow
1. `GET Health`
2. `POST Register Member` (run once)
3. `POST Login Member` (auto-saves `token`)
4. `GET Books` (auto-saves `bookId`)
5. `POST Borrow Book (Member)`
6. `GET My Borrowed Books (Member)` (auto-saves `borrowId`)
7. `POST Return Borrow Record (Member)`

#### Librarian flow
1. `POST Register Librarian` (run once)
2. `POST Login Librarian` (auto-saves `token`)
3. `POST Create Book (Librarian)`
4. `GET Books` (auto-saves `bookId`)
5. `PUT Update Book (Librarian)` / `DELETE Book (Librarian)`
6. `GET Members (Librarian)` (auto-saves `memberId`)
7. `DELETE Member (Librarian)` (optional)

### Important notes

- Protected routes require:
  `Authorization: Bearer {{token}}`
- `POST /api/books/:id/return` expects a **borrow record id** in `:id` (mapped to `{{borrowId}}` in the collection).
- Some requests are role-restricted:
  - Librarian only: manage books, view/delete members
  - Member only: borrow/return, view own borrowed books
