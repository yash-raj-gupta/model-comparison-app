# Model Arena - Codebase Overview

## Project Summary

**Model Arena** is a Next.js 16 application that provides a web interface for comparing outputs from multiple Large Language Models (LLMs) simultaneously. It connects to a LiteLLM proxy to query different AI models and display their responses side-by-side.

## Architecture

### Tech Stack

- **Framework**: Next.js 16.2.2 (React 19.2.4)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui
- **UI Components**: Radix UI primitives via shadcn/ui
- **Icons**: Lucide React
- **Markdown Rendering**: react-markdown, react-syntax-highlighter

### Project Structure

```
model-comparison-app/
├── app/
│   ├── page.tsx          # Main application page (all logic)
│   ├── layout.tsx        # Root layout with fonts & metadata
│   └── globals.css       # Global styles, Tailwind config, CSS variables
├── components/
│   └── ui/               # shadcn/ui components
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
├── lib/
│   └── utils.ts          # Utility functions (cn helper for Tailwind)
├── package.json          # Dependencies
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── components.json       # shadcn/ui configuration
└── .next/                # Build output
```

## Key Files Explained

### 1. `app/page.tsx` - Main Application

The single-page application containing all functionality:

**State Management:**
- `prompt` - User's input prompt
- `selectedModels` - Array of selected model IDs (default: open-large, claude-sonnet-4-6, gemini-3-pro-preview)
- `responses` - Array of model responses with loading/error states
- `isLoading` - Global loading state
- `apiKey` / `baseUrl` - LiteLLM proxy credentials (with env defaults)
- `copiedModel` - Tracks which response was copied

**Supported Models:** 18 models from 5 providers:
- **Anthropic**: Claude Sonnet 4.5, Claude Opus 4.5, Claude Opus 4.6, Claude Haiku variants
- **Google**: Gemini 3 Pro/Flash Preview, Gemini Embedding, Gemini 3.1 Pro
- **Juspay**: Open Large, Open Fast
- **Zhipu**: GLM Latest, GLM Flash Experimental
- **Moonshot**: Kimi Latest
- **MiniMax**: MiniMax M2

**Key Functions:**
- `handleModelToggle(modelId)` - Add/remove models from selection
- `handleSubmit()` - Send parallel requests to all selected models via LiteLLM proxy
- `copyToClipboard(content, model)` - Copy response text
- `getModelInfo(modelId)` - Get display info for a model

**API Integration:**
```typescript
POST ${baseUrl}/v1/chat/completions
Body: {
  model: modelId,
  messages: [{ role: "user", content: prompt }],
  temperature: 0.7,
  max_tokens: 2000
}
```

**UI Sections:**
1. Header - Title with Sparkles icon
2. Configuration - Base URL and API key inputs
3. Model Selection - Toggle buttons for all available models
4. Prompt Input - Textarea with character count
5. Results Display - Grid/List view tabs showing responses

### 2. `app/layout.tsx` - Root Layout

- Sets up Geist Sans and Geist Mono fonts
- Metadata: "Model Arena - Compare LLM Outputs"
- Dark mode support via className

### 3. `app/globals.css` - Global Styles

- Tailwind CSS 4 imports and configuration
- CSS variables for theming (light/dark modes)
- shadcn/ui theme tokens
- OKLCH color space for modern color handling

### 4. `lib/utils.ts` - Utilities

- `cn()` - Combines clsx and tailwind-merge for conditional classes

### 5. UI Components (`components/ui/`)

All shadcn/ui components using Radix UI primitives:
- Built with `class-variance-authority` for variant management
- Styled with Tailwind CSS
- Support dark mode via CSS variables

## Environment Variables

```
NEXT_PUBLIC_LITELLM_API_KEY     # API key for LiteLLM proxy
NEXT_PUBLIC_LITELLM_BASE_URL    # Base URL (default: http://localhost:4000)
```

## Key Features

1. **Multi-Model Comparison** - Query multiple LLMs simultaneously
2. **Real-time Metrics** - Shows latency (ms) and token usage for each response
3. **Dual View Modes** - Grid view (2-3 columns) or List view (stacked)
4. **Copy to Clipboard** - One-click copying of any response
5. **Error Handling** - Graceful handling of API errors per model
6. **Dark Mode** - Full dark mode support
7. **Responsive Design** - Works on mobile and desktop

## Dependencies to Note

```json
{
  "@base-ui/react": "^1.3.0",        // Radix UI alternative
  "react-markdown": "^10.1.0",        // Markdown rendering
  "react-syntax-highlighter": "^16.1.1", // Code syntax highlighting
  "rehype-highlight": "^7.0.2",       // Highlight.js integration
  "remark-gfm": "^4.0.1",             // GitHub-flavored markdown
  "lucide-react": "^1.7.0"            // Icon library
}
```

## Development Commands

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

## Important Notes

- **Next.js 16 Breaking Changes**: This project uses Next.js 16 which has API differences from older versions. Refer to `node_modules/next/dist/docs/` if modifying.
- **Client Component**: The main page is marked `"use client"` for React hooks
- **Parallel Requests**: All model requests fire simultaneously via `Promise.all()`
- **No Backend**: This is a pure frontend app - all API calls go directly to the LiteLLM proxy
