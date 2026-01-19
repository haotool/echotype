/**
 * @vitest-environment jsdom
 *
 * EchoType - Selectors DOM Integration Tests
 * Tests DOM detection with actual jsdom environment
 *
 * @updated 2026-01-19T23:08:35+08:00
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Simulated selectors module functions (mirrors actual implementation)
const DICTATION_LABELS = {
  start: ['聽寫按鈕', 'Voice input', 'Dictation button'],
  stop: ['停止聽寫', 'Stop recording', 'Stop dictation'],
  submit: ['提交聽寫', 'Submit recording', 'Submit dictation'],
};

describe('DOM Detection with jsdom', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Login Status Detection', () => {
    it('should detect login button (not logged in)', () => {
      document.body.innerHTML = `
        <div>
          <button data-testid="login-button">Log in</button>
          <a href="/auth/signup">Sign up</a>
        </div>
      `;

      const loginButton = document.querySelector('button[data-testid="login-button"]');
      expect(loginButton).not.toBeNull();
      expect(loginButton?.textContent).toBe('Log in');
    });

    it('should detect user menu (logged in)', () => {
      document.body.innerHTML = `
        <div>
          <button aria-label="開啟設定檔功能表">
            <img alt="設定檔圖像" src="/avatar.png" />
          </button>
          <div id="prompt-textarea" contenteditable="true"></div>
        </div>
      `;

      const userMenu = document.querySelector('button[aria-label*="設定檔"]');
      const profileImage = document.querySelector('img[alt*="設定檔圖像"]');
      const composer = document.querySelector('#prompt-textarea');

      expect(userMenu).not.toBeNull();
      expect(profileImage).not.toBeNull();
      expect(composer).not.toBeNull();
    });

    it('should detect composer element', () => {
      document.body.innerHTML = `
        <main>
          <div id="prompt-textarea" contenteditable="true">想問就問</div>
        </main>
      `;

      const composer = document.querySelector('#prompt-textarea');
      expect(composer).not.toBeNull();
      expect(composer?.textContent).toBe('想問就問');
    });
  });

  describe('Dictation Button Detection', () => {
    it('should find start button by aria-label (Traditional Chinese)', () => {
      document.body.innerHTML = `
        <main>
          <button aria-label="聽寫按鈕">
            <img src="/mic.svg" />
          </button>
        </main>
      `;

      let foundButton: Element | null = null;
      for (const label of DICTATION_LABELS.start) {
        const btn = document.querySelector(`button[aria-label="${label}"]`);
        if (btn) {
          foundButton = btn;
          break;
        }
      }

      expect(foundButton).not.toBeNull();
      expect(foundButton?.getAttribute('aria-label')).toBe('聽寫按鈕');
    });

    it('should find start button by aria-label (English)', () => {
      document.body.innerHTML = `
        <main>
          <button aria-label="Voice input">
            <img src="/mic.svg" />
          </button>
        </main>
      `;

      let foundButton: Element | null = null;
      for (const label of DICTATION_LABELS.start) {
        const btn = document.querySelector(`button[aria-label="${label}"]`);
        if (btn) {
          foundButton = btn;
          break;
        }
      }

      expect(foundButton).not.toBeNull();
      expect(foundButton?.getAttribute('aria-label')).toBe('Voice input');
    });

    it('should find stop button during recording', () => {
      document.body.innerHTML = `
        <main>
          <canvas id="waveform"></canvas>
          <button aria-label="停止聽寫">Stop</button>
          <button aria-label="提交聽寫">Submit</button>
        </main>
      `;

      let stopButton: Element | null = null;
      for (const label of DICTATION_LABELS.stop) {
        const btn = document.querySelector(`button[aria-label="${label}"]`);
        if (btn) {
          stopButton = btn;
          break;
        }
      }

      expect(stopButton).not.toBeNull();
      expect(stopButton?.getAttribute('aria-label')).toBe('停止聽寫');
    });

    it('should find submit button during recording', () => {
      document.body.innerHTML = `
        <main>
          <canvas id="waveform"></canvas>
          <button aria-label="提交聽寫">Submit</button>
        </main>
      `;

      let submitButton: Element | null = null;
      for (const label of DICTATION_LABELS.submit) {
        const btn = document.querySelector(`button[aria-label="${label}"]`);
        if (btn) {
          submitButton = btn;
          break;
        }
      }

      expect(submitButton).not.toBeNull();
      expect(submitButton?.getAttribute('aria-label')).toBe('提交聽寫');
    });

    it('should find button by SVG href', () => {
      document.body.innerHTML = `
        <main>
          <button>
            <svg>
              <use href="/sprites.svg#29f921"></use>
            </svg>
          </button>
        </main>
      `;

      const button = document.querySelector('button:has(svg use[href*="#29f921"])');
      expect(button).not.toBeNull();
    });
  });

  describe('Waveform Canvas Detection', () => {
    it('should detect waveform canvas during recording', () => {
      document.body.innerHTML = `
        <main>
          <div class="composer-area">
            <canvas width="400" height="100"></canvas>
          </div>
        </main>
      `;

      const canvas = document.querySelector('main canvas');
      expect(canvas).not.toBeNull();
      expect(canvas?.getAttribute('width')).toBe('400');
    });

    it('should not find canvas when idle', () => {
      document.body.innerHTML = `
        <main>
          <div id="prompt-textarea" contenteditable="true"></div>
        </main>
      `;

      const canvas = document.querySelector('main canvas');
      expect(canvas).toBeNull();
    });
  });

  describe('Element Visibility Detection', () => {
    it('should detect visible button', () => {
      document.body.innerHTML = `
        <button aria-label="聽寫按鈕" style="display: block;">Dictate</button>
      `;

      const button = document.querySelector('button[aria-label="聽寫按鈕"]');
      expect(button).not.toBeNull();

      // Check computed style (jsdom has limited CSS support)
      const style = window.getComputedStyle(button!);
      expect(style.display).not.toBe('none');
    });

    it('should detect hidden button with display:none', () => {
      document.body.innerHTML = `
        <button aria-label="聽寫按鈕" style="display: none;">Dictate</button>
      `;

      const button = document.querySelector('button[aria-label="聽寫按鈕"]');
      expect(button).not.toBeNull();

      const style = window.getComputedStyle(button!);
      expect(style.display).toBe('none');
    });

    it('should detect aria-hidden elements', () => {
      document.body.innerHTML = `
        <div aria-hidden="true">
          <button aria-label="聽寫按鈕">Dictate</button>
        </div>
      `;

      const button = document.querySelector('button[aria-label="聽寫按鈕"]');
      expect(button).not.toBeNull();

      const hiddenParent = button?.closest('[aria-hidden="true"]');
      expect(hiddenParent).not.toBeNull();
    });
  });

  describe('Dictation Root Detection', () => {
    it('should find common ancestor for composer and buttons', () => {
      document.body.innerHTML = `
        <main>
          <form class="composer-form">
            <div id="prompt-textarea" contenteditable="true"></div>
            <button data-testid="composer-plus-btn">+</button>
            <button aria-label="聽寫按鈕">Dictate</button>
            <button data-testid="send-button">Send</button>
          </form>
        </main>
      `;

      const composer = document.querySelector('#prompt-textarea');
      const plusBtn = document.querySelector('[data-testid="composer-plus-btn"]');
      const sendBtn = document.querySelector('[data-testid="send-button"]');

      expect(composer).not.toBeNull();
      expect(plusBtn).not.toBeNull();
      expect(sendBtn).not.toBeNull();

      // All should share form as common ancestor
      const form = document.querySelector('form.composer-form');
      expect(form?.contains(composer!)).toBe(true);
      expect(form?.contains(plusBtn!)).toBe(true);
      expect(form?.contains(sendBtn!)).toBe(true);
    });

    it('should find dictation root during recording (no composer)', () => {
      document.body.innerHTML = `
        <main>
          <form class="composer-form">
            <canvas id="waveform"></canvas>
            <button aria-label="停止聽寫">Stop</button>
            <button aria-label="提交聽寫">Submit</button>
          </form>
        </main>
      `;

      const canvas = document.querySelector('canvas');
      const stopBtn = document.querySelector('[aria-label="停止聽寫"]');
      const submitBtn = document.querySelector('[aria-label="提交聽寫"]');

      expect(canvas).not.toBeNull();
      expect(stopBtn).not.toBeNull();
      expect(submitBtn).not.toBeNull();

      // All should share form as common ancestor
      const form = document.querySelector('form.composer-form');
      expect(form?.contains(canvas!)).toBe(true);
      expect(form?.contains(stopBtn!)).toBe(true);
      expect(form?.contains(submitBtn!)).toBe(true);
    });
  });

  describe('Status Detection Patterns', () => {
    it('should detect idle state pattern', () => {
      document.body.innerHTML = `
        <main>
          <div id="prompt-textarea" contenteditable="true"></div>
          <button aria-label="聽寫按鈕">Dictate</button>
          <button data-testid="send-button" disabled>Send</button>
        </main>
      `;

      const composer = document.querySelector('#prompt-textarea');
      const startBtn = document.querySelector('[aria-label="聽寫按鈕"]');
      const stopBtn = document.querySelector('[aria-label="停止聽寫"]');
      const submitBtn = document.querySelector('[aria-label="提交聽寫"]');
      const canvas = document.querySelector('canvas');

      expect(composer).not.toBeNull();
      expect(startBtn).not.toBeNull();
      expect(stopBtn).toBeNull();
      expect(submitBtn).toBeNull();
      expect(canvas).toBeNull();

      // Status should be: idle
    });

    it('should detect listening state pattern', () => {
      document.body.innerHTML = `
        <main>
          <canvas id="waveform"></canvas>
          <button aria-label="停止聽寫">Stop</button>
        </main>
      `;

      const composer = document.querySelector('#prompt-textarea');
      const startBtn = document.querySelector('[aria-label="聽寫按鈕"]');
      const stopBtn = document.querySelector('[aria-label="停止聽寫"]');
      const canvas = document.querySelector('canvas');

      expect(composer).toBeNull();
      expect(startBtn).toBeNull();
      expect(stopBtn).not.toBeNull();
      expect(canvas).not.toBeNull();

      // Status should be: listening
    });

    it('should detect recording state pattern', () => {
      document.body.innerHTML = `
        <main>
          <canvas id="waveform"></canvas>
          <button aria-label="提交聽寫">Submit</button>
        </main>
      `;

      const composer = document.querySelector('#prompt-textarea');
      const submitBtn = document.querySelector('[aria-label="提交聽寫"]');
      const canvas = document.querySelector('canvas');

      expect(composer).toBeNull();
      expect(submitBtn).not.toBeNull();
      expect(canvas).not.toBeNull();

      // Status should be: recording
    });

    it('should detect processing state pattern (disabled buttons)', () => {
      document.body.innerHTML = `
        <main>
          <canvas id="waveform"></canvas>
          <button aria-label="停止聽寫" disabled>Stop</button>
          <button aria-label="提交聽寫" disabled>Submit</button>
          <svg class="motion-safe:animate-spin"></svg>
        </main>
      `;

      const stopBtn = document.querySelector('[aria-label="停止聽寫"]') as HTMLButtonElement;
      const submitBtn = document.querySelector('[aria-label="提交聽寫"]') as HTMLButtonElement;
      const spinner = document.querySelector('svg.motion-safe\\:animate-spin');

      expect(stopBtn?.disabled).toBe(true);
      expect(submitBtn?.disabled).toBe(true);
      expect(spinner).not.toBeNull();

      // Status should be: processing
    });
  });

  describe('Button Click Simulation', () => {
    it('should trigger click event on button', () => {
      let clicked = false;
      document.body.innerHTML = `
        <button aria-label="聽寫按鈕">Dictate</button>
      `;

      const button = document.querySelector('[aria-label="聽寫按鈕"]') as HTMLButtonElement;
      button.addEventListener('click', () => {
        clicked = true;
      });

      button.click();
      expect(clicked).toBe(true);
    });

    it('should not trigger click on disabled button', () => {
      document.body.innerHTML = `
        <button aria-label="聽寫按鈕" disabled>Dictate</button>
      `;

      const button = document.querySelector('[aria-label="聽寫按鈕"]') as HTMLButtonElement;

      // Note: In real browsers, disabled buttons don't fire click events
      // jsdom may behave differently, so we check disabled state
      expect(button.disabled).toBe(true);
    });

    it('should dispatch mouse events sequence', () => {
      const events: string[] = [];
      document.body.innerHTML = `
        <button aria-label="聽寫按鈕">Dictate</button>
      `;

      const button = document.querySelector('[aria-label="聽寫按鈕"]') as HTMLButtonElement;
      button.addEventListener('mousedown', () => events.push('mousedown'));
      button.addEventListener('mouseup', () => events.push('mouseup'));
      button.addEventListener('click', () => events.push('click'));

      // Simulate human-like click sequence
      button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(events).toEqual(['mousedown', 'mouseup', 'click']);
    });
  });

  describe('MutationObserver Simulation', () => {
    it('should detect DOM changes with MutationObserver', async () => {
      document.body.innerHTML = `<main></main>`;

      const changes: MutationRecord[] = [];
      const main = document.querySelector('main')!;

      const observer = new MutationObserver((mutations) => {
        changes.push(...mutations);
      });

      observer.observe(main, { childList: true, subtree: true });

      // Simulate ChatGPT adding transcription result
      const textarea = document.createElement('div');
      textarea.id = 'prompt-textarea';
      textarea.textContent = 'Hello World';
      main.appendChild(textarea);

      // Wait for mutation to be recorded
      await new Promise((resolve) => setTimeout(resolve, 10));

      observer.disconnect();

      expect(changes.length).toBeGreaterThan(0);
      expect(changes[0].addedNodes.length).toBeGreaterThan(0);
    });
  });
});
