# EchoType

[English](README.md) | [繁體中文](README.zh-TW.md)

EchoType is a Chrome extension that turns ChatGPT voice dictation into reusable text you can paste anywhere.

## Highlights

- Voice dictation powered by ChatGPT Whisper
- Global keyboard shortcuts for start, submit, cancel, and paste
- Optional auto-copy and auto-paste after completion
- History of recent dictation results
- Multi-language UI (25 languages)
- Popup and settings UI with MV3 offscreen clipboard support

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
| `Alt+Shift+S` | Toggle dictation (start/submit) |
| `Alt+Shift+C` | Cancel dictation |
| `Alt+Shift+P` | Paste last result |

Settings:

Open the popup and select Settings.

| Setting | Description | Default |
| --- | --- | --- |
| Auto Copy | Copy results to clipboard | On |
| Auto Paste | Paste to the original input | Off |
| Return Focus | Return to the original tab after start | Off |

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
