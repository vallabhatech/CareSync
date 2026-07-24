import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeModeProvider, useThemeMode } from './ThemeContext';

function ThemeProbe() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <div>
      <div data-testid="theme-mode">{mode}</div>
      <button type="button" onClick={toggleTheme}>
        Toggle theme
      </button>
    </div>
  );
}

describe('ThemeModeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to light mode and persists theme changes', () => {
    render(
      <ThemeModeProvider>
        <ThemeProbe />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(localStorage.getItem('caresync_theme_mode')).toBe('dark');
  });
});
