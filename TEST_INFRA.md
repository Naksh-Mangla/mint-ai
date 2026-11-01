# E2E Test Infra: Mint AI

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.
- Execution: In-browser test runner running in the browser and headless environments.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| F1 | Zero-Build Web Shell & Architecture | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| F2 | Apple Design System (Tokens & Squircles) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| F3 | Theme Switching (Dark & Light Mode) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| F4 | Role Switching (Teacher vs Student Mode) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| F5 | Puter.js Auth Guard & Profile | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| F6 | Unified Storage (Puter KV & LocalStorage) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| F7 | AI Memory System & Context Injection | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| F8 | DeepSeek AI Generation & Parser | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| F9 | Academic Question Formats | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| F10 | Teacher Answer Keys & Rubrics | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| F11 | Mints Economy & Accounting | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| F12 | A4 Printable Worksheet Export | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: `tests/test-runner.html` and `tests/test-runner.js`.
- Invocation: Direct execution in browser, URL query parameter `?test=true`, or headless script `node tests/verify-headless.js`.
- Pass/Fail Semantics: Strict assertion checking; exit code 0 / all green badges on pass.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Biology Teacher creates 10-mark cellular biology test with rubrics and prints A4 master copy | F1, F2, F3, F4, F5, F7, F8, F9, F10, F11, F12 | High |
| 2 | High school student switches to Student Mode, practices fill-in-blanks & 1-mark questions, records weak areas | F1, F3, F4, F6, F7, F9 | Medium |
| 3 | Teacher gives thumbs down to negative phrasing, triggers memory update, verifies next test adapts | F4, F6, F7, F8, F10 | High |
| 4 | First-time user receives 50 Mints, claims 10 Mints daily bonus, attempts overdrawn generation, validates ledger | F2, F4, F11 | Medium |
| 5 | Offline / Unauthenticated teacher edits preferences and drafts test with LocalStorage fallback preservation | F1, F5, F6, F7, F11 | High |

## Coverage Thresholds
- Tier 1: >=5 per feature (60 test cases minimum)
- Tier 2: >=5 per feature (60 test cases minimum)
- Tier 3: Pairwise coverage of major feature interactions (12 test cases minimum)
- Tier 4: >=5 realistic application scenarios (5 test cases minimum)
- Total minimum test cases: >=137 assertions
