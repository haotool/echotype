# Changelog

All notable changes to EchoType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-01-07

### Added

- **Multi-language Support (i18n)**
  - English (`_locales/en/messages.json`)
  - Traditional Chinese (`_locales/zh_TW/messages.json`)
  - Auto-detection based on browser locale
  - 40+ translated UI strings
- **Audio Feedback**
  - Start dictation sound (440Hz A4)
  - Success sound (880Hz A5)
  - Error sound (220Hz A3)
  - Uses Web Audio API via Offscreen Document
- **Keyboard Shortcuts Display**
  - Dynamic shortcuts display using `chrome.commands.getAll()`
  - "Customize Shortcuts" button to Chrome settings
  - Visual indication for unset shortcuts
- **i18n Utilities** (`src/shared/i18n.ts`)
  - `getMessage()` - Get localized messages
  - `applyI18n()` - Auto-translate data-i18n elements
  - `formatRelativeTime()` - Localized relative time

### Changed

- Updated manifest with `default_locale: "en"`
- Options page now shows actual keyboard shortcuts
- Popup and Options use i18n for all text

### Technical

- 86 unit tests passing
- Build size: ~22KB

## [0.2.0] - 2026-01-07

### Added

- **Popup UI** - Modern dark theme popup with status display
  - Live status indicator (Ready/Recording/Processing)
  - Start/Pause/Submit control buttons
  - Last result display with one-click copy
  - Keyboard shortcuts reference
- **Badge Status** - Visual feedback on extension icon
  - 'REC' with red background during recording
  - '...' with orange during processing
  - '✓' green flash on success
  - '!' red flash on error
- **History UI** - Options page history management
  - Display last 5 dictation results
  - Relative timestamps (剛才, X 分鐘前)
  - One-click copy for each item
  - Clear all with confirmation
- PNG icons (16/32/48/128px) with brand color

### Changed

- Updated Options page design with history section
- Improved HistoryItem type with numeric timestamp

## [Unreleased]

### Planned

- Browser integration testing
- E2E test coverage
- Advanced ChatGPT DOM resilience

## [0.1.0] - 2026-01-07

### Added

- **Core Architecture**
  - CRXJS Vite Plugin setup with TypeScript
  - Chrome Extension Manifest V3 configuration
  - Modular project structure

- **Dictation Control (ChatGPT)**
  - `capture.ts` - Stable text capture with change detection
  - `clear.ts` - Robust clearing with verification (4 retries)
  - `diff.ts` - Baseline diff to extract only new text
  - `selectors.ts` - Resilient DOM selectors
  - `controller.ts` - Start/Pause/Submit orchestration

- **Background Service Worker**
  - Command routing (Ctrl+Shift+1/2/3/4)
  - Tab management for ChatGPT
  - Settings persistence (chrome.storage.sync)
  - History management (last 5 results)

- **Universal Content Script**
  - Paste results to any webpage
  - Smart element detection (input/textarea/contenteditable)

- **Offscreen Document**
  - Clipboard write via Offscreen API (MV3 compliant)

- **Options Page**
  - Auto Copy toggle
  - Auto Paste toggle
  - Return Focus toggle
  - Keyboard shortcuts reference

- **Testing**
  - 75 unit tests (Vitest)
  - E2E test framework (Playwright)
  - BDD feature specifications (Gherkin)

- **Documentation**
  - README.md with installation guide
  - AGENTS.md team configuration
  - BDD feature files
  - Analysis report

### Technical Details

- **Build Size**: ~20KB (production)
- **Dependencies**: CRXJS, Vitest, Playwright, TypeScript 5.8
- **Browser Support**: Chromium-based browsers

---

## Version History

| Version | Date       | Description                             |
| ------- | ---------- | --------------------------------------- |
| 0.3.0   | 2026-01-07 | i18n, audio feedback, shortcuts display |
| 0.2.0   | 2026-01-07 | Popup UI, badge status, history UI      |
| 0.1.0   | 2026-01-07 | Initial MVP release                     |

[Unreleased]: https://github.com/your-username/EchoType/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/your-username/EchoType/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/your-username/EchoType/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-username/EchoType/releases/tag/v0.1.0
