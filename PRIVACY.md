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

**GitHub**: https://github.com/haotool/echotype

---

## Disclaimer

**EchoType is an open-source project provided "AS IS" without warranty of any kind.**

### Important Notice

1. **No Affiliation**: EchoType is not affiliated with, endorsed by, or sponsored by OpenAI, ChatGPT, or any related entities. This is an independent, community-driven project.

2. **Use at Your Own Risk**: By using this extension, you acknowledge that:
   - The extension interacts with third-party services (ChatGPT) that may change without notice
   - The developers are not responsible for any issues arising from the use of this extension
   - You are responsible for complying with ChatGPT's Terms of Service

3. **No Warranty**: This software is provided without any express or implied warranties, including but not limited to:
   - Merchantability
   - Fitness for a particular purpose
   - Non-infringement

4. **Limitation of Liability**: In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of this software.

5. **Third-Party Services**: This extension relies on ChatGPT's voice dictation feature. We have no control over:
   - Availability of the voice dictation feature
   - Changes to ChatGPT's interface or functionality
   - Data processing by OpenAI/ChatGPT

### Takedown Requests

If you believe this extension infringes on any rights or violates any terms, please contact us:

- **Email**: haotool.org@gmail.com
- **GitHub Issues**: https://github.com/haotool/echotype/issues

We will respond to all legitimate takedown requests within 48 hours.

### Open Source License

EchoType is released under the MIT License. See the [LICENSE](LICENSE) file for details.

---

© 2026 EchoType Contributors. This is an open-source project.
