// Audio Synthesis Engine via Web Audio API
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startTime);
    gain.gain.setValueAtTime(gainLevel, audioCtx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
}

function playSaveSound() {
  initAudio();
  playTone(523.25, 'sine', 0.1, 0, 0.2); // C5
  playTone(659.25, 'sine', 0.1, 0.08, 0.2); // E5
  playTone(783.99, 'sine', 0.2, 0.16, 0.25); // G5
}

function playRollSound() {
  initAudio();
  for (let i = 0; i < 6; i++) {
    playTone(180 + Math.random() * 80, 'triangle', 0.04, i * 0.08, 0.2);
  }
}

function playStepSound() {
  initAudio();
  playTone(440, 'sine', 0.08, 0, 0.2);
  playTone(587, 'sine', 0.12, 0.05, 0.25);
}

function playBlockedSound() {
  initAudio();
  playTone(220, 'square', 0.12, 0, 0.15);
  playTone(164.8, 'square', 0.2, 0.14, 0.15);
}

function playLadderSound() {
  initAudio();
  const notes = [261.63, 329.63, 392.00, 523.25];
  notes.forEach((freq, idx) => {
    playTone(freq, 'sine', 0.15, idx * 0.1, 0.25);
  });
}

function playSnakeSound() {
  initAudio();
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {}
}

function playWrongSound() {
  initAudio();
  playTone(180, 'sawtooth', 0.25, 0, 0.2);
}

function playCorrectSound() {
  initAudio();
  playTone(587.33, 'sine', 0.12, 0, 0.2);
  playTone(880.00, 'sine', 0.25, 0.1, 0.25);
}

function playTrophySound() {
  initAudio();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    playTone(freq, 'triangle', 0.18, idx * 0.09, 0.25);
  });
}

function playVictorySound() {
  initAudio();
  const melody = [
    { f: 523.25, d: 0.15, t: 0 },
    { f: 523.25, d: 0.15, t: 0.15 },
    { f: 523.25, d: 0.15, t: 0.3 },
    { f: 659.25, d: 0.4, t: 0.45 },
    { f: 587.33, d: 0.2, t: 0.9 },
    { f: 783.99, d: 0.6, t: 1.1 }
  ];
  melody.forEach(item => {
    playTone(item.f, 'sine', item.d, item.t, 0.3);
  });
}

// Game State Definition
const PLAYER_COLORS = ['#ff5d66', '#1878ee', '#18a75b', '#8a4de1', '#ef8b20'];

const LADDERS = {
  2: 9,
  7: 14,
  12: 19
};

const SNAKES = {
  11: 10,
  13: 8,
  15: 6
};

// Serpentine Grid Layout:
// Row 1 (top): 20, 19, 18, 17, 16
// Row 2: 11, 12, 13, 14, 15
// Row 3: 10, 9, 8, 7, 6
// Row 4 (bottom): 1, 2, 3, 4, 5
const SERPENTINE_GRID = [
  [20, 19, 18, 17, 16],
  [11, 12, 13, 14, 15],
  [10, 9, 8, 7, 6],
  [1, 2, 3, 4, 5]
];

// Map square number to { row, col }
const SQUARE_COORDS = {};
SERPENTINE_GRID.forEach((rowArr, rowIdx) => {
  rowArr.forEach((sqNum, colIdx) => {
    SQUARE_COORDS[sqNum] = { row: rowIdx, col: colIdx };
  });
});

const state = {
  mode: 'cpu', // 'cpu' or 'local'
  playerCount: 2,
  savedNames: {},
  players: [],
  activePlayerIndex: 0,
  rolledValue: 0,
  busy: false,
  questions: Array.from({ length: 20 }, () => ({ q: '', a: '' })),
  openSquare: null,
  gameOver: false
};

// Storage Keys
const STORAGE_NAMES = 'snakeTrailNames';
const STORAGE_QUESTIONS = 'snakeTrailQuestions';

// Utility: Normalize Answers
function normalizeAnswer(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Utility: Escape HTML
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Load Storage
function loadSavedData() {
  try {
    const rawNames = localStorage.getItem(STORAGE_NAMES);
    if (rawNames) {
      state.savedNames = JSON.parse(rawNames) || {};
    }
  } catch (e) {
    state.savedNames = {};
  }

  try {
    const rawQ = localStorage.getItem(STORAGE_QUESTIONS);
    if (rawQ) {
      const parsed = JSON.parse(rawQ);
      if (Array.isArray(parsed)) {
        for (let i = 0; i < 20; i++) {
          if (parsed[i]) {
            state.questions[i] = {
              q: parsed[i].q || '',
              a: parsed[i].a || ''
            };
          }
        }
      }
    }
  } catch (e) {
    // Keep empty questions
  }
}

// Save Questions
function saveQuestionsToStorage() {
  try {
    localStorage.setItem(STORAGE_QUESTIONS, JSON.stringify(state.questions));
    updateQuestionIconStates();
  } catch (e) {}
}

// UI Setup & Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadSavedData();
  initSettingsUI();
  initGameUI();
  initSoundToggle();
});

function initSoundToggle() {
  const btn = document.getElementById('soundToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    btn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    btn.textContent = soundEnabled ? '🔊 Sound on' : '🔇 Sound off';
  });
}
