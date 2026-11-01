# Project: Mint AI

## Bottom-Line Summary
Mint AI is a pure client-side, Apple-inspired AI Test Generator web application for teachers and students, featuring DeepSeek AI test generation, Puter.js cloud storage with LocalStorage fallback, an AI memory system, a 50-Mints economy, clean printable A4 worksheets, and automated browser verification.

---

## Architecture
- **Pure Browser Web Application**: Zero build tools, bundlers, or compilation. Runs directly from `index.html`.
- **Presentation Layer**: `styles.css` with SF Pro typography, Apple squircle containers, frosted glass blur (`backdrop-filter`), spring micro-interactions, mint green accents (`#00A368` / `#00E599`), dark/light theme tokens, and `@media print` A4 worksheet rules.
- **State & Coordination Layer**: `js/state.js` centralized reactive state with custom DOM event dispatching (`mint:state-changed`, `mint:role-changed`, `mint:currency-changed`).
- **Authentication & Cloud Layer**: Puter.js v2 SDK (`https://js.puter.com/v2/`) with auth modal guard, Puter KV cloud storage, and airtight fallback to `window.localStorage`.
- **AI Engine**: `puter.ai.chat()` targeting `deepseek/deepseek-v4.1-flash` with strict system prompt schemas and markdown code-fence sanitizing.
- **Memory System**: Persistent teacher ratings (thumbs up/down), custom rules, and student weak areas injected into generation prompts.
- **Economy System**: 50 welcome Mints, 1 Mint per question pre-flight gatekeeping, 24-hour daily bonus (+10 Mints) with countdown, refill options, and transaction ledger.
- **Print System**: Dedicated printable A4 worksheet views separating student exam papers (with ruled writing lines) and teacher master keys.

---

## Code Layout
```
d:\my antigravity\unknown\
├── index.html              # Core application HTML shell
├── styles.css              # Apple design tokens, layout, components, and A4 print styles
├── js/
│   ├── app.js              # Main application initialization and event wiring
│   ├── state.js            # Central reactive state manager
│   ├── theme.js            # Dark and light mode toggle manager
│   ├── role-switcher.js    # Teacher Mode vs Student Mode switcher
│   ├── storage.js          # Unified StorageService (Puter KV with LocalStorage fallback)
│   ├── auth.js             # Puter.js authentication guard and profile display
│   ├── memory.js           # AI Memory manager for teacher feedback and student weak areas
│   ├── ai-service.js       # DeepSeek AI chat connector, prompt builder, and JSON parser
│   ├── mints.js            # Mints currency, deduction gatekeeper, daily bonus, and ledger
│   ├── worksheet-view.js   # Question card renderer, rubrics, and student answer inputs
│   └── print-export.js     # Dedicated A4 printable worksheet generator
└── tests/
    ├── test-runner.html    # In-browser test runner interface
    └── test-runner.js      # Automated test harness verifying all components
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Zero-Build Web Shell | Clean HTML/CSS/ES modular architecture runnable directly in any browser | M1 | R1 |
| F2 | Apple Design System | Squircles, glassmorphism blur, SF Pro font stack, mint accents, spring animations | M1 | R1 |
| F3 | Theme Switching | Instant toggle between dark and light modes with persistent preference | M1 | R1 |
| F4 | Role Switching | Instant toggle between Teacher Mode and Student Mode with animated sliding pill | M1 | R1 |
| F5 | Puter.js Auth Guard | Login detection via `puter.auth.isSignedIn()` and modal login prompt | M2 | R2 |
| F6 | Unified Storage Service | Puter KV cloud storage with seamless `window.localStorage` fallback | M2 | R3 |
| F7 | AI Memory System | Persistence of teacher ratings, custom instructions, and student weak areas | M2 | R3 |
| F8 | DeepSeek AI Generation | AI test generation via `puter.ai.chat()` targeting `deepseek/deepseek-v4.1-flash` | M3 | R2 |
| F9 | Academic Question Formats | 1-mark definition, 2-3 mark bullet/differentiation, 5-mark long answer, fill-in-the-blanks | M3 | R2 |
| F10 | Teacher Answer Keys & Rubrics | Step-by-step grading rubrics and marking schemes alongside questions | M3 | R2 |
| F11 | Mints Economy System | 50 welcome Mints, 1 Mint/question cost, daily bonus (+10), refills, transaction ledger | M4 | R4 |
| F12 | A4 Printable Worksheet Export | Pure CSS print layout with student exam header, ruled lines, and separate answer key | M4 | R5 |
| F13 | E2E Automated Verification | In-browser test suite covering roles, themes, Puter mocking, economy, and memory | M5 | R6 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI Shell & Apple Design System | `index.html`, `styles.css`, `js/state.js`, `js/theme.js`, `js/role-switcher.js` | none | IN_PROGRESS |
| M2 | Puter Auth & Storage Memory Layer | `js/storage.js`, `js/auth.js`, `js/memory.js` | M1 | PLANNED |
| M3 | DeepSeek AI Generation & Formats | `js/ai-service.js`, `js/worksheet-view.js` | M1, M2 | PLANNED |
| M4 | Mints Economy & Printable A4 Export | `js/mints.js`, `js/print-export.js`, `js/app.js` | M1, M2, M3 | PLANNED |
| M5 | E2E Test Suite & Adversarial Hardening | `tests/test-runner.html`, `tests/test-runner.js`, 100% verification pass | M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### `js/state.js`
- State structure:
  ```javascript
  {
    role: 'teacher' | 'student',
    theme: 'light' | 'dark',
    user: { signedIn: boolean, username: string | null },
    mints: number,
    currentTest: object | null,
    preferences: object,
    studentWeaknesses: array
  }
  ```
- Events: `mint:state-changed`, `mint:role-changed`, `mint:theme-changed`, `mint:currency-changed`, `mint:test-generated`.

### `js/storage.js` (`StorageService`)
- `get(key, defaultValue)`: returns Promise<any>
- `set(key, value)`: returns Promise<boolean>
- `del(key)`: returns Promise<boolean>

### `js/memory.js` (`MemoryManager`)
- `addTeacherRating(questionId, questionText, rating, feedback)`
- `addCustomInstruction(ruleText)`
- `recordStudentWeakness(subject, topic, severity)`
- `buildMemoryPromptContext()`: returns string

### `js/ai-service.js` (`AIService`)
- `generateTest({ subject, topic, grade, count, formats })`: returns Promise<TestObject>
- Throws `'AUTH_REQUIRED'` if user is not signed in.
- Throws `'INSUFFICIENT_MINTS'` if balance < count.

### `js/mints.js` (`MintEconomyManager`)
- `getBalance()`: returns number
- `canAfford(count)`: returns boolean
- `deductForGeneration(count, topic)`: returns transaction
- `getDailyBonusStatus()`: returns `{ canClaim: boolean, remainingMs: number }`
- `claimDailyBonus()`: returns transaction
- `refill(amount, description)`: returns transaction

### `js/print-export.js` (`PrintExportManager`)
- `prepareAndPrint({ mode: 'student' | 'teacher_master' })`
