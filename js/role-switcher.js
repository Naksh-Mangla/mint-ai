/**
 * Mint AI - Role Switcher Component (js/role-switcher.js)
 * 
 * Simple explanation:
 * Think of this file like switching between "Teacher" (Builder) and "Student" (Player) modes.
 * When you click the switch at the top, a shiny white pill slides across smoothly with
 * an Apple-style spring bounce. The website immediately hides the teacher tools and shows
 * the student worksheet, or vice-versa, so both can use the app seamlessly!
 */

import { getState, setState, on } from './state.js';

// Valid role identifiers
export const ROLES = Object.freeze({
  TEACHER: 'teacher',
  STUDENT: 'student'
});

/**
 * Returns the currently active role ('teacher' or 'student').
 * 
 * @returns {'teacher'|'student'} Current active role
 */
export function getRole() {
  return getState().role || ROLES.TEACHER;
}

/**
 * Checks if Teacher Mode is currently active.
 * 
 * @returns {boolean} True if teacher mode is active
 */
export function isTeacher() {
  return getRole() === ROLES.TEACHER;
}

/**
 * Checks if Student Mode is currently active.
 * 
 * @returns {boolean} True if student mode is active
 */
export function isStudent() {
  return getRole() === ROLES.STUDENT;
}

/**
 * Switches the active role, animates the sliding pill, updates body classes, and syncs UI.
 * 
 * @param {'teacher'|'student'} targetRole - Role to switch to
 * @returns {'teacher'|'student'} Activated role
 */
export function setRole(targetRole) {
  const normalizedRole = targetRole === ROLES.STUDENT ? ROLES.STUDENT : ROLES.TEACHER;

  // 1. Sync with reactive state store (this also fires 'mint:role-changed')
  if (getState().role !== normalizedRole) {
    setState({ role: normalizedRole });
  }

  // 2. Update DOM classes and styles
  applyRoleToDOM(normalizedRole);

  return normalizedRole;
}

/**
 * Toggles between Teacher Mode and Student Mode.
 * 
 * @returns {'teacher'|'student'} Newly activated role
 */
export function toggleRole() {
  const current = getRole();
  const next = current === ROLES.TEACHER ? ROLES.STUDENT : ROLES.TEACHER;
  return setRole(next);
}

/**
 * Applies role changes to DOM elements: updates body classes, pill position, and view visibility.
 * 
 * @param {'teacher'|'student'} role - The active role
 */
export function applyRoleToDOM(role) {
  if (typeof document === 'undefined') return;

  // 1. Update body classes: .role-teacher and .role-student
  if (document.body) {
    document.body.classList.remove('role-teacher', 'role-student');
    document.body.classList.add(`role-${role}`);
    document.body.setAttribute('data-current-role', role);
  }

  // 2. Update role switcher container and sliding pill
  const containers = document.querySelectorAll('.role-switcher-container, #roleSwitcher, #roleSwitcherContainer');
  containers.forEach(container => {
    container.setAttribute('data-active-role', role);
  });

  // 3. Update radio buttons and ARIA attributes
  const teacherBtns = document.querySelectorAll('#btnRoleTeacher, [data-role="teacher"]');
  const studentBtns = document.querySelectorAll('#btnRoleStudent, [data-role="student"]');

  const isTeacherActive = role === ROLES.TEACHER;

  teacherBtns.forEach(btn => {
    btn.classList.toggle('active', isTeacherActive);
    btn.setAttribute('aria-checked', isTeacherActive ? 'true' : 'false');
    btn.tabIndex = isTeacherActive ? 0 : -1;
  });

  studentBtns.forEach(btn => {
    const isStudentActive = !isTeacherActive;
    btn.classList.toggle('active', isStudentActive);
    btn.setAttribute('aria-checked', isStudentActive ? 'true' : 'false');
    btn.tabIndex = isStudentActive ? 0 : -1;
  });

  // 4. Update role-specific workspaces and UI visibility
  updateWorkspaceVisibility(role);
}

/**
 * Shows or hides role-specific sections smoothly.
 * 
 * @param {'teacher'|'student'} role - The active role
 */
export function updateWorkspaceVisibility(role) {
  if (typeof document === 'undefined') return;

  const isTeacherActive = role === ROLES.TEACHER;

  // Workspaces by ID
  const teacherWorkspace = document.getElementById('teacherWorkspace');
  const studentWorkspace = document.getElementById('studentWorkspace');

  if (teacherWorkspace) {
    // Setting '' clears inline display style, allowing stylesheet's display: grid to apply!
    teacherWorkspace.style.display = isTeacherActive ? '' : 'none';
    teacherWorkspace.setAttribute('aria-hidden', isTeacherActive ? 'false' : 'true');
    if (isTeacherActive) {
      teacherWorkspace.removeAttribute('hidden');
    } else {
      teacherWorkspace.setAttribute('hidden', '');
    }
  }

  if (studentWorkspace) {
    // Setting '' clears inline display style, allowing stylesheet's display: flex to apply!
    studentWorkspace.style.display = isTeacherActive ? 'none' : '';
    studentWorkspace.setAttribute('aria-hidden', isTeacherActive ? 'true' : 'false');
    if (isTeacherActive) {
      studentWorkspace.setAttribute('hidden', '');
    } else {
      studentWorkspace.removeAttribute('hidden');
    }
  }

  // Generic role-based visibility helper classes
  const teacherOnlyElements = document.querySelectorAll('.teacher-only, [data-visible-role="teacher"]');
  teacherOnlyElements.forEach(el => {
    if (el !== teacherWorkspace) {
      el.style.display = isTeacherActive ? '' : 'none';
      if (isTeacherActive) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    }
  });

  const studentOnlyElements = document.querySelectorAll('.student-only, [data-visible-role="student"]');
  studentOnlyElements.forEach(el => {
    if (el !== studentWorkspace) {
      el.style.display = isTeacherActive ? 'none' : '';
      if (isTeacherActive) el.setAttribute('hidden', '');
      else el.removeAttribute('hidden');
    }
  });
}

/**
 * Initializes the role switcher component and wires up click and keyboard listeners.
 * 
 * @returns {'teacher'|'student'} Initial role
 */
export function initRoleSwitcher() {
  const currentRole = getState().role || ROLES.TEACHER;

  // Apply to DOM right away
  applyRoleToDOM(currentRole);

  // Wire up click and keyboard listeners
  bindRoleSwitcherEvents();

  // Listen for state changes from other modules
  on('mint:role-changed', (detail) => {
    if (detail && detail.role) {
      applyRoleToDOM(detail.role);
    }
  });

  return currentRole;
}

/**
 * Attaches click and accessible keyboard event listeners to the role buttons.
 */
export function bindRoleSwitcherEvents() {
  if (typeof document === 'undefined') return;

  const containers = document.querySelectorAll('.role-switcher-container, #roleSwitcher, #roleSwitcherContainer');

  containers.forEach(container => {
    // Avoid double-binding
    if (container.dataset.roleBound === 'true') return;
    container.dataset.roleBound = 'true';

    // Click handler for container buttons
    container.addEventListener('click', (e) => {
      const button = e.target.closest('[data-role]');
      if (!button) return;

      const targetRole = button.getAttribute('data-role');
      if (targetRole === ROLES.TEACHER || targetRole === ROLES.STUDENT) {
        setRole(targetRole);
      }
    });

    // Keyboard navigation (Arrow keys and Space/Enter)
    container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setRole(ROLES.STUDENT);
        const studentBtn = container.querySelector('[data-role="student"]');
        if (studentBtn && typeof studentBtn.focus === 'function') {
          studentBtn.focus();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setRole(ROLES.TEACHER);
        const teacherBtn = container.querySelector('[data-role="teacher"]');
        if (teacherBtn && typeof teacherBtn.focus === 'function') {
          teacherBtn.focus();
        }
      }
    });
  });
}

// Export default object
export default {
  ROLES,
  getRole,
  isTeacher,
  isStudent,
  setRole,
  toggleRole,
  applyRoleToDOM,
  initRoleSwitcher,
  bindRoleSwitcherEvents,
  updateWorkspaceVisibility
};
