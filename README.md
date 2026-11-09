# Fanuna Shop API

## Student

Ahmed Yassine Tifour

## Application description

A standalone REST API for the Fanuna Shop application. It stores product and user records in MongoDB, exposes public product reads, and protects product/category management with either the API's JWT or a Google OAuth 2.0 access token. Google OpenID Connect ID tokens are also accepted. The React client is maintained separately and can be connected to this API.

## Technologies

- Node.js and JavaScript (ES modules)
- Express.js
- MongoDB Atlas and Mongoose
- bcryptjs password hashing
- JWT authentication with `jsonwebtoken`
- Google OAuth 2.0 access-token validation and OpenID Connect ID-token verification
- `express-rate-limit`, Helmet, and CORS
- Postman or Thunder Client for API verification

## Database models

### Product

`name`, `description`, `price`, optional `previous_price`, nullable `category_id` reference, `imageUrl`, `images`, `stock`, and `featured`, plus timestamps. `imageUrl` satisfies the required image URL field; `images` preserves compatibility with the Fanuna React catalogue.

### User

`name`, unique normalized `email`, and `passwordHash`, plus timestamps. The password hash is excluded from normal queries and responses.

### Category

`name` (unique), `description`, `is_active`, and `sort_order`, plus timestamps. Categories are stored separately and related to products through `category_id`.

## API endpoints

All endpoints return JSON. Protected endpoints accept `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check API status |
| POST | `/api/auth/register` | Public | Create a user account |
| POST | `/api/auth/login` | Public, limited to 5 requests per 15 minutes per IP | Verify credentials and issue API JWT |
| GET | `/api/products` | Public | Retrieve all products, including linked category name and ID |
| GET | `/api/products/:id` | Public | Retrieve one product |
| POST | `/api/products` | JWT, Google OAuth access token, or Google OIDC ID token | Create a product; accepts `category_id` (or an existing category name in `category`) |
| PUT | `/api/products/:id` | JWT, Google OAuth access token, or Google OIDC ID token | Update a product |
| DELETE | `/api/products/:id` | JWT, Google OAuth access token, or Google OIDC ID token | Delete a product |
| GET | `/api/categories` | Public | Retrieve active storefront categories |
| GET | `/api/admin/categories` | JWT, Google OAuth access token, or Google OIDC ID token | List all categories with product counts |
| POST | `/api/admin/categories` | JWT, Google OAuth access token, or Google OIDC ID token | Create a category |
| GET | `/api/admin/categories/:id` | JWT, Google OAuth access token, or Google OIDC ID token | Retrieve one category |
| PUT | `/api/admin/categories/:id` | JWT, Google OAuth access token, or Google OIDC ID token | Update a category |
| DELETE | `/api/admin/categories/:id` | JWT, Google OAuth access token, or Google OIDC ID token | Delete a category and unlink its products |

The general API limit is 100 requests per 15 minutes per IP. Exceeded limits return HTTP 429. Product and category management requires a valid API JWT from `/api/auth/login` or a Google token issued to the configured `GOOGLE_CLIENT_ID`. No role checks are added, matching the introductory lab's stated scope.

Products store a MongoDB `category_id` reference to a category document. Product responses include `category_id` and a populated category name in `category` for easy storefront display. Category records have `name`, `description`, `is_active`, and `sort_order`; deleting one safely clears that reference from its products. The public category route returns active categories only.

## JWT authentication

Registration validates required fields, hashes the password with bcrypt, and stores the user in MongoDB. Login compares the supplied password with the stored hash and returns a signed JWT. The API JWT secret comes from `JWT_SECRET`. Protected requests send the token in the `Authorization` header as `Bearer <token>`; absent, invalid, or expired tokens receive HTTP 401.

For the OAuth 2.0 test, configure Postman's Authorization Code flow with PKCE for the selected Google OAuth client and request `openid email profile`. Use Postman's registered browser callback URI and send the returned **access token** as the Bearer token to a protected API route. The API validates it with Google's token-info service, checks its audience matches `GOOGLE_CLIENT_ID`, checks expiry and email scope, and requires a verified account. The API also accepts a valid Google OIDC ID token, which is the token intended specifically to prove user identity. The regular API JWT login remains available independently.

## Install and run

Requirements: Node.js 18 or newer and npm.

```bash
npm install
```

Copy `.env.example` to `.env`, fill in the values described below, then start the server:

```bash
npm run dev
```

The API runs at `http://localhost:3000` by default. Check `GET http://localhost:3000/api/health`.

## MongoDB and environment variables

Create a MongoDB Atlas cluster, a database user, and an IP access-list entry for your development IP. Copy the Node.js driver URI from Atlas and use it as `MONGODB_URI`; include the database name `fanuna_shop` in the URI path. Atlas account login credentials are not database-user credentials.

Set these variables in your local `.env`:

| Variable | Purpose |
|---|---|
| `PORT` | API port; defaults to 3000 |
| `MONGODB_URI` | Private Atlas connection URI |
| `JWT_SECRET` | Long random secret used to sign API JWTs |
| `JWT_EXPIRES_IN` | API JWT lifetime; defaults to `1d` |
| `FRONTEND_ORIGIN` | Origin allowed by CORS; defaults to the local Vite frontend at `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID; required audience for Google access and ID tokens |

Never commit `.env`, MongoDB credentials, OAuth secrets, or JWT secrets. `.gitignore` excludes `.env`; commit only `.env.example` with placeholders.

## Seed sample products

After configuring `.env`, run:

```bash
npm run seed
```

This upserts the categories and six sample products used by the Fanuna catalogue. Existing product documents are updated in place to use category references; unrelated records are preserved.

## Postman / Thunder Client verification checklist

The `postman/` directory contains an importable Postman collection and a sanitized local environment template. Import both files into Postman, select **Fanuna Local API**, and fill in your own test password. The exported environment contains no database credentials, OAuth client secrets, or tokens.

- Register a new user; repeat with the same email and confirm HTTP 409.
- Log in with valid credentials and copy the returned JWT; invalid credentials should return 401.
- Retrieve all products and one product; check an invalid ID and unknown product ID.
- Create, update, and delete a product with a valid JWT.
- List active storefront categories; create, list, retrieve, update, and delete categories with a valid JWT. Confirm category product counts and that deleting a category unlinks its products.
- Create and update a product with an existing `category_id`; confirm the response includes the category ID and name. Try an unknown category reference and confirm HTTP 400.
- Repeat a protected operation without a token and with a deliberately invalid token; both should return 401.
- Submit missing/invalid product fields and confirm HTTP 400.
- Use Postman OAuth 2.0 Authorization Code with PKCE and Google scopes `openid email profile`; use `https://oauth.pstmn.io/v1/browser-callback` as the authorized callback URI. Send the returned access token as the Bearer token to a protected request.
- Exceed the product API limit and login limit to demonstrate HTTP 429.