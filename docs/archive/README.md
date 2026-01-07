# Archive

This directory contains archived files for reference.

## Files

### `original-demo.js`

The original single-file DOM script (860 lines) that has been refactored into the modular extension architecture.

**Status**: Archived (2026-01-07)

**Reason**: All functionality has been extracted into separate modules:
- `src/shared/` - Shared utilities, types, protocol
- `src/content/chatgpt/` - ChatGPT dictation control
- `src/background/` - Service worker, tab management
- `src/offscreen/` - Clipboard operations
- `src/options/` - Settings page

**Features moved**:
- ✅ DOM selectors → `content/chatgpt/selectors.ts`
- ✅ Stable capture → `content/chatgpt/capture.ts`
- ✅ Baseline diff → `content/chatgpt/diff.ts`
- ✅ Robust clear → `content/chatgpt/clear.ts`
- ✅ Utility functions → `shared/utils.ts`
- ✅ History management → `background/history.ts`
- ⏸️ Audio visualizer → Removed (may add later)
- ⏸️ Draggable panel → Removed (using keyboard shortcuts)
