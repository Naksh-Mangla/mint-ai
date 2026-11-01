/**
 * Mint AI - Theme Manager (js/theme.js)
 * 
 * Simple explanation:
 * Think of this file like a smart light switch for the whole website.
 * It lets you flip between clean light mode (looks like Apple ceramic glass)
 * and sleek dark mode (looks like Apple space gray with glowing mint).
 * It remembers your choice on your computer, checks if your computer is
 * already set to dark mode, and changes the colors instantly without reloading!
 */

import { getState, setState, on } from './state.js';

// Local storage key used to remember user's theme choice
const THEME_STORAGE_KEY = 'mint_theme';

// Color hex codes for mobile browser address bar
const THEME_COLORS = {
  light: '#F5F5F7',
  dark: '#000000'
};

/**
 * Safely reads from localStorage without crashing in incognito mode.
 * 
 * @param {string} key - Storage key to read
 * @returns {string|null} Stored value or null
 */
function safeStorageGet(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    console.warn('LocalStorage is not accessible, using memory fallback:', err);
  }
  return null;
}

/**
 * Safely writes to localStorage without crashing in private browsing.
 * 
 * @param {string} key - Storage key to write
 * @param {string} value - Value to store
 */
function safeStorageSet(key, value) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (err) {
    console.warn('Unable to write to LocalStorage:', err);
  }
}

/**
 * Detects if the user's operating system prefers dark mode.
 * 
 * @returns {boolean} True if system preference is dark mode
 */
export function getSystemPrefersDark() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * Returns the currently active theme ('light' or 'dark').
 * 
 * @returns {'light'|'dark'} Current theme name
 */
export function getTheme() {
  if (typeof document !== 'undefined' && document.documentElement) {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') {
      return attr;
    }
  }
  return getState().theme || 'light';
}

/**
 * Checks if dark mode is currently active.
 * 
 * @returns {boolean} True if dark mode is active
 */
export function isDark() {
  return getTheme() === 'dark';
}

/**
 * Sets the active theme, updates HTML document attribute, syncs state, and saves to storage.
 * 
 * @param {'light'|'dark'} theme - The desired theme
 * @param {boolean} [saveToStorage=true] - Whether to save choice to localStorage
 * @returns {'light'|'dark'} Applied theme
 */
export function setTheme(theme, saveToStorage = true) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';

  // 1. Update HTML tag attribute
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', normalizedTheme);
  }

  // 2. Update mobile browser top bar color (<meta name="theme-color">)
  if (typeof document !== 'undefined') {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', THEME_COLORS[normalizedTheme]);
  }

  // 3. Update theme toggle button UI and ARIA attributes
  updateToggleButtons(normalizedTheme);

  // 4. Save to localStorage if requested
  if (saveToStorage) {
    safeStorageSet(THEME_STORAGE_KEY, normalizedTheme);
  }

  // 5. Sync with reactive state store if different
  if (getState().theme !== normalizedTheme) {
    setState({ theme: normalizedTheme });
  }

  return normalizedTheme;
}

/**
 * Toggles between light and dark theme.
 * 
 * @returns {'light'|'dark'} Newly activated theme
 */
export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return setTheme(next, true);
}

/**
 * Updates all theme toggle buttons on the page with proper icons and ARIA attributes.
 * 
 * @param {'light'|'dark'} activeTheme - The currently active theme
 */
export function updateToggleButtons(activeTheme) {
  if (typeof document === 'undefined') return;

  const buttons = document.querySelectorAll('#btnThemeToggle, [data-action="toggle-theme"], #themeToggleBtn, .theme-toggle-btn');
  buttons.forEach(btn => {
    const isDarkMode = activeTheme === 'dark';
    btn.setAttribute('aria-pressed', isDarkMode ? 'true' : 'false');
    btn.setAttribute('aria-label', isDarkMode ? 'Switch to light appearance' : 'Switch to dark appearance');
    btn.setAttribute('title', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    
    // Toggle icon visibility if button contains icon wrappers
    const sunIcon = btn.querySelector('.icon-sun, .theme-icon-sun');
    const moonIcon = btn.querySelector('.icon-moon, .theme-icon-moon');
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDarkMode ? 'block' : 'none';
      moonIcon.style.display = isDarkMode ? 'none' : 'block';
    }
  });
}

/**
 * Initializes the theme system:
 * 1. Checks localStorage for saved theme.
 * 2. If not saved, checks system prefers-color-scheme.
 * 3. Applies initial theme.
 * 4. Attaches listener for live system theme changes.
 * 
 * @returns {'light'|'dark'} The initialized theme
 */
export function initTheme() {
  const saved = safeStorageGet(THEME_STORAGE_KEY);
  let initialTheme = 'light';

  if (saved === 'dark' || saved === 'light') {
    initialTheme = saved;
  } else if (getSystemPrefersDark()) {
    initialTheme = 'dark';
  }

  // Apply without overriding localStorage if we just read from system
  const hasManualPreference = saved !== null;
  setTheme(initialTheme, hasManualPreference);

  // Listen for live system theme changes when user has no manual override
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      // Only auto-switch if user hasn't explicitly set a preference in storage
      const currentSaved = safeStorageGet(THEME_STORAGE_KEY);
      if (!currentSaved) {
        setTheme(e.matches ? 'dark' : 'light', false);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemChange);
    }
  }

  // Listen for state changes if theme is updated by another component
  on('mint:theme-changed', (detail) => {
    if (detail && detail.theme && detail.theme !== getTheme()) {
      setTheme(detail.theme, true);
    }
  });

  // Bind clicks on any theme buttons already on the page
  bindThemeButtons();

  return initialTheme;
}

/**
 * Finds all theme toggle buttons and wires up click events.
 */
export function bindThemeButtons() {
  if (typeof document === 'undefined') return;

  const buttons = document.querySelectorAll('#btnThemeToggle, [data-action="toggle-theme"], #themeToggleBtn, .theme-toggle-btn');
  buttons.forEach(btn => {
    // Avoid double-binding
    if (btn.dataset.themeBound === 'true') return;
    btn.dataset.themeBound = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
}

// Export default object
export default {
  initTheme,
  getTheme,
  setTheme,
  toggleTheme,
  isDark,
  getSystemPrefersDark,
  bindThemeButtons,
  updateToggleButtons
};
