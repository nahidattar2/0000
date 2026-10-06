// Game Play & Lifecycle Management
function initGameUI() {
  const backBtn = document.getElementById('backToSettingsBtn');
  const restartBtn = document.getElementById('restartGameBtn');
  const diceBtn = document.getElementById('diceStationBtn');
  const moveBtn = document.getElementById('moveBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const checkAnswerBtn = document.getElementById('checkAnswerBtn');
  const modalInput = document.getElementById('modalAnswerInput');
  const playAgainBtn = document.getElementById('playAgainBtn');

  backBtn.addEventListener('click', () => {
    initAudio();
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'flex';
  });

  restartBtn.addEventListener('click', () => {
    initAudio();
    restartGame();
  });

  diceBtn.addEventListener('click', () => {
    if (state.busy || state.gameOver) return;
    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.isCpu) return;
    rollDice();
  });

  moveBtn.addEventListener('click', () => {
    if (state.busy || state.gameOver) return;
    executeMove();
  });

  closeModalBtn.addEventListener('click', closeQuestionModal);

  checkAnswerBtn.addEventListener('click', checkQuestionAnswer);

  modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkQuestionAnswer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('questionModal');
      if (modal && modal.style.display !== 'none') {
        closeQuestionModal();
      }
    }
  });

  playAgainBtn.addEventListener('click', () => {
    initAudio();
    document.getElementById('victoryOverlay').style.display = 'none';
    restartGame();
  });

  window.addEventListener('resize', () => {
    updateTokensPositions();
  });

  renderBoardGrid();
}

function launchGame() {
  const total = state.mode === 'cpu' ? 2 : state.playerCount;
  state.players = [];

  for (let i = 0; i < total; i++) {
    const isCpu = state.mode === 'cpu' && i === 1;
    let name = isCpu ? 'CPU' : (state.savedNames[i] || '').trim();
    if (!name) name = `P${i + 1}`;

    state.players.push({
      id: i,
      name,
      isCpu,
      color: PLAYER_COLORS[i],
      position: 0,
      trophyCount: 0,
      trophiesEarned: new Set()
    });
  }

  state.activePlayerIndex = 0;
  state.rolledValue = 0;
  state.busy = false;
  state.gameOver = false;

  document.getElementById('settingsScreen').style.display = 'none';
  const gameScreen = document.getElementById('gameScreen');
  gameScreen.style.display = 'flex';

  updateQuestionIconStates();
  renderTokens();
  updateTokensPositions();
  updateTurnDisplay();
  renderScoreboard();
}

function restartGame() {
  state.players.forEach(p => {
    p.position = 0;
    p.trophyCount = 0;
    p.trophiesEarned = new Set();
  });
  state.activePlayerIndex = 0;
  state.rolledValue = 0;
  state.busy = false;
  state.gameOver = false;
  document.getElementById('victoryOverlay').style.display = 'none';
  document.getElementById('moveBtn').style.display = 'none';

  updateTurnDisplay();
  renderScoreboard();
  updateTokensPositions();
  resetDiceRestingTilt();
}

function renderBoardGrid() {
  const gridContainer = document.getElementById('boardGridHitareas');
  gridContainer.innerHTML = '';

  SERPENTINE_GRID.forEach((rowArr, rowIdx) => {
    rowArr.forEach((sqNum, colIdx) => {
      const cell = document.createElement('div');
      cell.className = 'square-cell';
      cell.dataset.square = String(sqNum);
      cell.id = `squareCell_${sqNum}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `question-icon-btn icon-col-${colIdx}`;
      btn.id = `qBtn_${sqNum}`;
      btn.setAttribute('aria-label', `Open question for square ${sqNum}`);
      btn.textContent = '?';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        handleQuestionIconClick(sqNum);
      });

      cell.appendChild(btn);
      gridContainer.appendChild(cell);
    });
  });
}

function updateQuestionIconStates() {
  for (let sq = 1; sq <= 20; sq++) {
    const btn = document.getElementById(`qBtn_${sq}`);
    if (!btn) continue;
    const qData = state.questions[sq - 1];
    if (qData && qData.q && qData.q.trim()) {
      btn.classList.add('has-question');
    } else {
      btn.classList.remove('has-question');
    }
  }
}

function renderTokens() {
  const container = document.getElementById('tokensLayer');
  container.innerHTML = '';

  state.players.forEach((p, idx) => {
    const token = document.createElement('div');
    token.className = 'player-token';
    token.id = `playerToken_${p.id}`;
    token.style.background = p.color;
    token.textContent = String(p.id + 1);
    container.appendChild(token);
  });
}

function updateTokensPositions() {
  const boardFrame = document.getElementById('boardInnerFrame');
  const startingDock = document.getElementById('startingDock');
  if (!boardFrame || !startingDock) return;

  const boardRect = boardFrame.getBoundingClientRect();
  const tokensLayer = document.getElementById('tokensLayer');
  if (!tokensLayer) return;
  const layerRect = tokensLayer.getBoundingClientRect();

  // Group players by position
  const posMap = {};
  state.players.forEach(p => {
    if (!posMap[p.position]) posMap[p.position] = [];
    posMap[p.position].push(p);
  });

  // Position for square 0 (dock)
  if (posMap[0]) {
    const dockRect = startingDock.getBoundingClientRect();
    const count = posMap[0].length;
    posMap[0].forEach((p, i) => {
      const el = document.getElementById(`playerToken_${p.id}`);
      if (!el) return;
      const step = 42;
      const startX = dockRect.left + dockRect.width / 2 - ((count - 1) * step) / 2;
      const targetLeft = startX + i * step - layerRect.left;
      const targetTop = (dockRect.top + dockRect.height / 2) - layerRect.top;
      el.style.left = `${targetLeft}px`;
      el.style.top = `${targetTop}px`;
    });
  }

  // Position for squares 1 to 20
  for (let sq = 1; sq <= 20; sq++) {
    const group = posMap[sq];
    if (!group || group.length === 0) continue;

    const cell = document.getElementById(`squareCell_${sq}`);
    if (!cell) continue;
    const cellRect = cell.getBoundingClientRect();
    const centerX = cellRect.left + cellRect.width / 2 - layerRect.left;
    const centerY = cellRect.top + cellRect.height / 2 - layerRect.top;

    const tokenSize = Math.max(24, Math.min(42, window.innerWidth * 0.04));
    const offsetDist = tokenSize * 0.44;

    if (group.length === 1) {
      // Exactly 0 offset on both axes!
      const el = document.getElementById(`playerToken_${group[0].id}`);
      if (el) {
        el.style.left = `${centerX}px`;
        el.style.top = `${centerY}px`;
      }
    } else if (group.length === 2) {
      // Left and right
      const offsets = [[-offsetDist, 0], [offsetDist, 0]];
      group.forEach((p, i) => {
        const el = document.getElementById(`playerToken_${p.id}`);
        if (el) {
          el.style.left = `${centerX + offsets[i][0]}px`;
          el.style.top = `${centerY + offsets[i][1]}px`;
        }
      });
    } else if (group.length === 3) {
      // Two above and one below
      const offsets = [
        [-offsetDist, -offsetDist * 0.7],
        [offsetDist, -offsetDist * 0.7],
        [0, offsetDist * 0.7]
      ];
      group.forEach((p, i) => {
        const el = document.getElementById(`playerToken_${p.id}`);
        if (el) {
          el.style.left = `${centerX + offsets[i][0]}px`;
          el.style.top = `${centerY + offsets[i][1]}px`;
        }
      });
    } else if (group.length === 4) {
      // 2x2 cluster
      const offsets = [
        [-offsetDist, -offsetDist],
        [offsetDist, -offsetDist],
        [-offsetDist, offsetDist],
        [offsetDist, offsetDist]
      ];
      group.forEach((p, i) => {
        const el = document.getElementById(`playerToken_${p.id}`);
        if (el) {
          el.style.left = `${centerX + offsets[i][0]}px`;
          el.style.top = `${centerY + offsets[i][1]}px`;
        }
      });
    } else if (group.length >= 5) {
      // Four corners + one center
      const offsets = [
        [-offsetDist, -offsetDist],
        [offsetDist, -offsetDist],
        [-offsetDist, offsetDist],
        [offsetDist, offsetDist],
        [0, 0]
      ];
      group.forEach((p, i) => {
        const el = document.getElementById(`playerToken_${p.id}`);
        if (el) {
          el.style.left = `${centerX + (offsets[i] ? offsets[i][0] : 0)}px`;
          el.style.top = `${centerY + (offsets[i] ? offsets[i][1] : 0)}px`;
        }
      });
    }
  }
}
