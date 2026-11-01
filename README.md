# Mint AI — Apple-Style AI Test & Exam Generator

Mint AI is a modern web application crafted for tuition teachers and school students to generate, customize, and practice standard curriculum exam papers. Built with an Apple design language, it runs directly in the browser with zero backend configuration.

![Theme](https://img.shields.io/badge/Theme-Apple%20Mint%20Green-00A368)
![Engine](https://img.shields.io/badge/AI-DeepSeek%20V4.1-10B981)
![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20Puter.js-3B82F6)

## Features

- **Apple Design Language:** Clean squircle cards, frosted-glass acrylic blurs (`backdrop-filter`), SF Pro typography, smooth spring micro-interactions, and instant dark/light mode toggle.
- **Role Switcher:**
  - **Teacher Mode:** Test creator studio for generating standard school exam papers (1-mark definitions, 2-3 mark bullet points, 5-mark long answers, fill-in-the-blanks) with complete teacher answer keys and grading rubrics.
  - **Student Mode:** Interactive practice workspace with timer, answer inputs, and expandable marking rubrics.
- **Smart AI Memory:** Remembers teacher question preferences (thumbs up/down ratings and custom teaching rules) and persists them using Puter KV and LocalStorage.
- **Mints Economy:** Built-in coin balance system (1 Mint per question). Users receive 50 free welcome Mints with a daily claimable bonus.
- **Clean A4 Worksheet Print:** Dedicated print layout formatting tests into clean paper worksheets without buttons or navigation bars.

## Getting Started

Simply open `index.html` in any modern web browser or serve statically using Cloudflare Pages.

### Automated Testing

Run the automated test suite in Node.js:

```bash
node tests/verify-headless.js
```

Or open `tests/test-runner.html` in any browser to see the interactive test dashboard.

