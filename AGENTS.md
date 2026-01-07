# AGENTS.md - EchoType Development Team Configuration

> Version: 1.5.0 | Updated: 2026-01-08T00:30:00+08:00

## 🎯 Project Overview

**EchoType** - Chrome Extension for universal voice dictation via ChatGPT's Whisper integration.

## 👥 Team Codenames

| Codename     | Role              | Responsibilities                    |
| ------------ | ----------------- | ----------------------------------- |
| **Echo**     | Product Manager   | PRD, UX, feature prioritization     |
| **Whisper**  | Architect         | System design, module decomposition |
| **Pulse**    | Frontend Engineer | UI/UX, Content Scripts              |
| **Signal**   | Backend Engineer  | Background SW, messaging protocol   |
| **Cipher**   | Security Engineer | Permissions, data security          |
| **Spectrum** | QA Engineer       | BDD testing, quality assurance      |

## 🛠️ Tech Stack

```yaml
runtime: Chrome Extension (Manifest V3)
framework: CRXJS Vite Plugin
language: TypeScript (strict mode)
testing: Vitest + vitest-cucumber
styling: Vanilla CSS (inline)
```

## 📁 Project Structure

```
EchoType/
├── docs/                    # Documentation (keeps root clean)
│   ├── bdd/features/        # Gherkin .feature files
│   └── architecture/        # ADRs, diagrams
├── src/
│   ├── shared/              # Shared types, protocol, utils
│   ├── background/          # Service Worker
│   ├── content/
│   │   ├── chatgpt/         # ChatGPT-specific content script
│   │   └── universal/       # Universal paste content script
│   ├── offscreen/           # Clipboard operations
│   └── options/             # Settings page
├── tests/
│   ├── unit/                # Unit tests
│   └── e2e/                 # End-to-end tests
├── manifest.json            # Extension manifest
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies
```

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Development with HMR
pnpm dev

# Build for production
pnpm build

# Run tests (BDD: red-green-refactor)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint & format
pnpm lint
pnpm format
```

## 🧪 BDD Workflow (Red-Green-Refactor)

1. **Red**: Write failing test (`.feature` → step definitions)
2. **Green**: Implement minimum code to pass
3. **Refactor**: Clean up while keeping tests green
4. **Commit**: Atomic commit with conventional message

## 📝 Commit Convention

```
type(scope): subject

# Types: feat, fix, refactor, test, docs, chore
# Scope: shared, chatgpt, background, offscreen, options
# Subject: imperative, <50 chars, no period

# Examples:
feat(chatgpt): implement stable capture with change detection
fix(offscreen): handle clipboard permission denial gracefully
test(shared): add unit tests for normalizeText utility
```

## 🔒 Security Boundaries

### Allowed (Auto-execute)

- File read/write within `src/`, `docs/`, `tests/`
- Run `pnpm` commands
- Git operations (stage, commit, push)

### Requires Confirmation

- Delete files outside `tests/`
- Modify `manifest.json` permissions
- External API calls

## 📋 Key Selectors (ChatGPT DOM)

```typescript
// Subject to change - use health checks
const SELECTORS = {
  startBtn: 'button[aria-label="聽寫按鈕"]',
  stopBtn: 'button[aria-label="停止聽寫"]',
  submitBtn: 'button[aria-label="提交聽寫"]',
  composer: '#prompt-textarea',
};
```

## 🎯 MVP Acceptance Criteria

- [x] Keyboard shortcuts configured (Ctrl+Shift+1/2/3/4)
- [x] Baseline diff captures only new text
- [x] Robust clear with verification (4 retries)
- [x] Auto-copy to clipboard via Offscreen API
- [x] History: last 5 results management
- [x] Options: toggle auto-copy, auto-paste, return focus
- [x] Build passes with no errors
- [x] 86 unit tests pass
- [x] E2E test framework configured (Playwright)
- [x] E2E testing framework with 23 tests
- [x] Multi-language support (en, zh_TW)
- [x] Audio feedback sounds
- [x] Keyboard shortcuts display
- [x] Modern UI with design tokens (light/dark mode)
- [x] Developer mode with debugging tools
- [x] Multi-language ChatGPT selectors (EN/ZH-TW/ZH-CN)

## 🔗 References

- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
- [Chrome Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
- [Chrome Commands API](https://developer.chrome.com/docs/extensions/reference/api/commands)
- [Vitest](https://vitest.dev/)
