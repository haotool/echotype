# Changelog

All notable changes to EchoType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.2] - 2026-01-21

### 🐛 Bug Fixes
- **Manual Submit Auto Copy - Full Workflow Alignment** - Fixed manual submit to mirror popup submit behavior:
  - Now properly clears composer after capturing text (same as popup)
  - Uses baseline diff to compute added text (same as popup)
  - Resets controller state after submit (same as popup)
  - Fixed i18n locale files with corrupted `minutesAgo` placeholders structure

### 🔧 Technical
- Manual submit now uses `captureAfterSubmit()` for stable text capture
- Added `clearComposerRobust()` call after manual submit
- Added `computeAddedText()` for baseline diff calculation
- Added `getControllerState()` export for baseline text access
- Fixed JSON structure in 9 locale files (de, es, fr, it, ja, ko, pt, ru, zh_CN)

### 🧪 Testing
- All 140 unit tests passing
- Build successful

---

## [0.9.1] - 2026-01-21

### ✨ New Features
- **Manual Submit Auto Copy** - New setting to automatically copy dictation results when manually clicking the submit button on ChatGPT page:
  - Enable in Settings → Automation → "Manual Submit Auto Copy"
  - Works when user manually clicks ChatGPT's dictation submit button
  - Automatically copies captured text to clipboard
  - Adds result to history
  - Plays success sound (if audio feedback enabled)
  - Perfect for users who prefer mouse interaction over keyboard shortcuts

### 🔧 Technical
- Added `manualSubmitAutoCopy` setting to `EchoTypeSettings` interface
- New `MANUAL_SUBMIT_CAPTURE` message type in protocol
- Content script monitors submit button clicks when feature is enabled
- Background script handles clipboard copy and history addition

### 🌐 i18n
- Added translations for "Manual Submit Auto Copy" in all 25 supported languages

### 🧪 Testing
- All 140 unit tests passing
- Build successful

---

## [0.9.0] - 2026-01-20

### 🎨 UI/UX - Major Visual Overhaul
- **Vibrant Red Recording Theme** - Completely redesigned audio visualizer:
  - Wide, dynamic wave animations (all 25 bars animate prominently)
  - 5-tier animation groups: peak → high → mid → outer → edge
  - Vibrant red gradient (#fca5a5 → #f87171 → #ef4444 → #dc2626)
  - Wider bars (6-10px) with 3px gap for better visibility
  - Red ambient glow effect during recording
  - Red box-shadow on active bars

- **Consistent Color Scheme**:
  - **Record button**: Red (unchanged)
  - **Submit button**: Changed from green to red (matches recording theme)
  - **Ready status**: Changed from gray to green with green indicator dot
  - **Recording status**: Red (unchanged)

- **Improved Popup Layout**:
  - Increased min-height from 420px to 480px
  - All content displays without being clipped

### 🔧 Improvements
- Removed redundant UI elements (visualizer-status, volume-indicator)
- Simplified HTML structure for better performance
- Pure CSS animation mode (no microphone conflicts)

### 🧪 Testing
- All 140 unit tests passing
- All 27 E2E tests passing in headless mode

---

## [0.8.20] - 2026-01-20

### 🎨 UI/UX
- **Modern AI Minimalist Visualizer** - Redesigned with Siri/Google Assistant inspired aesthetics:
  - Centered symmetric waveform with 25 thin bars (3px width)
  - AI-style indigo → violet gradient during recording
  - Center-out animation pattern (center bars peak highest)
  - Minimal idle state with subtle pulse animation
  - Removed redundant "Listening..." status text (now shown in status badge)
  - Reduced height to 64px for cleaner appearance
  - Simplified ambient glow effect

### 🔧 Improvements
- **Cleaner UI** - Removed redundant elements:
  - Removed visualizer-status element (redundant with status badge showing "Listening... SEC 07")
  - Removed volume-indicator element (not needed for CSS-only animation)
  - Simplified HTML structure for better performance

### 🧪 Testing
- All 140 unit tests passing
- All 27 E2E tests passing in headless mode

---

## [0.8.19] - 2026-01-20

### 🎨 UI/UX
- **Premium Studio-Grade Audio Visualizer** - Completely redesigned equalizer with professional aesthetics:
  - 25 wave bars (increased from 21) with wider, more prominent design
  - Subtle grid lines for professional studio look
  - Reflection effect on each bar for depth
  - 4-tier color coding: green → purple → amber → red (peak)
  - Ambient glow with gradient from green to purple
  - Smooth wave animation with staggered delays for realistic effect
  - Status indicator badge ("LIVE") during recording
  - Volume level indicator repositioned to bottom-left
  - Height increased to 72px for better visibility

### 🔧 Improvements
- **Simplified Audio Visualization** - Removed getUserMedia dependency:
  - Pure CSS animation mode to avoid conflicts with ChatGPT's microphone usage
  - ChatGPT handles audio capture, popup only shows visual feedback
  - Eliminated permission conflicts between extension and web page
  - More reliable and consistent visualization behavior

### 🧪 Testing
- **Headless E2E Testing** - Added `--headless=new` support for CI/CD:
  - Environment variable `HEADLESS=false` to disable headless mode
  - Compatible with Chrome 109+ headless mode for extensions
- All 140 unit tests passing
- All 27 E2E tests passing in headless mode

---

## [0.8.18] - 2026-01-20

### ✨ Features
- **Real-time Audio Visualization** - Modern audio visualizer with Web Audio API:
  - 21 wave bars with dynamic height based on microphone input
  - Color-coded volume levels (green → yellow → red)
  - Smooth CSS animations with `cubic-bezier` easing
  - Fallback CSS animation when audio API unavailable
  - Volume percentage indicator
- **ChatGPT Toast Detection** - Detect microphone permission errors from ChatGPT:
  - Multi-language toast pattern matching (EN/繁中/简中/日/韓/德/法/西)
  - `detectMicrophoneToast()` for immediate detection
  - `observeMicrophoneToast()` with MutationObserver for real-time monitoring
  - Automatic status update when toast detected

### 🎨 UI/UX
- **Redesigned Audio Visualizer** - Premium extension-quality audio feedback:
  - Ambient glow effect when recording
  - Gradient backgrounds with subtle depth
  - Responsive bar animations with natural jitter
  - Idle state with gentle pulse animation

### 🔧 Bug Fixes
- **E2E Test Stability** - Increased service worker wait timeout to 30s for reliable test execution

### 🧪 Testing
- All 140 unit tests passing
- All 27 E2E tests passing

---

## [0.8.17] - 2026-01-20

### 🌐 Internationalization
- **Complete Error Message i18n** - Added localized error messages for all 25 supported languages:
  - `errorConnectionFailed` / `errorConnectionFailedDesc`
  - `errorTabNotFound` / `errorTabNotFoundDesc`
  - `errorNotLoggedIn` / `errorNotLoggedInDesc`
  - `errorAlreadyActive` / `errorAlreadyActiveDesc`
  - `errorMicrophoneDenied` / `errorMicrophoneDeniedDesc`
- **Smart Error Display** - Popup now maps error codes to localized messages via `ERROR_I18N_MAP`

### 🔧 Bug Fixes
- **Fixed Hardcoded Error Messages** - Error messages in popup now use i18n instead of raw English strings
- **Added Error Code Mapping** - `showErrorFromCode()` function translates error codes to user-friendly localized messages

### 🧪 Testing
- All 140 unit tests passing
- All 27 E2E tests passing

---

## [0.8.16] - 2026-01-20

### 🔧 Critical Bug Fixes
- **Fixed "Dictation is not idle (unknown)" Error** - Modified `handleStartDictation()` to allow start when status is `unknown` (common in logged-out state). Now only blocks when actively recording/processing.
- **Improved Login Detection** - Enhanced `checkLoginStatus()` to prioritize login/signup button detection, check for dictation button presence, and default to "not logged in" when uncertain.

### ✨ Features
- **Microphone Permission Detection** - Added `checkMicrophonePermission()` and `requestMicrophoneAccess()` functions using the Permissions API
- **Multi-language Permission Messages** - Added `getMicrophonePermissionMessage()` with EN/繁中/简中 support
- **New Error Codes** - Added `ALREADY_ACTIVE` and `MICROPHONE_DENIED` to `ErrorCode` type

### 🔁 Reliability
- **Better State Machine Logic** - `handleStartDictation()` now distinguishes between recoverable states (`idle`, `unknown`, `error`) and active states (`listening`, `recording`, `processing`)
- **Enhanced Debug Output** - `startDictation()` now includes `micPermission` in debug info for troubleshooting

---

## [0.8.15] - 2026-01-19

### 📝 Documentation
- **Comprehensive Error Handling Analysis** - Updated `ERROR_HANDLING_ANALYSIS.md` (EN) and `ERROR_HANDLING_ANALYSIS.zh_TW.md` (繁中) with detailed state machine diagrams, DOM detection strategies, and background tab limitations
- **BDD Test Scenarios** - Added `error-handling.feature` with 20+ scenarios covering login detection, voice availability, health checks, and background tab operations

### 🧪 Testing
- **New Unit Tests** - Added `selectors.test.ts` with 17 tests covering login status detection, health check logic, dictation status detection, and voice input availability
- **DOM Integration Tests** - Added `selectors-dom.test.ts` with 23 tests using jsdom environment for realistic DOM detection testing
- **Test Coverage** - Increased total unit tests from 100 to 140 (+40%)

### 🔁 Reliability
- **Human-like Automation Guidelines** - Documented best practices for anti-detection: variable delays, natural mouse events, graceful degradation

---

## [0.8.14] - 2026-01-18

### 🔁 Reliability
- Persist capture origin to ensure auto-paste returns to the original tab after background processing
- Skip auto-paste on the ChatGPT tab to avoid overwriting the composer

### 🧭 UX Consistency
- Popup settings view now fills the popup height and matches the main view layout
- Embedded settings syncs theme/dev mode changes with the popup

### 🧹 Maintenance
- Removed generated analysis reports from version control and ignored them going forward

---

## [0.8.13] - 2026-01-17

### 🔁 Reliability
- Deferred submit flow now returns to the origin tab immediately, waits for processing, then briefly activates ChatGPT only for capture before returning
- Auto copy/paste/return focus now execute on the original tab after background processing completes

### 🧭 UX Consistency
- Embedded settings view inside the popup to avoid options-page navigation
- Unified header layout between popup and settings with shared structure and manifest-driven version labels
- Synced theme/dev-mode changes across popup and embedded settings

### 📝 Documentation
- Updated README shortcuts, settings table, and test counts for current behavior

---

## [0.8.12] - 2026-01-16

### 🔧 Critical Bug Fixes
- **Fixed Dictation Root Detection** - `getDictationRoot()` now correctly finds the container element during recording state instead of returning a single button
- **Fixed Health Check False Positives** - `performHealthCheck()` no longer reports `SELECTOR_NOT_FOUND` when composer is hidden during active dictation
- **Added Dictation Mode Anchors** - New `getDictationModeAnchors()` function finds stop/submit buttons by aria-label when composer is replaced by wave canvas

### 🔁 Reliability
- **Enhanced Button Finder Fallback** - `findStartButton()`, `findStopButton()`, `findSubmitButton()` now fall back to document-wide search if not found in root
- **Improved State Detection** - Status machine correctly identifies `listening`/`recording` states when wave canvas is active
- **Background Tab DOM Capture Fix** - Tab activation now happens BEFORE text capture and returns AFTER completion, ensuring ChatGPT's DOM updates are captured correctly even when tab was inactive

### 🐛 Bug Fixes
- Fixed issue where clicking dictation button would immediately reset to idle state
- Fixed `dictationRoot.tagName: "BUTTON"` incorrect detection during recording
- Fixed health check blocking dictation flow due to missing composer

### 🗑️ Removed
- **Removed "Activate ChatGPT Tab" setting** - No longer needed; background execution now works seamlessly with automatic flash activation during text capture

---

## [0.8.11] - 2026-01-15

### 🎛️ Settings
- Added the **Activate ChatGPT Tab** toggle so the background can bring the ChatGPT tab forward before dictation, keeping the page active.

### 🔁 Reliability
- The background honors the new toggle to prevent `PAGE_INACTIVE` failures when starting dictation.

### 🌐 Internationalization (i18n)
- Added localization strings for the new option across all supported locales.

## [0.8.10] - 2026-01-11

### 🌐 Internationalization (i18n)
- **Language Section Fixes** - Added and corrected translations for language labels and notes across all locales
- **Hot Update Copy** - Updated interface language descriptions to reflect live updates

### 🧹 Maintenance
- Updated project metadata and version references to 0.8.10

---

## [0.8.9] - 2026-01-11

### 🎛️ Settings & i18n
- **Audio Feedback Toggle** - Added settings switch with hot updates and i18n coverage
- **Live Language Updates** - Options/Popup now respond to language changes without reload

### 🎙️ Audio & Offscreen
- **AudioWorklet Migration** - Replaced deprecated audio path with AudioWorklet + safe fallback
- **Clipboard Messaging Fix** - Offscreen clipboard payload now targets the offscreen document explicitly

### 🔁 State Sync & UI
- **SSOT Hardening** - Added status transition validation and resync on unknown states
- **Processing Detection** - Recognize submit-only and processing spinner/disabled buttons
- **Recording Timer** - Show professional SEC timer (no emoji) during recording
- **Temporary Chat Enforcement** - Background ensures `?temporary-chat=true` before start

### 📝 Documentation
- Version bump to 0.8.9

---

## [0.8.8] - 2026-01-10

### 🌐 Internationalization (i18n) Improvements
- **Full i18n Support for Popup** - Added `data-i18n` attributes to all UI text elements
- **Full i18n Support for Options** - Added `data-i18n` attributes to settings page
- **Dynamic Status Labels** - Status messages now use localized strings
- **Localized Toast Messages** - All toast notifications now support i18n
- **Localized Error Messages** - Error dialogs now use localized strings

### 🔧 Technical Improvements
- Added `applyI18n()` call to both Popup and Options initialization
- Replaced hardcoded English strings with `getMessage()` calls
- Added new i18n message keys: `toggleTheme`, `statusLabel`, `errorStartFailed`, `errorSubmitFailed`, `errorCancelFailed`, `languageSection`, `interfaceLanguage`, `interfaceLanguageDesc`, `languageNote`, `devBadge`, `confirmClearHistory`, `historyCleared`
- Updated both English and Traditional Chinese message files

### 📝 Documentation
- Updated language note to clarify that Chrome Extension language is determined by browser settings
- Version bump to 0.8.8

---

## [0.8.7] - 2026-01-10

### 🐛 Critical Bug Fixes
- **Fixed Invalid CSS Selector Error** - Replaced Playwright-specific `button:has-text()` with valid CSS selectors
  - Error: `SyntaxError: 'button:has-text("Log in")' is not a valid selector`
  - Solution: Created `findButtonByText()` helper using standard DOM methods
- **Improved Login Detection** - Enhanced `checkLoginStatus()` with more reliable selectors
  - Added multi-language support for login button detection
  - Added profile image detection for logged-in state
  - Changed default to assume logged in when no indicators found (safer for extension)

### 🔧 Technical Improvements
- New `findButtonByText()` helper function for text-based button search
- Expanded aria-label selectors for user menu detection
- Better fallback logic for login state detection

---

## [0.8.6] - 2026-01-10

### 🐛 Bug Fixes
- **Enhanced Button Click Reliability** - Added multiple click strategies (direct click, focus+click, mouse events) for better button interaction
- **Improved Diagnostics** - Added comprehensive diagnostic info for Developer Mode debugging

### 🔧 Technical Improvements
- **New `getDiagnosticInfo()` function** - Returns detailed DOM state including:
  - Button status (found, disabled, element HTML)
  - Composer status
  - All SVG hrefs in buttons
  - Relevant aria-labels
  - Health check results
- **Enhanced logging** - Added detailed console logs for startDictation flow
- **New GET_DIAGNOSTIC message type** - Allows Options page to fetch DOM diagnostic info
- **Options Page Updates** - Added "Get Full Diagnostic" button in Developer Mode

### 📚 Developer Mode Enhancements
- Full diagnostic output panel with JSON display
- SVG href inspection for selector debugging
- Button element HTML preview
- Real-time health status

---

## [0.8.5] - 2026-01-10

### 🐛 Critical Bug Fixes

#### P0: Dictation Button State Synchronization
- **Root Cause**: Dual state management race condition between Popup (`currentStatus`) and Background (`currentDictationStatus`) caused UI/backend state divergence
- **Fix 1**: Added `syncStatusFromBackground()` function in Popup to force sync before any action
- **Fix 2**: Migrated Background status to `chrome.storage.session` for persistence across Service Worker terminations
- **Fix 3**: Added type-safe status validation with `isValidStatus()` guard

### 🔧 Technical Improvements
- Background Service Worker now persists dictation status to `chrome.storage.session`
- Popup refactored to Single Source of Truth architecture (v3.0.0)
- Removed local `currentStatus` variable from Popup - all state from Background
- Added `getStatusFromBackground()` and `isRecording()` helper functions
- Added `DictationStatusType` type alias for better type safety
- Improved error handling for status sync failures

### 📚 Best Practices Applied
- Chrome Extension MV3: Use Storage API instead of global variables for state persistence
- Single Source of Truth: Background is the authority for dictation status
- Defensive Programming: Always sync state before actions to prevent race conditions
- Reliable Messaging: New `messaging.ts` module with retry logic and error handling

---

## [0.8.4] - 2026-01-09

### 🧪 Test Coverage Improvements
- **Unit Tests** - Increased from 88 to 99 tests
- **Coverage** - Improved from 59% to 80.76%
- Added tests for DOM utilities (`$`, `exists`, `safeClick`)
- Added tests for `applyI18n` function (i18n-placeholder, i18n-title)

### 📊 Metrics
- 99 unit tests passing
- 26 E2E tests passing
- 80.76% statement coverage
- 91.30% branch coverage
- 90.69% function coverage

---

## [0.8.3] - 2026-01-09

### 🚀 Dependency Upgrades
- **@types/node** - Upgraded from 22.19.3 to 25.0.3
- **jsdom** - Upgraded from 26.1.0 to 27.4.0

### ✅ All Dependencies Now Latest
All development dependencies are now at their latest versions:
- Vite 7.3.1
- Vitest 4.0.16
- @vitest/coverage-v8 4.0.16
- @types/chrome 0.1.32
- @types/node 25.0.3
- jsdom 27.4.0
- eslint-config-prettier 10.1.8
- @crxjs/vite-plugin 2.3.0

---

## [0.8.2] - 2026-01-09

### 🚀 Major Upgrades
- **Vitest 4** - Upgraded from Vitest 2.1.9 to 4.0.16
  - Faster test execution
  - Improved coverage reporting
  - Better ESM support
- **@vitest/coverage-v8** - Upgraded from 2.1.9 to 4.0.16

### 🔧 Technical Improvements
- All 88 unit tests and 26 E2E tests passing
- Improved test execution speed

---

## [0.8.1] - 2026-01-09

### 🚀 Major Upgrades
- **Vite 7** - Upgraded from Vite 6.4.1 to 7.3.1
  - Faster builds with improved performance
  - Better tree-shaking and code splitting
  - Preparation for future Rolldown migration
- **@types/chrome** - Upgraded from 0.0.287 to 0.1.32
  - Fixed TypeScript errors with stricter type definitions
  - Added explicit type assertions for storage API results
- **eslint-config-prettier** - Upgraded from 9.1.2 to 10.1.8

### 🔧 Technical Improvements
- Improved TypeScript type safety in storage operations
- Simplified tab change info type signature
- All 88 unit tests and 26 E2E tests passing

---

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
