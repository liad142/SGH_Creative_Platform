# SGH Smart Platform - Technical Documentation

## 🌟 Overview

The **SGH Smart Platform** is an AI-powered game asset production system designed for the "Solitaire Grand Harvest" casual mobile game. It automates the creation of seasonal game content using Google's Gemini AI for both text brainstorming and image generation.

---

## 📁 Project Structure

```
SGH Smart Platform/
├── client/                 # React Frontend (Vite)
│   └── src/
│       ├── pages/
│       │   ├── Seasons/    # Season Management UI
│       │   │   ├── SeasonDashboard.jsx
│       │   │   ├── ChapterGrid.jsx
│       │   │   └── TaskManager.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Album.jsx
│       │   ├── Pets.jsx
│       │   └── Generations.jsx
│       └── components/
├── server/                 # Node.js Backend (Express)
│   └── src/
│       ├── controllers/
│       │   └── seasonController.ts    # Core Season Logic
│       ├── routes/
│       │   └── seasonRoutes.ts        # API Endpoints
│       ├── services/
│       │   ├── gemini.ts              # AI Integration
│       │   └── supabase.ts            # Database Client
│       └── config/
│           └── env.ts                 # Environment Config
├── database/               # SQL Migrations
│   └── 05_final_seasons_schema.sql    # Current Schema
├── migrations/             # Additional Migrations
├── shared/                 # Shared Types & Constants
└── .env                    # Environment Variables
```

---

## 🗄️ Database Schema (3-Tier Hierarchy)

The seasons feature uses a **3-tier relational structure**:

### Level 1: `seasons` (Theme Container)
```sql
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL,           -- e.g. "Underwater Atlantis"
  status TEXT DEFAULT 'planning',     -- 'planning', 'active', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Level 2: `season_chapters` (12 Locations per Season)
```sql
CREATE TABLE public.season_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  chapter_index INT NOT NULL,         -- 1 to 12
  chapter_title TEXT NOT NULL,        -- e.g. "Coral Reef Outpost"
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Level 3: `chapter_tasks` (6 Buildable Assets per Chapter)
```sql
CREATE TABLE public.chapter_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.season_chapters(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,            -- e.g. "Seahorse Mailbox"
  task_type TEXT,                     -- 'structure', 'prop', 'nature'
  
  -- Generation State
  status TEXT DEFAULT 'pending',      -- 'pending', 'generated', 'completed'
  
  -- AI Prompts
  prompt_used TEXT,                   -- The prompt sent to AI
  storage_path TEXT,                  -- Storage bucket path
  
  -- Generated Assets
  full_asset_url TEXT,                -- Main "Step 1" image (public URL)
  part_1_url TEXT,                    -- "Step 2" decomposition part 1
  part_2_url TEXT,                    -- Part 2
  part_3_url TEXT,                    -- Part 3
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Entity Relationship Diagram
```
┌─────────────┐       ┌──────────────────┐       ┌────────────────┐
│   seasons   │───┬──▶│ season_chapters  │───┬──▶│ chapter_tasks  │
│             │   │   │                  │   │   │                │
│ theme_name  │   │   │ chapter_title    │   │   │ task_name      │
│ status      │  1:12 │ chapter_index    │  1:6+ │ full_asset_url │
└─────────────┘       └──────────────────┘       │ part_1_url     │
                                                 │ part_2_url     │
                                                 │ part_3_url     │
                                                 │ prompt_used    │
                                                 └────────────────┘
```

---

## 🔌 API Endpoints

### Base URL: `/api/seasons`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List all seasons |
| `GET` | `/chapters?seasonId=xxx` | Get chapters & tasks for a season |
| `POST` | `/init` | Initialize a new season with AI brainstorming |
| `POST` | `/tasks/:taskId/generate-full` | Generate main asset image |
| `POST` | `/tasks/:taskId/decompose` | Split asset into 3 component parts |

### Endpoint Details

#### `POST /api/seasons/init`
**Purpose**: Creates a new season by asking Gemini to brainstorm 12 chapters × 6 tasks.

**Request Body**:
```json
{
  "theme": "Groundbreaking Harvest"
}
```

**Response**:
```json
{
  "success": true,
  "seasonId": "uuid-xxx-xxx"
}
```

**Flow**:
1. Send theme to Gemini Text (`gemini-2.0-flash`)
2. AI returns JSON with 12 chapters, each with 6 task names
3. Insert season → chapters → tasks into database
4. All tasks start with `status: 'pending'`

---

#### `POST /api/seasons/tasks/:taskId/generate-full`
**Purpose**: Generates the main asset image using AI.

**Request Body** (optional):
```json
{
  "customPrompt": "Your custom prompt here..."
}
```

**Response**:
```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/sgh-generated/...",
  "prompt": "The prompt used for generation"
}
```

**Flow**:
1. Fetch task details (name, chapter title, theme)
2. Build prompt (or use custom prompt from request)
3. Call Gemini Image (`gemini-2.5-flash-image` aka "Nano Banana")
4. Upload PNG to Supabase Storage (`sgh-generated` bucket)
5. Generate **public URL** (permanent, never expires)
6. Update task with `full_asset_url`, `prompt_used`, `status: 'generated'`

**Default Prompt Template**:
```
Subject: Isometric game asset of "{taskName}".
Context: A level named "{chapterTitle}" in a "{themeName}" casual game.
Style Constraints (CRITICAL):
- 3D Clay Render / Plastocene texture.
- "Chibi" proportions (chunky, rounded, cute).
- High glossy finish, soft daylight.
- Isometric 30-degree projection.
- On pure white background.
```

---

#### `POST /api/seasons/tasks/:taskId/decompose`
**Purpose**: Generates 3 component parts from the full asset.

**Response**:
```json
{
  "success": true,
  "part_1_url": "https://...",
  "part_2_url": "https://...",
  "part_3_url": "https://..."
}
```

**Flow**:
1. Verify `full_asset_url` exists
2. Generate "knolling sprite sheet" of 3 components
3. Use **Sharp** to crop into 3 equal vertical strips
4. Upload each part to storage
5. Update task with URLs and `status: 'completed'`

---

## 🤖 AI Integration

### Gemini Services (`server/src/services/gemini.ts`)

The platform uses **two Google AI SDKs**:

| SDK | Model | Purpose |
|-----|-------|---------|
| `@google/genai` | `gemini-2.5-flash-image` | Image generation (Nano Banana) |
| `@google/generative-ai` | `gemini-2.0-flash` | Text generation (JSON mode) |

### Image Generation Flow
```typescript
const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
        responseModalities: ['IMAGE', 'TEXT'],
    },
});

// Extract base64 image from response
const imageData = response.candidates[0].content.parts[0].inlineData.data;
return Buffer.from(imageData, 'base64');
```

### Text Generation Flow (JSON Mode)
```typescript
const textModel = legacyGenAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' }
});

const result = await textModel.generateContent(prompt);
const json = JSON.parse(result.response.text());
```

### Error Handling & Retry Logic
- Automatic retry on `429` (rate limit) and `503` (service unavailable)
- 5-second delay between retries
- Maximum 3 retry attempts

---

## 🎨 Frontend Components

### Season Management Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  SeasonDashboard    │────▶│     ChapterGrid     │────▶│    TaskManager      │
│                     │     │                     │     │                     │
│ • List all seasons  │     │ • 12 chapter cards  │     │ • Generate images   │
│ • Create new season │     │ • Progress bars     │     │ • View/edit prompts │
│ • Navigate to       │     │ • Click to open     │     │ • Decompose assets  │
│   chapters          │     │   TaskManager       │     │ • Fullscreen preview│
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### TaskManager.jsx Features

| Feature | Description |
|---------|-------------|
| **Generate Image** | Triggers AI image generation |
| **Regenerate** | Re-generates with same or new prompt |
| **View/Edit Prompt** | Modal to view and customize the AI prompt |
| **Fullscreen Preview** | Click image to open large modal |
| **Decompose** | Split image into 3 game-ready parts |
| **Status Badges** | Pending → Generated → Completed |

---

## 📦 Storage Architecture

### Supabase Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `sgh-generated` | **Public** | AI-generated images |
| `sgh-assets` | **Public** | Static uploaded assets |

### URL Strategy

**Public URLs** (current implementation):
```
https://{project}.supabase.co/storage/v1/object/public/sgh-generated/{path}
```
- ✅ Never expire
- ✅ Directly accessible
- ✅ CDN-friendly

**Storage Path Convention**:
```
sgh-generated/
└── tasks/
    └── {taskId}/
        ├── full_{uuid}.png      # Main asset
        ├── part_1_{uuid}.png    # Component 1
        ├── part_2_{uuid}.png    # Component 2
        └── part_3_{uuid}.png    # Component 3
```

---

## ⚙️ Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SERVICE_ROLE_KEY=eyJ...

# Google AI
GOOGLE_API_KEY=AIza...

# Server
PORT=3001
```

---

## 🚀 Development Commands

```bash
# Start both client and server
npm run dev

# Start only server
npm run dev -w server

# Start only client
npm run dev -w client

# Install dependencies
npm install
```

---

## 📊 Task Status Lifecycle

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐
│ PENDING  │────▶│  GENERATED  │────▶│  COMPLETED  │
│          │     │             │     │             │
│ No image │     │ Full asset  │     │ Full asset  │
│ yet      │     │ created     │     │ + 3 parts   │
└──────────┘     └─────────────┘     └─────────────┘
     │                  │                   │
     │   generate-full  │    decompose      │
     └──────────────────┴───────────────────┘
```

---

## 🔧 Key Technologies

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite | 7.3.0 |
| Styling | Tailwind CSS | 3.x |
| Icons | Lucide React | - |
| Backend | Express.js | 4.x |
| Runtime | Node.js + TSX | 22.x |
| Database | Supabase (PostgreSQL) | - |
| Storage | Supabase Storage | - |
| AI (Text) | Gemini 2.0 Flash | - |
| AI (Image) | Gemini 2.5 Flash Image | - |
| Image Processing | Sharp | - |

---

## 📈 Scalability Considerations

1. **Task Queue**: For production, consider adding a job queue (Bull, BullMQ) for image generation
2. **Caching**: Add Redis caching for frequently accessed seasons/chapters
3. **CDN**: Supabase Storage already provides CDN via public URLs
4. **Rate Limiting**: Implement API rate limiting to prevent abuse
5. **Background Processing**: Move image generation to background workers

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `429 Too Many Requests` | API quota exceeded | Enable billing on Google Cloud |
| `PGRST204` column not found | Missing DB column | Run SQL migration |
| Images not showing | Signed URLs expired | Using public URLs now |
| `No image data found` | Wrong response parsing | Check `inlineData.data` path |

---

## 📚 Related Documentation

- [Google AI SDK for JavaScript](https://ai.google.dev/gemini-api/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Vite Documentation](https://vitejs.dev/)

---

*Last Updated: December 23, 2025*
