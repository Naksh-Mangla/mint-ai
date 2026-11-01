/**
 * Mint AI - Centralized Reactive State Store (js/state.js)
 * 
 * Simple explanation:
 * Think of this file like the scoreboard in a video game. It keeps track of the player's
 * points (mints), game mode (Teacher or Student), and screen brightness (Light or Dark).
 * Whenever something changes, it rings a bell (dispatches an event) so every other
 * part of the website updates instantly.
 */

// Initial default state for the entire application
const INITIAL_STATE = Object.freeze({
  role: 'teacher', // 'teacher' | 'student'
  theme: 'light',  // 'light' | 'dark'
  user: {
    signedIn: false,
    username: null,
    uid: null
  },
  mints: 50, // Welcome gift of 50 free mints
  lastDailyBonus: null, // Timestamp when daily bonus was last claimed
  currentTest: null, // Active generated test paper object
  preferences: {
    defaultGrade: 'Grade 10',
    defaultDifficulty: 'Medium',
    defaultCount: 4,
    avoidNegativePhrasing: false,
    customInstructions: []
  },
  studentWeaknesses: [], // List of student weak areas for AI targeting
  recentTransactions: [], // List of mint balance changes
  isLoading: false,
  error: null
});

/**
 * Creates a safe, deep copy of any object so outside code cannot accidentally break internal state.
 * 
 * @param {any} value - The object or value to clone
 * @returns {any} Deep copy of the value
 */
export function deepClone(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch (e) {
      // Fallback if object contains non-cloneable items like functions or DOM nodes
    }
  }
  try {
    return JSON.parse(
      JSON.stringify(value, (k, v) => (typeof v === 'bigint' ? v.toString() : v))
    );
  } catch (e) {
    // Graceful fallback for circular structures or non-serializable objects
    return Array.isArray(value) ? [...value] : { ...value };
  }
}

// Active in-memory state object initialized with a complete deep copy
let currentState = deepClone(INITIAL_STATE);

/**
 * Helper to safely serialize values for comparison without crashing on BigInt or circular structures.
 * 
 * @param {any} val - Value to serialize
 * @returns {string} String representation of value
 */
function safeStringify(val) {
  const seen = new WeakSet();
  return JSON.stringify(val, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Dispatches a native CustomEvent on window for reactive UI updates.
 * 
 * @param {string} eventName - Name of the custom event (e.g. 'mint:role-changed')
 * @param {object} detail - Data payload attached to the event
 */
export function dispatchStateEvent(eventName, detail = {}) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    const customEvent = new CustomEvent(eventName, {
      detail: {
        ...detail,
        timestamp: Date.now()
      },
      bubbles: true,
      composed: true
    });
    window.dispatchEvent(customEvent);
  }
}

/**
 * Returns a safe, cloned snapshot of the current state.
 * 
 * @returns {object} Immutable snapshot of current application state
 */
export function getState() {
  return deepClone(currentState);
}

/**
 * Returns a specific top-level property from the state.
 * 
 * @param {string} key - Property name (e.g. 'role', 'mints')
 * @returns {any} Cloned property value
 */
export function getStateProperty(key) {
  return deepClone(currentState[key]);
}

/**
 * Updates application state and dispatches targeted events.
 * 
 * @param {object} updates - Object containing keys and new values to merge
 * @returns {object} Updated state snapshot
 */
export function setState(updates) {
  // Reject non-objects and arrays to prevent state key pollution
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return getState();
  }

  const previousState = deepClone(currentState);
  const changedKeys = [];

  // Determine what has actually changed using safe serialization
  for (const [key, value] of Object.entries(updates)) {
    const oldValue = currentState[key];
    let isDifferent = false;
    try {
      isDifferent = safeStringify(oldValue) !== safeStringify(value);
    } catch (e) {
      isDifferent = oldValue !== value;
    }
    
    if (isDifferent) {
      changedKeys.push(key);
      if (value && typeof value === 'object' && !Array.isArray(value) && oldValue && typeof oldValue === 'object' && !Array.isArray(oldValue)) {
        // Deep clone nested updates so external object mutations do not leak into internal state
        currentState[key] = { ...oldValue, ...deepClone(value) };
      } else {
        currentState[key] = deepClone(value);
      }
    }
  }

  // If nothing changed, exit early without firing events
  if (changedKeys.length === 0) {
    return getState();
  }

  // 1. Role change event
  if (changedKeys.includes('role')) {
    dispatchStateEvent('mint:role-changed', {
      role: currentState.role,
      previousRole: previousState.role
    });
  }

  // 2. Theme change event
  if (changedKeys.includes('theme')) {
    dispatchStateEvent('mint:theme-changed', {
      theme: currentState.theme,
      previousTheme: previousState.theme
    });
  }

  // 3. Currency (Mints) change event
  if (changedKeys.includes('mints')) {
    const delta = typeof currentState.mints === 'bigint' || typeof previousState.mints === 'bigint'
      ? Number(currentState.mints) - Number(previousState.mints)
      : currentState.mints - previousState.mints;
    dispatchStateEvent('mint:currency-changed', {
      mints: currentState.mints,
      previousMints: previousState.mints,
      delta: delta,
      reason: updates.reason || 'balance_update'
    });
  }

  // 4. Test generation event
  if (changedKeys.includes('currentTest') && currentState.currentTest !== null) {
    dispatchStateEvent('mint:test-generated', {
      test: currentState.currentTest,
      previousTest: previousState.currentTest
    });
  }

  // 5. Auth change event
  if (changedKeys.includes('user')) {
    dispatchStateEvent('mint:auth-changed', {
      user: currentState.user,
      previousUser: previousState.user
    });
  }

  // 6. General master event for any state change
  dispatchStateEvent('mint:state-changed', {
    state: getState(),
    updates: deepClone(updates),
    changedKeys: changedKeys
  });

  return getState();
}

/**
 * Resets state back to initial values (useful for tests and user sign-out).
 * 
 * @returns {object} Initial state snapshot
 */
export function resetState() {
  currentState = deepClone(INITIAL_STATE);
  dispatchStateEvent('mint:state-changed', {
    state: getState(),
    updates: {},
    changedKeys: ['RESET']
  });
  return getState();
}

/**
 * Convenience helper to listen for state events on the window.
 * Returns a cleanup function that automatically unsubscribes.
 * 
 * @param {string} eventName - Name of custom event
 * @param {Function} handler - Callback receiving event.detail
 * @returns {Function} Unsubscribe function
 */
export function on(eventName, handler) {
  if (typeof window === 'undefined') return () => {};
  
  const listener = (event) => handler(event.detail);
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

// Export default object containing all methods
export default {
  getState,
  getStateProperty,
  setState,
  resetState,
  on,
  dispatchStateEvent,
  deepClone
};
