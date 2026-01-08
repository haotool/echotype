# Changelog

All notable changes to EchoType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
