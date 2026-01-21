/**
 * EchoType - Shortcut display helpers
 * @module shared/shortcuts
 *
 * Provides OS-aware formatting and default shortcut resolution.
 */

export type OperatingSystem = 'mac' | 'windows' | 'linux';

type NavigatorLike = {
  platform?: string;
  userAgent?: string;
};

/**
 * Detect the user's operating system.
 */
export function detectOS(env: NavigatorLike = navigator): OperatingSystem {
  const platform = (env.platform ?? '').toLowerCase();
  const userAgent = (env.userAgent ?? '').toLowerCase();

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac';
  }
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }
  return 'linux';
}

/**
 * Format a shortcut string for display.
 * Mac uses symbols (⌥⇧⌘) while Windows/Linux keep text.
 */
export function formatShortcut(shortcut: string, os: OperatingSystem = detectOS()): string {
  if (os !== 'mac') {
    return shortcut;
  }

  return shortcut
    .replace(/MacCtrl/g, '⌃')
    .replace(/Control/g, '⌃')
    .replace(/Ctrl/g, '⌃')
    .replace(/Command/g, '⌘')
    .replace(/Shift/g, '⇧')
    .replace(/Alt/g, '⌥')
    .replace(/\+/g, '');
}

/**
 * Resolve a suggested shortcut from the extension manifest.
 */
export function getSuggestedShortcut(
  commandName: string,
  os: OperatingSystem,
  manifest: Partial<chrome.runtime.Manifest> = chrome.runtime.getManifest()
): string | null {
  const commands = manifest.commands ?? {};
  const entry = commands[commandName];
  const suggested = entry?.suggested_key;

  if (!suggested) {
    return null;
  }

  const platformKey =
    os === 'mac'
      ? suggested.mac
      : os === 'windows'
        ? suggested.windows
        : suggested.linux;

  return platformKey || suggested.default || null;
}
