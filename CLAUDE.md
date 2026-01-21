# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EchoType is a Chrome extension (Manifest V3) that captures voice dictation from ChatGPT's Whisper and makes it available as reusable text. It uses the CRXJS Vite plugin for development.

## Commands

```bash
# Development
pnpm dev          # Start dev server with HMR (load dist/ in Chrome)
pnpm build        # Production build (tsc && vite build)
pnpm typecheck    # TypeScript check without emit

# Testing
pnpm test         # Run unit tests (Vitest)
pnpm test:watch   # Watch mode
pnpm test:e2e     # E2E tests (Playwright) - requires fresh build
pnpm test:e2e:ui  # E2E with Playwright UI

# Quality
pnpm lint         # ESLint
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Prettier format
pnpm test:all     # Full check: lint + typecheck + test + build

# Package
pnpm package      # Build and create versioned zip
```

## Architecture

### Extension Components

The extension follows Chrome MV3 architecture with these components:

```
src/
├── background/     # Service Worker - orchestrates all operations
├── content/
│   ├── chatgpt/    # ChatGPT-specific content script (dictation control)
│   └── universal/  # Injected into all tabs (paste functionality)
├── offscreen/      # Offscreen document for clipboard operations
├── popup/          # Extension popup UI
├── options/        # Settings page
└── shared/         # Shared types, protocol, utilities
```

### Message Flow

Communication uses a typed protocol (`src/shared/protocol.ts`):

1. **Background ↔ Content**: Commands (`CMD_START`, `CMD_SUBMIT`, etc.) and results (`RESULT_READY`, `STATUS_CHANGED`)
2. **Background → Offscreen**: Clipboard operations (`OFFSCREEN_CLIPBOARD_WRITE`)
3. **Background → Universal**: Paste operations (`PASTE_TEXT`)

### Key Files

- `src/shared/protocol.ts` - All message types and creators
- `src/shared/types.ts` - Core type definitions (`DictationStatus`, `EchoTypeSettings`)
- `src/background/index.ts` - Main service worker logic
- `src/content/chatgpt/controller.ts` - Dictation state machine
- `src/content/chatgpt/selectors.ts` - ChatGPT DOM selectors (SVG-based)

### Status State Machine

```
idle → listening/recording → processing → idle
  ↑                            ↓
  ←←←←←←← error ←←←←←←←←←←←←←←
```

Status is persisted in `chrome.storage.session` to survive service worker restarts.

## Path Aliases

Configured in both `tsconfig.json` and `vite.config.ts`:

- `@/` → `src/`
- `@shared/` → `src/shared/`
- `@background/` → `src/background/`
- `@content/` → `src/content/`

## Testing Structure

- **Unit tests** (`tests/unit/`): Vitest with jsdom, covers `src/shared/` utilities
- **E2E tests** (`tests/e2e/`): Playwright, covers full extension workflows

Unit test coverage excludes files requiring Chrome API mocking (background, content, offscreen) - these are covered by E2E.

## Commit Convention

```
type(scope): subject

# Types: feat, fix, refactor, test, docs, chore
# Scopes: shared, chatgpt, background, offscreen, options, popup
```

## ChatGPT DOM Integration

The extension detects ChatGPT buttons using SVG `use[href]` patterns as primary selectors with `aria-label` fallbacks. See `src/content/chatgpt/selectors.ts` for current patterns. These may need updates when ChatGPT's UI changes.
