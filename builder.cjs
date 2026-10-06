const fs = require('fs');
const path = require('path');

const boardB64 = fs.readFileSync('board.b64.txt', 'utf8').trim();
const titleB64 = fs.readFileSync('title.b64.txt', 'utf8').trim();
const avatarB64 = fs.readFileSync('avatar.b64.txt', 'utf8').trim();

const css1 = fs.readFileSync('game-styles.css', 'utf8');
const css2 = fs.readFileSync('game-board-styles.css', 'utf8');
const fullCSS = css1 + '\n' + css2;

const js1 = fs.readFileSync('game-script.js', 'utf8');
const js2 = fs.readFileSync('game-script-ui.js', 'utf8');
const js3 = fs.readFileSync('game-script-play.js', 'utf8');
const js4 = fs.readFileSync('game-script-dice-turns.js', 'utf8');
const fullJS = js1 + '\n' + js2 + '\n' + js3 + '\n' + js4;

function generateDiceFacesHTML() {
  return `
    <div class="dice-face face-1">
      <div class="pip" style="grid-area: 2 / 2;"></div>
    </div>
    <div class="dice-face face-2">
      <div class="pip" style="grid-area: 1 / 1;"></div>
      <div class="pip" style="grid-area: 3 / 3;"></div>
    </div>
    <div class="dice-face face-3">
      <div class="pip" style="grid-area: 1 / 1;"></div>
      <div class="pip" style="grid-area: 2 / 2;"></div>
      <div class="pip" style="grid-area: 3 / 3;"></div>
    </div>
    <div class="dice-face face-4">
      <div class="pip" style="grid-area: 1 / 1;"></div>
      <div class="pip" style="grid-area: 1 / 3;"></div>
      <div class="pip" style="grid-area: 3 / 1;"></div>
      <div class="pip" style="grid-area: 3 / 3;"></div>
    </div>
    <div class="dice-face face-5">
      <div class="pip" style="grid-area: 1 / 1;"></div>
      <div class="pip" style="grid-area: 1 / 3;"></div>
      <div class="pip" style="grid-area: 2 / 2;"></div>
      <div class="pip" style="grid-area: 3 / 1;"></div>
      <div class="pip" style="grid-area: 3 / 3;"></div>
    </div>
    <div class="dice-face face-6">
      <div class="pip" style="grid-area: 1 / 1;"></div>
      <div class="pip" style="grid-area: 2 / 1;"></div>
      <div class="pip" style="grid-area: 3 / 1;"></div>
      <div class="pip" style="grid-area: 1 / 3;"></div>
      <div class="pip" style="grid-area: 2 / 3;"></div>
      <div class="pip" style="grid-area: 3 / 3;"></div>
    </div>
  `;
}

const fullHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snakes and Ladder</title>
  <meta name="description" content="Snakes and Ladder educational learning game">
  <meta property="og:title" content="Snakes and Ladder">
  <meta property="og:description" content="Snakes and Ladder educational learning game">
  <meta property="og:type" content="website">
  <style>
${fullCSS}
  </style>
</head>
<body>
  <header class="game-header">
    <div class="title-img-container">
      <img src="${titleB64}" alt="SNAKES AND LADDER" class="title-img" onerror="this.src='https://raw.githubusercontent.com/cs0028monglish-cmd/pictures-for-my-site-/main/title%20for%20snakes%20and%20ladder%20.png'">
    </div>
    <button id="soundToggleBtn" class="sound-toggle-btn" type="button" aria-pressed="true" aria-label="Toggle sound">🔊 Sound on</button>
  </header>

  <main class="main-wrapper">
    <!-- Settings Screen -->
    <section class="settings-container" id="settingsScreen" aria-label="Game Settings">
      <div class="settings-header">
        <h2>Set up your game</h2>
        <p class="settings-subtitle">Choose how to play, save the player names, and add your learning questions.</p>
      </div>

      <div>
        <div class="settings-section-title">Play mode</div>
        <div class="mode-grid">
          <button type="button" id="modeCpuBtn" class="mode-card" aria-pressed="true">
            <div class="mode-card-title">🤖 Versus computer</div>
            <div class="mode-card-desc">One human player vs automatic CPU</div>
          </button>
          <button type="button" id="modeLocalBtn" class="mode-card" aria-pressed="false">
            <div class="mode-card-title">👥 Various players</div>
            <div class="mode-card-desc">2 to 5 local players sharing one device</div>
          </button>
        </div>

        <div class="player-count-picker" id="playerCountPicker" style="display: none;">
          <span style="font-weight: 700; font-size: 14px; color: #94a3b8;">Number of players:</span>
          <button type="button" class="count-btn" data-count="2" aria-pressed="true">2</button>
          <button type="button" class="count-btn" data-count="3" aria-pressed="false">3</button>
          <button type="button" class="count-btn" data-count="4" aria-pressed="false">4</button>
          <button type="button" class="count-btn" data-count="5" aria-pressed="false">5</button>
        </div>
      </div>

      <div>
        <div class="settings-section-title">Player names (optional)</div>
        <div class="names-grid" id="namesInputsContainer"></div>
        <div class="names-action-bar">
          <button type="button" id="saveNamesBtn" class="btn btn-green" style="padding: 10px 18px; font-size: 14px;">Save player names</button>
          <span id="saveStatusIndicator" class="save-status-indicator" aria-live="polite"></span>
        </div>
      </div>

      <details class="questions-accordion">
        <summary>Add or edit my questions</summary>
        <div class="questions-editor-inner">
          <div>
            <div style="font-weight: 700; margin-bottom: 8px; color: #7dd3fc; font-size: 14px;">Bulk Import (1 to 20 lines)</div>
            <div class="bulk-editor-grid">
              <div>
                <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #94a3b8;" for="bulkQuestions">Questions, one per line</label>
                <textarea id="bulkQuestions" class="bulk-textarea" placeholder="What is 5 + 5?&#10;Capital of France?"></textarea>
              </div>
              <div>
                <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #94a3b8;" for="bulkAnswers">Answers, one per line</label>
                <textarea id="bulkAnswers" class="bulk-textarea" placeholder="10&#10;Paris"></textarea>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; margin-top: 10px;">
              <button type="button" id="applyBulkBtn" class="btn btn-nav">Apply bulk questions</button>
              <span id="bulkFeedback" class="status-feedback" aria-live="polite"></span>
            </div>
          </div>

          <div class="single-editor-box">
            <div style="font-weight: 700; color: #7dd3fc; font-size: 14px;">Single Square Question Editor</div>
            <div class="single-editor-row">
              <select id="singleSquareSelect" class="select-styled" aria-label="Select square number">
                ${Array.from({ length: 20 }, (_, i) => `<option value="${i + 1}">Square ${i + 1}</option>`).join('\n')}
              </select>
              <input type="text" id="singleQuestionInput" class="name-input" placeholder="Question text" style="flex: 2;">
              <input type="text" id="singleAnswerInput" class="name-input" placeholder="Exact answer" style="flex: 1.5;">
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px;">
              <button type="button" id="saveSingleSquareBtn" class="btn btn-green" style="padding: 8px 14px; font-size: 13px;">Save this square</button>
              <button type="button" id="clearSingleSquareBtn" class="btn btn-nav" style="padding: 8px 14px; font-size: 13px;">Clear this square</button>
              <span id="singleFeedback" class="status-feedback" aria-live="polite"></span>
            </div>
          </div>
        </div>
      </details>

      <button type="button" id="startGameBtn" class="btn btn-green btn-start-game">Start the game ▶</button>
    </section>

    <!-- Main Game Screen -->
    <section class="game-screen" id="gameScreen" style="display: none;" aria-label="Game Board and Controls">
      <div class="game-nav-bar">
        <button type="button" id="backToSettingsBtn" class="btn btn-nav">← Back to settings</button>
        <button type="button" id="restartGameBtn" class="btn btn-nav">↻ Restart game</button>
      </div>

      <div class="game-stage-grid">
        <!-- Board Column -->
        <div class="board-column">
          <div class="board-halo-wrapper">
            <div class="board-inner-frame" id="boardInnerFrame">
              <img src="${boardB64}" alt="Snakes and Ladders Game Board" class="board-bg-image" onerror="this.src='https://raw.githubusercontent.com/cs0028monglish-cmd/pictures-for-my-site-/main/snakes%20and%20Ladder.png'">
              <div class="board-grid-hitareas" id="boardGridHitareas"></div>
              <div class="tokens-layer" id="tokensLayer"></div>
            </div>
          </div>

          <!-- Starting Dock -->
          <div class="starting-dock" id="startingDock" aria-label="Starting Dock">
            <span class="starting-dock-label">STARTING DOCK</span>
            <div class="dock-tokens-zone" id="dockTokensZone"></div>
          </div>
        </div>

        <!-- Control Panel Column -->
        <div class="control-panel-wrapper">
          <aside class="control-panel" aria-label="Game Controls">
            <div class="turn-header">
              <div class="turn-badge">CURRENT TURN</div>
              <div class="active-player-name" id="activePlayerName">P1</div>
            </div>

            <div class="turn-status-text" id="turnStatusText" aria-live="polite">Click the dice to roll.</div>

            <div class="avatar-dice-stage">
              <div class="avatar-box-wrapper">
                <div class="animated-question-marks" aria-hidden="true">
                  <span class="qmark-1">?</span>
                  <span class="qmark-2">?</span>
                  <span class="qmark-3">?</span>
                </div>
                <div class="avatar-img-box">
                  <img src="${avatarB64}" alt="Game Avatar" class="avatar-img" onerror="this.src='https://raw.githubusercontent.com/cs0028monglish-cmd/pictures-for-my-site-/main/snakes%20and%20ladder%203.png'">
                </div>
              </div>

              <button type="button" id="diceStationBtn" class="dice-station-btn" aria-label="Roll 3D dice">
                <div class="dice-cube" id="diceCube">
                  ${generateDiceFacesHTML()}
                </div>
              </button>
            </div>

            <button type="button" id="moveBtn" class="btn btn-green btn-move-space" style="display: none;">Move space</button>

            <div class="players-scoreboard" id="playersScoreboard" aria-label="Player Scores and Trophies"></div>
          </aside>

          <!-- Signature below right control box -->
          <div class="footer-signature">
            <div class="sig-name">Dr.Abir Wafa</div>
            <div class="sig-title">Head of EdTech at Edulixa</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Question Modal -->
  <div class="modal-backdrop" id="questionModal" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <div class="modal-dialog">
      <h3 class="modal-title" id="modalTitle">Square question</h3>
      <div class="modal-question-text" id="modalQuestionText"></div>
      <input type="text" id="modalAnswerInput" class="modal-input" placeholder="Type your answer here..." aria-label="Answer input">
      <div id="modalFeedback" class="modal-feedback" aria-live="assertive"></div>
      <div class="modal-btn-row">
        <button type="button" id="closeModalBtn" class="btn btn-secondary">Close</button>
        <button type="button" id="checkAnswerBtn" class="btn btn-green">Check my answer</button>
      </div>
    </div>
  </div>

  <!-- Fullscreen Victory Overlay -->
  <div class="victory-overlay" id="victoryOverlay" style="display: none;" role="dialog" aria-modal="true" aria-label="Victory">
    <div class="victory-card">
      <div class="trophy-giant">🏆</div>
      <h2 class="victory-title">Victory!</h2>
      <p class="victory-message" id="victoryMessage"></p>
      <button type="button" id="playAgainBtn" class="btn btn-green" style="padding: 14px 28px; font-size: 18px; margin-top: 8px;">Play again</button>
    </div>
  </div>

  <script>
${fullJS}
  </script>
</body>
</html>`;

fs.writeFileSync('snake-learning-game-latest-edition.html', fullHTML);
fs.writeFileSync('index.html', fullHTML);
fs.writeFileSync('public/snake-learning-game-latest-edition.html', fullHTML);

console.log('Build complete! Files created:');
console.log('- snake-learning-game-latest-edition.html size:', fs.statSync('snake-learning-game-latest-edition.html').size);
console.log('- index.html size:', fs.statSync('index.html').size);
console.log('- public/snake-learning-game-latest-edition.html size:', fs.statSync('public/snake-learning-game-latest-edition.html').size);
