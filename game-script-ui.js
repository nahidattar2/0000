// Settings Screen Management
function initSettingsUI() {
  const modeCpuBtn = document.getElementById('modeCpuBtn');
  const modeLocalBtn = document.getElementById('modeLocalBtn');
  const countPicker = document.getElementById('playerCountPicker');
  const saveNamesBtn = document.getElementById('saveNamesBtn');
  const startGameBtn = document.getElementById('startGameBtn');
  const applyBulkBtn = document.getElementById('applyBulkBtn');
  const saveSingleBtn = document.getElementById('saveSingleSquareBtn');
  const clearSingleBtn = document.getElementById('clearSingleSquareBtn');
  const singleSelect = document.getElementById('singleSquareSelect');

  // Mode buttons
  modeCpuBtn.addEventListener('click', () => {
    initAudio();
    state.mode = 'cpu';
    modeCpuBtn.setAttribute('aria-pressed', 'true');
    modeLocalBtn.setAttribute('aria-pressed', 'false');
    countPicker.style.display = 'none';
    renderNameInputs();
  });

  modeLocalBtn.addEventListener('click', () => {
    initAudio();
    state.mode = 'local';
    modeLocalBtn.setAttribute('aria-pressed', 'true');
    modeCpuBtn.setAttribute('aria-pressed', 'false');
    countPicker.style.display = 'flex';
    renderNameInputs();
  });

  // Count buttons (2, 3, 4, 5)
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      initAudio();
      document.querySelectorAll('.count-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      state.playerCount = parseInt(btn.dataset.count, 10);
      renderNameInputs();
    });
  });

  // Save Names
  saveNamesBtn.addEventListener('click', () => {
    initAudio();
    const inputs = document.querySelectorAll('.name-input');
    let count = 0;
    inputs.forEach(input => {
      const idx = input.dataset.player;
      state.savedNames[idx] = input.value.trim().slice(0, 22);
      count++;
    });
    localStorage.setItem(STORAGE_NAMES, JSON.stringify(state.savedNames));
    playSaveSound();
    const indicator = document.getElementById('saveStatusIndicator');
    indicator.textContent = `✓ ${count} names saved`;
    indicator.className = 'save-status-indicator status-saved';
  });

  // Bulk Question Importer
  applyBulkBtn.addEventListener('click', () => {
    initAudio();
    const qLines = document.getElementById('bulkQuestions').value.split('\n').map(s => s.trim()).filter(Boolean);
    const aLines = document.getElementById('bulkAnswers').value.split('\n').map(s => s.trim()).filter(Boolean);
    const feedback = document.getElementById('bulkFeedback');

    if (qLines.length !== aLines.length) {
      feedback.textContent = `Error: Line counts do not match (${qLines.length} questions, ${aLines.length} answers).`;
      feedback.style.color = '#f87171';
      playWrongSound();
      return;
    }
    if (qLines.length < 1 || qLines.length > 20) {
      feedback.textContent = 'Error: Must provide between 1 and 20 questions.';
      feedback.style.color = '#f87171';
      playWrongSound();
      return;
    }

    qLines.forEach((q, idx) => {
      state.questions[idx] = { q, a: aLines[idx] };
    });

    saveQuestionsToStorage();
    playSaveSound();
    feedback.textContent = `✓ Successfully saved ${qLines.length} questions!`;
    feedback.style.color = '#4ade80';
    updateSingleSquareInputs();
  });

  // Single Square Selector & Actions
  singleSelect.addEventListener('change', updateSingleSquareInputs);

  saveSingleBtn.addEventListener('click', () => {
    initAudio();
    const sqIndex = parseInt(singleSelect.value, 10) - 1;
    const qVal = document.getElementById('singleQuestionInput').value.trim();
    const aVal = document.getElementById('singleAnswerInput').value.trim();
    state.questions[sqIndex] = { q: qVal, a: aVal };
    saveQuestionsToStorage();
    playSaveSound();
    const feedback = document.getElementById('singleFeedback');
    feedback.textContent = `✓ Square ${sqIndex + 1} saved!`;
    feedback.style.color = '#4ade80';
  });

  clearSingleBtn.addEventListener('click', () => {
    initAudio();
    const sqIndex = parseInt(singleSelect.value, 10) - 1;
    state.questions[sqIndex] = { q: '', a: '' };
    document.getElementById('singleQuestionInput').value = '';
    document.getElementById('singleAnswerInput').value = '';
    saveQuestionsToStorage();
    playSaveSound();
    const feedback = document.getElementById('singleFeedback');
    feedback.textContent = `Square ${sqIndex + 1} cleared.`;
    feedback.style.color = '#93c5fd';
  });

  startGameBtn.addEventListener('click', () => {
    initAudio();
    launchGame();
  });

  renderNameInputs();
  updateSingleSquareInputs();
}

function renderNameInputs() {
  const container = document.getElementById('namesInputsContainer');
  container.innerHTML = '';
  const indicator = document.getElementById('saveStatusIndicator');
  indicator.textContent = '';

  const total = state.mode === 'cpu' ? 2 : state.playerCount;

  for (let i = 0; i < total; i++) {
    const row = document.createElement('div');
    row.className = 'name-row';

    const swatch = document.createElement('div');
    swatch.className = 'player-swatch';
    swatch.style.background = PLAYER_COLORS[i];

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name-input';
    input.maxLength = 22;
    input.dataset.player = String(i);

    if (state.mode === 'cpu' && i === 1) {
      input.value = 'CPU';
      input.disabled = true;
      input.title = 'Computer player';
    } else {
      input.placeholder = `Player ${i + 1} (e.g. P${i + 1})`;
      input.value = state.savedNames[i] || '';
      input.addEventListener('input', () => {
        indicator.textContent = 'Unsaved changes';
        indicator.className = 'save-status-indicator status-unsaved';
      });
    }

    row.appendChild(swatch);
    row.appendChild(input);
    container.appendChild(row);
  }
}

function updateSingleSquareInputs() {
  const select = document.getElementById('singleSquareSelect');
  const idx = parseInt(select.value, 10) - 1;
  const qRecord = state.questions[idx] || { q: '', a: '' };
  document.getElementById('singleQuestionInput').value = qRecord.q || '';
  document.getElementById('singleAnswerInput').value = qRecord.a || '';
  document.getElementById('singleFeedback').textContent = '';
}
