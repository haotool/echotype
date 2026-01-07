# EchoType Privacy Policy

**Last Updated**: 2026-01-08

## Overview

EchoType is a Chrome Extension that enables universal voice dictation by leveraging ChatGPT's built-in Whisper speech recognition. We are committed to protecting your privacy and being transparent about our data practices.

## Data Collection

**EchoType does NOT collect any personal data.**

- No analytics or tracking
- No user accounts required
- No data transmitted to external servers
- All processing occurs locally in your browser

## Permissions Explained

EchoType requires the following Chrome permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab to paste dictation results |
| `storage` | Store your preferences (theme, auto-copy settings) locally |
| `clipboardWrite` | Copy dictation results to your clipboard |
| `offscreen` | Create an offscreen document for clipboard operations |

### Host Permissions

| Host | Purpose |
|------|---------|
| `https://chatgpt.com/*` | Control ChatGPT's voice dictation feature |

## Data Storage

### Local Storage Only

All data is stored locally in your browser using Chrome's storage API:

- **Preferences**: Theme selection, auto-copy/paste settings
- **History**: Last 5 dictation results (stored locally, never uploaded)

### No Cloud Storage

- No data is ever uploaded to any server
- No synchronization across devices (unless Chrome sync is enabled by you)
- All data can be cleared by uninstalling the extension

## Third-Party Services

EchoType interacts with ChatGPT (`chatgpt.com`) to:
- Start/stop voice dictation
- Read transcribed text from the input field

This interaction happens entirely within your browser. We do not have access to your ChatGPT account or conversations.

## Data Deletion

To delete all data stored by EchoType:

1. Open Chrome's Extensions page (`chrome://extensions`)
2. Find EchoType and click "Remove"
3. All local data will be deleted automatically

Alternatively, you can clear data from the Options page:
1. Right-click the EchoType icon
2. Select "Options"
3. Enable Developer Mode
4. Click "Clear Storage"

## Children's Privacy

EchoType is not directed to children under 13 years of age. We do not knowingly collect information from children.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date at the top of this document.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository:

**GitHub**: https://github.com/user/echotype

---

© 2026 EchoType Team. All rights reserved.
