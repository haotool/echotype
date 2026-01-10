/**
 * EchoType - ChatGPT DOM Selectors
 * @module content/chatgpt/selectors
 *
 * Centralized DOM selectors for ChatGPT interface.
 * Supports multiple languages and handles UI changes gracefully.
 *
 * Strategy: SVG href fragments are prioritized for stability,
 * with aria-label as fallback for accessibility.
 *
 * @version 3.0.0
 * @updated 2026-01-09
 */

import { $ } from '@shared/utils';
import type { DictationStatus, EchoTypeError } from '@shared/types';

// ============================================================================
// Selector Definitions
// ============================================================================

/**
 * SVG href fragments for dictation buttons.
 * These are more stable than aria-labels as they reference specific icon IDs.
 *
 * Note: These values should be updated if ChatGPT changes their icon system.
 */
const SVG_HREFS = {
  // Start dictation button icon (microphone)
  start: ['#29f921', '#microphone', '#mic-icon'],
  // Stop/Cancel dictation button icon (stop/pause)
  stop: ['#85f94b', '#stop-icon', '#pause-icon'],
  // Submit dictation button icon (send/check)
  submit: ['#fa1dbd', '#send-icon', '#check-icon'],
} as const;

const PROCESSING_ICON_HREFS = ['#4944fe'] as const;
const PROCESSING_SPINNER_SELECTOR = 'svg.motion-safe\\:animate-spin, svg[class*="animate-spin"]';

/**
 * Multi-language aria-label selectors for dictation buttons.
 * ChatGPT uses different labels based on user's language setting.
 * Used as fallback when SVG selectors don't match.
 */
const DICTATION_LABELS = {
  start: [
    // Traditional Chinese
    '聽寫按鈕',
    '語音輸入',
    // Simplified Chinese
    '听写按钮',
    '语音输入',
    // English
    'Voice input',
    'Dictation button',
    'Start voice input',
    'Record voice',
    // Japanese
    '音声入力',
    'ディクテーション',
    // Korean
    '음성 입력',
    '받아쓰기',
    // German
    'Spracheingabe',
    'Diktat',
    // French
    'Saisie vocale',
    'Dictée',
    // Spanish
    'Entrada de voz',
    'Dictado',
    // Portuguese
    'Entrada de voz',
    'Ditado',
    // Italian
    'Input vocale',
    'Dettatura',
    // Russian
    'Голосовой ввод',
    'Диктовка',
    // Arabic
    'الإدخال الصوتي',
    'إملاء',
    // Vietnamese
    'Nhập giọng nói',
    'Đọc chính tả',
    // Thai
    'ป้อนเสียง',
    'การป้อนข้อความด้วยเสียง',
    // Indonesian
    'Input suara',
    'Dikte',
    // Hebrew
    'קלט קולי',
    'הקלדה קולית',
    // Persian
    'ورودی صوتی',
    'دیکته',
    // Turkish
    'Sesli giriş',
    'Dikte',
    // Polish
    'Wprowadzanie głosowe',
    'Dyktowanie',
    // Dutch
    'Spraakinvoer',
    'Dicteren',
    // Ukrainian
    'Голосовий ввід',
    'Диктування',
    // Hindi
    'वॉइस इनपुट',
    'डिक्टेशन',
    // Czech
    'Hlasový vstup',
    'Diktování',
    // Greek
    'Φωνητική εισαγωγή',
    'Υπαγόρευση',
    // Swedish
    'Röstinmatning',
    'Diktamen',
  ],
  stop: [
    // Traditional Chinese
    '停止聽寫',
    '停止錄音',
    // Simplified Chinese
    '停止听写',
    '停止录音',
    // English
    'Stop recording',
    'Stop dictation',
    'Stop voice input',
    // Japanese
    '録音を停止',
    '停止',
    // Korean
    '녹음 중지',
    '중지',
    // German
    'Aufnahme stoppen',
    // French
    "Arrêter l'enregistrement",
    // Spanish
    'Detener grabación',
    // Portuguese
    'Parar gravação',
    // Italian
    'Ferma registrazione',
    // Russian
    'Остановить запись',
    'Остановить',
    // Arabic
    'إيقاف التسجيل',
    'إيقاف',
    // Vietnamese
    'Dừng ghi',
    'Dừng',
    // Thai
    'หยุดบันทึก',
    'หยุด',
    // Indonesian
    'Hentikan rekaman',
    'Berhenti',
    // Hebrew
    'עצור הקלטה',
    'עצור',
    // Persian
    'توقف ضبط',
    'توقف',
    // Turkish
    'Kaydı durdur',
    'Durdur',
    // Polish
    'Zatrzymaj nagrywanie',
    'Zatrzymaj',
    // Dutch
    'Opname stoppen',
    'Stoppen',
    // Ukrainian
    'Зупинити запис',
    'Зупинити',
    // Hindi
    'रिकॉर्डिंग रोकें',
    'रोकें',
    // Czech
    'Zastavit nahrávání',
    'Zastavit',
    // Greek
    'Διακοπή εγγραφής',
    'Διακοπή',
    // Swedish
    'Stoppa inspelning',
    'Stoppa',
  ],
  submit: [
    // Traditional Chinese
    '提交聽寫',
    '傳送聽寫',
    // Simplified Chinese
    '提交听写',
    '发送听写',
    // English
    'Submit recording',
    'Submit dictation',
    'Send voice input',
    // Japanese
    '送信',
    '提出',
    // Korean
    '제출',
    '보내기',
    // German
    'Senden',
    // French
    'Envoyer',
    // Spanish
    'Enviar',
    // Portuguese
    'Enviar',
    // Italian
    'Invia',
    // Russian
    'Отправить',
    // Arabic
    'إرسال',
    // Vietnamese
    'Gửi',
    // Thai
    'ส่ง',
    // Indonesian
    'Kirim',
    // Hebrew
    'שלח',
    // Persian
    'ارسال',
    // Turkish
    'Gönder',
    // Polish
    'Wyślij',
    // Dutch
    'Verzenden',
    // Ukrainian
    'Надіслати',
    // Hindi
    'भेजें',
    // Czech
    'Odeslat',
    // Greek
    'Υποβολή',
    // Swedish
    'Skicka',
  ],
} as const;

/**
 * Build selector string prioritizing SVG href, with aria-label fallback.
 *
 * @param svgHrefs - SVG href fragments to match
 * @param ariaLabels - Aria-label values as fallback
 * @returns Combined CSS selector string
 */
function buildButtonSelector(
  svgHrefs: readonly string[],
  ariaLabels: readonly string[]
): string {
  // SVG href selectors (priority)
  const svgSelectors = svgHrefs.flatMap((href) => [
    `button:has(svg use[href*="${href}"])`,
    `button:has(svg use[xlink\\:href*="${href}"])`,
  ]);

  // Aria-label selectors (fallback)
  const ariaSelectors = ariaLabels.map((label) => `button[aria-label="${label}"]`);

  return [...svgSelectors, ...ariaSelectors].join(', ');
}

/**
 * Build selector string from multiple aria-labels only
 * @deprecated Use buildButtonSelector for better stability
 */
export function buildAriaLabelSelector(labels: readonly string[]): string {
  return labels.map((label) => `button[aria-label="${label}"]`).join(', ');
}

/**
 * ChatGPT DOM selectors with SVG priority and multi-language fallback.
 */
export const SELECTORS = {
  /** Start dictation button (SVG priority, aria-label fallback) */
  startBtn: buildButtonSelector(SVG_HREFS.start, DICTATION_LABELS.start),
  /** Stop dictation button (appears when recording) */
  stopBtn: buildButtonSelector(SVG_HREFS.stop, DICTATION_LABELS.stop),
  /** Submit dictation button */
  submitBtn: buildButtonSelector(SVG_HREFS.submit, DICTATION_LABELS.submit),
  /** ProseMirror composer/textarea - primary selector */
  composer: '#prompt-textarea',
  /** Alternative composer selectors */
  composerAlt: [
    '#prompt-textarea',
    '[data-testid="prompt-textarea"]',
    '[data-testid="prompt-textarea"] [contenteditable="true"]',
    '[contenteditable="true"][data-virtualkeyboard]',
    'textarea[name="prompt-textarea"]',
    'textarea[data-testid="prompt-textarea"]',
    '.ProseMirror[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
  ],
} as const;

// ============================================================================
// Debug Logger
// ============================================================================

const DEBUG = process.env.NODE_ENV === 'development';

function log(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[EchoType:Selectors]', ...args);
  }
}

// ============================================================================
// Element Accessors
// ============================================================================

/**
 * Get the composer (input) element.
 * Tries multiple selectors for resilience.
 *
 * @returns The composer element or null
 */
export function getComposerElement(): HTMLElement | null {
  // Try primary selector first
  let el = $(SELECTORS.composer);
  if (el instanceof HTMLElement) {
    return el;
  }

  // Try alternative selectors
  for (const selector of SELECTORS.composerAlt) {
    el = $(selector);
    if (el instanceof HTMLElement) {
      log('Found composer with alt selector:', selector);
      return el;
    }
  }

  return null;
}

/**
 * Read text content from the composer.
 *
 * @returns The text content (may include ProseMirror artifacts)
 */
export function readComposerRawText(): string {
  const el = getComposerElement();
  if (!el) return '';
  if (el instanceof HTMLTextAreaElement) {
    return el.value || '';
  }
  return el.innerText || el.textContent || '';
}

/**
 * Wait for the composer element to appear.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns True if composer is found before timeout
 */
export async function waitForComposer(timeoutMs = 3000): Promise<boolean> {
  if (getComposerElement()) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      if (getComposerElement()) {
        clearTimeout(timeout);
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

// ============================================================================
// Button Finders
// ============================================================================

/**
 * Find the start dictation button.
 */
export function findStartButton(): HTMLButtonElement | null {
  const el = $(SELECTORS.startBtn);
  return el instanceof HTMLButtonElement ? el : null;
}

/**
 * Find the stop dictation button.
 */
export function findStopButton(): HTMLButtonElement | null {
  const el = $(SELECTORS.stopBtn);
  return el instanceof HTMLButtonElement ? el : null;
}

/**
 * Find the submit dictation button.
 */
export function findSubmitButton(): HTMLButtonElement | null {
  const el = $(SELECTORS.submitBtn);
  return el instanceof HTMLButtonElement ? el : null;
}

// ============================================================================
// Status Detection
// ============================================================================

/**
 * Detect current dictation status based on visible buttons.
 *
 * @returns Current status
 */
export function detectStatus(): DictationStatus {
  if (isProcessingState()) return 'processing';
  if (findStopButton()) return 'listening';
  if (findSubmitButton()) return 'recording';
  if (findStartButton()) return 'idle';
  return 'unknown';
}

/**
 * Check if a specific button type exists in the DOM.
 *
 * @param type - Button type to check
 * @returns True if button exists
 */
export function buttonExists(type: 'start' | 'stop' | 'submit'): boolean {
  switch (type) {
    case 'start':
      return Boolean(findStartButton());
    case 'stop':
      return Boolean(findStopButton());
    case 'submit':
      return Boolean(findSubmitButton());
    default:
      return false;
  }
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  missing: string[];
  warnings: string[];
  error?: EchoTypeError;
  debug?: {
    composerFound: boolean;
    startBtnFound: boolean;
    stopBtnFound: boolean;
    submitBtnFound: boolean;
  };
}

/**
 * Perform health check to verify ChatGPT UI is accessible.
 * This should be called before any operation.
 *
 * @returns Health check result with detailed diagnostics
 */
export function performHealthCheck(): HealthCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  const composerFound = Boolean(getComposerElement());
  const startBtnFound = Boolean(findStartButton());
  const stopBtnFound = Boolean(findStopButton());
  const submitBtnFound = Boolean(findSubmitButton());
  const dictationControlsFound = stopBtnFound || submitBtnFound;

  // Check composer (required)
  if (!composerFound) {
    missing.push('composer');
  }

  // Check for dictation buttons
  // Note: Only start OR stop button needs to be present (not both)
  // If neither is found, it might mean:
  // 1. User is not logged in
  // 2. Voice input is not available in this region
  // 3. DOM has changed
  if (!startBtnFound && !stopBtnFound && !submitBtnFound) {
    // This is a warning, not a critical error
    // User might need to log in or enable voice input
    warnings.push('dictation buttons not found (login may be required)');
  }

  // If dictation is active, composer may be replaced by waveform canvas.
  // Consider health OK when dictation controls are present.
  if (!composerFound && dictationControlsFound) {
    warnings.push('composer hidden during dictation');
  }

  // For MVP, we require composer unless dictation controls indicate active dictation
  const healthy = composerFound || dictationControlsFound;

  return {
    healthy,
    missing,
    warnings,
    error: healthy
      ? undefined
      : {
          code: 'SELECTOR_NOT_FOUND',
          message: `Missing UI elements: ${missing.join(', ')}`,
          detail: missing.includes('composer')
            ? 'ChatGPT page may not be fully loaded. Please wait and try again.'
            : 'Voice input may not be available. Please ensure you are logged in to ChatGPT.',
        },
    debug: {
      composerFound,
      startBtnFound,
      stopBtnFound,
      submitBtnFound,
    },
  };
}

/**
 * Check if voice input feature is available.
 * This requires user to be logged in and have voice input enabled.
 */
export function isVoiceInputAvailable(): boolean {
  return Boolean(findStartButton() || findStopButton() || findSubmitButton());
}

/**
 * Helper function to find button by text content.
 * Uses standard DOM methods instead of Playwright-specific selectors.
 */
function findButtonByText(texts: string[]): Element | null {
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    const buttonText = button.textContent?.trim().toLowerCase() || '';
    for (const text of texts) {
      if (buttonText.includes(text.toLowerCase())) {
        return button;
      }
    }
  }
  return null;
}

/**
 * Check if user is logged in to ChatGPT.
 * Detects login state by looking for login-related UI elements.
 *
 * @returns Object with login status and reason
 */
export function checkLoginStatus(): { loggedIn: boolean; reason: string } {
  // Check for login button (indicates not logged in)
  // Using valid CSS selectors and DOM text search
  const loginButton =
    document.querySelector('button[data-testid="login-button"]') ||
    document.querySelector('a[href*="/auth/login"]') ||
    findButtonByText(['Log in', '登入', '登录', 'Sign in', '登錄']);

  if (loginButton) {
    return { loggedIn: false, reason: 'login_button_found' };
  }

  // Check for user menu (indicates logged in)
  const userMenu =
    document.querySelector('[data-testid="profile-button"]') ||
    document.querySelector('button[aria-label*="Profile"]') ||
    document.querySelector('button[aria-label*="帳戶"]') ||
    document.querySelector('button[aria-label*="账户"]') ||
    document.querySelector('button[aria-label*="設定檔"]') ||
    document.querySelector('button[aria-label*="开启设置"]') ||
    document.querySelector('img[alt*="User"]') ||
    document.querySelector('img[alt*="設定檔圖像"]') ||
    document.querySelector('img[alt*="头像"]');

  if (userMenu) {
    return { loggedIn: true, reason: 'user_menu_found' };
  }

  // Check for composer (usually only visible when logged in)
  const composer = getComposerElement();
  if (composer) {
    return { loggedIn: true, reason: 'composer_found' };
  }

  // Check for "Sign up" or "Get started" buttons (indicates not logged in)
  const signupButton =
    document.querySelector('a[href*="/auth/signup"]') ||
    findButtonByText(['Sign up', 'Get started', '註冊', '注册', '開始使用']);

  if (signupButton) {
    return { loggedIn: false, reason: 'signup_button_found' };
  }

  // Default: assume logged in if composer is found or no login buttons
  // This is a safer default for the extension
  return { loggedIn: true, reason: 'no_login_indicators' };
}

// ============================================================================
// Button Interactions
// ============================================================================

/**
 * Click the start dictation button.
 * Uses multiple click strategies for better reliability.
 *
 * @returns True if button was clicked
 */
export function clickStartButton(
  strategy: 'direct' | 'focus' | 'mouse' = 'direct'
): boolean {
  const el = findStartButton();
  if (el) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      log('Start button is disabled');
      console.warn('[EchoType:Selectors] Start button is disabled, cannot click');
      return false;
    }
    
    log('Clicking start button');
    console.log('[EchoType:Selectors] Found start button:', el.outerHTML.substring(0, 200));
    
    switch (strategy) {
      case 'focus':
        try {
          el.focus();
          el.click();
          console.log('[EchoType:Selectors] Focus + click executed');
          return true;
        } catch (error) {
          console.warn('[EchoType:Selectors] Focus + click failed:', error);
          return false;
        }
      case 'mouse':
        try {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          el.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY,
          }));
          
          el.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY,
          }));
          
          el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY,
          }));
          
          console.log('[EchoType:Selectors] Mouse events dispatched');
          return true;
        } catch (error) {
          console.warn('[EchoType:Selectors] Mouse event dispatch failed:', error);
          return false;
        }
      case 'direct':
      default:
        try {
          el.click();
          console.log('[EchoType:Selectors] Direct click executed');
          return true;
        } catch (error) {
          console.warn('[EchoType:Selectors] Direct click failed:', error);
          return false;
        }
    }
  }
  
  log('Start button not found');
  console.warn('[EchoType:Selectors] Start button not found. Selector:', SELECTORS.startBtn.substring(0, 100));
  return false;
}

// ========================================================================
// Status Helpers
// ========================================================================

function isButtonDisabled(el: HTMLButtonElement | null): boolean {
  if (!el) return false;
  return el.disabled || el.getAttribute('aria-disabled') === 'true';
}

function hasProcessingSpinner(root: Element | null): boolean {
  if (!root) return false;
  if (root.querySelector(PROCESSING_SPINNER_SELECTOR)) return true;
  return PROCESSING_ICON_HREFS.some((href) =>
    Boolean(
      root.querySelector(`use[href*="${href}"]`) ||
        root.querySelector(`use[xlink\\:href*="${href}"]`)
    )
  );
}

function isProcessingState(): boolean {
  const stopBtn = findStopButton();
  const submitBtn = findSubmitButton();

  if (isButtonDisabled(stopBtn) || isButtonDisabled(submitBtn)) {
    return true;
  }

  if (hasProcessingSpinner(stopBtn) || hasProcessingSpinner(submitBtn)) {
    return true;
  }

  return false;
}

/**
 * Click the stop dictation button.
 *
 * @returns True if button was clicked
 */
export function clickStopButton(): boolean {
  const el = findStopButton();
  if (el) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      log('Stop button is disabled');
      return false;
    }
    log('Clicking stop button');
    el.click();
    return true;
  }
  log('Stop button not found');
  return false;
}

/**
 * Click the submit dictation button.
 *
 * @returns True if button was clicked
 */
export function clickSubmitButton(): boolean {
  const el = findSubmitButton();
  if (el) {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') {
      log('Submit button is disabled');
      return false;
    }
    log('Clicking submit button');
    el.click();
    return true;
  }
  log('Submit button not found');
  return false;
}

// ============================================================================
// DOM Inspector (Development & Production Debug)
// ============================================================================

/**
 * Detailed diagnostic info for debugging.
 */
export interface DiagnosticInfo {
  timestamp: string;
  url: string;
  readyState: string;
  buttons: {
    start: { found: boolean; selector: string; element?: string; disabled?: boolean };
    stop: { found: boolean; selector: string; element?: string; disabled?: boolean };
    submit: { found: boolean; selector: string; element?: string; disabled?: boolean };
  };
  composer: {
    found: boolean;
    selector: string;
    tagName?: string;
    contentLength?: number;
  };
  svgHrefs: string[];
  ariaLabels: string[];
  health: HealthCheckResult;
}

/**
 * Get detailed diagnostic information.
 * Used by Developer Mode for debugging.
 */
export function getDiagnosticInfo(): DiagnosticInfo {
  // Find all SVG use hrefs in buttons
  const svgHrefs: string[] = [];
  const ariaLabels: string[] = [];
  
  document.querySelectorAll('button').forEach((btn) => {
    const label = btn.getAttribute('aria-label');
    if (label) ariaLabels.push(label);
    
    const svgUse = btn.querySelector('svg use');
    if (svgUse) {
      const href = svgUse.getAttribute('href') || svgUse.getAttribute('xlink:href');
      if (href) svgHrefs.push(href);
    }
  });

  const startBtn = findStartButton();
  const stopBtn = findStopButton();
  const submitBtn = findSubmitButton();
  const composer = getComposerElement();

  return {
    timestamp: new Date().toISOString(),
    url: location.href,
    readyState: document.readyState,
    buttons: {
      start: {
        found: Boolean(startBtn),
        selector: SELECTORS.startBtn.substring(0, 100) + '...',
        element: startBtn?.outerHTML.substring(0, 200),
        disabled: startBtn?.disabled || startBtn?.getAttribute('aria-disabled') === 'true',
      },
      stop: {
        found: Boolean(stopBtn),
        selector: SELECTORS.stopBtn.substring(0, 100) + '...',
        element: stopBtn?.outerHTML.substring(0, 200),
        disabled: stopBtn?.disabled || stopBtn?.getAttribute('aria-disabled') === 'true',
      },
      submit: {
        found: Boolean(submitBtn),
        selector: SELECTORS.submitBtn.substring(0, 100) + '...',
        element: submitBtn?.outerHTML.substring(0, 200),
        disabled: submitBtn?.disabled || submitBtn?.getAttribute('aria-disabled') === 'true',
      },
    },
    composer: {
      found: Boolean(composer),
      selector: SELECTORS.composer,
      tagName: composer?.tagName,
      contentLength: composer?.textContent?.length,
    },
    svgHrefs,
    ariaLabels: ariaLabels.filter(l => 
      l.includes('聽寫') || l.includes('录') || l.includes('voice') || 
      l.includes('dictation') || l.includes('停止') || l.includes('提交') ||
      l.includes('傳送') || l.includes('录音')
    ),
    health: performHealthCheck(),
  };
}

/**
 * Inspect DOM for dictation-related elements.
 * Useful for debugging selector issues.
 */
export function inspectDOM(force = false): void {
  if (!DEBUG && !force) return;

  console.group('[EchoType] DOM Inspection');

  // Find all buttons with aria-label
  const buttons = document.querySelectorAll('button[aria-label]');
  console.log('Buttons with aria-label:', buttons.length);
  buttons.forEach((btn) => {
    const label = btn.getAttribute('aria-label');
    if (
      label?.toLowerCase().includes('voice') ||
      label?.toLowerCase().includes('record') ||
      label?.toLowerCase().includes('dictation') ||
      label?.includes('聽寫') ||
      label?.includes('錄音') ||
      label?.includes('語音') ||
      label?.includes('停止') ||
      label?.includes('提交')
    ) {
      console.log(`  Found: "${label}"`, btn);
    }
  });

  // Find all SVG use elements with href
  const svgUses = document.querySelectorAll('button svg use[href]');
  console.log('SVG use elements in buttons:', svgUses.length);
  svgUses.forEach((use) => {
    const href = use.getAttribute('href');
    if (href) {
      console.log(`  SVG href: "${href}"`);
    }
  });

  // Check composer
  const composer = getComposerElement();
  console.log(
    'Composer found:',
    Boolean(composer),
    composer?.tagName,
    composer?.className
  );

  // Get full diagnostic
  const diagnostic = getDiagnosticInfo();
  console.log('Full diagnostic:', diagnostic);

  // Check health
  const health = performHealthCheck();
  console.log('Health check:', health);

  console.groupEnd();
}

// Export for development debugging
if (DEBUG) {
  (window as unknown as { __ECHOTYPE_SELECTORS__: unknown }).__ECHOTYPE_SELECTORS__ = {
    SELECTORS,
    DICTATION_LABELS,
    inspectDOM,
    performHealthCheck,
    getComposerElement,
    findStartButton,
    findStopButton,
    findSubmitButton,
  };
}
