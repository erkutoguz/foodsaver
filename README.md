# FoodSaver API

Backend service for the FoodSaver senior project.

Current stack:
- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Zod validation
- Vitest + Supertest for tests

Current implemented modules:
- Health check
- Authentication
- Inventory CRUD
- Inventory expiration summary
- Mock image recognition
- Mock recipe generation
- Favorites
- Cook flow and history

Not implemented yet:
- Notification delivery
- Real AI provider integration

## Project Structure

```text
api/
  src/
    adapters/
    config/
    lib/
    middleware/
    models/
    routes/
    services/
    utils/
    validators/
  tests/
```

## Run Locally

```bash
cd api
npm install
npm run dev
```

Production-like start:

```bash
cd api
npm start
```

Run tests:

```bash
cd api
npm test
```

## Environment Variables

Example file: [`api/.env.example`](api/.env.example)

```env
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=*
LOG_LEVEL=info
MONGODB_URI=mongodb://127.0.0.1:27017/foodsaver
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=7d
RECIPE_JOB_DELAY_MS=150
```

Notes:
- `MONGODB_URI` should point to your real MongoDB Atlas database in development.
- `RECIPE_JOB_DELAY_MS` controls how long the mock recipe job waits before processing.

## Base URL

Local default:

```text
http://localhost:4000
```

## Authentication

Protected endpoints require this header:

```http
Authorization: Bearer <jwt_token>
```

## Response and Error Format

Successful responses return JSON objects.

Standard error format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

Common error codes:
- `AUTH_REQUIRED`
- `INVALID_TOKEN`
- `INVALID_CREDENTIALS`
- `VALIDATION_ERROR`
- `EMAIL_ALREADY_USED`
- `INVENTORY_ITEM_NOT_FOUND`
- `RECIPE_JOB_NOT_FOUND`
- `RECIPE_NOT_FOUND`
- `FAVORITE_ALREADY_EXISTS`
- `FAVORITE_NOT_FOUND`
- `INSUFFICIENT_INVENTORY`

## Endpoints

### `GET /health`

Simple health check for server status.

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "environment": "development"
}
```

## Auth

### `POST /api/auth/register`

Creates a user and returns a JWT.

Request body:

```json
{
  "fullName": "Erkut Oguz",
  "email": "erkut@example.com",
  "password": "123456"
}
```

Response `201`:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "680000000000000000000001",
    "fullName": "Erkut Oguz",
    "email": "erkut@example.com",
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z"
  }
}
```

### `POST /api/auth/login`

Logs in an existing user.

Request body:

```json
{
  "email": "erkut@example.com",
  "password": "123456"
}
```

Response `200`:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "680000000000000000000001",
    "fullName": "Erkut Oguz",
    "email": "erkut@example.com",
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z"
  }
}
```

### `GET /api/auth/me`

Returns the currently authenticated user.

Response `200`:

```json
{
  "user": {
    "id": "680000000000000000000001",
    "fullName": "Erkut Oguz",
    "email": "erkut@example.com",
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z"
  }
}
```

## Inventory

Allowed units:
- `piece`
- `gram`
- `ml`

### `GET /api/inventory`

Lists inventory items of the authenticated user.

Response `200`:

```json
{
  "items": [
    {
      "id": "680000000000000000000010",
      "name": "Milk",
      "quantity": 2,
      "unit": "piece",
      "category": "dairy",
      "expiresAt": "2026-05-01T00:00:00.000Z",
      "expirationStatus": "safe",
      "daysUntilExpiration": 30,
      "createdAt": "2026-04-01T12:00:00.000Z",
      "updatedAt": "2026-04-01T12:00:00.000Z"
    }
  ]
}
```

`expirationStatus` can be:
- `expired`
- `expiringSoon`
- `safe`

### `GET /api/inventory/summary`

Returns simple expiration statistics for the authenticated user's inventory.

Optional query:

```text
?days=7
```

Response `200`:

```json
{
  "summary": {
    "totalItems": 4,
    "expiredCount": 1,
    "expiringSoonCount": 1,
    "safeCount": 2,
    "windowDays": 7
  }
}
```

### `GET /api/inventory/expiring`

Lists only items that are already expired or will expire soon.

Optional query:

```text
?days=7
```

Response `200`:

```json
{
  "days": 7,
  "counts": {
    "total": 2,
    "expired": 1,
    "expiringSoon": 1
  },
  "items": [
    {
      "id": "680000000000000000000010",
      "name": "Milk",
      "quantity": 2,
      "unit": "piece",
      "category": "dairy",
      "expiresAt": "2026-04-03T00:00:00.000Z",
      "expirationStatus": "expiringSoon",
      "daysUntilExpiration": 2,
      "createdAt": "2026-04-01T12:00:00.000Z",
      "updatedAt": "2026-04-01T12:00:00.000Z"
    }
  ]
}
```

### `POST /api/inventory`

Creates a new inventory item.

Request body:

```json
{
  "name": "Milk",
  "quantity": 2,
  "unit": "piece",
  "category": "dairy",
  "expiresAt": "2026-05-01T00:00:00.000Z"
}
```

Response `201`:

```json
{
  "item": {
    "id": "680000000000000000000010",
    "name": "Milk",
    "quantity": 2,
    "unit": "piece",
    "category": "dairy",
    "expiresAt": "2026-05-01T00:00:00.000Z",
    "expirationStatus": "safe",
    "daysUntilExpiration": 30,
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z"
  }
}
```

### `PATCH /api/inventory/:id`

Updates an existing inventory item.

Request body example:

```json
{
  "quantity": 5,
  "category": "vegetable"
}
```

Response `200`:

```json
{
  "item": {
    "id": "680000000000000000000010",
    "name": "Tomato",
    "quantity": 5,
    "unit": "piece",
    "category": "vegetable",
    "expiresAt": null,
    "expirationStatus": "safe",
    "daysUntilExpiration": null,
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:05:00.000Z"
  }
}
```

### `DELETE /api/inventory/:id`

Deletes an inventory item.

Response `200`:

```json
{
  "status": "deleted"
}
```

## Image Recognition

Important:
- Image recognition is currently mock-based.
- It does not process real image pixels yet.
- The endpoint is useful for frontend integration and flow testing right now.

### `POST /api/image-recognition/analyze`

Analyzes an image-like input and returns suggested inventory items.

Request body:

```json
{
  "imageUrl": "https://example.com/uploads/milk-eggs-tomato.jpg",
  "context": "items on a kitchen counter"
}
```

### `POST /api/image-recognition/confirm`

Saves selected detected items into inventory.

Behavior:
- if the same `name + unit` already exists for the user, quantity is merged
- otherwise a new inventory item is created

Request body:

```json
{
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "unit": "piece",
      "category": "dairy"
    },
    {
      "name": "Egg",
      "quantity": 6,
      "unit": "piece",
      "category": "protein"
    }
  ]
}
```

Response `201`:

```json
{
  "savedItems": [
    {
      "id": "680000000000000000000050",
      "name": "Milk",
      "quantity": 3,
      "unit": "piece",
      "category": "dairy",
      "expiresAt": null,
      "action": "merged",
      "createdAt": "2026-04-01T12:00:00.000Z",
      "updatedAt": "2026-04-01T12:05:00.000Z"
    }
  ],
  "summary": {
    "processedCount": 1,
    "createdCount": 0,
    "mergedCount": 1
  }
}
```

You can also send `fileName` or `imageBase64` instead of `imageUrl`.

Response `200`:

```json
{
  "analysis": {
    "provider": "mock",
    "sourceType": "imageUrl",
    "summary": "Detected 3 possible items from mock image analysis.",
    "detectedItems": [
      {
        "name": "Milk",
        "quantity": 1,
        "unit": "piece",
        "category": "dairy",
        "confidence": 0.96
      },
      {
        "name": "Egg",
        "quantity": 6,
        "unit": "piece",
        "category": "protein",
        "confidence": 0.94
      },
      {
        "name": "Tomato",
        "quantity": 4,
        "unit": "piece",
        "category": "vegetable",
        "confidence": 0.92
      }
    ]
  }
}
```

## Recipes

Important:
- Recipe generation is currently mock-based.
- It does not call a real AI provider yet.
- The API still behaves like an async job system.

### `POST /api/recipes/generate`

Creates a recipe generation job.

Request body:

```json
{
  "prompt": "high protein dinner"
}
```

Response `202`:

```json
{
  "jobId": "680000000000000000000020",
  "status": "queued"
}
```

### `GET /api/recipes/jobs/:id`

Gets recipe job status.

Response `200` while processing:

```json
{
  "jobId": "680000000000000000000020",
  "status": "processing",
  "recipeId": null,
  "errorMessage": null,
  "completedAt": null,
  "createdAt": "2026-04-01T12:00:00.000Z",
  "updatedAt": "2026-04-01T12:00:01.000Z"
}
```

Response `200` when completed:

```json
{
  "jobId": "680000000000000000000020",
  "status": "completed",
  "recipeId": "680000000000000000000021",
  "errorMessage": null,
  "completedAt": "2026-04-01T12:00:02.000Z",
  "createdAt": "2026-04-01T12:00:00.000Z",
  "updatedAt": "2026-04-01T12:00:02.000Z"
}
```

### `GET /api/recipes/:id`

Returns a generated recipe.

Response `200`:

```json
{
  "recipe": {
    "id": "680000000000000000000021",
    "title": "Mock High Protein Dinner Recipe",
    "prompt": "high protein dinner",
    "ingredients": [
      {
        "name": "Chicken",
        "quantity": 2,
        "unit": "piece"
      },
      {
        "name": "Rice",
        "quantity": 200,
        "unit": "gram"
      }
    ],
    "steps": [
      "Prepare the ingredients for \"high protein dinner\".",
      "Cook Chicken gently and combine it with the rest of the available ingredients.",
      "Season the dish, serve warm, and enjoy your mock AI recipe."
    ],
    "estimatedTimeMinutes": 25,
    "calories": 420,
    "missingIngredients": [],
    "provider": "mock",
    "createdAt": "2026-04-01T12:00:02.000Z",
    "updatedAt": "2026-04-01T12:00:02.000Z"
  }
}
```

### `POST /api/recipes/:id/cook`

Marks a recipe as cooked, deducts matching ingredients from current inventory, and writes a history record.

Response `200`:

```json
{
  "status": "cooked",
  "history": {
    "id": "680000000000000000000040",
    "recipeId": "680000000000000000000021",
    "title": "Mock High Protein Dinner Recipe",
    "prompt": "high protein dinner",
    "consumedIngredients": [
      {
        "name": "Chicken",
        "quantity": 2,
        "unit": "piece"
      },
      {
        "name": "Rice",
        "quantity": 200,
        "unit": "gram"
      }
    ],
    "cookedAt": "2026-04-01T12:10:00.000Z",
    "createdAt": "2026-04-01T12:10:00.000Z",
    "updatedAt": "2026-04-01T12:10:00.000Z"
  }
}
```

If inventory is no longer enough, the API returns:

```json
{
  "code": "INSUFFICIENT_INVENTORY",
  "message": "Not enough inventory for: Chicken (2 piece)."
}
```

## Favorites

Favorites are based on `recipeId`.

### `GET /api/favorites`

Lists favorite recipes of the authenticated user.

Response `200`:

```json
{
  "favorites": [
    {
      "id": "680000000000000000000030",
      "recipeId": "680000000000000000000021",
      "recipe": {
        "id": "680000000000000000000021",
        "title": "Mock High Protein Dinner Recipe",
        "prompt": "high protein dinner",
        "ingredients": [],
        "steps": [],
        "estimatedTimeMinutes": 25,
        "calories": 420,
        "missingIngredients": [],
        "provider": "mock",
        "createdAt": "2026-04-01T12:00:02.000Z",
        "updatedAt": "2026-04-01T12:00:02.000Z"
      },
      "createdAt": "2026-04-01T12:05:00.000Z",
      "updatedAt": "2026-04-01T12:05:00.000Z"
    }
  ]
}
```

### `POST /api/favorites`

Adds a recipe to favorites.

Request body:

```json
{
  "recipeId": "680000000000000000000021"
}
```

Response `201`:

```json
{
  "favorite": {
    "id": "680000000000000000000030",
    "recipeId": "680000000000000000000021",
    "recipe": {
      "id": "680000000000000000000021",
      "title": "Mock High Protein Dinner Recipe",
      "prompt": "high protein dinner",
      "ingredients": [],
      "steps": [],
      "estimatedTimeMinutes": 25,
      "calories": 420,
      "missingIngredients": [],
      "provider": "mock",
      "createdAt": "2026-04-01T12:00:02.000Z",
      "updatedAt": "2026-04-01T12:00:02.000Z"
    },
    "createdAt": "2026-04-01T12:05:00.000Z",
    "updatedAt": "2026-04-01T12:05:00.000Z"
  }
}
```

### `DELETE /api/favorites/:recipeId`

Removes a recipe from favorites.

Response `200`:

```json
{
  "status": "deleted"
}
```

## History

### `GET /api/history`

Lists cooked recipe history of the authenticated user.

Response `200`:

```json
{
  "history": [
    {
      "id": "680000000000000000000040",
      "recipeId": "680000000000000000000021",
      "title": "Mock High Protein Dinner Recipe",
      "prompt": "high protein dinner",
      "consumedIngredients": [
        {
          "name": "Chicken",
          "quantity": 2,
          "unit": "piece"
        },
        {
          "name": "Rice",
          "quantity": 200,
          "unit": "gram"
        }
      ],
      "cookedAt": "2026-04-01T12:10:00.000Z",
      "createdAt": "2026-04-01T12:10:00.000Z",
      "updatedAt": "2026-04-01T12:10:00.000Z"
    }
  ]
}
```

## Validation Rules

Important validation rules currently in place:

- Auth register:
  - `fullName` is required
  - `email` must be valid
  - `password` minimum 6 characters
- Auth login:
  - valid email required
  - password required
- Inventory create:
  - `name` required
  - `quantity` must be greater than `0`
  - `unit` must be `piece`, `gram`, or `ml`
- Inventory update:
  - at least one field is required
- Recipe generate:
  - `prompt` is required
- Image recognition analyze:
  - at least one of `imageUrl`, `fileName`, or `imageBase64` is required
- Image recognition confirm:
  - `items` must contain at least one detected item
  - `name`, `quantity`, and `unit` are required for each item
- Favorite create:
  - `recipeId` must be a valid Mongo ObjectId

## Current Test Setup

Tests live under:

[`api/tests/backend.test.js`](api/tests/backend.test.js)

Current test coverage includes:
- health endpoint
- auth flows
- inventory CRUD
- mock image recognition
- mock recipe generation job flow
- favorites flow
- cook flow and history

## Notes

- The recipe generation module currently uses mock data on purpose.
- The image recognition module currently uses mock data on purpose.
- The API is written in plain JavaScript with ESM.
- The backend is intentionally kept straightforward and not over-engineered.
