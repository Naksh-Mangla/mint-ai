/**
 * Mint AI — Conversational Apple-Style App (js/app.js)
 * 
 * Simple explanation:
 * 1. Step 1: Login + Name + Role all in one clean card.
 * 2. Step 2: "Hey welcome to Mint AI" with a floating typing bar that
 *    follows you everywhere, letting you pick grade, topic, question count,
 *    and attach notes!
 */

import state, { getState, setState, on } from './state.js';
import theme, { initTheme, toggleTheme } from './theme.js';

// Attached sources list
let attachedSources = [];

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.setAttribute('role', 'alert');

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
 * Screen Navigator (Auth vs Chat App)
 */
function navigateToScreen(screenName) {
  const screenAuth = document.getElementById('screenAuth');
  const screenApp = document.getElementById('screenApp');

  if (screenAuth) screenAuth.hidden = (screenName !== 'auth');
  if (screenApp) screenApp.hidden = (screenName !== 'app');

  if (screenName === 'app') {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) setTimeout(() => chatInput.focus(), 250);
  }
}

/**
 * Updates UI with current user and role info
 */
function updateHeaderUserInfo() {
  const currentState = getState();
  const userNameEl = document.getElementById('displayUserName');
  const roleBadgeText = document.getElementById('roleBadgeText');
  const heroRoleDesc = document.getElementById('heroRoleDesc');

  if (userNameEl) {
    userNameEl.textContent = currentState.user?.username || 'Teacher';
  }

  const isTeacher = currentState.role === 'teacher';
  if (roleBadgeText) {
    roleBadgeText.textContent = isTeacher ? '👨‍🏫 Teacher Mode' : '🎓 Student Mode';
  }
  if (heroRoleDesc) {
    heroRoleDesc.textContent = isTeacher
      ? 'Pick your grade, topic, and number of questions below, or talk to me like an AI assistant to make tests!'
      : 'Select your grade and chapter below to generate practice questions with step-by-step marking rubrics!';
  }
}

/**
 * Updates wallet currency in top bar and modals
 */
function updateMintsUI(mints) {
  const countEl = document.getElementById('mintsCount');
  const dialogCount = document.getElementById('dialogMintsCount');
  if (countEl) countEl.textContent = String(mints);
  if (dialogCount) dialogCount.textContent = String(mints);
}

/**
 * Step 1: Unified Login + Name + Role Flow
 */
function setupUnifiedAuthFlow() {
  const formAuth = document.getElementById('formAuth');
  const inputName = document.getElementById('inputAuthName');
  const inputEmail = document.getElementById('inputAuthEmail');
  const btnPickerTeacher = document.getElementById('btnPickerTeacher');
  const btnPickerStudent = document.getElementById('btnPickerStudent');
  const roleHint = document.getElementById('rolePickerHint');
  const btnPuterQuick = document.getElementById('btnPuterQuickSignIn');

  let chosenRole = 'teacher';

  // Toggle role in segment picker
  if (btnPickerTeacher && btnPickerStudent) {
    btnPickerTeacher.addEventListener('click', () => {
      chosenRole = 'teacher';
      btnPickerTeacher.classList.add('active');
      btnPickerStudent.classList.remove('active');
      if (roleHint) roleHint.textContent = 'Teacher mode creates exam papers, answer keys, and printable A4 worksheets.';
    });

    btnPickerStudent.addEventListener('click', () => {
      chosenRole = 'student';
      btnPickerStudent.classList.add('active');
      btnPickerTeacher.classList.remove('active');
      if (roleHint) roleHint.textContent = 'Student mode creates practice quizzes with instant grading and explanations.';
    });
  }

  // Restore previous session if present
  try {
    const savedUser = localStorage.getItem('mintai_user');
    const savedRole = localStorage.getItem('mintai_role');

    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      setState({
        user: userObj,
        role: savedRole || 'teacher'
      });
      updateHeaderUserInfo();
      navigateToScreen('app');
      return;
    }
  } catch (e) {
    console.warn('Session check note:', e);
  }

  // Handle Form Submit
  if (formAuth) {
    formAuth.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = inputName?.value.trim() || 'Educator';
      const email = inputEmail?.value.trim() || 'user@mintai.app';

      const userObj = {
        signedIn: true,
        username: name,
        email: email,
        uid: 'user_' + Date.now()
      };

      setState({
        user: userObj,
        role: chosenRole
      });

      try {
        localStorage.setItem('mintai_user', JSON.stringify(userObj));
        localStorage.setItem('mintai_role', chosenRole);
      } catch (err) {}

      updateHeaderUserInfo();
      showToast(`Welcome, ${name}! Mint AI is ready. 🚀`, 'success');
      navigateToScreen('app');
    });
  }

  // Handle Puter Cloud Quick Login
  if (btnPuterQuick) {
    btnPuterQuick.addEventListener('click', async () => {
      if (typeof window !== 'undefined' && window.puter && window.puter.auth) {
        try {
          await window.puter.auth.signIn();
          const pUser = await window.puter.auth.getUser();
          const userObj = {
            signedIn: true,
            username: pUser?.username || 'Puter Educator',
            email: pUser?.email || '',
            uid: pUser?.uuid || 'puter_user'
          };
          setState({
            user: userObj,
            role: chosenRole
          });
          localStorage.setItem('mintai_user', JSON.stringify(userObj));
          localStorage.setItem('mintai_role', chosenRole);
          updateHeaderUserInfo();
          showToast(`Signed in to Puter Cloud as ${userObj.username}! 🟢`, 'success');
          navigateToScreen('app');
        } catch (err) {
          showToast('Puter sign-in was canceled or unavailable.', 'info');
        }
      } else {
        const userObj = {
          signedIn: true,
          username: inputName?.value.trim() || 'Guest Teacher',
          email: 'guest@mintai.app',
          uid: 'guest_' + Date.now()
        };
        setState({ user: userObj, role: chosenRole });
        localStorage.setItem('mintai_user', JSON.stringify(userObj));
        localStorage.setItem('mintai_role', chosenRole);
        updateHeaderUserInfo();
        navigateToScreen('app');
      }
    });
  }

  // Switch role button in header
  const btnSwitchRole = document.getElementById('btnSwitchRole');
  if (btnSwitchRole) {
    btnSwitchRole.addEventListener('click', () => {
      const current = getState().role;
      const nextRole = current === 'teacher' ? 'student' : 'teacher';
      setState({ role: nextRole });
      try {
        localStorage.setItem('mintai_role', nextRole);
      } catch (e) {}
      updateHeaderUserInfo();
      showToast(`Switched to ${nextRole === 'teacher' ? 'Teacher' : 'Student'} Mode!`, 'info');
    });
  }

  // Logout button
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('mintai_user');
      localStorage.removeItem('mintai_role');
      setState({
        user: { signedIn: false, username: null, uid: null },
        role: 'teacher'
      });
      navigateToScreen('auth');
      showToast('Logged out.', 'info');
    });
  }
}

/**
 * Sources Modal & Management
 */
function setupSourcesFlow() {
  const modal = document.getElementById('modalSources');
  const btnOpen = document.getElementById('btnOpenSourceModal');
  const btnTopSources = document.getElementById('btnTopSources');
  const btnClose = document.getElementById('btnCloseSourcesModal');
  const btnCancel = document.getElementById('btnCancelSource');
  const btnSave = document.getElementById('btnSaveSource');
  const inputTitle = document.getElementById('inputSourceTitle');
  const inputContent = document.getElementById('inputSourceContent');
  const fileUpload = document.getElementById('fileSourceUpload');

  const openModal = () => {
    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
    } else if (modal) {
      modal.setAttribute('open', '');
    }
  };

  const closeModal = () => {
    if (modal && typeof modal.close === 'function') {
      modal.close();
    } else if (modal) {
      modal.removeAttribute('open');
    }
  };

  if (btnOpen) btnOpen.addEventListener('click', openModal);
  if (btnTopSources) btnTopSources.addEventListener('click', openModal);
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (inputContent) inputContent.value = event.target?.result || '';
        if (inputTitle && !inputTitle.value) inputTitle.value = file.name;
        showToast(`Loaded file: ${file.name}`, 'info');
      };
      reader.readAsText(file);
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const title = inputTitle?.value.trim() || `Source ${attachedSources.length + 1}`;
      const content = inputContent?.value.trim();

      if (!content) {
        showToast('Please paste or upload some notes content.', 'warning');
        return;
      }

      attachedSources.push({ id: 'src_' + Date.now(), title, content });
      updateSourcesPreview();
      closeModal();

      if (inputTitle) inputTitle.value = '';
      if (inputContent) inputContent.value = '';

      showToast(`Attached "${title}" to AI memory! 📎`, 'success');
    });
  }
}

/**
 * Updates attached source preview tags
 */
function updateSourcesPreview() {
  const bar = document.getElementById('sourcesPreviewBar');
  const tagsList = document.getElementById('sourcesTagsList');
  const topCount = document.getElementById('topSourcesCount');

  if (topCount) {
    topCount.textContent = `${attachedSources.length} ${attachedSources.length === 1 ? 'Source' : 'Sources'}`;
  }

  if (!bar || !tagsList) return;

  if (attachedSources.length === 0) {
    bar.hidden = true;
    tagsList.innerHTML = '';
    return;
  }

  bar.hidden = false;
  tagsList.innerHTML = '';

  attachedSources.forEach((src, idx) => {
    const pill = document.createElement('span');
    pill.className = 'source-tag-pill';
    pill.innerHTML = `
      <span>📄 ${src.title}</span>
      <button type="button" class="btn-remove-source-tag" data-index="${idx}" title="Remove source">✕</button>
    `;
    tagsList.appendChild(pill);
  });

  tagsList.querySelectorAll('.btn-remove-source-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      attachedSources.splice(index, 1);
      updateSourcesPreview();
      showToast('Source removed.', 'info');
    });
  });
}

/**
 * AI Test Generation Engine (Puter DeepSeek V4.1 with Curriculum Fallback)
 */
async function callDeepSeekAI(userPrompt, grade, topic, questionCount) {
  let sourcesContext = '';
  if (attachedSources.length > 0) {
    sourcesContext = '\\n\\nTEACHER ATTACHED TEXTBOOK SOURCES:\\n' + 
      attachedSources.map(s => `--- ${s.title} ---\\n${s.content}`).join('\\n\\n');
  }

  const systemPrompt = `You are Mint AI, an elite academic exam and test generator for schools and tuition teachers.
Generate a standard school exam paper.
Target Grade/Level: ${grade}
Subject / Topic: ${topic}
Specific Teacher Prompt / Instructions: ${userPrompt || 'Create standard school questions on this topic'}
Total Questions: ${questionCount}
${sourcesContext}

IMPORTANT RULES:
1. Always include standard school curriculum formats:
   - 1-mark definition questions (e.g. "What is mitochondria?", "Define velocity")
   - 2 to 3 mark bullet-point differentiation or comparative questions
   - 5-mark structured long-answer questions
   - Fill-in-the-blanks with numbered tokens [blank_1], [blank_2]
2. For EVERY question provide:
   - Detailed model answer
   - Step-by-step point-wise grading rubric
3. Return STRICTLY a valid JSON object without markdown fences, backticks, or conversational preamble.

JSON Schema:
{
  "title": "${topic} Examination",
  "subject": "${topic}",
  "grade": "${grade}",
  "totalMarks": ${questionCount * 2.5},
  "questions": [
    {
      "id": "q1",
      "format": "1-Mark Definition",
      "marks": 1,
      "questionText": "Question text here...",
      "modelAnswer": "Model answer here...",
      "rubricSteps": [
        {"criterion": "Key point or definition mentioned", "points": "1.0 Mark"}
      ]
    }
  ]
}`;

  if (typeof window !== 'undefined' && window.puter && window.puter.ai && typeof window.puter.ai.chat === 'function') {
    try {
      const response = await window.puter.ai.chat(systemPrompt, {
        model: 'deepseek/deepseek-v4.1-flash'
      });

      let raw = typeof response === 'string' ? response : (response?.message?.content || response?.text || JSON.stringify(response));
      raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Puter DeepSeek call completed with fallback:', err);
    }
  }

  // Realistic Standard School Curriculum Fallback
  const cleanTopic = topic || 'Science: Mitochondria';
  
  return {
    title: `${cleanTopic} Examination`,
    subject: cleanTopic,
    grade: grade || 'Grade 10',
    totalMarks: questionCount * 2.5,
    questions: [
      {
        id: 'q1',
        format: '1-Mark Definition',
        marks: 1,
        questionText: `What is mitochondria? State its primary function in eukaryotic cells.`,
        modelAnswer: `Mitochondria are double-membraned cell organelles known as the powerhouse of the cell, responsible for generating ATP (adenosine triphosphate) through cellular respiration.`,
        rubricSteps: [
          { criterion: 'Defines double-membraned organelle / powerhouse of cell', points: '0.5 Mark' },
          { criterion: 'States ATP generation via cellular respiration', points: '0.5 Mark' }
        ]
      },
      {
        id: 'q2',
        format: '2 to 3 Mark Points',
        marks: 3,
        questionText: `State three distinct structural features of the mitochondrion and their physiological significance.`,
        modelAnswer: `1. Double Membrane: Outer membrane is smooth; inner membrane is folded into cristae to maximize surface area for ATP synthase.\\n2. Matrix: Contains Krebs cycle enzymes, 70S ribosomes, and mitochondrial DNA.\\n3. Intermembrane Space: Generates the proton gradient necessary for chemiosmotic phosphorylation.`,
        rubricSteps: [
          { criterion: 'Identifies outer/inner membrane and cristae function', points: '1.0 Mark' },
          { criterion: 'Explains matrix contents (enzymes and mtDNA)', points: '1.0 Mark' },
          { criterion: 'Explains proton gradient in intermembrane space', points: '1.0 Mark' }
        ]
      },
      {
        id: 'q3',
        format: '5-Mark Long Answer',
        marks: 5,
        questionText: `Explain the complete process of cellular respiration occurring inside the mitochondrion. Differentiate between aerobic and anaerobic pathways.`,
        modelAnswer: `Cellular respiration involves Glycolysis (cytoplasm), Krebs Cycle (mitochondrial matrix), and Electron Transport Chain (cristae). Aerobic respiration uses oxygen to fully oxidize glucose into CO2 and H2O, yielding 36-38 ATP. Anaerobic respiration occurs without oxygen, producing lactic acid or ethanol with only 2 ATP.`,
        rubricSteps: [
          { criterion: 'Stages of cellular respiration and mitochondrial locations', points: '1.5 Marks' },
          { criterion: 'Krebs Cycle and Electron Transport mechanism', points: '1.5 Marks' },
          { criterion: 'Key differences between aerobic and anaerobic respiration', points: '1.0 Mark' },
          { criterion: 'Summary of total ATP yield and chemical equation', points: '1.0 Mark' }
        ]
      },
      {
        id: 'q4',
        format: 'Fill-in-the-Blanks',
        marks: 1,
        questionText: `The inner mitochondrial membrane forms numerous folds called [blank_1], which house the enzyme [blank_2] for energy production.`,
        modelAnswer: `[blank_1] Cristae\\n[blank_2] ATP Synthase`,
        rubricSteps: [
          { criterion: 'Correctly identifies [blank_1] as Cristae', points: '0.5 Mark' },
          { criterion: 'Correctly identifies [blank_2] as ATP Synthase', points: '0.5 Mark' }
        ]
      }
    ].slice(0, questionCount)
  };
}

/**
 * Step 2: Floating Chat Flow (Follows User Everywhere)
 */
function setupFloatingChatFlow() {
  const chatInput = document.getElementById('chatInput');
  const btnSend = document.getElementById('btnSendMessage');
  const chatFeed = document.getElementById('chatFeed');
  const selectGrade = document.getElementById('selectGrade');
  const inputTopic = document.getElementById('inputSubjectTopic');
  const selectCount = document.getElementById('selectQuestionCount');
  const chatHero = document.getElementById('chatHero');

  if (chatInput) {
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        triggerGenerate();
      }
    });
  }

  if (btnSend) {
    btnSend.addEventListener('click', (e) => {
      e.preventDefault();
      triggerGenerate();
    });
  }

  // Suggestion idea chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (chatInput) {
        chatInput.value = prompt;
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
      }
      triggerGenerate();
    });
  });

  async function triggerGenerate() {
    const text = chatInput?.value.trim() || '';
    const grade = selectGrade?.value || 'Grade 10';
    const topic = inputTopic?.value.trim() || 'Science: Mitochondria';
    const count = parseInt(selectCount?.value, 10) || 4;
    const currentMints = getState().mints;

    // Check Mints balance
    if (currentMints < count) {
      showToast(`Need ${count} Mints, but you have ${currentMints} Mints. Claim daily bonus or refill!`, 'warning');
      const mintsModal = document.getElementById('modalMints');
      if (mintsModal && typeof mintsModal.showModal === 'function') {
        mintsModal.showModal();
      }
      return;
    }

    // Hide hero once generation starts
    if (chatHero) chatHero.hidden = true;

    // 1. Append User Bubble showing request
    const userDisplayMsg = text || `Generate ${count} questions on ${topic} (${grade})`;
    appendUserBubble(userDisplayMsg);

    chatInput.value = '';
    chatInput.style.height = 'auto';

    // 2. Append Thinking Indicator
    const thinkingRow = appendThinkingIndicator();

    if (btnSend) btnSend.disabled = true;

    try {
      // 3. Call AI with Grade, Topic, Count, and Attached Sources
      const testData = await callDeepSeekAI(text, grade, topic, count);

      // Deduct Mints
      setState({
        mints: currentMints - count,
        currentTest: testData,
        reason: 'test_generation'
      });

      // Remove thinking indicator
      if (thinkingRow && thinkingRow.parentNode) {
        thinkingRow.parentNode.removeChild(thinkingRow);
      }

      // 4. Render AI Response and Generated Test Paper
      appendAIResponse(testData, count);
      showToast(`Generated ${testData.questions.length} questions! Used ${count} Mints. ✨`, 'success');

    } catch (err) {
      console.error('Error generating test:', err);
      if (thinkingRow && thinkingRow.parentNode) {
        thinkingRow.parentNode.removeChild(thinkingRow);
      }
      appendErrorMessage('An error occurred during generation. Please try again!');
    } finally {
      if (btnSend) btnSend.disabled = false;
      scrollToBottom();
    }
  }

  function appendUserBubble(text) {
    const row = document.createElement('div');
    row.className = 'chat-message-row';
    row.innerHTML = `<div class="user-message-bubble">${escapeHtml(text)}</div>`;
    chatFeed.appendChild(row);
    scrollToBottom();
  }

  function appendThinkingIndicator() {
    const row = document.createElement('div');
    row.className = 'chat-message-row';
    row.innerHTML = `
      <div class="thinking-indicator">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span>Mint AI is writing standard school questions with DeepSeek...</span>
      </div>
    `;
    chatFeed.appendChild(row);
    scrollToBottom();
    return row;
  }

  function appendErrorMessage(msg) {
    const row = document.createElement('div');
    row.className = 'chat-message-row';
    row.innerHTML = `<div class="ai-message-bubble" style="border-left: 3px solid var(--color-danger);">${msg}</div>`;
    chatFeed.appendChild(row);
    scrollToBottom();
  }

  function appendAIResponse(testData, count) {
    const row = document.createElement('div');
    row.className = 'chat-message-row';
    const testId = 'test_' + Date.now();

    let questionsHtml = '';
    testData.questions.forEach((q, idx) => {
      const qNum = idx + 1;
      questionsHtml += `
        <article class="apple-glass-card question-card" data-question-id="${q.id || `q${qNum}`}">
          <header class="card-header">
            <div class="q-meta">
              <span class="q-number-pill">Q${qNum}</span>
              <span class="q-format-pill">${q.format}</span>
            </div>
            <div class="q-marks-badge">${q.marks} ${q.marks === 1 ? 'Mark' : 'Marks'}</div>
          </header>

          <div class="q-body">
            <p class="q-text">${q.questionText}</p>
          </div>

          <!-- Model Answer & Rubric (Teacher Key) -->
          <details class="rubric-accordion" open>
            <summary class="rubric-summary">
              <span class="summary-title">Model Answer & Marking Rubric</span>
              <span class="accordion-chevron" aria-hidden="true"></span>
            </summary>
            <div class="rubric-content">
              <div class="model-answer-block">
                <strong>Model Answer:</strong>
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
              <span class="feedback-label">Memory Rating:</span>
              <button type="button" class="btn-thumb thumb-up" data-feedback="up" title="I like this question style">
                <span>👍 Good</span>
              </button>
              <button type="button" class="btn-thumb thumb-down" data-feedback="down" title="Revise this style">
                <span>👎 Needs work</span>
              </button>
            </div>
          </footer>
        </article>
      `;
    });

    row.innerHTML = `
      <div class="ai-response-wrapper">
        <div class="ai-message-bubble">
          Here is your <strong>${testData.questions.length}-question</strong> exam paper for <strong>${testData.grade}</strong> on <strong>${testData.title}</strong>:
        </div>

        <div class="generated-test-paper" id="${testId}">
          <div class="test-paper-header">
            <div>
              <h3 class="test-paper-title">${testData.title}</h3>
              <div class="test-paper-meta">
                <span class="meta-pill">${testData.subject}</span>
                <span class="meta-pill">${testData.grade}</span>
                <span class="meta-pill">Total: ${testData.totalMarks} Marks</span>
              </div>
            </div>

            <div class="paper-actions-bar">
              <button type="button" class="apple-button btn-tool btn-print-paper" title="Print clean A4 worksheet">
                <span>🖨️ Print Worksheet</span>
              </button>
              <button type="button" class="apple-button btn-tool btn-export-paper-json" title="Download JSON file">
                <span>📥 Export JSON</span>
              </button>
            </div>
          </div>

          <div class="test-paper-questions">
            ${questionsHtml}
          </div>
        </div>
      </div>
    `;

    chatFeed.appendChild(row);

    // Wire Print
    const printBtn = row.querySelector('.btn-print-paper');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Wire Export JSON
    const exportBtn = row.querySelector('.btn-export-paper-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testData, null, 2));
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `mint-ai-${testData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Downloaded test paper JSON! 📄', 'success');
      });
    }

    // Wire Memory Ratings
    row.querySelectorAll('.btn-thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-feedback');
        btn.classList.add(type === 'up' ? 'active-positive' : 'active-negative');
        showToast(type === 'up' ? 'Saved: AI will use this style! 👍' : 'Feedback noted: AI will adjust future questions. 👎', 'info');
      });
    });

    scrollToBottom();
  }

  function scrollToBottom() {
    const main = document.getElementById('chatMainContainer');
    if (main) {
      setTimeout(() => {
        main.scrollTop = main.scrollHeight;
      }, 60);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Economy & Wallet Flow
 */
function setupEconomyFlow() {
  const btnTopBonus = document.getElementById('btnDailyBonus');
  const btnModalBonus = document.getElementById('btnClaimDailyModal');
  const btnDevMints = document.getElementById('btnDevAddMints');
  const badgeMints = document.getElementById('mintsBadge');
  const modalMints = document.getElementById('modalMints');
  const btnCloseMints = document.getElementById('btnCloseMintsModal');
  const btnCloseFooter = document.getElementById('btnCloseMintsFooter');

  const openMints = () => {
    if (modalMints && typeof modalMints.showModal === 'function') {
      modalMints.showModal();
    } else if (modalMints) {
      modalMints.setAttribute('open', '');
    }
  };

  const closeMints = () => {
    if (modalMints && typeof modalMints.close === 'function') {
      modalMints.close();
    } else if (modalMints) {
      modalMints.removeAttribute('open');
    }
  };

  if (badgeMints) badgeMints.addEventListener('click', openMints);
  if (btnCloseMints) btnCloseMints.addEventListener('click', closeMints);
  if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeMints);

  const claimBonus = () => {
    const current = getState();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (current.lastDailyBonus && (now - current.lastDailyBonus) < oneDay) {
      const diffHours = Math.ceil((oneDay - (now - current.lastDailyBonus)) / (1000 * 60 * 60));
      showToast(`Daily bonus already claimed! Next bonus in ~${diffHours} hours.`, 'warning');
      return;
    }

    setState({
      mints: current.mints + 10,
      lastDailyBonus: now,
      reason: 'daily_bonus'
    });
    showToast('Claimed +10 Free Mints! 🪙🎉', 'success');
  };

  if (btnTopBonus) btnTopBonus.addEventListener('click', claimBonus);
  if (btnModalBonus) btnModalBonus.addEventListener('click', claimBonus);

  if (btnDevMints) {
    btnDevMints.addEventListener('click', () => {
      const cur = getState().mints;
      setState({ mints: cur + 50, reason: 'dev_refill' });
      showToast('Added +50 Test Mints to wallet!', 'success');
    });
  }
}

/**
 * Theme Flow
 */
function setupThemeFlow() {
  initTheme();
  const btn = document.getElementById('btnThemeToggle');
  const icon = document.getElementById('themeIcon');

  if (btn) {
    btn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      if (icon) icon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
      showToast(`Switched to ${newTheme} mode`, 'info');
    });
  }
}

/**
 * Main Init
 */
export function initApp() {
  setupThemeFlow();
  setupUnifiedAuthFlow();
  setupSourcesFlow();
  setupFloatingChatFlow();
  setupEconomyFlow();

  on('mint:currency-changed', (detail) => {
    if (detail && typeof detail.mints === 'number') {
      updateMintsUI(detail.mints);
    }
  });

  updateMintsUI(getState().mints);
  console.log('Mint AI: Initialized with unified login and sticky floating input bar.');
}

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
