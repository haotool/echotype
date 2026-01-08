# Changelog

All notable changes to EchoType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-01-09

### 🐛 Critical Bug Fixes
- **State Reset Bug** - Fixed dictation state not resetting after submit, which caused the extension to be stuck in "recording" state
  - Popup now explicitly resets `currentStatus` to 'idle' after submit/cancel operations
  - Added immediate UI update after status change for responsive feedback
- **Tab Connection** - Improved ChatGPT tab connection reliability with retry logic and exponential backoff
  - Increased max retries from 3 to 5 for better reliability
  - Optimized retry delay for faster recovery
- **Content Script Injection** - Enhanced content script injection with validation and recovery
- **Clipboard DOMException** - Improved clipboard write with robust fallback using execCommand

### ✨ New Features
- **Login Detection** - Added automatic detection of ChatGPT login status with user-friendly error messages
- **Voice Input Availability Check** - Validates that voice dictation feature is available before attempting to start

### 🔒 Security & Legal
- **Comprehensive Disclaimer** - Added detailed disclaimer and legal notices to PRIVACY.md
- **Takedown Request Process** - Added clear process for takedown requests

### 🔧 Improvements
- **Tab Manager** - Added tab validation, refresh capability, and improved state management
- **Error Messages** - More descriptive error messages for common failure scenarios
- **Logging** - Enhanced debug logging for troubleshooting

### 📦 Build Optimizations
- **Terser Minification** - Added terser for production builds with console.log removal
- **Chunk Splitting** - Manual chunk splitting for better caching (protocol, utils)
- **Target ESNext** - Build target set to esnext for smaller bundle size
- **ZIP Size** - Reduced from 96KB to 94KB

### 📝 Metadata
- **GitHub Account** - Updated to `haotool` organization
- **Contact Email** - Updated to `haotool.org@gmail.com`
- **Version** - Bumped to 0.8.0
- **Test Coverage** - 75% coverage with 88 unit tests

---

## [0.7.0] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Hindi (hi) - हिन्दी
  - Czech (cs) - Čeština
  - Greek (el) - Ελληνικά
  - Swedish (sv) - Svenska
- 🔍 **Extended Selector Coverage** - Added aria-labels for Hindi, Czech, Greek, Swedish ChatGPT UI

### Changed
- 📦 Version bump to 0.7.0
- 🌏 Now supports **25 languages** total

---

## [0.6.9] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Polish (pl) - Polski
  - Dutch (nl) - Nederlands
  - Ukrainian (uk) - Українська
- 🔍 **Extended Selector Coverage** - Added aria-labels for Polish, Dutch, Ukrainian ChatGPT UI

### Changed
- 📦 Version bump to 0.6.9
- 🌏 Now supports 21 languages total

---

## [0.6.8] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Hebrew (he) - עברית (RTL)
  - Persian (fa) - فارسی (RTL)
  - Turkish (tr) - Türkçe
- 🔍 **Extended Selector Coverage** - Added aria-labels for Hebrew, Persian, Turkish ChatGPT UI

### Changed
- 📦 Version bump to 0.6.8
- 🌏 Now supports 18 languages total

---

## [0.6.7] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Vietnamese (vi) - Tiếng Việt
  - Thai (th) - ภาษาไทย
  - Indonesian (id) - Bahasa Indonesia
- 🔍 **Extended Selector Coverage** - Added aria-labels for Vietnamese, Thai, Indonesian ChatGPT UI

### Changed
- 📦 Version bump to 0.6.7
- 🌏 Now supports 15 languages total

---

## [0.6.6] - 2026-01-09

### Added
- 🌍 **RTL (Right-to-Left) Support** - Full RTL layout support for:
  - Arabic (ar)
  - Hebrew (he) - prepared
  - Persian (fa) - prepared
- 📄 **Updated Store Description** - Multi-language store descriptions for Chrome Web Store

### Changed
- 📦 Version bump to 0.6.6
- 🎨 Enhanced CSS with RTL-aware utility classes

---

## [0.6.5] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Russian (ru) - Русский
  - Simplified Chinese (zh_CN) - 简体中文
  - Arabic (ar) - العربية
- 🔍 **Extended Selector Coverage** - Added aria-labels for Russian, Simplified Chinese, and Arabic ChatGPT UI

### Changed
- 📦 Version bump to 0.6.5

---

## [0.6.4] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Portuguese (pt) - Português
  - Italian (it) - Italiano
- 🔍 **Extended Selector Coverage** - Added aria-labels for Portuguese and Italian ChatGPT UI
- 🚀 **GitHub Actions Release Workflow** - Automated release creation on tag push

### Changed
- 📦 Version bump to 0.6.4

---

## [0.6.3] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - French (fr) - Français
  - Spanish (es) - Español
- 🔍 **Extended Selector Coverage** - Added aria-labels for French and Spanish ChatGPT UI

### Changed
- 📦 Version bump to 0.6.3

---

## [0.6.2] - 2026-01-09

### Added
- 🌐 **Multi-language Support Expansion** - Full i18n for:
  - Japanese (ja) - 日本語
  - Korean (ko) - 한국어
  - German (de) - Deutsch
- 🔍 **Extended Selector Coverage** - Added aria-labels for Japanese, Korean, German, French, Spanish

### Changed
- 📦 Version bump to 0.6.2

---

## [0.6.1] - 2026-01-09

### Added
- 🌐 **Japanese Language Support** - Full i18n for Japanese (ja) locale
- 🔍 **Extended Selector Coverage** - Added aria-labels for Japanese, Korean, German, French, Spanish

### Changed
- 📦 Version bump to 0.6.1

---

## [0.6.0] - 2026-01-09

### Changed
- 🎯 **Simplified Keyboard Shortcuts** - Reduced from 4 to 3 commands:
  - `toggle-dictation` (Alt+Shift+S): Start if idle, Submit if recording
  - `cancel-dictation` (Alt+Shift+C): Cancel recording and clear input
  - `paste-last-result` (Alt+Shift+P): Paste last result (unchanged)
- 🎨 **Redesigned Popup UI** - Single toggle button replaces Start/Pause/Submit
  - Red "Record" button when idle
  - Green "Submit" button when recording
  - Cancel button appears only during recording
- 🔧 **Enhanced Selector Stability** - SVG href fragments prioritized over aria-labels
- 📡 **Fixed State Sync Bug** - Status changes now properly forwarded to popup

### Added
- `cancelDictation()` function in controller (alias for pauseDictation)
- SVG-based button detection for ChatGPT interface stability
- New i18n messages for toggle/cancel commands

### Fixed
- Popup UI getting stuck in old state after dictation submission
- Status not updating in popup when recording starts/stops

## [0.5.2] - 2026-01-08

### Fixed
- Allow submit while composer is hidden during active dictation
- Treat dictation controls as healthy state when waveform UI replaces composer
- Skip clicking disabled dictation buttons

## [0.5.1] - 2026-01-08

### Changed
- 🎨 **Modern Extension Icon** - Redesigned icon with gradient purple theme and sound wave elements
- 🖼️ **SVG Source** - Created scalable vector source (icon.svg) for future icon modifications
- 🔧 **Icon Generation** - Used rsvg-convert CLI tool for high-quality PNG conversion (16x16, 32x32, 48x48, 128x128)

## [0.5.0] - 2026-01-08

### Added
- 🎯 **Complete E2E Testing** - 25 Playwright tests covering all core functionality
- 📝 **CHANGELOG** - Comprehensive version history documentation
- 🔄 **Service Worker Keep-alive** - Alarms-based mechanism to prevent SW termination
- 💓 **Heartbeat Tracking** - Real-time SW health monitoring with uptime stats
- 🤖 **GitHub Actions CI** - Automated testing on push/PR to main/develop
- 📜 **Privacy Policy** - PRIVACY.md for Chrome Web Store compliance
- 🖼️ **Promotional Images** - 440x280 and 220x140 for Chrome Web Store
- 📦 **Release Package** - EchoType-v0.5.0.zip (35KB) ready for Store
- 🔒 **Content Security Policy** - Enhanced security configuration

### Changed
- Upgraded project version to 0.5.0
- Improved test reliability for toggle interactions
- Updated README badges with CI status and test counts
- Adjusted coverage thresholds to 60% for testable shared utilities
- Excluded browser-specific files from unit test coverage (covered by E2E)

### Fixed
- Playwright ESM __dirname compatibility issue
- Service worker detection timing in E2E tests
- E2E test navigation interruption in customize shortcuts test
- Added missing `alarms` permission for keep-alive functionality

### Security
- Added explicit `content_security_policy` in manifest.json
- Restricted scripts and objects to 'self' origin

## [0.4.0] - 2026-01-08

### Added
- 🎨 **Modern UI Design** - Complete redesign with design tokens for consistent styling
- 🌙 **Dark/Light Mode** - Theme toggle with automatic system preference detection
- 🌐 **Multi-language Support** - Full i18n for English and Traditional Chinese
- 🛠️ **Developer Mode** - Advanced debugging tools and diagnostics panel
- 🔊 **Audio Feedback** - Sound effects for dictation events (start, stop, submit)
- 📋 **Keyboard Shortcuts Display** - Visual shortcuts guide in popup UI
- 🎯 **Multi-language ChatGPT Selectors** - Support for EN/ZH-TW/ZH-CN UI labels

### Changed
- Popup UI completely redesigned with modern aesthetics
- Options page redesigned with card-based layout
- Status indicators now show animated waveform visualization
- Improved error handling with friendly error messages

### Fixed
- ChatGPT selector detection for English UI
- Theme persistence across sessions
- Button states properly reflect dictation status

## [0.3.0] - 2026-01-07

### Added
- E2E testing framework with Playwright
- Offscreen API for clipboard operations
- History management with up to 5 entries
- Settings persistence via chrome.storage.sync

### Changed
- Migrated to Manifest V3
- Improved baseline diff algorithm
- Enhanced robust clear mechanism

## [0.2.0] - 2026-01-06

### Added
- ChatGPT content script with DOM manipulation
- Universal paste content script
- Background service worker message routing
- Basic popup UI

### Fixed
- Content script injection timing
- Message passing reliability

## [0.1.0] - 2026-01-05

### Added
- Initial project setup with CRXJS Vite Plugin
- TypeScript configuration with strict mode
- Basic manifest.json structure
- Vitest testing framework
- BDD workflow with vitest-cucumber
