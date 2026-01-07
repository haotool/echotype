/**
 * EchoType Icons - Lightweight SVG Icon System
 * Professional icon set for the extension
 * 
 * @version 1.0.0
 * @updated 2026-01-08
 * 
 * Icons are designed to be:
 * - Lightweight (minimal paths)
 * - Consistent 24x24 viewBox
 * - 2px stroke width for clarity
 * - No fill, stroke only for modern look
 */

/**
 * Create an SVG element from icon path data
 */
export function createIcon(
  pathData: string,
  options: {
    size?: number;
    className?: string;
    strokeWidth?: number;
    fill?: string;
  } = {}
): string {
  const { size = 24, className = '', strokeWidth = 2, fill = 'none' } = options;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}">${pathData}</svg>`;
}

/**
 * Icon path definitions
 * Using Lucide-style icons for consistency
 */
export const ICON_PATHS = {
  // === Audio/Mic Icons ===
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  micOff: '<line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5.29"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/>',
  
  // === Playback Controls ===
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  pause: '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  
  // === Actions ===
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  
  // === Navigation ===
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>',
  
  // === UI Elements ===
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  moreVertical: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  
  // === Status Icons ===
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  alertCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  alertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  
  // === Theme ===
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  
  // === Developer/Debug ===
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  bug: '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  
  // === Keyboard ===
  keyboard: '<rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/>',
  
  // === Waveform/Audio Visualization ===
  waveform: '<path d="M2 12h2"/><path d="M6 8v8"/><path d="M10 4v16"/><path d="M14 6v12"/><path d="M18 8v8"/><path d="M22 12h-2"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/>',
} as const;

/**
 * Pre-built icon HTML strings for common use
 */
export const icons = {
  // Audio/Mic
  mic: createIcon(ICON_PATHS.mic),
  micOff: createIcon(ICON_PATHS.micOff),
  micSmall: createIcon(ICON_PATHS.mic, { size: 16, strokeWidth: 2.5 }),
  
  // Playback
  play: createIcon(ICON_PATHS.play),
  pause: createIcon(ICON_PATHS.pause),
  stop: createIcon(ICON_PATHS.stop),
  playSmall: createIcon(ICON_PATHS.play, { size: 16, strokeWidth: 2.5 }),
  pauseSmall: createIcon(ICON_PATHS.pause, { size: 16, strokeWidth: 2.5 }),
  
  // Actions
  check: createIcon(ICON_PATHS.check),
  checkCircle: createIcon(ICON_PATHS.checkCircle),
  copy: createIcon(ICON_PATHS.copy),
  clipboard: createIcon(ICON_PATHS.clipboard),
  send: createIcon(ICON_PATHS.send),
  sendSmall: createIcon(ICON_PATHS.send, { size: 16, strokeWidth: 2.5 }),
  
  // Navigation
  settings: createIcon(ICON_PATHS.settings),
  settingsSmall: createIcon(ICON_PATHS.settings, { size: 16, strokeWidth: 2.5 }),
  history: createIcon(ICON_PATHS.history),
  historySmall: createIcon(ICON_PATHS.history, { size: 16, strokeWidth: 2.5 }),
  externalLink: createIcon(ICON_PATHS.externalLink),
  
  // UI
  chevronDown: createIcon(ICON_PATHS.chevronDown),
  chevronRight: createIcon(ICON_PATHS.chevronRight),
  x: createIcon(ICON_PATHS.x),
  xSmall: createIcon(ICON_PATHS.x, { size: 16, strokeWidth: 2.5 }),
  menu: createIcon(ICON_PATHS.menu),
  moreVertical: createIcon(ICON_PATHS.moreVertical),
  
  // Status
  info: createIcon(ICON_PATHS.info),
  alertCircle: createIcon(ICON_PATHS.alertCircle),
  alertTriangle: createIcon(ICON_PATHS.alertTriangle),
  
  // Theme
  sun: createIcon(ICON_PATHS.sun),
  sunSmall: createIcon(ICON_PATHS.sun, { size: 16, strokeWidth: 2.5 }),
  moon: createIcon(ICON_PATHS.moon),
  moonSmall: createIcon(ICON_PATHS.moon, { size: 16, strokeWidth: 2.5 }),
  
  // Developer
  code: createIcon(ICON_PATHS.code),
  terminal: createIcon(ICON_PATHS.terminal),
  bug: createIcon(ICON_PATHS.bug),
  zap: createIcon(ICON_PATHS.zap),
  
  // Keyboard
  keyboard: createIcon(ICON_PATHS.keyboard),
  keyboardSmall: createIcon(ICON_PATHS.keyboard, { size: 16, strokeWidth: 2.5 }),
  
  // Audio
  waveform: createIcon(ICON_PATHS.waveform),
  volume: createIcon(ICON_PATHS.volume),
  volumeX: createIcon(ICON_PATHS.volumeX),
} as const;

export type IconName = keyof typeof icons;

/**
 * Get icon by name
 */
export function getIcon(name: IconName): string {
  return icons[name] || icons.info;
}

/**
 * Create custom-sized icon
 */
export function getIconCustom(
  name: keyof typeof ICON_PATHS,
  size: number,
  strokeWidth = 2
): string {
  return createIcon(ICON_PATHS[name], { size, strokeWidth });
}
