// ===== GAME.JS — SKE-IT GAME LOGIC =====

// ======= CONFIGURATION =======
const CONFIG = {
  ROUND_DURATION: 120,      // seconds per round
  POINTS_CORRECT: 100,      // base points for correct guess
  POINTS_BONUS_TIME: 1,     // bonus points per second remaining
  MAX_ROUNDS: 5,            // rounds per game session
  AI_CONFIDENCE_THRESHOLD: 0.4, // minimum confidence to count as correct

  // OpenAI API key — set via prompt or env variable
  // NEVER hardcode your key in production. Use a backend proxy.
  OPENAI_API_KEY: '',       // Set with setApiKey() or prompt user
};

// ======= WORD LIST =======
const WORD_LIST = [
  // Animals
  'cat', 'dog', 'fish', 'bird', 'rabbit', 'elephant', 'giraffe', 'penguin', 'lion', 'shark',
  'butterfly', 'octopus', 'turtle', 'horse', 'duck', 'owl', 'bear', 'monkey', 'frog', 'whale',
  // Objects
  'bicycle', 'clock', 'umbrella', 'guitar', 'camera', 'telephone', 'lamp', 'chair', 'key', 'book',
  'pizza', 'rocket', 'crown', 'diamond', 'balloon', 'cloud', 'mountain', 'tree', 'flower', 'sun',
  // Actions / harder
  'sleeping', 'flying', 'running', 'swimming', 'dancing', 'cooking',
  // Scenes
  'beach', 'rainbow', 'volcano', 'castle', 'lighthouse',
];

// ======= GAME STATE =======
let GameState = {
  currentWord: '',
  usedWords: [],
  roundNumber: 0,
  totalScore: 0,
  timeLeft: CONFIG.ROUND_DURATION,
  timerInterval: null,
  isDrawing: false,
  isSubmitting: false,
  strokes: [],
  canvas: null,
  ctx: null,
  brushSize: 4,
  brushColor: '#000000',
  erasing: false,
  lastX: 0,
  lastY: 0,
  painting: false,
};

// ======= CANVAS SETUP =======
function initCanvas() {
  const canvas = document.getElementById('drawing-canvas');
  if (!canvas) return;

  GameState.canvas = canvas;
  GameState.ctx = canvas.getContext('2d');

  resizeCanvas();
  clearCanvas();

  // Mouse events
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // Touch events
  canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(touchToMouse(e)); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(touchToMouse(e)); }, { passive: false });
  canvas.addEventListener('touchend', stopDraw);
}

function resizeCanvas() {
  const wrapper = document.querySelector('.canvas-wrapper');
  if (!wrapper || !GameState.canvas) return;
  const rect = wrapper.getBoundingClientRect();
  GameState.canvas.width = rect.width;
  GameState.canvas.height = rect.height || 420;
  clearCanvas(false); // don't wipe state, just re-fill white
}

function clearCanvas(resetStrokes = true) {
  if (!GameState.ctx) return;
  GameState.ctx.fillStyle = '#ffffff';
  GameState.ctx.fillRect(0, 0, GameState.canvas.width, GameState.canvas.height);
  if (resetStrokes) GameState.strokes = [];
}

function touchToMouse(e) {
  const rect = GameState.canvas.getBoundingClientRect();
  const touch = e.touches[0] || e.changedTouches[0];
  return { clientX: touch.clientX, clientY: touch.clientY, type: e.type.replace('touch', 'mouse') };
}

function getPos(e) {
  const rect = GameState.canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (GameState.canvas.width / rect.width),
    y: (e.clientY - rect.top) * (GameState.canvas.height / rect.height)
  };
}

function startDraw(e) {
  GameState.painting = true;
  const pos = getPos(e);
  GameState.lastX = pos.x;
  GameState.lastY = pos.y;

  // Dot on click
  GameState.ctx.beginPath();
  GameState.ctx.arc(pos.x, pos.y, GameState.brushSize / 2, 0, Math.PI * 2);
  GameState.ctx.fillStyle = GameState.erasing ? '#ffffff' : GameState.brushColor;
  GameState.ctx.fill();
}

function draw(e) {
  if (!GameState.painting) return;
  const pos = getPos(e);
  const ctx = GameState.ctx;

  ctx.beginPath();
  ctx.moveTo(GameState.lastX, GameState.lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = GameState.erasing ? '#ffffff' : GameState.brushColor;
  ctx.lineWidth = GameState.erasing ? GameState.brushSize * 3 : GameState.brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  GameState.lastX = pos.x;
  GameState.lastY = pos.y;
}

function stopDraw() {
  GameState.painting = false;
}

// ======= WORD / ROUND MANAGEMENT =======
function getNextWord() {
  const remaining = WORD_LIST.filter(w => !GameState.usedWords.includes(w));
  if (remaining.length === 0) {
    GameState.usedWords = [];
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  }
  const word = remaining[Math.floor(Math.random() * remaining.length)];
  GameState.usedWords.push(word);
  return word;
}

function startNewRound() {
  GameState.roundNumber++;
  GameState.currentWord = getNextWord();
  GameState.timeLeft = CONFIG.ROUND_DURATION;
  GameState.isSubmitting = false;

  clearCanvas();
  updateWordDisplay();
  updateRoundDisplay();
  startTimer();
  updateHintText('');
  document.getElementById('submit-btn')?.removeAttribute('disabled');

  // Reset tool buttons
  setEraseMode(false);
}

function updateWordDisplay() {
  const el = document.getElementById('current-word');
  if (el) {
    el.textContent = `Draw: ${GameState.currentWord.toUpperCase()}!`;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 600);
  }
}

function updateRoundDisplay() {
  const el = document.getElementById('round-display');
  if (el) el.textContent = `Round ${GameState.roundNumber} / ${CONFIG.MAX_ROUNDS}`;

  const scoreEl = document.getElementById('score-display');
  if (scoreEl) scoreEl.textContent = `Score: ${GameState.totalScore}`;
}

function updateHintText(text) {
  const el = document.getElementById('hint-text');
  if (el) el.textContent = text;
}

// ======= TIMER =======
function startTimer() {
  clearInterval(GameState.timerInterval);
  updateTimerDisplay();

  GameState.timerInterval = setInterval(() => {
    GameState.timeLeft--;
    updateTimerDisplay();

    if (GameState.timeLeft <= 0) {
      clearInterval(GameState.timerInterval);
      onTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (!el) return;

  const mins = Math.floor(GameState.timeLeft / 60).toString().padStart(2, '0');
  const secs = (GameState.timeLeft % 60).toString().padStart(2, '0');
  el.textContent = `${mins}:${secs}`;

  if (GameState.timeLeft <= 10) {
    el.classList.add('timer-critical');
    el.style.color = '#cc0000';
  } else if (GameState.timeLeft <= 30) {
    el.style.color = '#cc6600';
    el.classList.remove('timer-critical');
  } else {
    el.style.color = '';
    el.classList.remove('timer-critical');
  }
}

function onTimeUp() {
  clearInterval(GameState.timerInterval);
  showEffect('TIME UP!', `The word was: ${GameState.currentWord.toUpperCase()}`, '#cc0000', () => {
    if (GameState.roundNumber >= CONFIG.MAX_ROUNDS) {
      endGame();
    } else {
      startNewRound();
    }
  });
}

// ======= AI VISION =======
/**
 * Sends the canvas image to OpenAI GPT-4o Vision for guessing.
 * @returns {Promise<{guess: string, confidence: number, isCorrect: boolean}>}
 */
async function askAI(base64Image, targetWord) {
  const apiKey = CONFIG.OPENAI_API_KEY || localStorage.getItem('skeit_api_key');

  if (!apiKey) {
    // Demo mode: random 40% correct for testing without API key
    console.warn('No API key set. Running in DEMO mode.');
    const demoCorrect = Math.random() < 0.4;
    await new Promise(r => setTimeout(r, 1200)); // simulate latency
    return {
      guess: demoCorrect ? targetWord : 'something else',
      confidence: demoCorrect ? 0.85 : 0.2,
      isCorrect: demoCorrect,
      demo: true
    };
  }

  const prompt = `Look at this sketch drawing carefully. It was drawn by a human playing a Pictionary-style game.

The player is trying to draw: "${targetWord}"

Please analyze the drawing and tell me:
1. What does this drawing look like to you?
2. Does it match the target word "${targetWord}"?

Respond ONLY in this JSON format (no markdown, no extra text):
{
  "guess": "your best guess of what is drawn",
  "confidence": 0.0 to 1.0,
  "isCorrect": true or false,
  "feedback": "one short encouraging sentence"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}`, detail: 'low' } }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API Error ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content.trim();

    // Strip markdown fences if present
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      guess: result.guess || 'unknown',
      confidence: result.confidence || 0,
      isCorrect: result.isCorrect === true || result.confidence >= CONFIG.AI_CONFIDENCE_THRESHOLD,
      feedback: result.feedback || '',
      demo: false
    };
  } catch (err) {
    console.error('AI Vision error:', err);
    return { guess: 'error', confidence: 0, isCorrect: false, error: err.message };
  }
}

// ======= SUBMIT DRAWING =======
async function submitDrawing() {
  if (GameState.isSubmitting) return;

  // Check if canvas has anything drawn
  const imageData = GameState.ctx.getImageData(0, 0, GameState.canvas.width, GameState.canvas.height);
  const hasDrawing = imageData.data.some((val, i) => i % 4 !== 3 && val < 250);
  if (!hasDrawing) {
    updateHintText('✏️ Draw something first!');
    return;
  }

  GameState.isSubmitting = true;
  clearInterval(GameState.timerInterval);

  const btn = document.getElementById('submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'SCANNING...'; btn.classList.add('scanning'); }

  updateHintText('🤖 AI is analyzing your drawing...');

  // Get base64 image from canvas
  const base64 = GameState.canvas.toDataURL('image/png').split(',')[1];

  try {
    const result = await askAI(base64, GameState.currentWord);

    if (btn) { btn.disabled = false; btn.textContent = 'SUBMIT!'; btn.classList.remove('scanning'); }

    if (result.isCorrect) {
      const bonus = Math.floor(GameState.timeLeft * CONFIG.POINTS_BONUS_TIME);
      const earned = CONFIG.POINTS_CORRECT + bonus;
      GameState.totalScore += earned;

      // Save score
      if (typeof Auth !== 'undefined') Auth.updateScore(earned);

      showEffect(
        '✓ CORRECT!',
        `+${earned} pts! ${result.feedback || `You drew "${GameState.currentWord}" perfectly!`}`,
        '#006600',
        () => {
          if (GameState.roundNumber >= CONFIG.MAX_ROUNDS) endGame();
          else startNewRound();
        }
      );
    } else {
      GameState.isSubmitting = false;
      startTimer(); // resume timer

      const guessText = result.guess && result.guess !== 'error' ? `I see "${result.guess}"...` : '';
      showEffect(
        'TRY AGAIN!',
        `${guessText} Keep drawing! ${result.demo ? '(Demo mode)' : ''}`,
        '#cc0000',
        null,
        1800
      );
      updateHintText(`Hint: Think about the key features of "${GameState.currentWord}"`);
    }
  } catch (err) {
    console.error(err);
    if (btn) { btn.disabled = false; btn.textContent = 'SUBMIT!'; btn.classList.remove('scanning'); }
    GameState.isSubmitting = false;
    updateHintText('⚠️ Error connecting to AI. Try again!');
    startTimer();
  }
}

// ======= EFFECT DISPLAY =======
function showEffect(title, subtitle, color = '#000', onClose = null, autoClose = 0) {
  const overlay = document.createElement('div');
  overlay.className = 'effect-panel';
  overlay.innerHTML = `
    <div style="text-align:center; padding: 20px;">
      <div class="effect-text" style="color: ${color}; -webkit-text-stroke: 4px #000;">${title}</div>
      <div class="effect-subtitle">${subtitle}</div>
      ${!autoClose ? '<div style="margin-top:20px; color:#aaa; font-family:var(--font-body); font-size:0.9rem;">Click anywhere to continue</div>' : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 200);
  };

  if (autoClose > 0) {
    setTimeout(close, autoClose);
  } else {
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', close, { once: true });
  }
}

// ======= GAME END =======
function endGame() {
  clearInterval(GameState.timerInterval);
  const user = typeof Session !== 'undefined' ? Session.get() : null;

  const overlay = document.createElement('div');
  overlay.className = 'effect-panel';
  overlay.style.flexDirection = 'column';
  overlay.innerHTML = `
    <div style="text-align:center; max-width:480px; padding:40px; background:var(--paper); border:5px solid var(--ink); box-shadow:8px 8px 0 var(--ink);">
      <div class="title-display" style="font-size:3.5rem; color:var(--ink);">GAME OVER!</div>
      <div style="font-family:var(--font-hand); font-size:1.3rem; margin:16px 0; color:var(--ink);">
        ${user ? user.username + "'s" : 'Your'} Final Score
      </div>
      <div class="title-display" style="font-size:5rem; color:var(--ink);">${GameState.totalScore}</div>
      <div style="font-family:var(--font-body); color:var(--ink); margin:12px 0;">
        Rounds Completed: ${GameState.roundNumber} / ${CONFIG.MAX_ROUNDS}
      </div>
      <div style="display:flex; gap:12px; justify-content:center; margin-top:24px; flex-wrap:wrap;">
        <button class="btn-manga" onclick="restartGame()">PLAY AGAIN</button>
        <a href="leaderboard.html" class="btn-manga-outline">LEADERBOARD</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function restartGame() {
  document.querySelectorAll('.effect-panel').forEach(el => el.remove());
  GameState.totalScore = 0;
  GameState.roundNumber = 0;
  GameState.usedWords = [];
  startNewRound();
}

// ======= BRUSH TOOLS =======
function setBrushSize(size) {
  GameState.brushSize = size;
  document.querySelectorAll('.brush-btn').forEach(b => b.classList.remove('active-tool'));
  document.querySelector(`[data-size="${size}"]`)?.classList.add('active-tool');
}

function setEraseMode(state) {
  GameState.erasing = state;
  const eraseBtn = document.getElementById('erase-btn');
  const drawBtn = document.getElementById('draw-btn');
  if (eraseBtn) eraseBtn.classList.toggle('active-tool', state);
  if (drawBtn) drawBtn.classList.toggle('active-tool', !state);
  if (GameState.canvas) {
    GameState.canvas.style.cursor = state ? 'cell' : 'crosshair';
  }
}

function setApiKey(key) {
  CONFIG.OPENAI_API_KEY = key;
  localStorage.setItem('skeit_api_key', key);
}

// ======= INIT =======
document.addEventListener('DOMContentLoaded', () => {
  // Auth check
  if (typeof Auth !== 'undefined') Auth.requireAuth();

  initCanvas();
  initToolbar();

  // Start first round
  startNewRound();

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (typeof Auth !== 'undefined') Auth.signOut();
  });

  // API key prompt if not set
  const savedKey = localStorage.getItem('skeit_api_key');
  if (savedKey) {
    CONFIG.OPENAI_API_KEY = savedKey;
  } else {
    setTimeout(() => {
      const key = prompt('🤖 Enter your OpenAI API key for AI Vision:\n(Leave blank to play in Demo mode)');
      if (key && key.trim()) setApiKey(key.trim());
    }, 1000);
  }

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 200);
  });
});

function initToolbar() {
  // Submit
  document.getElementById('submit-btn')?.addEventListener('click', submitDrawing);

  // Clear
  document.getElementById('clear-btn')?.addEventListener('click', () => clearCanvas());

  // Eraser
  document.getElementById('erase-btn')?.addEventListener('click', () => setEraseMode(true));
  document.getElementById('draw-btn')?.addEventListener('click', () => setEraseMode(false));

  // Brush sizes
  document.querySelectorAll('.brush-btn').forEach(btn => {
    btn.addEventListener('click', () => setBrushSize(parseInt(btn.dataset.size)));
  });

  // Skip round (costs time, no points)
  document.getElementById('skip-btn')?.addEventListener('click', () => {
    clearInterval(GameState.timerInterval);
    showEffect('SKIP!', `The word was: ${GameState.currentWord.toUpperCase()}`, '#555', () => {
      if (GameState.roundNumber >= CONFIG.MAX_ROUNDS) endGame();
      else startNewRound();
    });
  });

  // Set first brush active
  setBrushSize(4);
  setEraseMode(false);
}