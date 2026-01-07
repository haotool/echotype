# Changelog

All notable changes to EchoType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with CRXJS Vite Plugin + TypeScript
- Chrome Extension Manifest V3 configuration
- BDD specification files (Gherkin format)
- Keyboard shortcuts for dictation control
  - `Ctrl+Shift+1` - Start dictation
  - `Ctrl+Shift+2` - Pause dictation
  - `Ctrl+Shift+3` - Submit and get result
  - `Ctrl+Shift+4` - Paste last result

### Modules
- **shared/**: types.ts, protocol.ts, utils.ts
- **background/**: Service Worker with tab management, settings, history
- **content/chatgpt/**: Dictation control, stable capture, baseline diff, robust clear
- **content/universal/**: Universal paste support for all websites
- **offscreen/**: Clipboard operations via Offscreen API
- **options/**: Settings page with toggle switches

### Testing
- 61 unit tests with Vitest
- 100% TypeScript strict mode compliance

## [0.1.0] - 2026-01-07

### Added
- Initial release
- Complete modular architecture from original demo.js
- Full keyboard shortcut support
- Auto-copy to clipboard option
- History tracking (last 5 results)
- Options page for customization
