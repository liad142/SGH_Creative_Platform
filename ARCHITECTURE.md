# SGH Smart Platform - Architecture & Implementation Plan

## Role
**Lead System Architect:** Dashboard & Orchestration.

## Structure
- **/client**: React (Vite) frontend.
- **/server**: Node.js (Express) backend.
- **/shared**: Shared types and constants (MCP protocol definitions).

## Responsibilities

### Database Agent (Supabase)
- **Goal**: Setup PostgreSQL Schema.
- **Tables**:
  - `users`: profiles.
  - `generations`: AI generated assets.
  - `seasons`: Game seasons.
  - `cards`: Collectible cards.
  - `pets`: User pets.
- **Storage**: Buckets for images/assets.

### Backend Agent (Node/Express)
- **Goal**: API Implementation.
- **Stack**: Express, Gemini SDK, Supabase Admin.
- **Endpoints**:
  - `POST /api/generate` (Gemini Imagen 3).
  - `GET /api/seasons`
  - `GET /api/cards`
  - etc.

### Frontend Agent (React/Vite)
- **Goal**: UI/UX Implementation.
- **Stack**: Tailwind CSS, Lucide Icons.
- **Pages**:
  - Dashboard
  - Seasons
  - Cards Album
  - Pets
  - Generations

## Configuration
- Enforce Environment Variables in `.env`.
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY`
