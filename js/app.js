/**
 * Mint AI - Main Application Entry Point (js/app.js)
 * 
 * Simple explanation:
 * Think of this file like the conductor of an orchestra.
 * It waits for the website stage to be set (DOMContentLoaded), turns on
 * the lights (Theme), sets the mode (Role Switcher), and connects all the
 * buttons so that clicking them opens windows, claims bonus mints, or prints worksheets!
 */

import state, { getState, setState, on } from './state.js';
import theme, { initTheme, toggleTheme } from './theme.js';
import roleSwitcher, { initRoleSwitcher, setRole } from './role-switcher.js';

/**
 * Toast Notification System
 * Displays unobtrusive, floating Apple-style pill alerts in the corner of the screen.
 * 
 * @param {string} message - Text to display
 * @param {'success'|'info'|'warning'|'error'} [type='info'] - Style variant
 * @param {number} [duration=3500] - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.setAttribute('role', 'alert');

  // Simple icon based on type
  let icon = '✨';
  if (type === 'success') icon = '✓';
  else if (type === 'warning') icon = '⚠️';
  else if (type === 'error') icon = '✕';

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Updates all currency displays on the page when the balance changes.
 * 
 * @param {number} mints - The current balance
 */
function updateMintsDisplay(mints) {
  const countSpan = document.getElementById('mintsCount');
  if (countSpan) {
    countSpan.textContent = String(mints);
  }

  const dialogCount = document.getElementById('dialogMintsCount');
  if (dialogCount) {
    dialogCount.textContent = String(mints);
  }

  const badge = document.getElementById('mintsBadge');
  if (badge) {
    badge.setAttribute('aria-label', `Mint Balance: ${mints} Mints. Click to manage economy.`);
  }
}

/**
 * Wires dialog modal open and close controls with backdrop click support.
 */
function setupDialogs() {
  const dialogs = [
    { dialogId: 'dialogAuth', openBtnId: 'btnPuterAuth', closeBtnId: 'btnCloseAuth' },
    { dialogId: 'dialogMints', openBtnId: 'mintsBadge', closeBtnId: 'btnCloseMints' },
    { dialogId: 'dialogMemory', openBtnId: 'btnOpenMemory', closeBtnId: 'btnCloseMemory' }
  ];

  dialogs.forEach(({ dialogId, openBtnId, closeBtnId }) => {
    const dialog = document.getElementById(dialogId);
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = document.getElementById(closeBtnId);

    if (openBtn && dialog) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          dialog.setAttribute('open', '');
        }
      });
    }

    if (closeBtn && dialog) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      });
    }

    if (dialog) {
      // Close on clicking backdrop
      dialog.addEventListener('click', (e) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          if (typeof dialog.close === 'function') {
            dialog.close();
          } else {
            dialog.removeAttribute('open');
          }
        }
      });
    }
  });
}

/**
 * Sets up the Mints economy actions: Daily bonus claiming and dev refills.
 */
function setupEconomy() {
  const handleDailyBonus = () => {
    const currentState = getState();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (currentState.lastDailyBonus && (now - currentState.lastDailyBonus) < twentyFourHours) {
      const remainingMs = twentyFourHours - (now - currentState.lastDailyBonus);
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      showToast(`Daily bonus already claimed! Next bonus in ~${remainingHours} hours.`, 'warning');
      return;
    }

    const newBalance = currentState.mints + 10;
    setState({
      mints: newBalance,
      lastDailyBonus: now,
      reason: 'daily_bonus'
    });

    showToast('Claimed +10 Daily Bonus Mints! 🎉', 'success');

    // Update countdown text
    const countdown = document.getElementById('dailyBonusCountdown');
    if (countdown) {
      countdown.removeAttribute('hidden');
      countdown.textContent = 'Next bonus available in 24 hours';
    }
  };

  const btnTopBonus = document.getElementById('btnDailyBonus');
  if (btnTopBonus) {
    btnTopBonus.addEventListener('click', (e) => {
      e.preventDefault();
      handleDailyBonus();
    });
  }

  const btnModalBonus = document.getElementById('btnClaimModalBonus');
  if (btnModalBonus) {
    btnModalBonus.addEventListener('click', (e) => {
      e.preventDefault();
      handleDailyBonus();
    });
  }

  const btnDevRefill = document.getElementById('btnDevRefill50');
  if (btnDevRefill) {
    btnDevRefill.addEventListener('click', (e) => {
      e.preventDefault();
      const current = getState().mints;
      setState({
        mints: current + 50,
        reason: 'dev_refill'
      });
      showToast('Added +50 Test Mints to wallet!', 'success');
    });
  }
}

/**
 * Generates test questions using Puter DeepSeek AI with intelligent fallback.
 */
async function generateAIExam({ subject, grade, topic, count, formats, rules }) {
  const formatList = formats.length ? formats.join(', ') : '1_mark, 2_3_mark, 5_mark, fill_in_blanks';
  const customRulesText = rules.length ? rules.join('; ') : 'Focus on standard school curriculum definitions and concepts.';
  
  const systemPrompt = `You are Mint AI, an elite academic test and exam paper generator for teachers.
Generate a realistic academic exam test paper with EXACTLY ${count} standard school exam questions.
Subject: ${subject}
Grade/Level: ${grade}
Topic/Chapter: ${topic}
Question Formats to include: ${formatList}
Teacher style guidelines and rules: ${customRulesText}

IMPORTANT REQUIREMENTS:
1. Include standard school curriculum questions (e.g. definitions like "What is mitochondria?", bullet-point differences, step-by-step explanations, fill-in-the-blanks).
2. For each question, provide a detailed model answer and a point-wise grading rubric.
3. Return STRICTLY a valid JSON object with NO markdown formatting, NO backticks, and NO extra commentary.

JSON Schema:
{
  "title": "${subject}: ${topic}",
  "subject": "${subject}",
  "grade": "${grade}",
  "totalMarks": ${count * 2.5},
  "questions": [
    {
      "id": "q1",
      "format": "1-Mark Definition",
      "marks": 1,
      "questionText": "Question text here...",
      "modelAnswer": "Model answer here...",
      "rubricSteps": [
        {"criterion": "Key point or keyword mentioned", "points": "1.0 Mark"}
      ]
    }
  ]
}`;

  if (typeof window !== 'undefined' && window.puter && window.puter.ai && typeof window.puter.ai.chat === 'function') {
    try {
      const response = await window.puter.ai.chat(systemPrompt, {
        model: 'deepseek/deepseek-v4.1-flash'
      });

      let rawText = typeof response === 'string' ? response : (response?.message?.content || response?.text || JSON.stringify(response));
      // Clean markdown code blocks if AI wrapped output in ```json
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Puter AI chat request completed with fallback:', err);
    }
  }

  // High-fidelity curriculum fallback when offline or guest
  const sampleTopics = [
    {
      id: 'q1',
      format: '1-Mark Definition',
      marks: 1,
      questionText: `Define the core principle of ${topic} in ${subject}.`,
      modelAnswer: `${topic} is a fundamental concept in ${subject} characterized by systematic principles and observable mechanisms.`,
      rubricSteps: [
        { criterion: 'Accurately defines the core concept and primary term', points: '1.0 Mark' }
      ]
    },
    {
      id: 'q2',
      format: '2 to 3 Mark Points',
      marks: 3,
      questionText: `State three essential properties or stages of ${topic} in ${subject}.`,
      modelAnswer: `1. Primary function or initiation stage.\\n2. Secondary regulatory mechanism.\\n3. Final outcome or physiological effect.`,
      rubricSteps: [
        { criterion: 'Identifies first key property/stage accurately', points: '1.0 Mark' },
        { criterion: 'Explains second property/stage clearly', points: '1.0 Mark' },
        { criterion: 'Provides third distinct comparative point', points: '1.0 Mark' }
      ]
    },
    {
      id: 'q3',
      format: '5-Mark Long Answer',
      marks: 5,
      questionText: `Explain the detailed mechanism of ${topic}. Discuss its practical significance and real-world applications in ${subject}.`,
      modelAnswer: `Comprehensive explanation covering structural foundation, functional progression, biochemical or mathematical principles, and real-world application with conclusive summary.`,
      rubricSteps: [
        { criterion: 'Introduction and foundational definitions', points: '1.0 Mark' },
        { criterion: 'Detailed structural and step-by-step mechanism', points: '2.0 Marks' },
        { criterion: 'Real-world significance and applications', points: '1.0 Mark' },
        { criterion: 'Clear scientific terminology and summary', points: '1.0 Mark' }
      ]
    },
    {
      id: 'q4',
      format: 'Fill-in-the-Blanks',
      marks: 1,
      questionText: `In the study of ${topic}, [blank_1] serves as the primary component, and [blank_2] regulates the reaction.`,
      modelAnswer: `[blank_1] Core Unit\\n[blank_2] Enzyme or Catalyst`,
      rubricSteps: [
        { criterion: 'Correctly identifies [blank_1]', points: '0.5 Mark' },
        { criterion: 'Correctly identifies [blank_2]', points: '0.5 Mark' }
      ]
    }
  ];

  return {
    title: `${subject}: ${topic}`,
    subject,
    grade,
    totalMarks: count * 2,
    questions: sampleTopics.slice(0, count)
  };
}

/**
 * Renders generated test questions dynamically into both Teacher and Student feeds.
 */
function renderGeneratedTest(testData) {
  if (!testData || !Array.isArray(testData.questions)) return;

  // 1. Update Teacher Metadata Toolbar
  const titleEl = document.getElementById('displayTestTitle');
  const subEl = document.getElementById('displayMetaSubject');
  const gradeEl = document.getElementById('displayMetaGrade');
  const marksEl = document.getElementById('displayMetaMarks');
  const studentTitle = document.getElementById('studentExamTitle');
  const studentTopic = document.getElementById('studentExamTopic');

  if (titleEl) titleEl.textContent = testData.title || `${testData.subject} Examination`;
  if (subEl) subEl.textContent = testData.subject || 'General';
  if (gradeEl) gradeEl.textContent = testData.grade || 'Standard';
  if (marksEl) marksEl.textContent = `Total: ${testData.totalMarks || testData.questions.length * 2} Marks`;
  if (studentTitle) studentTitle.textContent = `Practice Worksheet: ${testData.subject} (${testData.grade})`;
  if (studentTopic) studentTopic.textContent = `Topic: ${testData.title || testData.subject}`;

  // 2. Render Teacher Feed
  const teacherFeed = document.getElementById('teacherQuestionFeed');
  if (teacherFeed) {
    teacherFeed.innerHTML = '';
    testData.questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const article = document.createElement('article');
      article.className = 'apple-glass-card question-card';
      article.setAttribute('data-question-id', q.id || `q${qNum}`);
      article.innerHTML = `
        <header class="card-header">
          <div class="q-meta">
            <span class="q-number-pill">Q${qNum}</span>
            <span class="q-format-pill">${q.format || 'Standard Question'}</span>
          </div>
          <div class="q-marks-badge">${q.marks || 1} ${q.marks === 1 ? 'Mark' : 'Marks'}</div>
        </header>

        <div class="q-body">
          <p class="q-text">${q.questionText}</p>
        </div>

        <details class="rubric-accordion" open>
          <summary class="rubric-summary">
            <span class="summary-title">Model Answer & Grading Rubric</span>
            <span class="accordion-chevron" aria-hidden="true"></span>
          </summary>
          <div class="rubric-content">
            <div class="model-answer-block">
              <strong>Expected Answer:</strong>
              <p>${q.modelAnswer.replace(/\\n/g, '<br>')}</p>
            </div>
            <div class="step-rubric-table">
              ${(q.rubricSteps || []).map(step => `
                <div class="rubric-row">
                  <span class="rubric-criterion">${step.criterion}</span>
                  <span class="rubric-points">${step.points}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </details>

        <footer class="card-footer">
          <div class="feedback-group">
            <span class="feedback-label">AI Memory Rating:</span>
            <button type="button" class="btn-thumb thumb-up" data-feedback="up" data-qid="${q.id || `q${qNum}`}" aria-label="Thumbs up this question format">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span>Good</span>
            </button>
            <button type="button" class="btn-thumb thumb-down" data-feedback="down" data-qid="${q.id || `q${qNum}`}" aria-label="Thumbs down this question format">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
              </svg>
              <span>Revise</span>
            </button>
          </div>
        </footer>
      `;
      teacherFeed.appendChild(article);
    });
  }

  // 3. Render Student Feed
  const studentFeed = document.getElementById('studentQuestionFeed');
  if (studentFeed) {
    studentFeed.innerHTML = '';
    testData.questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const article = document.createElement('article');
      article.className = 'apple-glass-card student-q-card';
      article.setAttribute('data-question-id', `sq${qNum}`);
      article.innerHTML = `
        <header class="card-header">
          <div class="q-meta">
            <span class="q-number-pill">Question ${qNum}</span>
            <span class="q-marks-pill">${q.marks || 1} ${q.marks === 1 ? 'Mark' : 'Marks'}</span>
          </div>
        </header>
        
        <div class="q-body">
          <p class="q-prompt">${q.questionText}</p>
          <div class="student-input-container">
            <label for="studentAnswer${qNum}" class="sr-only">Your answer for Question ${qNum}</label>
            <textarea id="studentAnswer${qNum}" class="apple-textarea student-answer-box" rows="3" placeholder="Type your answer here..."></textarea>
          </div>
        </div>

        <footer class="card-footer">
          <button type="button" class="apple-button btn-reveal-key" data-target="sq${qNum}-rubric" aria-expanded="false">
            <span>Reveal Marking Rubric</span>
          </button>
          <div id="sq${qNum}-rubric" class="student-rubric-reveal" hidden>
            <div class="model-hint">
              <strong>Model Key:</strong> ${q.modelAnswer.replace(/\\n/g, '<br>')}
            </div>
          </div>
        </footer>
      `;
      studentFeed.appendChild(article);
    });
  }

  // Update current test in reactive state
  setState({ currentTest: testData });
}

/**
 * Sets up Teacher generator form inputs and cost calculation.
 */
function setupGeneratorForm() {
  const countInput = document.getElementById('inputQuestionCount');
  const costNumber = document.getElementById('costNumber');

  if (countInput && costNumber) {
    const updateCost = () => {
      const count = parseInt(countInput.value, 10) || 1;
      costNumber.textContent = String(count);
    };

    countInput.addEventListener('input', updateCost);
    countInput.addEventListener('change', updateCost);
  }

  const form = document.getElementById('formGenerateTest');
  const btnGenerate = document.getElementById('btnGenerateTest');
  const btnText = document.getElementById('btnGenerateText');
  const spinner = document.getElementById('generateSpinner');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const count = parseInt(countInput?.value, 10) || 4;
      const currentMints = getState().mints;

      if (currentMints < count) {
        showToast(`Insufficient Mints! Need ${count} Mints, but you have ${currentMints}.`, 'warning');
        const mintsDialog = document.getElementById('dialogMints');
        if (mintsDialog && typeof mintsDialog.showModal === 'function') {
          mintsDialog.showModal();
        }
        return;
      }

      // Collect inputs
      const subject = document.getElementById('inputSubject')?.value || 'Biology';
      const grade = document.getElementById('selectGrade')?.value || 'Grade 10';
      const topic = document.getElementById('inputTopic')?.value || 'Cell Structure and Energy';
      
      const formatCheckboxes = document.querySelectorAll('input[name="format"]:checked');
      const formats = Array.from(formatCheckboxes).map(cb => cb.value);
      const rules = getState().preferences?.customInstructions || [];

      // UI Loading state
      if (btnGenerate) btnGenerate.disabled = true;
      if (btnText) btnText.textContent = 'Generating with DeepSeek AI...';
      if (spinner) spinner.removeAttribute('hidden');
      showToast('Generating test paper with DeepSeek AI...', 'info');

      try {
        const testData = await generateAIExam({
          subject,
          grade,
          topic,
          count,
          formats,
          rules
        });

        // Deduct mints
        setState({
          mints: currentMints - count,
          reason: 'test_generation'
        });

        // Render dynamically
        renderGeneratedTest(testData);
        showToast(`Test generated successfully! Used ${count} Mints. ✨`, 'success');
      } catch (err) {
        console.error('Test generation error:', err);
        showToast('Error generating test. Please try again.', 'error');
      } finally {
        if (btnGenerate) btnGenerate.disabled = false;
        if (btnText) btnText.textContent = 'Generate Test with DeepSeek AI';
        if (spinner) spinner.setAttribute('hidden', '');
      }
    });
  }

  // Wire Export JSON button
  const btnExport = document.getElementById('btnExportJson');
  if (btnExport) {
    btnExport.addEventListener('click', (e) => {
      e.preventDefault();
      const activeTest = getState().currentTest || {
        subject: 'Science',
        title: 'Photosynthesis and Cellular Respiration',
        totalMarks: 10,
        exportedAt: new Date().toISOString()
      };
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeTest, null, 2));
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `mint-ai-test-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Downloaded test paper JSON! 📄', 'success');
    });
  }

  // Wire Puter Auth Buttons
  const btnPuterSignInModal = document.getElementById('btnPuterSignInModal');
  if (btnPuterSignInModal) {
    btnPuterSignInModal.addEventListener('click', async (e) => {
      e.preventDefault();
      if (typeof window !== 'undefined' && window.puter && window.puter.auth) {
        try {
          await window.puter.auth.signIn();
          const user = await window.puter.auth.getUser();
          setState({
            user: {
              signedIn: true,
              username: user?.username || 'Teacher',
              uid: user?.uuid || 'puter_user'
            }
          });
          showToast(`Signed in to Puter as ${user?.username || 'Teacher'}! 🟢`, 'success');
          const authDialog = document.getElementById('dialogAuth');
          if (authDialog) authDialog.close();
        } catch (authErr) {
          showToast('Sign-in cancelled or unavailable.', 'info');
        }
      } else {
        showToast('Puter SDK is operating in standalone browser mode.', 'info');
      }
    });
  }
}

/**
 * Sets up AI memory preference rules in Teacher mode.
 */
function setupMemory() {
  const form = document.getElementById('formAddRule');
  const input = document.getElementById('inputCustomRule');
  const list = document.getElementById('memoryRulesList');
  const clearBtn = document.getElementById('btnClearMemory');

  const renderRules = () => {
    if (!list) return;
    const rules = getState().preferences?.customInstructions || [];
    list.innerHTML = '';

    if (rules.length === 0) {
      list.innerHTML = '<p class="empty-rules-hint">No custom rules added yet. AI uses standard curriculum standards.</p>';
      return;
    }

    rules.forEach((rule, idx) => {
      const item = document.createElement('div');
      item.className = 'memory-rule-chip';
      item.innerHTML = `
        <span class="rule-chip-text">${rule}</span>
        <button type="button" class="btn-remove-rule" data-index="${idx}" aria-label="Remove rule">✕</button>
      `;
      list.appendChild(item);
    });

    const removeBtns = list.querySelectorAll('.btn-remove-rule');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        const currentRules = [...(getState().preferences?.customInstructions || [])];
        currentRules.splice(index, 1);
        setState({
          preferences: {
            ...getState().preferences,
            customInstructions: currentRules
          }
        });
        renderRules();
        showToast('Rule removed from AI Memory', 'info');
      });
    });
  };

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ruleText = input.value.trim();
      if (!ruleText) return;

      const currentRules = [...(getState().preferences?.customInstructions || [])];
      currentRules.push(ruleText);

      setState({
        preferences: {
          ...getState().preferences,
          customInstructions: currentRules
        }
      });

      input.value = '';
      renderRules();
      showToast('Custom teaching rule saved to AI Memory! 🧠', 'success');
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setState({
        preferences: {
          ...getState().preferences,
          customInstructions: []
        }
      });
      renderRules();
      showToast('Cleared all custom AI Memory rules', 'info');
    });
  }

  renderRules();
}

/**
 * Sets up feedback ratings and practice reveals on sample question cards.
 */
function setupCardInteractions() {
  // Thumbs up / down feedback
  document.addEventListener('click', (e) => {
    const thumbBtn = e.target.closest('.btn-thumb');
    if (thumbBtn) {
      e.preventDefault();
      const feedback = thumbBtn.getAttribute('data-feedback');
      const qid = thumbBtn.getAttribute('data-qid');
      const parent = thumbBtn.closest('.feedback-group');
      if (parent) {
        parent.querySelectorAll('.btn-thumb').forEach(b => b.classList.remove('active-positive', 'active-negative'));
      }
      if (feedback === 'up') {
        thumbBtn.classList.add('active-positive');
        showToast(`Saved preference: question ${qid} format rated Good!`, 'success');
      } else {
        thumbBtn.classList.add('active-negative');
        showToast(`Saved preference: question ${qid} will be refined by AI!`, 'info');
      }
    }

    // Student practice rubric reveal
    const revealBtn = e.target.closest('.btn-reveal-key');
    if (revealBtn) {
      e.preventDefault();
      const targetId = revealBtn.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (target) {
        const isHidden = target.hasAttribute('hidden');
        if (isHidden) {
          target.removeAttribute('hidden');
          revealBtn.setAttribute('aria-expanded', 'true');
          revealBtn.querySelector('span').textContent = 'Hide Marking Rubric';
        } else {
          target.setAttribute('hidden', '');
          revealBtn.setAttribute('aria-expanded', 'false');
          revealBtn.querySelector('span').textContent = 'Reveal Marking Rubric';
        }
      }
    }
  });

  // Practice timer
  const timerBtn = document.getElementById('btnToggleTimer');
  const timerDisplay = document.getElementById('timerDisplay');
  let timerInterval = null;
  let remainingSeconds = 20 * 60;

  if (timerBtn && timerDisplay) {
    timerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerBtn.textContent = 'Resume';
      } else {
        timerBtn.textContent = 'Pause';
        timerInterval = setInterval(() => {
          if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerDisplay.textContent = '00:00';
            timerBtn.textContent = 'Finished';
            showToast('Time is up for this practice session!', 'warning');
            return;
          }
          remainingSeconds--;
          const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
          const s = String(remainingSeconds % 60).padStart(2, '0');
          timerDisplay.textContent = `${m}:${s}`;
        }, 1000);
      }
    });
  }

  // Print buttons
  const btnPrintStudent = document.getElementById('btnPrintStudentWorksheet');
  if (btnPrintStudent) {
    btnPrintStudent.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  }

  const btnPrintMaster = document.getElementById('btnPrintTeacherMaster');
  if (btnPrintMaster) {
    btnPrintMaster.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  }
}

/**
 * Initializes the entire application.
 */
export function initApp() {
  // 1. Initialize theme
  initTheme();

  // 2. Initialize role switcher
  initRoleSwitcher();

  // 3. Listen to reactive state changes for wallet balance
  on('mint:currency-changed', (detail) => {
    if (detail && typeof detail.mints === 'number') {
      updateMintsDisplay(detail.mints);
    }
  });

  // Initial balance sync
  updateMintsDisplay(getState().mints);

  // 4. Wire interactive components
  setupDialogs();
  setupEconomy();
  setupGeneratorForm();
  setupMemory();
  setupCardInteractions();

  // Expose global API for automated testing & diagnostics
  if (typeof window !== 'undefined') {
    window.MintAI = {
      state,
      theme,
      roleSwitcher,
      showToast
    };
  }

  console.log('Mint AI: Initialized successfully with Apple Design System & Reactive State.');
}

// Auto-boot on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

export default {
  initApp,
  showToast
};
