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

function getDictationAnchors(): Element[] {
  const anchors: Element[] = [];
  const composer = getComposerElement();
  if (composer) anchors.push(composer);

  const plusButton = document.querySelector('button[data-testid="composer-plus-btn"]');
  if (plusButton) anchors.push(plusButton);

  const sendButton =
    document.querySelector('button[data-testid="send-button"]') ||
    document.querySelector('#composer-submit-button');
  if (sendButton) anchors.push(sendButton);

  return anchors;
}

/**
 * Find anchors for dictation mode (when composer is replaced by wave canvas).
 * Looks for stop/submit buttons by aria-label.
 */
function getDictationModeAnchors(): Element[] {
  const anchors: Element[] = [];
  
  // Find stop button by aria-label
  for (const label of DICTATION_LABELS.stop) {
    const stopBtn = document.querySelector(`button[aria-label="${label}"]`);
    if (stopBtn) {
      anchors.push(stopBtn);
      break;
    }
  }
  
  // Find submit button by aria-label
  for (const label of DICTATION_LABELS.submit) {
    const submitBtn = document.querySelector(`button[aria-label="${label}"]`);
    if (submitBtn) {
      anchors.push(submitBtn);
      break;
    }
  }
  
  // Also look for canvas (wave visualization)
  const canvas = document.querySelector('main canvas');
  if (canvas) anchors.push(canvas);
  
  return anchors;
}

function getAncestors(el: Element): Element[] {
  const ancestors: Element[] = [];
  let current: Element | null = el;
  while (current) {
    ancestors.push(current);
    current = current.parentElement;
  }
  return ancestors;
}

function findLowestCommonAncestor(anchors: Element[]): HTMLElement | null {
  if (!anchors.length) return null;

  const ancestorLists = anchors.map(getAncestors);
  for (const candidate of ancestorLists[0]) {
    if (ancestorLists.every((list) => list.includes(candidate))) {
      return candidate as HTMLElement;
    }
  }

  const fallback =
    anchors[0].closest('form') ??
    anchors[0].closest('[role="group"]') ??
    anchors[0].parentElement;
  return fallback instanceof HTMLElement ? fallback : null;
}

function getDictationRoot(): HTMLElement | null {
  // First try normal anchors (composer, plus, send buttons)
  const normalAnchors = getDictationAnchors();
  if (normalAnchors.length > 0) {
    const root = findLowestCommonAncestor(normalAnchors);
    // Validate root is not a single button (too narrow scope)
    if (root && root.tagName !== 'BUTTON') {
      return root;
    }
  }
  
  // Fallback: try dictation mode anchors (stop, submit, canvas)
  const dictationAnchors = getDictationModeAnchors();
  if (dictationAnchors.length > 0) {
    const root = findLowestCommonAncestor(dictationAnchors);
    // Validate root is not a single button
    if (root && root.tagName !== 'BUTTON') {
      return root;
    }
    // If we only found one anchor, go up to find a suitable container
    if (dictationAnchors.length === 1) {
      const anchor = dictationAnchors[0];
      // Look for a form or main container
      const container = anchor.closest('form') ?? 
                       anchor.closest('[role="group"]') ?? 
                       anchor.closest('main') ??
                       anchor.parentElement?.parentElement;
      if (container instanceof HTMLElement) {
        return container;
      }
    }
  }
  
  // Last resort: find the main content area
  const main = document.querySelector('main');
  if (main instanceof HTMLElement) {
    return main;
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
export function findStartButton(root: Element | null = getDictationRoot()): HTMLButtonElement | null {
  // Try with provided root first
  let btn = findVisibleButton(SELECTORS.startBtn, {
    root,
    preferredLabels: DICTATION_LABELS.start,
  });
  
  // Fallback: search entire document if not found in root
  if (!btn) {
    btn = findVisibleButton(SELECTORS.startBtn, {
      root: null, // null means search entire document
    preferredLabels: DICTATION_LABELS.start,
  });
  }
  
  return btn;
}

/**
 * Find the stop dictation button.
 */
export function findStopButton(root: Element | null = getDictationRoot()): HTMLButtonElement | null {
  // Try with provided root first
  let btn = findVisibleButton(SELECTORS.stopBtn, {
    root,
    preferredLabels: DICTATION_LABELS.stop,
  });
  
  // Fallback: search entire document if not found in root
  if (!btn) {
    btn = findVisibleButton(SELECTORS.stopBtn, {
      root: null, // null means search entire document
    preferredLabels: DICTATION_LABELS.stop,
  });
  }
  
  return btn;
}

/**
 * Find the submit dictation button.
 */
export function findSubmitButton(root: Element | null = getDictationRoot()): HTMLButtonElement | null {
  // Try with provided root first
  let btn = findVisibleButton(SELECTORS.submitBtn, {
    root,
    preferredLabels: DICTATION_LABELS.submit,
  });
  
  // Fallback: search entire document if not found in root
  if (!btn) {
    btn = findVisibleButton(SELECTORS.submitBtn, {
      root: null, // null means search entire document
    preferredLabels: DICTATION_LABELS.submit,
  });
  }
  
  return btn;
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
  const root = getDictationRoot();
  const composer = getComposerElement();
  const waveformActive = root ? Boolean(root.querySelector('canvas')) : false;
  const stopBtn = findStopButton(root);
  const submitBtn = findSubmitButton(root);

  if (isProcessingState(stopBtn, submitBtn)) return 'processing';
  if (stopBtn && (waveformActive || !composer)) return 'listening';
  if (submitBtn && (waveformActive || !composer)) return 'recording';
  if (findStartButton(root)) return 'idle';
  return 'unknown';
}

/**
 * Check if a specific button type exists in the DOM.
 *
 * @param type - Button type to check
 * @returns True if button exists
 */
export function buttonExists(type: 'start' | 'stop' | 'submit'): boolean {
  const root = getDictationRoot();
  switch (type) {
    case 'start':
      return Boolean(findStartButton(root));
    case 'stop':
      return Boolean(findStopButton(root));
    case 'submit':
      return Boolean(findSubmitButton(root));
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
  const dictationRoot = getDictationRoot();
  const waveformActive = dictationRoot ? Boolean(dictationRoot.querySelector('canvas')) : false;
  const startBtnFound = Boolean(findStartButton(dictationRoot));
  const stopBtnFound = Boolean(findStopButton(dictationRoot));
  const submitBtnFound = Boolean(findSubmitButton(dictationRoot));
  
  // Dictation is active if we have stop/submit buttons (regardless of composer state)
  const dictationActive = stopBtnFound || submitBtnFound;
  
  // Dictation controls are valid when we have the buttons AND either:
  // 1. Waveform canvas is visible, OR
  // 2. Composer is hidden (replaced by wave UI)
  const dictationControlsValid = dictationActive && (waveformActive || !composerFound);

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

  // Determine health status:
  // - Healthy if composer is found (idle state)
  // - Healthy if dictation controls are valid (recording state)
  // - Healthy if we're in dictation mode (stop/submit found, even without composer)
  const healthy = composerFound || dictationControlsValid || dictationActive;

  // Only add composer to missing if we're NOT in dictation mode
  if (!composerFound && !dictationActive) {
    missing.push('composer');
  }

  // If dictation is active, composer may be replaced by waveform canvas.
  // This is expected behavior, not an error.
  if (!composerFound && dictationActive) {
    warnings.push('composer hidden during dictation (expected)');
  }

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
  // Priority 1: Check for login/signup buttons (strong indicator of not logged in)
  const loginButton =
    document.querySelector('button[data-testid="login-button"]') ||
    document.querySelector('a[href*="/auth/login"]') ||
    findButtonByText(['Log in', '登入', '登录', 'Sign in', '登錄']);

  const signupButton =
    document.querySelector('a[href*="/auth/signup"]') ||
    findButtonByText(['Sign up', 'Get started', '註冊', '注册', '開始使用', '免費註冊', '免费注册', 'Create account']);

  if (loginButton || signupButton) {
    return {
      loggedIn: false,
      reason: loginButton ? 'login_button_found' : 'signup_button_found',
    };
  }

  // Priority 2: Check for dictation button (strong indicator of logged in)
  const dictationBtn = findStartButton();
  if (dictationBtn) {
    return { loggedIn: true, reason: 'dictation_button_found' };
  }

  // Priority 3: Check for user profile menu (indicates logged in)
  const userMenu =
    document.querySelector('[data-testid="profile-button"]') ||
    document.querySelector('button[aria-label*="Profile"]') ||
    document.querySelector('button[aria-label*="帳戶"]') ||
    document.querySelector('button[aria-label*="账户"]') ||
    document.querySelector('button[aria-label*="設定檔"]') ||
    document.querySelector('button[aria-label*="开启设置"]') ||
    document.querySelector('button[aria-label="開啟設定檔功能表"]') ||
    document.querySelector('img[alt*="User"]') ||
    document.querySelector('img[alt*="設定檔圖像"]') ||
    document.querySelector('img[alt*="头像"]');

  if (userMenu) {
    return { loggedIn: true, reason: 'user_menu_found' };
  }

  // Priority 4: Check for composer (usually only visible when logged in)
  const composer = getComposerElement();
  if (composer) {
    return { loggedIn: true, reason: 'composer_found' };
  }

  // Priority 5: Check for navigation menu with logged-out items
  const navLoginLink = document.querySelector('nav a[href*="/auth/login"]');
  if (navLoginLink) {
    return { loggedIn: false, reason: 'nav_login_link_found' };
  }

  // Default: assume not logged in if no indicators found
  // This is safer than assuming logged in when uncertain
  return { loggedIn: false, reason: 'no_login_indicators' };
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

function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  if (el.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  if (el.closest('[aria-hidden="true"]')) {
    return false;
  }

  return true;
}

function findVisibleButton(
  selector: string,
  options?: {
    root?: Element | null;
    preferredLabels?: readonly string[];
  }
): HTMLButtonElement | null {
  const scope = options?.root ?? document;
  const elements = scope.querySelectorAll(selector);
  const visibleButtons: HTMLButtonElement[] = [];

  for (const el of elements) {
    if (el instanceof HTMLButtonElement && isElementVisible(el)) {
      visibleButtons.push(el);
    }
  }

  if (!visibleButtons.length) {
    return null;
  }

  if (options?.preferredLabels?.length) {
    const preferred = visibleButtons.find((btn) => {
      const label = btn.getAttribute('aria-label') ?? '';
      return options.preferredLabels?.includes(label);
    });
    if (preferred) {
      return preferred;
    }
  }

  return visibleButtons[0] ?? null;
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

function isProcessingState(
  stopBtn: HTMLButtonElement | null,
  submitBtn: HTMLButtonElement | null
): boolean {
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
  dictationRoot: {
    found: boolean;
    tagName?: string;
    className?: string;
  };
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

  const dictationRoot = getDictationRoot();
  const startBtn = findStartButton(dictationRoot);
  const stopBtn = findStopButton(dictationRoot);
  const submitBtn = findSubmitButton(dictationRoot);
  const composer = getComposerElement();

  return {
    timestamp: new Date().toISOString(),
    url: location.href,
    readyState: document.readyState,
    dictationRoot: {
      found: Boolean(dictationRoot),
      tagName: dictationRoot?.tagName,
      className: dictationRoot?.className,
    },
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

  const dictationRoot = getDictationRoot();
  console.log(
    'Dictation root found:',
    Boolean(dictationRoot),
    dictationRoot?.tagName,
    dictationRoot?.className
  );

  // Get full diagnostic
  const diagnostic = getDiagnosticInfo();
  console.log('Full diagnostic:', diagnostic);

  // Check health
  const health = performHealthCheck();
  console.log('Health check:', health);

  console.groupEnd();
}

// ============================================================================
// ChatGPT Toast Detection (Microphone Error)
// ============================================================================

/**
 * Toast message patterns for microphone permission errors across languages.
 * ChatGPT displays these when microphone access is denied or unavailable.
 */
const MICROPHONE_TOAST_PATTERNS = [
  // English
  'enable microphone access',
  'microphone access',
  'allow microphone',
  // Traditional Chinese
  '啟用麥克風存取權',
  '麥克風存取權',
  '允許麥克風',
  // Simplified Chinese
  '启用麦克风访问',
  '麦克风访问',
  '允许麦克风',
  // Japanese
  'マイクへのアクセス',
  'マイクを許可',
  // Korean
  '마이크 액세스',
  '마이크 허용',
  // German
  'Mikrofonzugriff',
  // French
  'accès au microphone',
  // Spanish
  'acceso al micrófono',
] as const;

export interface ToastDetectionResult {
  found: boolean;
  type: 'microphone_error' | 'unknown' | null;
  message: string | null;
  element: Element | null;
}

/**
 * Detect ChatGPT toast messages, particularly microphone permission errors.
 * ChatGPT displays a red toast when microphone access is denied.
 *
 * @returns Detection result with toast details
 */
export function detectMicrophoneToast(): ToastDetectionResult {
  // Look for toast containers with error styling
  const toastSelectors = [
    '.toast-root',
    '[data-state="entered"].toast-root',
    '[role="alert"]',
    'div[class*="toast"]',
  ];

  for (const selector of toastSelectors) {
    const toasts = document.querySelectorAll(selector);
    for (const toast of toasts) {
      const text = toast.textContent?.toLowerCase() || '';
      
      // Check if this is a microphone error toast
      for (const pattern of MICROPHONE_TOAST_PATTERNS) {
        if (text.includes(pattern.toLowerCase())) {
          return {
            found: true,
            type: 'microphone_error',
            message: toast.textContent?.trim() || null,
            element: toast,
          };
        }
      }
    }
  }

  return {
    found: false,
    type: null,
    message: null,
    element: null,
  };
}

/**
 * Set up a MutationObserver to watch for microphone error toasts.
 * Calls the callback when a microphone error toast is detected.
 *
 * @param callback - Function to call when toast is detected
 * @returns Cleanup function to disconnect the observer
 */
export function observeMicrophoneToast(
  callback: (result: ToastDetectionResult) => void
): () => void {
  let lastToastMessage: string | null = null;

  const observer = new MutationObserver(() => {
    const result = detectMicrophoneToast();
    
    // Only trigger callback if we found a new toast
    if (result.found && result.message !== lastToastMessage) {
      lastToastMessage = result.message;
      callback(result);
      
      // Reset after a delay to allow re-detection
      setTimeout(() => {
        lastToastMessage = null;
      }, 5000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Check immediately in case toast is already present
  const initialResult = detectMicrophoneToast();
  if (initialResult.found) {
    callback(initialResult);
    lastToastMessage = initialResult.message;
  }

  return () => observer.disconnect();
}

// ============================================================================
// Microphone Permission Detection
// ============================================================================

export type MicrophonePermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface MicrophonePermissionResult {
  status: MicrophonePermissionStatus;
  reason: string;
  canRequest: boolean;
}

/**
 * Check microphone permission status using the Permissions API.
 * Falls back to 'unknown' if the API is not available.
 *
 * @returns Promise with permission status and metadata
 */
export async function checkMicrophonePermission(): Promise<MicrophonePermissionResult> {
  // Check if Permissions API is available
  if (!navigator.permissions) {
    return {
      status: 'unknown',
      reason: 'permissions_api_unavailable',
      canRequest: true, // Assume we can try
    };
  }

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    switch (result.state) {
      case 'granted':
        return {
          status: 'granted',
          reason: 'permission_granted',
          canRequest: false,
        };
      case 'denied':
        return {
          status: 'denied',
          reason: 'permission_denied',
          canRequest: false,
        };
      case 'prompt':
        return {
          status: 'prompt',
          reason: 'permission_not_requested',
          canRequest: true,
        };
      default:
        return {
          status: 'unknown',
          reason: `unknown_state_${result.state}`,
          canRequest: true,
        };
    }
  } catch (error) {
    // Some browsers don't support microphone permission query
    return {
      status: 'unknown',
      reason: `query_failed_${error instanceof Error ? error.message : 'unknown'}`,
      canRequest: true,
    };
  }
}

/**
 * Request microphone access and return the result.
 * This will trigger the browser's permission prompt if not already granted/denied.
 *
 * @returns Promise with permission result
 */
export async function requestMicrophoneAccess(): Promise<MicrophonePermissionResult> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop all tracks immediately - we just needed to check permission
    stream.getTracks().forEach(track => track.stop());
    return {
      status: 'granted',
      reason: 'permission_granted_via_request',
      canRequest: false,
    };
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          status: 'denied',
          reason: 'user_denied_permission',
          canRequest: false,
        };
      }
      if (error.name === 'NotFoundError') {
        return {
          status: 'denied',
          reason: 'no_microphone_device',
          canRequest: false,
        };
      }
    }
    return {
      status: 'unknown',
      reason: `request_failed_${error instanceof Error ? error.message : 'unknown'}`,
      canRequest: true,
    };
  }
}

/**
 * Get user-friendly message for microphone permission status.
 *
 * @param result - Permission check result
 * @param lang - Language code (default: 'en')
 * @returns User-friendly message
 */
export function getMicrophonePermissionMessage(
  result: MicrophonePermissionResult,
  lang: 'en' | 'zh_TW' | 'zh_CN' = 'en'
): string {
  const messages: Record<MicrophonePermissionStatus, Record<string, string>> = {
    granted: {
      en: 'Microphone access granted.',
      zh_TW: '麥克風權限已授予。',
      zh_CN: '麦克风权限已授予。',
    },
    denied: {
      en: 'Microphone access denied. Please enable microphone permission in your browser settings.',
      zh_TW: '麥克風權限被拒絕。請在瀏覽器設定中啟用麥克風權限。',
      zh_CN: '麦克风权限被拒绝。请在浏览器设置中启用麦克风权限。',
    },
    prompt: {
      en: 'Microphone permission required. Please allow access when prompted.',
      zh_TW: '需要麥克風權限。請在提示時允許存取。',
      zh_CN: '需要麦克风权限。请在提示时允许访问。',
    },
    unknown: {
      en: 'Unable to determine microphone permission status.',
      zh_TW: '無法確定麥克風權限狀態。',
      zh_CN: '无法确定麦克风权限状态。',
    },
  };

  return messages[result.status][lang] || messages[result.status].en;
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
    checkMicrophonePermission,
    requestMicrophoneAccess,
  };
}
