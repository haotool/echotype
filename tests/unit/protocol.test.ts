/**
 * Unit tests for shared/protocol.ts
 * @module tests/unit/protocol
 */

import { describe, it, expect } from 'vitest';
import {
  MSG,
  createMessage,
  isCommandMessage,
  isResultMessage,
} from '@shared/protocol';
import type { DictationStatus, CaptureResult, ClearResult } from '@shared/types';

describe('MSG constants', () => {
  it('should have unique values', () => {
    const values = Object.values(MSG);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });
});

describe('createMessage', () => {
  describe('cmdStart', () => {
    it('should create start command with default mode', () => {
      const msg = createMessage.cmdStart();
      expect(msg.type).toBe(MSG.CMD_START);
      expect(msg.baselineMode).toBe('snapshot');
    });

    it('should create start command with specified mode', () => {
      const msg = createMessage.cmdStart('empty');
      expect(msg.baselineMode).toBe('empty');
    });
  });

  describe('cmdPause', () => {
    it('should create pause command', () => {
      const msg = createMessage.cmdPause();
      expect(msg.type).toBe(MSG.CMD_PAUSE);
    });
  });

  describe('cmdSubmit', () => {
    it('should create submit command with default requireChange', () => {
      const msg = createMessage.cmdSubmit();
      expect(msg.type).toBe(MSG.CMD_SUBMIT);
      expect(msg.requireChange).toBe(true);
    });

    it('should create submit command with specified requireChange', () => {
      const msg = createMessage.cmdSubmit(false);
      expect(msg.requireChange).toBe(false);
    });
  });

  describe('cmdGetStatus', () => {
    it('should create get status command', () => {
      const msg = createMessage.cmdGetStatus();
      expect(msg.type).toBe(MSG.CMD_GET_STATUS);
    });
  });

  describe('inspectDom', () => {
    it('should create inspect dom message', () => {
      const msg = createMessage.inspectDom();
      expect(msg.type).toBe(MSG.INSPECT_DOM);
    });
  });

  describe('devForward', () => {
    it('should create dev forward message', () => {
      const msg = createMessage.devForward({ type: MSG.INSPECT_DOM });
      expect(msg.type).toBe(MSG.DEV_FORWARD);
      expect(msg.message.type).toBe(MSG.INSPECT_DOM);
    });
  });

  describe('resultReady', () => {
    it('should create result ready message', () => {
      const capture: CaptureResult = { text: 'test', reason: 'stable' };
      const clear: ClearResult = { ok: true, reason: 'cleared-attempt-1' };
      const msg = createMessage.resultReady('added', 'full', capture, clear);

      expect(msg.type).toBe(MSG.RESULT_READY);
      expect(msg.addedText).toBe('added');
      expect(msg.fullText).toBe('full');
      expect(msg.capture).toBe(capture);
      expect(msg.clear).toBe(clear);
      expect(msg.timestamp).toBeDefined();
    });
  });

  describe('statusChanged', () => {
    it('should create status changed message', () => {
      const status: DictationStatus = 'listening';
      const msg = createMessage.statusChanged(status);

      expect(msg.type).toBe(MSG.STATUS_CHANGED);
      expect(msg.status).toBe('listening');
    });
  });

  describe('error', () => {
    it('should create error message', () => {
      const error = {
        code: 'SELECTOR_NOT_FOUND' as const,
        message: 'test error',
      };
      const msg = createMessage.error(error);

      expect(msg.type).toBe(MSG.ERROR);
      expect(msg.error).toBe(error);
    });
  });

  describe('broadcastResult', () => {
    it('should create broadcast result message', () => {
      const historyItem = {
        id: '123',
        timestamp: 1704067200000,
        text: 'test',
        createdAt: '2025-01-01T00:00:00Z',
      };
      const msg = createMessage.broadcastResult('test', historyItem);

      expect(msg.type).toBe(MSG.BROADCAST_RESULT);
      expect(msg.text).toBe('test');
      expect(msg.historyItem).toBe(historyItem);
    });
  });

  describe('pasteText', () => {
    it('should create paste text message', () => {
      const msg = createMessage.pasteText('test');
      expect(msg.type).toBe(MSG.PASTE_TEXT);
      expect(msg.text).toBe('test');
    });
  });

  describe('offscreenClipboardWrite', () => {
    it('should create clipboard write message', () => {
      const msg = createMessage.offscreenClipboardWrite('test');
      expect(msg.type).toBe(MSG.OFFSCREEN_CLIPBOARD_WRITE);
      expect(msg.text).toBe('test');
      expect(msg.target).toBe('offscreen');
    });
  });
});

describe('type guards', () => {
  describe('isCommandMessage', () => {
    it('should return true for command messages', () => {
      expect(isCommandMessage(createMessage.cmdStart())).toBe(true);
      expect(isCommandMessage(createMessage.cmdPause())).toBe(true);
      expect(isCommandMessage(createMessage.cmdSubmit())).toBe(true);
      expect(isCommandMessage(createMessage.cmdGetStatus())).toBe(true);
      expect(isCommandMessage(createMessage.inspectDom())).toBe(true);
      expect(isCommandMessage(createMessage.devForward({ type: MSG.INSPECT_DOM }))).toBe(true);
    });

    it('should return false for non-command messages', () => {
      expect(isCommandMessage(createMessage.statusChanged('idle'))).toBe(false);
      expect(isCommandMessage(createMessage.pasteText('test'))).toBe(false);
    });
  });

  describe('isResultMessage', () => {
    it('should return true for result messages', () => {
      const capture: CaptureResult = { text: 'test', reason: 'stable' };
      const clear: ClearResult = { ok: true, reason: 'cleared-attempt-1' };

      expect(
        isResultMessage(createMessage.resultReady('a', 'b', capture, clear))
      ).toBe(true);
      expect(isResultMessage(createMessage.statusChanged('idle'))).toBe(true);
      expect(
        isResultMessage(
          createMessage.error({ code: 'TIMEOUT', message: 'test' })
        )
      ).toBe(true);
    });

    it('should return false for non-result messages', () => {
      expect(isResultMessage(createMessage.cmdStart())).toBe(false);
      expect(isResultMessage(createMessage.pasteText('test'))).toBe(false);
    });
  });
});
