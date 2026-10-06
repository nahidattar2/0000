// Dice, Turns, Questions, and Victory Engine
let diceRotationX = -12;
let diceRotationY = 16;

const DICE_TARGET_ROTATIONS = {
  1: { x: -12, y: 16 },
  2: { x: -12, y: -74 },
  3: { x: -102, y: 16 },
  4: { x: 78, y: 16 },
  5: { x: -12, y: 106 },
  6: { x: -12, y: 196 }
};

function resetDiceRestingTilt() {
  const cube = document.getElementById('diceCube');
  if (cube) {
    diceRotationX = -12;
    diceRotationY = 16;
    cube.style.transform = `rotateX(${diceRotationX}deg) rotateY(${diceRotationY}deg)`;
  }
}

function updateTurnDisplay() {
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer) return;

  const nameEl = document.getElementById('activePlayerName');
  const statusEl = document.getElementById('turnStatusText');
  const moveBtn = document.getElementById('moveBtn');
  const diceBtn = document.getElementById('diceStationBtn');

  nameEl.textContent = activePlayer.name;
  nameEl.style.color = activePlayer.color;

  if (activePlayer.isCpu) {
    statusEl.textContent = 'CPU is thinking...';
    diceBtn.disabled = true;
    moveBtn.style.display = 'none';
    if (!state.busy && !state.gameOver) {
      scheduleCpuTurn();
    }
  } else {
    diceBtn.disabled = state.busy || state.rolledValue > 0;
    if (state.rolledValue > 0) {
      statusEl.textContent = `You rolled a ${state.rolledValue}!`;
      moveBtn.style.display = 'inline-flex';
      moveBtn.textContent = `Move ${state.rolledValue} ${state.rolledValue === 1 ? 'space' : 'spaces'}`;
    } else {
      statusEl.textContent = 'Click the dice to roll.';
      moveBtn.style.display = 'none';
    }
  }
}

function renderScoreboard() {
  const board = document.getElementById('playersScoreboard');
  board.innerHTML = '';

  state.players.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'score-row' + (idx === state.activePlayerIndex ? ' active-turn-row' : '');

    const info = document.createElement('div');
    info.className = 'score-player-info';

    const dot = document.createElement('div');
    dot.className = 'score-dot';
    dot.style.background = p.color;

    const name = document.createElement('span');
    name.className = 'score-name';
    name.textContent = p.name;

    info.appendChild(dot);
    info.appendChild(name);

    const trophies = document.createElement('span');
    trophies.className = 'score-trophies';
    trophies.textContent = `🏆 ${p.trophyCount}/5`;

    row.appendChild(info);
    row.appendChild(trophies);
    board.appendChild(row);
  });
}

function rollDice() {
  if (state.busy || state.gameOver) return;
  state.busy = true;

  const cube = document.getElementById('diceCube');
  const diceBtn = document.getElementById('diceStationBtn');
  const statusEl = document.getElementById('turnStatusText');

  diceBtn.disabled = true;
  playRollSound();

  const rollVal = Math.floor(Math.random() * 6) + 1;
  state.rolledValue = rollVal;

  // Add multiple full turns for dynamic 3D spinning
  const extraSpinsX = 720 * (Math.random() > 0.5 ? 1 : 2);
  const extraSpinsY = 720 * (Math.random() > 0.5 ? 1 : 2);
  const target = DICE_TARGET_ROTATIONS[rollVal];

  diceRotationX += extraSpinsX;
  diceRotationY += extraSpinsY;

  // Align to target face with tilted resting perspective
  cube.style.transform = `rotateX(${target.x + 360 * 2}deg) rotateY(${target.y + 360 * 2}deg)`;

  setTimeout(() => {
    state.busy = false;
    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer.isCpu) {
      statusEl.textContent = `CPU rolled a ${rollVal}!`;
      setTimeout(() => {
        executeMove();
      }, 700);
    } else {
      updateTurnDisplay();
    }
  }, 1000);
}

function scheduleCpuTurn() {
  state.busy = true;
  setTimeout(() => {
    if (state.gameOver) return;
    state.busy = false;
    rollDice();
  }, 900);
}

async function executeMove() {
  if (state.busy || state.gameOver) return;
  state.busy = true;

  const activePlayer = state.players[state.activePlayerIndex];
  const rollVal = state.rolledValue;
  state.rolledValue = 0;
  document.getElementById('moveBtn').style.display = 'none';

  const statusEl = document.getElementById('turnStatusText');
  const tokenEl = document.getElementById(`playerToken_${activePlayer.id}`);

  // Overshoot check
  if (activePlayer.position + rollVal > 20) {
    statusEl.textContent = `${activePlayer.name} needs an exact roll. The token stays put.`;
    playBlockedSound();
    await delay(1200);
    finishTurn();
    return;
  }

  // Step-by-step movement
  for (let s = 0; s < rollVal; s++) {
    activePlayer.position += 1;
    updateTokensPositions();
    if (tokenEl) {
      tokenEl.classList.remove('token-hop');
      void tokenEl.offsetWidth; // trigger reflow
      tokenEl.classList.add('token-hop');
    }
    playStepSound();
    await delay(280);
  }

  await delay(150);

  // Exact 20 Win Condition
  if (activePlayer.position === 20) {
    triggerVictory(activePlayer, 'reached square 20!');
    return;
  }

  // Check Ladders
  if (LADDERS[activePlayer.position]) {
    const dest = LADDERS[activePlayer.position];
    statusEl.textContent = `Ladder! ${activePlayer.name} climbs to square ${dest}.`;
    playLadderSound();
    await delay(350);
    activePlayer.position = dest;
    updateTokensPositions();
    await delay(600);
  }
  // Check Snakes
  else if (SNAKES[activePlayer.position]) {
    const dest = SNAKES[activePlayer.position];
    statusEl.textContent = `Oh no! A snake bites ${activePlayer.name} and slides the token down to square ${dest}.`;
    playSnakeSound();
    showCryingOverlay();
    await delay(400);
    activePlayer.position = dest;
    updateTokensPositions();
    await delay(700);
  }

  finishTurn();
}

function showCryingOverlay() {
  const container = document.getElementById('boardInnerFrame');
  const overlay = document.createElement('div');
  overlay.className = 'snake-crying-overlay';
  overlay.innerHTML = '<div class="crying-emoji">😭</div>';
  container.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
  }, 1400);
}

function finishTurn() {
  state.busy = false;
  state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  updateTurnDisplay();
  renderScoreboard();
}

function handleQuestionIconClick(sqNum) {
  if (state.busy || state.gameOver) return;
  const activePlayer = state.players[state.activePlayerIndex];
  if (activePlayer.isCpu) return;

  const qRecord = state.questions[sqNum - 1];
  if (!qRecord || !qRecord.q || !qRecord.q.trim()) {
    const statusEl = document.getElementById('turnStatusText');
    statusEl.textContent = `No question is saved for square ${sqNum} yet. Add it in settings.`;
    playBlockedSound();
    return;
  }

  openQuestionModal(sqNum);
}

function openQuestionModal(sqNum) {
  state.openSquare = sqNum;
  const qRecord = state.questions[sqNum - 1];
  const modal = document.getElementById('questionModal');
  const title = document.getElementById('modalTitle');
  const qText = document.getElementById('modalQuestionText');
  const input = document.getElementById('modalAnswerInput');
  const feedback = document.getElementById('modalFeedback');

  title.textContent = `Square ${sqNum} question`;
  qText.textContent = qRecord.q;
  input.value = '';
  feedback.textContent = '';

  modal.style.display = 'flex';
  setTimeout(() => input.focus(), 50);
}

function closeQuestionModal() {
  const modal = document.getElementById('questionModal');
  modal.style.display = 'none';
  state.openSquare = null;
}

function checkQuestionAnswer() {
  if (!state.openSquare) return;
  const sqNum = state.openSquare;
  const qRecord = state.questions[sqNum - 1];
  const input = document.getElementById('modalAnswerInput');
  const feedback = document.getElementById('modalFeedback');
  const activePlayer = state.players[state.activePlayerIndex];

  const userAns = normalizeAnswer(input.value);
  const correctAns = normalizeAnswer(qRecord.a);

  if (userAns !== correctAns) {
    feedback.textContent = 'Not quite—try again. Check spelling and spacing.';
    feedback.style.color = '#f87171';
    playWrongSound();
    input.focus();
    return;
  }

  // Answer is correct!
  if (activePlayer.trophiesEarned.has(sqNum)) {
    feedback.textContent = 'Correct! You already earned the trophy for this square.';
    feedback.style.color = '#38bdf8';
    playCorrectSound();
    return;
  }

  // Award trophy
  activePlayer.trophiesEarned.add(sqNum);
  activePlayer.trophyCount++;
  playTrophySound();
  renderScoreboard();

  feedback.textContent = 'Correct! Trophy earned! ✨🏆';
  feedback.style.color = '#4ade80';

  if (activePlayer.trophyCount >= 5) {
    setTimeout(() => {
      closeQuestionModal();
      activePlayer.position = 20;
      updateTokensPositions();
      triggerVictory(activePlayer, 'collected five trophies!');
    }, 800);
  }
}

function triggerVictory(winner, reason) {
  state.gameOver = true;
  state.busy = true;

  const overlay = document.getElementById('victoryOverlay');
  const msgEl = document.getElementById('victoryMessage');
  msgEl.textContent = `${winner.name} wins by ${reason}!`;

  spawnConfetti();
  playVictorySound();
  overlay.style.display = 'flex';
}

function spawnConfetti() {
  const overlay = document.getElementById('victoryOverlay');
  const oldConfetti = overlay.querySelectorAll('.confetti-particle');
  oldConfetti.forEach(c => c.remove());

  const colors = ['#ffd85b', '#40e8ff', '#ff5d66', '#22c55e', '#a855f7', '#ec4899', '#ffffff'];

  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.width = `${Math.random() * 8 + 6}px`;
    el.style.height = `${Math.random() * 12 + 8}px`;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = `${Math.random() * 2 + 2}s`;
    el.style.animationDelay = `${Math.random() * 1.5}s`;
    overlay.appendChild(el);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
