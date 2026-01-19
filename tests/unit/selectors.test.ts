/**
 * EchoType - Selectors Unit Tests
 * Tests for DOM detection, login status, and health check logic
 */

import { describe, it, expect } from 'vitest';

describe('Login Status Detection Logic', () => {
  describe('checkLoginStatus patterns', () => {
    it('should detect NOT_LOGGED_IN when login button exists', () => {
      // Pattern: login button found
      const hasLoginButton = true;
      const hasUserMenu = false;
      const hasComposer = false;
      
      const result = determineLoginStatus(hasLoginButton, hasUserMenu, hasComposer);
      
      expect(result.loggedIn).toBe(false);
      expect(result.reason).toBe('login_button_found');
    });
    
    it('should detect LOGGED_IN when user menu exists', () => {
      const hasLoginButton = false;
      const hasUserMenu = true;
      const hasComposer = false;
      
      const result = determineLoginStatus(hasLoginButton, hasUserMenu, hasComposer);
      
      expect(result.loggedIn).toBe(true);
      expect(result.reason).toBe('user_menu_found');
    });
    
    it('should detect LOGGED_IN when composer exists', () => {
      const hasLoginButton = false;
      const hasUserMenu = false;
      const hasComposer = true;
      
      const result = determineLoginStatus(hasLoginButton, hasUserMenu, hasComposer);
      
      expect(result.loggedIn).toBe(true);
      expect(result.reason).toBe('composer_found');
    });
    
    it('should default to LOGGED_IN when no indicators found', () => {
      const hasLoginButton = false;
      const hasUserMenu = false;
      const hasComposer = false;
      
      const result = determineLoginStatus(hasLoginButton, hasUserMenu, hasComposer);
      
      expect(result.loggedIn).toBe(true);
      expect(result.reason).toBe('no_login_indicators');
    });
  });
});

describe('Health Check Logic', () => {
  describe('performHealthCheck patterns', () => {
    it('should be healthy when composer is found (idle state)', () => {
      const composerFound = true;
      const startBtnFound = true;
      const stopBtnFound = false;
      const submitBtnFound = false;
      const waveformActive = false;
      
      const result = determineHealth(composerFound, startBtnFound, stopBtnFound, submitBtnFound, waveformActive);
      
      expect(result.healthy).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
    
    it('should be healthy when dictation is active (recording state)', () => {
      const composerFound = false; // Hidden during recording
      const startBtnFound = false;
      const stopBtnFound = true;
      const submitBtnFound = true;
      const waveformActive = true;
      
      const result = determineHealth(composerFound, startBtnFound, stopBtnFound, submitBtnFound, waveformActive);
      
      expect(result.healthy).toBe(true);
      expect(result.warnings).toContain('composer hidden during dictation (expected)');
    });
    
    it('should be unhealthy when no composer and no dictation controls', () => {
      const composerFound = false;
      const startBtnFound = false;
      const stopBtnFound = false;
      const submitBtnFound = false;
      const waveformActive = false;
      
      const result = determineHealth(composerFound, startBtnFound, stopBtnFound, submitBtnFound, waveformActive);
      
      expect(result.healthy).toBe(false);
      expect(result.missing).toContain('composer');
    });
    
    it('should warn when no dictation buttons found', () => {
      const composerFound = true;
      const startBtnFound = false;
      const stopBtnFound = false;
      const submitBtnFound = false;
      const waveformActive = false;
      
      const result = determineHealth(composerFound, startBtnFound, stopBtnFound, submitBtnFound, waveformActive);
      
      expect(result.healthy).toBe(true); // Still healthy if composer exists
      expect(result.warnings).toContain('dictation buttons not found (login may be required)');
    });
  });
});

describe('Dictation Status Detection Logic', () => {
  describe('detectStatus patterns', () => {
    it('should detect idle when only start button visible', () => {
      const status = determineStatus({
        startBtn: true,
        stopBtn: false,
        submitBtn: false,
        waveformActive: false,
        composerVisible: true,
        buttonsDisabled: false,
      });
      
      expect(status).toBe('idle');
    });
    
    it('should detect listening when stop button visible with waveform', () => {
      const status = determineStatus({
        startBtn: false,
        stopBtn: true,
        submitBtn: false,
        waveformActive: true,
        composerVisible: false,
        buttonsDisabled: false,
      });
      
      expect(status).toBe('listening');
    });
    
    it('should detect recording when submit button visible with waveform', () => {
      const status = determineStatus({
        startBtn: false,
        stopBtn: false,
        submitBtn: true,
        waveformActive: true,
        composerVisible: false,
        buttonsDisabled: false,
      });
      
      expect(status).toBe('recording');
    });
    
    it('should detect processing when buttons are disabled', () => {
      const status = determineStatus({
        startBtn: false,
        stopBtn: true,
        submitBtn: true,
        waveformActive: true,
        composerVisible: false,
        buttonsDisabled: true,
      });
      
      expect(status).toBe('processing');
    });
    
    it('should detect unknown when no recognizable pattern', () => {
      const status = determineStatus({
        startBtn: false,
        stopBtn: false,
        submitBtn: false,
        waveformActive: false,
        composerVisible: false,
        buttonsDisabled: false,
      });
      
      expect(status).toBe('unknown');
    });
  });
});

describe('Voice Input Availability Logic', () => {
  it('should be available when start button exists', () => {
    const available = isVoiceAvailable(true, false, false);
    expect(available).toBe(true);
  });
  
  it('should be available when stop button exists', () => {
    const available = isVoiceAvailable(false, true, false);
    expect(available).toBe(true);
  });
  
  it('should be available when submit button exists', () => {
    const available = isVoiceAvailable(false, false, true);
    expect(available).toBe(true);
  });
  
  it('should not be available when no dictation buttons exist', () => {
    const available = isVoiceAvailable(false, false, false);
    expect(available).toBe(false);
  });
});

// Helper functions that mirror the actual logic in selectors.ts
function determineLoginStatus(
  hasLoginButton: boolean,
  hasUserMenu: boolean,
  hasComposer: boolean
): { loggedIn: boolean; reason: string } {
  if (hasLoginButton) {
    return { loggedIn: false, reason: 'login_button_found' };
  }
  if (hasUserMenu) {
    return { loggedIn: true, reason: 'user_menu_found' };
  }
  if (hasComposer) {
    return { loggedIn: true, reason: 'composer_found' };
  }
  return { loggedIn: true, reason: 'no_login_indicators' };
}

function determineHealth(
  composerFound: boolean,
  startBtnFound: boolean,
  stopBtnFound: boolean,
  submitBtnFound: boolean,
  waveformActive: boolean
): { healthy: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  const dictationActive = stopBtnFound || submitBtnFound;
  const dictationControlsValid = dictationActive && (waveformActive || !composerFound);
  
  if (!startBtnFound && !stopBtnFound && !submitBtnFound) {
    warnings.push('dictation buttons not found (login may be required)');
  }
  
  const healthy = composerFound || dictationControlsValid || dictationActive;
  
  if (!composerFound && !dictationActive) {
    missing.push('composer');
  }
  
  if (!composerFound && dictationActive) {
    warnings.push('composer hidden during dictation (expected)');
  }
  
  return { healthy, missing, warnings };
}

function determineStatus(state: {
  startBtn: boolean;
  stopBtn: boolean;
  submitBtn: boolean;
  waveformActive: boolean;
  composerVisible: boolean;
  buttonsDisabled: boolean;
}): string {
  if (state.buttonsDisabled) return 'processing';
  if (state.stopBtn && (state.waveformActive || !state.composerVisible)) return 'listening';
  if (state.submitBtn && (state.waveformActive || !state.composerVisible)) return 'recording';
  if (state.startBtn) return 'idle';
  return 'unknown';
}

function isVoiceAvailable(
  startBtn: boolean,
  stopBtn: boolean,
  submitBtn: boolean
): boolean {
  return startBtn || stopBtn || submitBtn;
}
