# EchoType 🎤

> Universal Voice Dictation Chrome Extension powered by ChatGPT Whisper

[![CI](https://github.com/haotool/echotype/actions/workflows/ci.yml/badge.svg)](https://github.com/haotool/echotype/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/Version-0.8.14-brightgreen)](CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF)](https://vite.dev/)
[![Manifest V3](https://img.shields.io/badge/Chrome-MV3-green)](https://developer.chrome.com/docs/extensions/mv3/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-100%20passing-success)](tests/unit/)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-26%20passing-success)](tests/e2e/)
[![Coverage](https://img.shields.io/badge/Coverage-80%25-brightgreen)](coverage/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 📋 Overview

**EchoType** transforms ChatGPT's voice dictation into a universal input tool that works on any website. Simply press a keyboard shortcut to start dictating, and the transcribed text is automatically available for pasting anywhere.

### ✨ Key Features

- 🎙️ **Voice Dictation** - Leverage ChatGPT's Whisper integration
- ⌨️ **Global Shortcuts** - Control dictation from any tab
- 📋 **Auto Clipboard** - Results copied automatically
- 🔄 **Smart Transfer** - Paste directly to active elements
- 📜 **History** - Access last 5 dictation results
- ⚙️ **Customizable** - Configure behavior via Options page
- 🔊 **Audio Feedback** - Sound cues for dictation events
- 🌐 **Multi-language** - 25 languages supported

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/haotool/echotype.git
cd EchoType

# Install dependencies
pnpm install

# Build the extension
pnpm build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### First Use

1. Press `Alt+Shift+S` to start dictation
2. ChatGPT opens and begins recording
3. Speak your text
4. Press `Alt+Shift+S` again to submit
5. Text is copied to clipboard!

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+S` | Toggle dictation (start/submit) |
| `Alt+Shift+C` | Cancel dictation |
| `Alt+Shift+P` | Paste last result |

> 💡 Customize shortcuts in `chrome://extensions/shortcuts`

## ⚙️ Settings

Open the popup → **Settings**

| Setting | Description | Default |
|---------|-------------|---------|
| Auto Copy | Copy results to clipboard | ✅ On |
| Auto Paste | Paste to active element | ❌ Off |
| Return Focus | Switch back after start | ❌ Off |

## 🏗️ Architecture

```
EchoType/
├── _locales/            # i18n translations
│   ├── en/              # English
│   └── zh_TW/           # Traditional Chinese
├── src/
│   ├── background/      # Service Worker (MV3)
│   │   ├── index.ts     # Command router & state
│   │   ├── tab-manager.ts
│   │   ├── settings.ts
│   │   ├── history.ts
│   │   ├── audio.ts     # Sound feedback
│   │   └── badge.ts     # Status badge
│   ├── content/
│   │   ├── chatgpt/     # ChatGPT DOM control
│   │   │   ├── capture.ts
│   │   │   ├── clear.ts
│   │   │   └── diff.ts
│   │   └── universal/   # Paste handler
│   ├── offscreen/       # Clipboard & Audio (MV3)
│   ├── popup/           # Extension popup UI
│   ├── options/         # Settings page
│   └── shared/          # Shared utilities & types
├── tests/
│   ├── unit/           # 100 Vitest unit tests
│   └── e2e/            # 26 Playwright E2E tests
└── dist/               # Built extension (~38KB)
```

## 🧪 Testing

```bash
# Unit tests (86 tests)
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (25 tests, requires build)
pnpm test:e2e
```

## 🛠️ Development

```bash
# Development with HMR
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## 📦 Tech Stack

- **Framework**: [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin)
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + Playwright
- **Manifest**: Chrome Extension MV3

## 🔒 Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for pasting |
| `storage` | Save user settings |
| `offscreen` | Clipboard operations |
| `clipboardWrite` | Write to clipboard |
| `chatgpt.com` | Dictation control |

## 📝 License

[MIT](LICENSE) © 2026 [haotool](https://github.com/haotool)

## ⚠️ Disclaimer

EchoType is **NOT** an official OpenAI product and is **NOT** affiliated with, endorsed by, or sponsored by OpenAI or ChatGPT.
OpenAI/ChatGPT/Whisper trademarks are used for identification only.
See [DISCLAIMER.md](DISCLAIMER.md) for the full legal notice and [PRIVACY.md](PRIVACY.md) for data handling details.

---

<p align="center">
  Made with ❤️ using <a href="https://crxjs.dev/">CRXJS</a> + <a href="https://vitejs.dev/">Vite</a>
</p>
