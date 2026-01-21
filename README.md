# EchoType

[English](README.md) | [繁體中文](README.zh-TW.md)

[![CI](https://github.com/haotool/echotype/actions/workflows/ci.yml/badge.svg?style=flat-square)](https://github.com/haotool/echotype/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/haotool/echotype?style=flat-square)](https://github.com/haotool/echotype/releases)
[![License](https://img.shields.io/github/license/haotool/echotype?style=flat-square)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-Testing-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-Unit%20Tests-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Stars](https://img.shields.io/github/stars/haotool/echotype?style=flat-square)](https://github.com/haotool/echotype/stargazers)
[![Issues](https://img.shields.io/github/issues/haotool/echotype?style=flat-square)](https://github.com/haotool/echotype/issues)

EchoType is a Chrome extension that turns ChatGPT voice dictation into reusable text you can paste anywhere. Use ChatGPT's powerful Whisper speech recognition and copy the results to any application with a single keyboard shortcut.

## ✨ Features

- 🎤 **Voice Dictation** - Powered by ChatGPT's Whisper speech recognition
- ⌨️ **Global Shortcuts** - Start, submit, cancel, and paste with keyboard shortcuts
- 📋 **Auto Copy** - Automatically copy results to clipboard after dictation
- 📝 **Auto Paste** - Optionally paste directly to your original input field
- 📜 **History** - Keep track of your recent dictation results
- 🌍 **Multi-language** - UI available in 25 languages
- 🎨 **Modern UI** - Beautiful popup with dark/light theme support
- 🔊 **Audio Feedback** - Sound effects for start, success, and error states
- 💾 **MV3 Ready** - Built with Chrome Manifest V3 for security and performance

## Requirements

- Chromium-based browser with Manifest V3 support
- ChatGPT account with voice input available

## Installation

```bash
git clone https://github.com/haotool/echotype.git
cd EchoType
pnpm install
pnpm build
```

Load the extension:

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked
4. Select the `dist/` folder

## Usage

Keyboard shortcuts:

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+D` | Toggle dictation (start/submit) |
| `Alt+Shift+C` | Cancel dictation |
| `Alt+Shift+V` | Paste last result |

Settings:

Open the popup and select Settings.

| Setting | Description | Default |
| --- | --- | --- |
| Auto Copy | Copy results to clipboard | On |
| Auto Paste | Paste to the original input | Off |
| Return Focus | Return to the original tab after start | Off |
| Manual Submit Auto Copy | Auto copy when manually clicking submit on ChatGPT | Off |

## Development

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm format
```

## Testing

```bash
pnpm test
pnpm test:e2e
```

Note: `pnpm test:e2e` requires a fresh build.

## Architecture

```
EchoType/
├── _locales/            # i18n translations
├── src/
│   ├── background/      # MV3 service worker
│   ├── content/         # ChatGPT + universal content scripts
│   ├── offscreen/       # Clipboard + audio
│   ├── popup/           # Popup UI
│   ├── options/         # Settings UI
│   └── shared/          # Shared utilities and types
├── tests/
│   ├── unit/            # Vitest
│   └── e2e/             # Playwright
└── dist/                # Build output
```

## Permissions

| Permission | Purpose |
| --- | --- |
| `activeTab` | Paste to the active tab |
| `storage` | Persist settings |
| `offscreen` | Clipboard access in MV3 |
| `clipboardWrite` | Write to clipboard |
| `https://chatgpt.com/*` | Dictation control |

## Security and privacy

EchoType does not collect or transmit user data. See [PRIVACY.md](PRIVACY.md) for details.

## Disclaimer

EchoType is not an official OpenAI product and is not affiliated with, endorsed by, or sponsored by OpenAI or ChatGPT.
See [DISCLAIMER.md](DISCLAIMER.md) for full legal and trademark notices.

## License

[MIT](LICENSE)
