import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTheme, applyTheme, toggleTheme } from './theme';

const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
};

describe('getTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  it('returns stored theme when set to dark', () => {
    localStorage.setItem('df-theme', 'dark');
    expect(getTheme()).toBe('dark');
  });

  it('returns stored theme when set to light', () => {
    localStorage.setItem('df-theme', 'light');
    expect(getTheme()).toBe('light');
  });

  it('falls back to system preference dark', () => {
    mockMatchMedia(true);
    expect(getTheme()).toBe('dark');
  });

  it('falls back to light when no preference', () => {
    mockMatchMedia(false);
    expect(getTheme()).toBe('light');
  });
});

describe('applyTheme', () => {
  it('adds .dark class for dark theme', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes .dark class for light theme', () => {
    document.documentElement.classList.add('dark');
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('toggleTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia(false);
  });

  it('switches from light to dark', () => {
    localStorage.setItem('df-theme', 'light');
    toggleTheme();
    expect(localStorage.getItem('df-theme')).toBe('dark');
  });

  it('switches from dark to light', () => {
    localStorage.setItem('df-theme', 'dark');
    toggleTheme();
    expect(localStorage.getItem('df-theme')).toBe('light');
  });
});
