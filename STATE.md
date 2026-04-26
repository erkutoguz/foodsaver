# Food Saver AI Codebase Familiarity Report

Last updated: 2026-04-26
Scope of this update: Initial codebase inspection, root startup scripts, backend Ollama recipe provider migration, and mobile recipe generation UI wiring.

## Project Source of Truth Notes
- This file is now the project progress source of truth.
- Future tasks should update this file with:
  - what changed
  - files changed
  - commands run
  - test results
  - remaining issues
  - next recommended task

## 1. Executive Summary
Food Saver AI is currently a split mobile-plus-API project with a more complete backend than frontend.

- The backend in [api/src/app.js](/home/erkut/bitirme/api/src/app.js) is a working Express API with JWT auth, MongoDB models, inventory CRUD, expiry summaries, mock image recognition, recipe generation jobs, favorites, and cooking history.
- The mobile app in [mobile/src/navigation/AppNavigator.js](/home/erkut/bitirme/mobile/src/navigation/AppNavigator.js) has real auth and pantry inventory wiring, but much of the rest of the user experience is still placeholder UI.
- The project appears to be in an early-to-mid implementation stage:
  - backend foundations are implemented and tested
  - mobile foundation and auth flow are implemented
  - AI and recipe features exist on the backend, but are only partially real and are not yet integrated into the mobile UI

## 2. Tech Stack
Confirmed from code:

- Mobile frontend: React Native with Expo
  - [mobile/package.json](/home/erkut/bitirme/mobile/package.json)
  - [mobile/App.js](/home/erkut/bitirme/mobile/App.js)
  - [mobile/index.js](/home/erkut/bitirme/mobile/index.js)
- Navigation: React Navigation
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `@react-navigation/bottom-tabs`
  - [mobile/src/navigation/AppNavigator.js](/home/erkut/bitirme/mobile/src/navigation/AppNavigator.js)
- Mobile state/storage:
  - Zustand for auth state: [mobile/src/store/auth-store.js](/home/erkut/bitirme/mobile/src/store/auth-store.js)
  - AsyncStorage for persisted session: same file
- Backend: Node.js + Express
  - [api/package.json](/home/erkut/bitirme/api/package.json)
  - [api/src/index.js](/home/erkut/bitirme/api/src/index.js)
  - [api/src/app.js](/home/erkut/bitirme/api/src/app.js)
- Database: MongoDB with Mongoose
  - [api/src/config/database.js](/home/erkut/bitirme/api/src/config/database.js)
  - [api/src/models/user.model.js](/home/erkut/bitirme/api/src/models/user.model.js) and other model files
- Validation: Zod
  - [api/src/validators](/home/erkut/bitirme/api/src/validators)
- Auth:
  - JWT via `jsonwebtoken`: [api/src/lib/auth.js](/home/erkut/bitirme/api/src/lib/auth.js)
  - Password hashing via `bcryptjs`: [api/src/services/auth.service.js](/home/erkut/bitirme/api/src/services/auth.service.js)
- Security/middleware:
  - `cors`, `helmet`, `express-rate-limit`, `morgan`
  - [api/src/app.js](/home/erkut/bitirme/api/src/app.js)
- AI services/APIs:
  - Optional local Ollama recipe provider via HTTP API: [api/src/adapters/ollama-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/ollama-recipe.provider.js)
  - Mock recipe provider: [api/src/adapters/mock-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/mock-recipe.provider.js)
  - Mock image recognition provider: [api/src/adapters/mock-image-recognition.provider.js](/home/erkut/bitirme/api/src/adapters/mock-image-recognition.provider.js)
- Testing:
  - Vitest + Supertest + mongodb-memory-server
  - [api/tests/backend.test.js](/home/erkut/bitirme/api/tests/backend.test.js)
- Not found in repo:
  - push notification service integration
  - cloud file storage integration
  - deployment manifests
  - CI workflow config
  - lint/format scripts

## 3. Repository Structure
Top-level structure:

- `package.json`: root helper scripts for starting the app from one command
- `api/`: backend API
- `mobile/`: React Native Expo app
- `README.md`: backend-oriented documentation
- `STATE.md`: project state file created in this task

Important backend paths:

- Entry points:
  - [api/src/index.js](/home/erkut/bitirme/api/src/index.js)
  - [api/src/app.js](/home/erkut/bitirme/api/src/app.js)
- Config:
  - [api/src/config/env.js](/home/erkut/bitirme/api/src/config/env.js)
  - [api/src/config/database.js](/home/erkut/bitirme/api/src/config/database.js)
  - [api/.env.example](/home/erkut/bitirme/api/.env.example)
- Middleware:
  - [api/src/middleware/auth.js](/home/erkut/bitirme/api/src/middleware/auth.js)
  - [api/src/middleware/validate.js](/home/erkut/bitirme/api/src/middleware/validate.js)
  - [api/src/middleware/error-handler.js](/home/erkut/bitirme/api/src/middleware/error-handler.js)
  - [api/src/middleware/not-found.js](/home/erkut/bitirme/api/src/middleware/not-found.js)
- Routes:
  - [api/src/routes/auth.routes.js](/home/erkut/bitirme/api/src/routes/auth.routes.js)
  - [api/src/routes/inventory.routes.js](/home/erkut/bitirme/api/src/routes/inventory.routes.js)
  - [api/src/routes/image-recognition.routes.js](/home/erkut/bitirme/api/src/routes/image-recognition.routes.js)
  - [api/src/routes/recipe.routes.js](/home/erkut/bitirme/api/src/routes/recipe.routes.js)
  - [api/src/routes/favorite.routes.js](/home/erkut/bitirme/api/src/routes/favorite.routes.js)
  - [api/src/routes/history.routes.js](/home/erkut/bitirme/api/src/routes/history.routes.js)
- Services:
  - [api/src/services](/home/erkut/bitirme/api/src/services)
- Repositories:
  - [api/src/repositories](/home/erkut/bitirme/api/src/repositories)
- Models:
  - [api/src/models](/home/erkut/bitirme/api/src/models)
- AI/provider adapters:
  - [api/src/adapters](/home/erkut/bitirme/api/src/adapters)
- Validation schemas:
  - [api/src/validators](/home/erkut/bitirme/api/src/validators)

Important mobile paths:

- Entry points:
  - [mobile/index.js](/home/erkut/bitirme/mobile/index.js)
  - [mobile/App.js](/home/erkut/bitirme/mobile/App.js)
- Expo config:
  - [mobile/app.json](/home/erkut/bitirme/mobile/app.json)
  - [mobile/.env.example](/home/erkut/bitirme/mobile/.env.example)
- Navigation:
  - [mobile/src/navigation/AppNavigator.js](/home/erkut/bitirme/mobile/src/navigation/AppNavigator.js)
- Screens:
  - [mobile/src/screens](/home/erkut/bitirme/mobile/src/screens)
- Components:
  - [mobile/src/components](/home/erkut/bitirme/mobile/src/components)
- API client/config:
  - [mobile/src/config/api.js](/home/erkut/bitirme/mobile/src/config/api.js)
  - [mobile/src/config/env.js](/home/erkut/bitirme/mobile/src/config/env.js)
  - [mobile/src/lib/api-client.js](/home/erkut/bitirme/mobile/src/lib/api-client.js)
- Services:
  - [mobile/src/services/auth-service.js](/home/erkut/bitirme/mobile/src/services/auth-service.js)
  - [mobile/src/services/inventory-service.js](/home/erkut/bitirme/mobile/src/services/inventory-service.js)
- State:
  - [mobile/src/store/auth-store.js](/home/erkut/bitirme/mobile/src/store/auth-store.js)

## 4. Mobile App Overview
Expo entry point:

- [mobile/index.js](/home/erkut/bitirme/mobile/index.js) registers [mobile/App.js](/home/erkut/bitirme/mobile/App.js).
- [mobile/App.js](/home/erkut/bitirme/mobile/App.js) wraps the app in `SafeAreaProvider`, sets `StatusBar`, and renders `AppNavigator`.

Navigation structure:

- Unauthenticated stack in [mobile/src/navigation/AppNavigator.js](/home/erkut/bitirme/mobile/src/navigation/AppNavigator.js):
  - `Landing`
  - `Auth`
- Authenticated bottom tabs:
  - `Home`
  - `Pantry`
  - `Recipes`
  - `Profile`

Screens currently present:

- [mobile/src/screens/LandingScreen.js](/home/erkut/bitirme/mobile/src/screens/LandingScreen.js)
  - marketing/intro screen
  - routes to login or register
- [mobile/src/screens/AuthScreen.js](/home/erkut/bitirme/mobile/src/screens/AuthScreen.js)
  - real login/register form
  - calls backend auth endpoints through Zustand actions
- [mobile/src/screens/HomeScreen.js](/home/erkut/bitirme/mobile/src/screens/HomeScreen.js)
  - now a data-driven dashboard using pantry summary, expiring items, and cooking history
- [mobile/src/screens/InventoryScreen.js](/home/erkut/bitirme/mobile/src/screens/InventoryScreen.js)
  - real inventory fetch and create flow
  - displays expiry status from backend response
  - uses a native date-time picker for expiration input instead of free-text entry
- [mobile/src/screens/RecipesScreen.js](/home/erkut/bitirme/mobile/src/screens/RecipesScreen.js)
  - real prompt-to-result recipe generation flow
  - creates async recipe jobs, polls job status, and renders recipe details
- [mobile/src/screens/ProfileScreen.js](/home/erkut/bitirme/mobile/src/screens/ProfileScreen.js)
  - shows current user from store
  - supports sign out

Reusable components:

- [mobile/src/components/ScreenShell.js](/home/erkut/bitirme/mobile/src/components/ScreenShell.js)
- [mobile/src/components/FormField.js](/home/erkut/bitirme/mobile/src/components/FormField.js)
- [mobile/src/components/PrimaryButton.js](/home/erkut/bitirme/mobile/src/components/PrimaryButton.js)
- [mobile/src/components/InfoCard.js](/home/erkut/bitirme/mobile/src/components/InfoCard.js)
- [mobile/src/components/LandingHeroArt.js](/home/erkut/bitirme/mobile/src/components/LandingHeroArt.js)

State management:

- Auth/session state is in Zustand with persistence:
  - token
  - user
  - hydration flag
  - session validation logic
  - [mobile/src/store/auth-store.js](/home/erkut/bitirme/mobile/src/store/auth-store.js)
- No broader app state store for inventory, recipes, favorites, or history yet.

API client usage:

- Common fetch wrapper: [mobile/src/lib/api-client.js](/home/erkut/bitirme/mobile/src/lib/api-client.js)
- Auth service wired:
  - [mobile/src/services/auth-service.js](/home/erkut/bitirme/mobile/src/services/auth-service.js)
- Inventory service wired:
  - [mobile/src/services/inventory-service.js](/home/erkut/bitirme/mobile/src/services/inventory-service.js)
- History service wired:
  - [mobile/src/services/history-service.js](/home/erkut/bitirme/mobile/src/services/history-service.js)
- Recipe service wired:
  - [mobile/src/services/recipe-service.js](/home/erkut/bitirme/mobile/src/services/recipe-service.js)
- API paths for recipes, favorites, history, and image recognition exist in config:
  - [mobile/src/config/api.js](/home/erkut/bitirme/mobile/src/config/api.js)
  - recipe paths are now used by the mobile UI
  - favorites, history, and image recognition still have no mobile integrations

Image upload/camera usage:

- No `expo-camera`, `expo-image-picker`, camera screen, or upload component found in `mobile/`.
- No file upload flow is currently implemented on the mobile side.

Notification logic:

- No `expo-notifications` usage or notification scheduling code found in `mobile/`.

Styling approach:

- Plain React Native `StyleSheet.create`
- Shared color palette in [mobile/src/theme/colors.js](/home/erkut/bitirme/mobile/src/theme/colors.js)
- No external design system, CSS-in-JS library, or Tailwind-style tool found

## 5. Backend Overview
Express entry point:

- [api/src/index.js](/home/erkut/bitirme/api/src/index.js)
  - loads env
  - creates app
  - connects MongoDB
  - starts HTTP server
- [api/src/app.js](/home/erkut/bitirme/api/src/app.js)
  - registers middleware and routes

Middleware:

- CORS configured from `CLIENT_ORIGIN`
- Helmet
- JSON body parser with `1mb` limit
- Rate limit: 120 requests/minute except in test
- Morgan request logging
- Auth middleware in [api/src/middleware/auth.js](/home/erkut/bitirme/api/src/middleware/auth.js)
- Zod validation middleware in [api/src/middleware/validate.js](/home/erkut/bitirme/api/src/middleware/validate.js)
- 404 handler and centralized error handler

Route structure:

- `/health`
- `/api/auth`
- `/api/inventory`
- `/api/image-recognition`
- `/api/recipes`
- `/api/favorites`
- `/api/history`

Controllers/services:

- There is no separate `controllers/` folder.
- Route handlers call service functions directly from [api/src/services](/home/erkut/bitirme/api/src/services).

MongoDB connection:

- [api/src/config/database.js](/home/erkut/bitirme/api/src/config/database.js)
- Uses `mongoose.connect(env.MONGODB_URI)`.

Mongoose schemas/models:

- `User`
- `InventoryItem`
- `RecipeJob`
- `Recipe`
- `Favorite`
- `RecipeHistory`

Authentication/authorization:

- JWT token creation/verification: [api/src/lib/auth.js](/home/erkut/bitirme/api/src/lib/auth.js)
- Password hashing with bcrypt: [api/src/services/auth.service.js](/home/erkut/bitirme/api/src/services/auth.service.js)
- Protected routes use `requireAuth` middleware.
- User scoping is enforced in repositories/services by querying with `userId`.

Error handling:

- [api/src/middleware/error-handler.js](/home/erkut/bitirme/api/src/middleware/error-handler.js)
- Handles:
  - invalid JSON
  - Zod validation errors
  - duplicate key errors
  - Mongoose validation errors
  - custom HTTP errors
  - fallback 500

File/image upload handling:

- No multipart upload middleware such as `multer` found.
- Image recognition accepts JSON payloads with `imageUrl`, `fileName`, or `imageBase64`:
  - [api/src/validators/image-recognition.schemas.js](/home/erkut/bitirme/api/src/validators/image-recognition.schemas.js)

## 6. Database Overview
Models found in [api/src/models](/home/erkut/bitirme/api/src/models):

### User
File: [api/src/models/user.model.js](/home/erkut/bitirme/api/src/models/user.model.js)

- Fields:
  - `fullName`
  - `email` unique, lowercased
  - `passwordHash`
  - timestamps
- Relationships:
  - referenced by inventory, recipe jobs, recipes, favorites, and history via `userId`

### InventoryItem
File: [api/src/models/inventory-item.model.js](/home/erkut/bitirme/api/src/models/inventory-item.model.js)

- Fields:
  - `userId` -> `User`
  - `name`
  - `quantity`
  - `unit` enum: `piece`, `gram`, `ml`
  - `category`
  - `expiresAt`
  - timestamps
- Notes:
  - expiry is stored directly on each inventory item
  - there is no separate expiry collection/model

### RecipeJob
File: [api/src/models/recipe-job.model.js](/home/erkut/bitirme/api/src/models/recipe-job.model.js)

- Fields:
  - `userId` -> `User`
  - `prompt`
  - `status` enum: `queued`, `processing`, `completed`, `failed`
  - `inventorySnapshot[]`
  - `recipeId` -> `Recipe`, nullable
  - `errorMessage`
  - `completedAt`
  - timestamps
- Notes:
  - used as an async recipe-generation job record
  - snapshot preserves pantry context at generation time

### Recipe
File: [api/src/models/recipe.model.js](/home/erkut/bitirme/api/src/models/recipe.model.js)

- Fields:
  - `userId` -> `User`
  - `jobId` -> `RecipeJob`
  - `prompt`
  - `title`
  - `ingredients[]` with `name`, `quantity`, `unit`
  - `steps[]`
  - `estimatedTimeMinutes`
  - `calories`
  - `missingIngredients[]`
  - `provider`
  - timestamps
- Notes:
  - this is the main generated recipe record
  - there is no separate nutrition model beyond calories

### Favorite
File: [api/src/models/favorite.model.js](/home/erkut/bitirme/api/src/models/favorite.model.js)

- Fields:
  - `userId` -> `User`
  - `recipeId` -> `Recipe`
  - timestamps
- Relationships:
  - compound unique index on `userId + recipeId`

### RecipeHistory
File: [api/src/models/recipe-history.model.js](/home/erkut/bitirme/api/src/models/recipe-history.model.js)

- Fields:
  - `userId` -> `User`
  - `recipeId` -> `Recipe`
  - `title`
  - `prompt`
  - `consumedIngredients[]`
  - `cookedAt`
  - timestamps
- Notes:
  - records completed cook actions
  - also acts as consumption history

### Models not found
- No notification model/collection
- No AI analysis result persistence model
- No onboarding/profile extension model beyond `User`
- No recipe rating/comment/social models

## 7. AI / Food Saver Features
Implemented or partially implemented:

- Food recognition:
  - endpoint exists: [api/src/routes/image-recognition.routes.js](/home/erkut/bitirme/api/src/routes/image-recognition.routes.js)
  - service exists: [api/src/services/image-recognition.service.js](/home/erkut/bitirme/api/src/services/image-recognition.service.js)
  - current provider is mock text-based matching in [api/src/adapters/mock-image-recognition.provider.js](/home/erkut/bitirme/api/src/adapters/mock-image-recognition.provider.js)
  - this is not real computer vision yet
- Image analysis:
  - accepts `imageUrl`, `fileName`, or `imageBase64`
  - returns mock detected items
  - can confirm detections into inventory
- Expiry tracking:
  - implemented in inventory service
  - summary and expiring list endpoints in [api/src/routes/inventory.routes.js](/home/erkut/bitirme/api/src/routes/inventory.routes.js)
- Recipe suggestions:
  - implemented on backend
  - job-based generation flow in [api/src/services/recipe.service.js](/home/erkut/bitirme/api/src/services/recipe.service.js)
  - provider switch in [api/src/adapters/recipe.provider.js](/home/erkut/bitirme/api/src/adapters/recipe.provider.js)
- Reducing food waste:
  - partially supported by pantry + expiry summary + recipe generation concept
  - not yet surfaced strongly in the mobile UI
- Nutrition suggestions:
  - only `calories` is present on recipes
  - no broader nutrition analysis found
- Reminders/notifications:
  - not implemented
- OpenAI usage:
  - none found
- Ollama usage:
  - optional local recipe generation provider exists
  - [api/src/adapters/ollama-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/ollama-recipe.provider.js)

Clear status:

- AI exists, but only part of it is real.
- Recipe generation can be real through a local Ollama model if configured.
- Image recognition is still mock-only.
- Mobile app now exposes recipe generation, but still does not expose favorites, history, or image recognition flows.

## 8. Authentication & User Flow
Registration/login:

- Backend endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Mobile form:
  - [mobile/src/screens/AuthScreen.js](/home/erkut/bitirme/mobile/src/screens/AuthScreen.js)

Token/session handling:

- Backend returns JWT plus user object
- Mobile stores token and user in Zustand + AsyncStorage:
  - [mobile/src/store/auth-store.js](/home/erkut/bitirme/mobile/src/store/auth-store.js)
- On hydration, `checkSession()` calls `/api/auth/me` to validate the token

Protected routes:

- All inventory, image-recognition, recipe, favorite, and history routes require auth
- Enforced by [api/src/middleware/auth.js](/home/erkut/bitirme/api/src/middleware/auth.js)

Mobile auth storage:

- `foodsaver-auth` persisted storage key in AsyncStorage

User onboarding:

- No dedicated onboarding flow found beyond landing -> register/login

Current main user journey in app:

1. Open landing screen.
2. Navigate to sign in or create account.
3. Authenticate against backend.
4. Enter authenticated tab flow.
5. View Home placeholder.
6. Add/list pantry items in Inventory screen.
7. View Profile and sign out.

Missing from current mobile user journey:

- generate recipes
- favorite recipes
- cook recipe
- view cooking history
- run image recognition
- notifications/reminders

## 9. API Map
Only endpoints verified from route files are listed below.

| Method | Endpoint | Purpose | Auth Required | Files |
|---|---|---|---|---|
| `GET` | `/health` | Health check | No | `api/src/app.js` |
| `POST` | `/api/auth/register` | Register user and return JWT | No | `api/src/routes/auth.routes.js`, `api/src/services/auth.service.js` |
| `POST` | `/api/auth/login` | Login user and return JWT | No | `api/src/routes/auth.routes.js`, `api/src/services/auth.service.js` |
| `GET` | `/api/auth/me` | Return current user | Yes | `api/src/routes/auth.routes.js`, `api/src/middleware/auth.js` |
| `GET` | `/api/inventory/summary` | Return inventory expiry counts | Yes | `api/src/routes/inventory.routes.js`, `api/src/services/inventory.service.js` |
| `GET` | `/api/inventory/expiring` | Return expired/expiring items | Yes | `api/src/routes/inventory.routes.js`, `api/src/services/inventory.service.js` |
| `GET` | `/api/inventory` | List user inventory items | Yes | `api/src/routes/inventory.routes.js`, `api/src/services/inventory.service.js` |
| `POST` | `/api/inventory` | Create inventory item | Yes | `api/src/routes/inventory.routes.js`, `api/src/services/inventory.service.js` |
| `PATCH` | `/api/inventory/:id` | Update inventory item | Yes | `api/src/routes/inventory.routes.js`, `api/src/services/inventory.service.js` |
| `DELETE` | `/api/inventory/:id` | Delete inventory item | Yes | `api/src/routes/inventory.routes.js`, `api/src/services/inventory.service.js` |
| `POST` | `/api/image-recognition/analyze` | Analyze image input and suggest detected items | Yes | `api/src/routes/image-recognition.routes.js`, `api/src/services/image-recognition.service.js` |
| `POST` | `/api/image-recognition/confirm` | Save confirmed detected items into inventory | Yes | `api/src/routes/image-recognition.routes.js`, `api/src/services/image-recognition.service.js` |
| `POST` | `/api/recipes/generate` | Create recipe generation job | Yes | `api/src/routes/recipe.routes.js`, `api/src/services/recipe.service.js` |
| `GET` | `/api/recipes/jobs/:id` | Get recipe job status | Yes | `api/src/routes/recipe.routes.js`, `api/src/services/recipe.service.js` |
| `GET` | `/api/recipes/:id` | Get generated recipe detail | Yes | `api/src/routes/recipe.routes.js`, `api/src/services/recipe.service.js` |
| `POST` | `/api/recipes/:id/cook` | Consume inventory and log cook history | Yes | `api/src/routes/recipe.routes.js`, `api/src/services/history.service.js` |
| `GET` | `/api/favorites` | List favorite recipes | Yes | `api/src/routes/favorite.routes.js`, `api/src/services/favorite.service.js` |
| `POST` | `/api/favorites` | Add favorite recipe | Yes | `api/src/routes/favorite.routes.js`, `api/src/services/favorite.service.js` |
| `DELETE` | `/api/favorites/:recipeId` | Remove favorite recipe | Yes | `api/src/routes/favorite.routes.js`, `api/src/services/favorite.service.js` |
| `GET` | `/api/history` | List cooking history | Yes | `api/src/routes/history.routes.js`, `api/src/services/history.service.js` |

## 10. Environment & Configuration
Backend env vars from [api/.env.example](/home/erkut/bitirme/api/.env.example):

- `PORT`
- `NODE_ENV`
- `CLIENT_ORIGIN`
- `LOG_LEVEL`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `RECIPE_JOB_DELAY_MS`
- `AI_PROVIDER`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Mobile env vars from [mobile/.env.example](/home/erkut/bitirme/mobile/.env.example):

- `EXPO_PUBLIC_API_URL`

MongoDB:

- backend requires `MONGODB_URI`

AI APIs:

- Ollama requires:
  - `AI_PROVIDER=ollama`
  - `OLLAMA_BASE_URL`
  - `OLLAMA_MODEL`

File storage:

- No file storage env vars found
- No S3/Cloudinary/Firebase storage integration found

Expo config:

- [mobile/app.json](/home/erkut/bitirme/mobile/app.json)
- No `eas.json` found

Config clarity notes:

- `.env.example` exists for both `api/` and `mobile/`
- mobile env fallback in [mobile/src/config/env.js](/home/erkut/bitirme/mobile/src/config/env.js) hardcodes `http://192.168.1.8:4000`, which is environment-specific and brittle
- root helper scripts now exist in [package.json](/home/erkut/bitirme/package.json), but local startup still depends on a valid backend `MONGODB_URI`

## 11. How to Run Locally
Verified from `package.json` files only.

Backend:

- Install:
  - `cd api`
  - `npm install`
- Env setup:
  - copy values from [api/.env.example](/home/erkut/bitirme/api/.env.example)
  - ensure `MONGODB_URI` points to a running MongoDB instance
- Run dev:
  - `npm run dev`
- Run start:
  - `npm start`
- Run tests:
  - `npm test`

Mobile:

- Install:
  - `cd mobile`
  - `npm install`
- Env setup:
  - set `EXPO_PUBLIC_API_URL`
  - or edit fallback behavior in [mobile/src/config/env.js](/home/erkut/bitirme/mobile/src/config/env.js)
- Start Expo:
  - `npm run start`
- Run Android:
  - `npm run android`
- Run iOS:
  - `npm run ios`
- Run web:
  - `npm run web`

Root:

- Combined dev start:
  - `npm run dev`
- Backend only:
  - `npm run dev:api`
- Mobile only:
  - `npm run dev:mobile`
- Mobile Android shortcut:
  - `npm run android`
- Mobile iOS shortcut:
  - `npm run ios`
- Mobile web shortcut:
  - `npm run web`

## 12. Tests & Quality Checks
Backend tests:

- Command run:
  - `cd api && npm test`
- First attempt inside sandbox:
  - failed due sandbox port restriction from `mongodb-memory-server`
  - error included `listen EPERM: operation not permitted 0.0.0.0`
- Rerun outside sandbox:
  - passed
  - result: `1` test file passed, `41` tests passed
- Test file:
  - [api/tests/backend.test.js](/home/erkut/bitirme/api/tests/backend.test.js)

What backend tests cover:

- health
- auth
- inventory CRUD
- expiry summary and expiring list
- image recognition analyze/confirm
- recipe generation job flow
- favorites
- cooking history
- inventory consumption failure cases

Frontend tests:

- No frontend test files found
- No `test` script in [mobile/package.json](/home/erkut/bitirme/mobile/package.json)

Lint/format:

- No lint or format scripts found in `api/package.json` or `mobile/package.json`

Build:

- No explicit backend build step
- No mobile build/export script in `mobile/package.json`

Expo checks:

- Command attempted:
  - `cd mobile && npm run start`
- Observed output:
  - `Starting project at /home/erkut/bitirme/mobile`
- No ready banner was captured in the short inspection window
- No automated Expo doctor/check script is defined in repo scripts
- Additional command attempted:
  - `cd mobile && npm run web`
- Observed output:
  - `Starting project at /home/erkut/bitirme/mobile`
- Additional command attempted:
  - `cd mobile && npx expo export --platform web`
- Result:
  - failed because web-only Expo dependencies are not installed in this repo
  - missing packages reported: `react-dom`, `react-native-web`

Root combined startup check:

- Command attempted:
  - `npm run dev`
- Observed output:
  - root script started both `api` and `mobile` child scripts from [package.json](/home/erkut/bitirme/package.json)
  - Expo side reached `Starting project at /home/erkut/bitirme/mobile`
  - backend process started through nodemon, then crashed while connecting to MongoDB
- Backend startup error observed:
  - `querySrv ECONNREFUSED _mongodb._tcp.foodsaver-cluster.aple465.mongodb.net`
- Meaning:
  - root startup wiring works
  - current local manual test is blocked by backend database connectivity, not by the new root script

## 13. Current Implementation Status
| Area | Status | Notes |
|---|---|---|
| Mobile frontend | partial | Auth, pantry, recipe generation, and dashboard home are real; profile is still lightweight. |
| Express backend | implemented | Core API is present in `api/src/app.js` and routed modules. |
| MongoDB models | implemented | Users, inventory, recipe jobs, recipes, favorites, and history models exist. |
| Authentication | implemented | JWT auth with register/login/me and persisted mobile session. |
| Food inventory | implemented | Backend CRUD exists; mobile supports list/create only. |
| Expiry tracking | implemented | Stored on inventory items and exposed through summary/expiring endpoints. |
| AI recognition | partial | Backend only, mock provider only, no real CV pipeline, no mobile UI. |
| Recipe suggestions | implemented | Backend async job flow exists with mock/Ollama providers and mobile can now generate and view recipe results. |
| Notifications | missing | No backend delivery logic or mobile notification integration found. |
| Image upload/camera | missing | No camera/image picker on mobile and no multipart upload on backend. |
| API integration | partial | Mobile integrates auth, inventory, and recipe generation/detail polling; favorites/history/image recognition remain unwired. |
| Tests | partial | Backend tests exist and pass; no frontend tests/lint/format coverage. |
| Deployment/config | partial | Basic env examples exist; no Docker, CI, or Expo EAS config found. |

## 14. Problems, Risks, and Technical Debt
- Hardcoded LAN API fallback in [mobile/src/config/env.js](/home/erkut/bitirme/mobile/src/config/env.js) and [mobile/.env.example](/home/erkut/bitirme/mobile/.env.example) makes local setup environment-specific.
- Mobile profile screen references favorites/history/settings conceptually, but no such data is loaded. [mobile/src/screens/ProfileScreen.js](/home/erkut/bitirme/mobile/src/screens/ProfileScreen.js)
- Mobile inventory service now supports list/create/summary/expiring, but update and delete are still not wired on mobile. [mobile/src/services/inventory-service.js](/home/erkut/bitirme/mobile/src/services/inventory-service.js)
- Mobile recipe polling is screen-local only; if the user leaves the screen or the app is restarted, in-flight recipe jobs are not resumed by the client. [mobile/src/screens/RecipesScreen.js](/home/erkut/bitirme/mobile/src/screens/RecipesScreen.js)
- Recipe jobs run through in-process `setTimeout`, so queued work can be lost on server restart and does not scale to multiple instances. [api/src/services/recipe.service.js](/home/erkut/bitirme/api/src/services/recipe.service.js)
- Image recognition is not real image analysis. It matches keywords from text input and returns canned detections. [api/src/adapters/mock-image-recognition.provider.js](/home/erkut/bitirme/api/src/adapters/mock-image-recognition.provider.js)
- No multipart upload/file pipeline exists for image recognition; backend accepts JSON only. [api/src/routes/image-recognition.routes.js](/home/erkut/bitirme/api/src/routes/image-recognition.routes.js), [api/src/validators/image-recognition.schemas.js](/home/erkut/bitirme/api/src/validators/image-recognition.schemas.js)
- Inventory consumption during cook flow is not wrapped in a MongoDB transaction, so concurrent requests could race and over-consume stock. [api/src/services/history.service.js](/home/erkut/bitirme/api/src/services/history.service.js)
- No notification/reminder persistence or delivery mechanism exists anywhere in `api/src` or `mobile/src`.
- No frontend test/lint/format pipeline exists. [mobile/package.json](/home/erkut/bitirme/mobile/package.json)
- No deployment configuration or CI workflows were found in the repo.
- Current manual startup can fail if the active backend `.env` points to an unreachable MongoDB Atlas SRV host. This was observed while running [package.json](/home/erkut/bitirme/package.json) root `dev` script.

## 15. Recommended Next Steps
Suggested order, without implementing yet:

1. Finish the remaining mobile-to-backend feature bridge:
   - wire favorites, history, and expiry summary into the mobile app
2. Expand the recipe flow from read-only generation to action-based usage:
   - cook-from-recipe flow
   - favorites/history entry points
3. Expand mobile inventory management:
   - edit item
   - delete item
   - expiring summary
4. Replace static mobile surfaces with real backend data:
   - `Home`
   - richer `Profile`
5. Stabilize environment setup:
   - remove hardcoded mobile API IP fallback
   - improve setup documentation
6. Decide AI direction:
   - keep mock flows for demos, or move image recognition to a real provider
7. Add notifications/reminders if they are core to the product goal
8. Improve backend job robustness:
   - replace `setTimeout` recipe jobs with a proper queue/background worker if needed
9. Add frontend tests and repo-wide quality scripts

## 16. Files Reviewed
Main files inspected for this report:

- [package.json](/home/erkut/bitirme/package.json)
- [README.md](/home/erkut/bitirme/README.md)
- [api/package.json](/home/erkut/bitirme/api/package.json)
- [api/.env.example](/home/erkut/bitirme/api/.env.example)
- [api/src/index.js](/home/erkut/bitirme/api/src/index.js)
- [api/src/app.js](/home/erkut/bitirme/api/src/app.js)
- [api/src/config/env.js](/home/erkut/bitirme/api/src/config/env.js)
- [api/src/config/database.js](/home/erkut/bitirme/api/src/config/database.js)
- [api/src/lib/auth.js](/home/erkut/bitirme/api/src/lib/auth.js)
- [api/src/lib/logger.js](/home/erkut/bitirme/api/src/lib/logger.js)
- [api/src/middleware/auth.js](/home/erkut/bitirme/api/src/middleware/auth.js)
- [api/src/middleware/error-handler.js](/home/erkut/bitirme/api/src/middleware/error-handler.js)
- [api/src/middleware/not-found.js](/home/erkut/bitirme/api/src/middleware/not-found.js)
- [api/src/middleware/validate.js](/home/erkut/bitirme/api/src/middleware/validate.js)
- [api/src/routes/auth.routes.js](/home/erkut/bitirme/api/src/routes/auth.routes.js)
- [api/src/routes/inventory.routes.js](/home/erkut/bitirme/api/src/routes/inventory.routes.js)
- [api/src/routes/image-recognition.routes.js](/home/erkut/bitirme/api/src/routes/image-recognition.routes.js)
- [api/src/routes/recipe.routes.js](/home/erkut/bitirme/api/src/routes/recipe.routes.js)
- [api/src/routes/favorite.routes.js](/home/erkut/bitirme/api/src/routes/favorite.routes.js)
- [api/src/routes/history.routes.js](/home/erkut/bitirme/api/src/routes/history.routes.js)
- [api/src/services/auth.service.js](/home/erkut/bitirme/api/src/services/auth.service.js)
- [api/src/services/inventory.service.js](/home/erkut/bitirme/api/src/services/inventory.service.js)
- [api/src/services/image-recognition.service.js](/home/erkut/bitirme/api/src/services/image-recognition.service.js)
- [api/src/services/recipe.service.js](/home/erkut/bitirme/api/src/services/recipe.service.js)
- [api/src/services/favorite.service.js](/home/erkut/bitirme/api/src/services/favorite.service.js)
- [api/src/services/history.service.js](/home/erkut/bitirme/api/src/services/history.service.js)
- [api/src/repositories/user.repository.js](/home/erkut/bitirme/api/src/repositories/user.repository.js)
- [api/src/repositories/inventory.repository.js](/home/erkut/bitirme/api/src/repositories/inventory.repository.js)
- [api/src/repositories/recipe.repository.js](/home/erkut/bitirme/api/src/repositories/recipe.repository.js)
- [api/src/repositories/recipe-job.repository.js](/home/erkut/bitirme/api/src/repositories/recipe-job.repository.js)
- [api/src/repositories/favorite.repository.js](/home/erkut/bitirme/api/src/repositories/favorite.repository.js)
- [api/src/repositories/history.repository.js](/home/erkut/bitirme/api/src/repositories/history.repository.js)
- [api/src/models/user.model.js](/home/erkut/bitirme/api/src/models/user.model.js)
- [api/src/models/inventory-item.model.js](/home/erkut/bitirme/api/src/models/inventory-item.model.js)
- [api/src/models/recipe.model.js](/home/erkut/bitirme/api/src/models/recipe.model.js)
- [api/src/models/recipe-job.model.js](/home/erkut/bitirme/api/src/models/recipe-job.model.js)
- [api/src/models/favorite.model.js](/home/erkut/bitirme/api/src/models/favorite.model.js)
- [api/src/models/recipe-history.model.js](/home/erkut/bitirme/api/src/models/recipe-history.model.js)
- [api/src/adapters/recipe.provider.js](/home/erkut/bitirme/api/src/adapters/recipe.provider.js)
- [api/src/adapters/ollama-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/ollama-recipe.provider.js)
- [api/src/adapters/mock-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/mock-recipe.provider.js)
- [api/src/adapters/mock-image-recognition.provider.js](/home/erkut/bitirme/api/src/adapters/mock-image-recognition.provider.js)
- [api/src/validators/auth.schemas.js](/home/erkut/bitirme/api/src/validators/auth.schemas.js)
- [api/src/validators/inventory.schemas.js](/home/erkut/bitirme/api/src/validators/inventory.schemas.js)
- [api/src/validators/recipe.schemas.js](/home/erkut/bitirme/api/src/validators/recipe.schemas.js)
- [api/src/validators/favorite.schemas.js](/home/erkut/bitirme/api/src/validators/favorite.schemas.js)
- [api/src/validators/image-recognition.schemas.js](/home/erkut/bitirme/api/src/validators/image-recognition.schemas.js)
- [api/tests/backend.test.js](/home/erkut/bitirme/api/tests/backend.test.js)
- [api/tests/ollama-recipe-provider.test.js](/home/erkut/bitirme/api/tests/ollama-recipe-provider.test.js)
- [mobile/package.json](/home/erkut/bitirme/mobile/package.json)
- [mobile/app.json](/home/erkut/bitirme/mobile/app.json)
- [mobile/.env.example](/home/erkut/bitirme/mobile/.env.example)
- [mobile/index.js](/home/erkut/bitirme/mobile/index.js)
- [mobile/App.js](/home/erkut/bitirme/mobile/App.js)
- [mobile/src/config/env.js](/home/erkut/bitirme/mobile/src/config/env.js)
- [mobile/src/config/api.js](/home/erkut/bitirme/mobile/src/config/api.js)
- [mobile/src/lib/api-client.js](/home/erkut/bitirme/mobile/src/lib/api-client.js)
- [mobile/src/store/auth-store.js](/home/erkut/bitirme/mobile/src/store/auth-store.js)
- [mobile/src/navigation/AppNavigator.js](/home/erkut/bitirme/mobile/src/navigation/AppNavigator.js)
- [mobile/src/screens/LandingScreen.js](/home/erkut/bitirme/mobile/src/screens/LandingScreen.js)
- [mobile/src/screens/AuthScreen.js](/home/erkut/bitirme/mobile/src/screens/AuthScreen.js)
- [mobile/src/screens/HomeScreen.js](/home/erkut/bitirme/mobile/src/screens/HomeScreen.js)
- [mobile/src/screens/InventoryScreen.js](/home/erkut/bitirme/mobile/src/screens/InventoryScreen.js)
- [mobile/src/screens/RecipesScreen.js](/home/erkut/bitirme/mobile/src/screens/RecipesScreen.js)
- [mobile/src/screens/ProfileScreen.js](/home/erkut/bitirme/mobile/src/screens/ProfileScreen.js)
- [mobile/src/components/ScreenShell.js](/home/erkut/bitirme/mobile/src/components/ScreenShell.js)
- [mobile/src/components/FormField.js](/home/erkut/bitirme/mobile/src/components/FormField.js)
- [mobile/src/components/PrimaryButton.js](/home/erkut/bitirme/mobile/src/components/PrimaryButton.js)
- [mobile/src/components/InfoCard.js](/home/erkut/bitirme/mobile/src/components/InfoCard.js)
- [mobile/src/components/LandingHeroArt.js](/home/erkut/bitirme/mobile/src/components/LandingHeroArt.js)
- [mobile/src/theme/colors.js](/home/erkut/bitirme/mobile/src/theme/colors.js)
- [.gitignore](/home/erkut/bitirme/.gitignore)

## Session Change Log
What changed:

- Created and populated [STATE.md](/home/erkut/bitirme/STATE.md) with the initial familiarity report.
- Added root helper scripts in [package.json](/home/erkut/bitirme/package.json) so backend and mobile can be started from one command for manual testing.
- Replaced the Gemini recipe provider path with a local Ollama provider for backend recipe generation.
- Added a focused Ollama adapter test suite and kept the existing mock-based recipe integration flow intact.
- Added the first real mobile recipe generation UI flow with async job polling and recipe detail rendering.
- Tightened the Ollama prompt so user prompts may be any language while generated recipe content is instructed to stay in English.
- Simplified the mobile recipe screen by removing the provider badge and removing all `Back to prompt` actions.
- Replaced the static Home screen with a dashboard backed by pantry summary, expiring items, and cooking history with pull-to-refresh and partial-failure loading.
- Replaced the pantry expiration text input with a native date-time picker and now submit/display expiration values with time included.

Files changed:

- [package.json](/home/erkut/bitirme/package.json)
- [STATE.md](/home/erkut/bitirme/STATE.md)
- [README.md](/home/erkut/bitirme/README.md)
- [api/.env.example](/home/erkut/bitirme/api/.env.example)
- [api/package.json](/home/erkut/bitirme/api/package.json)
- [api/package-lock.json](/home/erkut/bitirme/api/package-lock.json)
- [api/src/config/env.js](/home/erkut/bitirme/api/src/config/env.js)
- [api/src/adapters/recipe.provider.js](/home/erkut/bitirme/api/src/adapters/recipe.provider.js)
- [api/src/adapters/ollama-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/ollama-recipe.provider.js)
- [api/src/adapters/gemini-recipe.provider.js](/home/erkut/bitirme/api/src/adapters/gemini-recipe.provider.js)
- [api/tests/backend.test.js](/home/erkut/bitirme/api/tests/backend.test.js)
- [api/tests/ollama-recipe-provider.test.js](/home/erkut/bitirme/api/tests/ollama-recipe-provider.test.js)
- [mobile/src/components/ScreenShell.js](/home/erkut/bitirme/mobile/src/components/ScreenShell.js)
- [mobile/package.json](/home/erkut/bitirme/mobile/package.json)
- [mobile/package-lock.json](/home/erkut/bitirme/mobile/package-lock.json)
- [mobile/src/services/history-service.js](/home/erkut/bitirme/mobile/src/services/history-service.js)
- [mobile/src/services/inventory-service.js](/home/erkut/bitirme/mobile/src/services/inventory-service.js)
- [mobile/src/screens/InventoryScreen.js](/home/erkut/bitirme/mobile/src/screens/InventoryScreen.js)
- [mobile/src/screens/HomeScreen.js](/home/erkut/bitirme/mobile/src/screens/HomeScreen.js)
- [mobile/src/services/recipe-service.js](/home/erkut/bitirme/mobile/src/services/recipe-service.js)
- [mobile/src/screens/RecipesScreen.js](/home/erkut/bitirme/mobile/src/screens/RecipesScreen.js)

Commands run:

- `rg --files`
- `find . -maxdepth 2 -type d | sort`
- `git status --short`
- multiple `sed -n` reads across `api/` and `mobile/`
- `rg -n` searches for features, tests, and integrations
- `cd api && npm test`
- `cd mobile && npm run start`
- `npm run dev`
- `rg -n "gemini|GEMINI|AI_PROVIDER=mock|recipe generation with mock or Gemini provider" README.md api`
- `cd api && npm uninstall @google/genai`
- `cd api && npm test`
- multiple `sed -n` reads across `mobile/src/components`, `mobile/src/screens`, and `mobile/src/services`
- `node -e "import('./mobile/src/services/recipe-service.js')..."`
- `node -e "import('./mobile/src/screens/RecipesScreen.js')..."`
- `cd mobile && npm run web`
- `cd mobile && npx expo export --platform web`
- `cd api && npx vitest run tests/ollama-recipe-provider.test.js`
- multiple `sed -n` reads across `mobile/src/screens`, `mobile/src/services`, and `mobile/src/components`
- `cd mobile && npm install @react-native-community/datetimepicker`
- `cd mobile && npm ls @react-native-community/datetimepicker`

Test results:

- Backend tests passed after rerunning outside sandbox: `41/41` tests passed.
- Mobile has no automated tests configured.
- Expo start was attempted and reached `Starting project at /home/erkut/bitirme/mobile`, but no ready banner was captured in the short inspection window.
- Root combined startup script was validated:
  - mobile start was triggered successfully
  - backend start was triggered successfully
  - backend then failed on MongoDB DNS/SRV connectivity for the configured host
- Ollama adapter unit tests passed: `15/15`.
- Full backend suite passed after rerunning outside sandbox: `55/55` tests passed across `2` test files.
- Mobile recipe UI has no automated tests configured in the repo.
- `cd mobile && npm run web` reached Expo startup output: `Starting project at /home/erkut/bitirme/mobile`.
- `cd mobile && npx expo export --platform web` did not validate the new screen because this repo does not include Expo web dependencies:
  - missing `react-dom`
  - missing `react-native-web`
- Direct Node `import()` checks against mobile source were not meaningful validation for this app shape:
  - one failed on extensionless React Native module resolution
  - one failed on JSX parsing in plain Node without Expo/Babel transforms
- Targeted Ollama adapter tests passed after the English-output prompt update: `16/16`.
- Home dashboard changes were not covered by automated tests because the mobile app still has no frontend test setup in the repo.
- Native date-time picker dependency was installed successfully:
  - `@react-native-community/datetimepicker@9.1.0`
- Pantry expiration date-time changes were not covered by automated tests because the mobile app still has no frontend test setup in the repo.

Remaining issues:

- Mobile feature coverage still trails backend capability outside auth, pantry, and basic recipe generation.
- AI image recognition is mock-only.
- Notification flow is missing.
- Env and deployment setup need hardening.
- Manual end-to-end local testing currently depends on fixing backend `MONGODB_URI` / MongoDB reachability first.
- Manual Ollama recipe generation still depends on a running local Ollama service and a pulled local model referenced by `OLLAMA_MODEL`.
- Mobile recipe polling does not resume across screen exits or app restarts.
- Mobile still has no frontend automated test/lint/format pipeline.
- The new pantry date-time picker flow still needs manual device/emulator verification on Android and iOS.

Next recommended task:

 - Fix local backend environment so `npm run dev` can fully come up:
   - verify the active backend `.env`
   - point `MONGODB_URI` to a reachable local MongoDB or working Atlas URI
 - After MongoDB is reachable, manually validate the new mobile `Recipes` tab end-to-end with `AI_PROVIDER=ollama`.
 - Then wire the next highest-value mobile feature:
   - recipe cook action
   - favorites/history views
