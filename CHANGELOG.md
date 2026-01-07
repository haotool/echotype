# Changelog

All notable changes to EchoType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-01-08

### Added
- 🎯 **Complete E2E Testing** - 25 Playwright tests covering all core functionality
- 📝 **CHANGELOG** - Comprehensive version history documentation

### Changed
- Upgraded project version to 0.5.0
- Improved test reliability for toggle interactions

### Fixed
- Playwright ESM __dirname compatibility issue
- Service worker detection timing in E2E tests

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
