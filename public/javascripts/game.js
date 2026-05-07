// ===== GAME.JS — SKE-IT GAME LOGIC =====

// ======= CONFIGURATION =======
const CONFIG = {
  TOTAL_GAME_TIME: 120,     // 2 minutes total game time
  AI_CONFIDENCE_THRESHOLD: 0.75, // STRICT: require 75% confidence
  SUBMISSION_COOLDOWN: 4000, // 4 seconds between submissions to avoid Gemini rate limits
};

const GAME_STATE_KEY = 'skeit_active_game_v1';

// ======= WORD LIST =======
const WORD_LIST = [
  // Animals
  'cat', 'dog', 'fish', 'bird', 'rabbit', 'elephant', 'giraffe', 'penguin', 'lion', 'shark',
  'butterfly', 'octopus', 'turtle', 'horse', 'duck', 'owl', 'bear', 'monkey', 'frog', 'whale',
  'cow', 'pig', 'sheep', 'goat', 'zebra', 'kangaroo', 'snail', 'crab', 'squirrel', 'dolphin',
  'snake', 'tiger', 'cheetah', 'rhino', 'hippo', 'crocodile', 'alligator', 'bat', 'camel', 'deer',
  'flamingo', 'gorilla', 'iguana', 'jellyfish', 'koala', 'llama', 'moose', 'ostrich', 'peacock', 'raccoon',

  // Objects
  'bicycle', 'clock', 'umbrella', 'guitar', 'camera', 'telephone', 'lamp', 'chair', 'key', 'book',
  'pizza', 'rocket', 'crown', 'diamond', 'balloon', 'cloud', 'mountain', 'tree', 'flower', 'sun',
  'car', 'truck', 'house', 'phone', 'watch', 'hat', 'shoe', 'bag', 'table', 'pencil',
  'scissors', 'knife', 'fork', 'spoon', 'plate', 'bowl', 'cup', 'glass', 'bottle', 'box',
  
  // Actions
  'sleeping', 'flying', 'running', 'swimming', 'dancing', 'cooking', 'jumping', 'reading', 'singing', 'laughing',
  'crying', 'sneezing', 'climbing', 'painting', 'skating', 'fishing', 'shopping', 'sneaking', 'yawning', 'juggling',
  'digging', 'kicking', 'punching', 'throwing', 'catching', 'hiding', 'sweeping', 'typing', 'writing', 'whispering',
  
  // Scenes & Environments
  'beach', 'rainbow', 'volcano', 'castle', 'lighthouse', 'forest', 'desert', 'garden', 'bridge', 'city',
  'farm', 'hospital', 'school', 'playground', 'supermarket', 'library', 'stadium', 'airport', 'cave', 'island',
  'canyon', 'waterfall', 'swamp', 'jungle', 'tundra', 'glacier', 'oasis', 'cemetery', 'amusement park', 'zoo',

  // Food & Drink
  'hamburger', 'ice cream', 'banana', 'apple', 'donut', 'sushi', 'cheese', 'taco', 'pancake', 'watermelon',
  'coffee', 'carrot', 'grapes', 'sandwich', 'hotdog', 'popcorn', 'broccoli', 'cookie', 'egg', 'pineapple',
  'pizza', 'steak', 'salad', 'soup', 'bread', 'butter', 'milk', 'juice', 'tea', 'cake',
  'strawberry', 'orange', 'lemon', 'tomato', 'potato', 'onion', 'garlic', 'mushroom', 'pepper', 'chocolate',

  // Professions
  'doctor', 'teacher', 'police', 'firefighter', 'astronaut', 'chef', 'farmer', 'artist', 'pilot', 'ninja',
  'detective', 'scientist', 'magician', 'pirate', 'clown', 'dentist', 'judge', 'soldier', 'mechanic', 'waiter',
  'plumber', 'electrician', 'carpenter', 'lawyer', 'architect', 'baker', 'butcher', 'tailor', 'barber', 'janitor',

  // Sports & Hobbies
  'soccer', 'basketball', 'tennis', 'baseball', 'golf', 'volleyball', 'boxing', 'wrestling', 'surfing', 'bowling',
  'hockey', 'rugby', 'badminton', 'cricket', 'skiing', 'snowboarding', 'gymnastics', 'karate', 'cycling', 'archery',
  'billiards', 'darts', 'fencing', 'rowing', 'sailing', 'scuba diving', 'skydiving', 'weightlifting', 'yoga', 'chess',

  // Fantasy & Mythical
  'dragon', 'unicorn', 'mermaid', 'ghost', 'zombie', 'alien', 'fairy', 'vampire', 'wizard', 'monster',
  'witch', 'goblin', 'troll', 'pegasus', 'phoenix', 'elf', 'cyclops', 'werewolf', 'genie', 'mummy',
  'centaur', 'griffin', 'kraken', 'minotaur', 'yeti', 'sasquatch', 'gargoyle', 'leprechaun', 'hydra', 'banshee',

  // City & Infrastructure
  'roundabout', 'intersection', 'highway', 'overpass', 'traffic light', 'crosswalk', 'sidewalk', 'skyscraper', 'billboard', 'subway',
  'bus stop', 'parking lot', 'toll booth', 'streetlamp', 'fire hydrant', 'sewer', 'alley', 'plaza', 'tunnel', 'monument',

  // Technology & Computers
  'laptop', 'keyboard', 'mouse', 'monitor', 'server', 'router', 'microchip', 'headphones', 'microphone', 'battery',
  'printer', 'webcam', 'tablet', 'smartwatch', 'drone', 'robot', 'joystick', 'console', 'cable', 'satellite',

  // Car & Vehicle Detailing / Parts
  'engine', 'tire', 'steering wheel', 'brake', 'seatbelt', 'windshield', 'headlight', 'bumper', 'exhaust', 'mirror',
  'sponge', 'soap', 'wax', 'polish', 'brush', 'towel', 'hose', 'vacuum', 'garage', 'dashboard',

  // Space
  'planet', 'galaxy', 'asteroid', 'comet', 'sun', 'moon', 'star', 'black hole', 'nebula', 'meteor',
  'telescope', 'spaceship', 'space station', 'lunar rover', 'orbit', 'eclipse', 'constellation', 'milky way', 'observatory', 'supernova',

  // Clothing & Accessories
  'shirt', 'pants', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'socks', 'gloves', 'scarf',
  'tie', 'belt', 'glasses', 'sunglasses', 'necklace', 'bracelet', 'ring', 'earrings', 'helmet', 'backpack',

  // Household & Furniture
  'sofa', 'bed', 'wardrobe', 'bookshelf', 'television', 'refrigerator', 'microwave', 'oven', 'toaster', 'blender',
  'bathtub', 'toilet', 'sink', 'mirror', 'rug', 'curtain', 'pillow', 'blanket', 'fan', 'heater',

  // Body Parts
  'eye', 'nose', 'hand', 'foot', 'ear', 'mouth', 'tooth', 'brain', 'heart', 'bone',
  'thumb', 'finger', 'toe', 'tongue', 'muscle', 'skeleton', 'hair', 'leg', 'arm', 'lips'
];

// ======= GAME STATE =======
let GameState = {
  currentWord: '',
  usedWords: [],
  wordsCorrect: 0,
  totalScore: 0,
  wordLog: [],
  timeLeft: CONFIG.TOTAL_GAME_TIME,
  timerInterval: null,
  isDrawing: false,
  isSubmitting: false,
  isGameActive: true,
  strokes: [],
  canvas: null,
  ctx: null,
  brushSize: 4,
  brushColor: '#000000',
  erasing: false,
  lastX: 0,
  lastY: 0,
  painting: false,
  isPausedForAI: false,
  endAfterSubmit: false,
  hasEnded: false,
  lastSubmissionTime: 0,
};

function getCurrentUsername() {
  if (typeof Auth === 'undefined') return null;
  const user = Auth.get();
  return user && user.username ? user.username : null;
}

function resetGameState() {
  GameState.currentWord = '';
  GameState.usedWords = [];
  GameState.wordsCorrect = 0;
  GameState.totalScore = 0;
  GameState.wordLog = [];
  GameState.timeLeft = CONFIG.TOTAL_GAME_TIME;
  GameState.isSubmitting = false;
  GameState.isGameActive = true;
  GameState.isPausedForAI = false;
  GameState.endAfterSubmit = false;
  GameState.hasEnded = false;
}

function saveGameState() {
  try {
    const payload = {
      owner: getCurrentUsername(),
      currentWord: GameState.currentWord,
      usedWords: GameState.usedWords,
      wordsCorrect: GameState.wordsCorrect,
      totalScore: GameState.totalScore,
      wordLog: GameState.wordLog,
      timeLeft: GameState.timeLeft,
      isGameActive: GameState.isGameActive,
      isPausedForAI: GameState.isPausedForAI,
      endAfterSubmit: GameState.endAfterSubmit,
      savedAt: Date.now(),
      timerRunning: !!GameState.timerInterval && GameState.isGameActive && !GameState.isPausedForAI,
    };
    sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save game state:', err);
  }
}

function clearSavedGameState() {
  try {
    sessionStorage.removeItem(GAME_STATE_KEY);
  } catch (err) {
    console.warn('Failed to clear game state:', err);
  }
}

function restoreSavedGameState() {
  try {
    const raw = sessionStorage.getItem(GAME_STATE_KEY);
    if (!raw) return false;

    const saved = JSON.parse(raw);
    const currentUser = getCurrentUsername();
    if (saved.owner !== currentUser) {
      clearSavedGameState();
      return false;
    }

    if (!saved.isGameActive || Number(saved.timeLeft) <= 0) {
      clearSavedGameState();
      return false;
    }

    const elapsedSecs = Math.max(0, Math.floor((Date.now() - (saved.savedAt || Date.now())) / 1000));
    const adjustedTime = saved.timerRunning ? Math.max(0, Number(saved.timeLeft) - elapsedSecs) : Number(saved.timeLeft);
    if (adjustedTime <= 0) {
      clearSavedGameState();
      return false;
    }

    GameState.currentWord = saved.currentWord || '';
    GameState.usedWords = Array.isArray(saved.usedWords) ? saved.usedWords : [];
    GameState.wordsCorrect = Number(saved.wordsCorrect) || 0;
    GameState.totalScore = Number(saved.totalScore) || 0;
    GameState.wordLog = Array.isArray(saved.wordLog) ? saved.wordLog : [];
    GameState.timeLeft = adjustedTime;
    GameState.isGameActive = true;
    GameState.isPausedForAI = false;
    GameState.endAfterSubmit = false;
    GameState.hasEnded = false;

    return !!GameState.currentWord;
  } catch (err) {
    console.warn('Failed to restore game state:', err);
    clearSavedGameState();
    return false;
  }
}

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
  if (!GameState.isGameActive || GameState.hasEnded) return;

  GameState.currentWord = getNextWord();
  GameState.isSubmitting = false;

  clearCanvas();
  updateWordDisplay();
  updateHintText('');
  document.getElementById('submit-btn')?.removeAttribute('disabled');

  // Reset tool buttons
  setEraseMode(false);
  saveGameState();
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
  if (el) el.textContent = `Words: ${GameState.wordsCorrect}`;

  const scoreEl = document.getElementById('score-display');
  if (scoreEl) scoreEl.textContent = `Score: ${GameState.totalScore}`;

  saveGameState();
}

function updateHintText(text) {
  const el = document.getElementById('hint-text');
  if (el) el.textContent = text;
}

function formatConfidence(confidence) {
  const value = Number(confidence);
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value * 100)}%`;
}

// ======= TIMER =======
function startTimer() {
  if (!GameState.isGameActive || GameState.isPausedForAI || GameState.hasEnded) return;

  clearInterval(GameState.timerInterval);
  updateTimerDisplay();

  GameState.timerInterval = setInterval(() => {
    if (!GameState.isGameActive || GameState.isPausedForAI || GameState.hasEnded) {
      clearInterval(GameState.timerInterval);
      return;
    }

    GameState.timeLeft--;
    if (GameState.timeLeft < 0) GameState.timeLeft = 0;
    updateTimerDisplay();
    saveGameState();

    if (GameState.timeLeft <= 0) {
      clearInterval(GameState.timerInterval);
      onTimeUp();
    }
  }, 1000);

  saveGameState();
}

function pauseTimerForAI() {
  GameState.isPausedForAI = true;
  clearInterval(GameState.timerInterval);
  saveGameState();
}

function resumeTimerAfterAI() {
  GameState.isPausedForAI = false;

  if (!GameState.isGameActive || GameState.hasEnded) {
    saveGameState();
    return;
  }

  if (GameState.timeLeft <= 0) {
    onTimeUp();
    return;
  }

  startTimer();
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
  if (GameState.hasEnded) return;

  clearInterval(GameState.timerInterval);

  if (GameState.isSubmitting) {
    GameState.isGameActive = false;
    GameState.endAfterSubmit = true;
    updateHintText('⏳ Waiting for AI to finish your last submission...');
    saveGameState();
    return;
  }

  GameState.isGameActive = false;
  saveGameState();
  endGame();
}

// ======= AI VISION =======
/**
 * Sends the canvas image to server for Gemini Vision analysis.
 * Server uses GEMINI_API_KEY from .env for security.
 * @returns {Promise<{guess: string, confidence: number, isCorrect: boolean}>}
 */
async function askAI(base64Image, targetWord) {
  try {
    const response = await fetch('/api/analyze-drawing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ base64Image, targetWord })
    });

    const result = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const error = new Error(result.message || 'Server error');
      error.status = response.status;
      error.isRateLimited = result.isRateLimited || response.status === 429;
      throw error;
    }

    return result;
  } catch (err) {
    console.error('AI analysis error:', err);
    return {
      guess: 'error',
      confidence: 0,
      isCorrect: false,
      error: err.message || 'Unexpected error. Please try again!',
      status: err.status || 500,
      isRateLimited: err.isRateLimited || false
    };
  }
}

// ======= SUBMIT DRAWING =======
async function submitDrawing() {
  if (GameState.isSubmitting || GameState.hasEnded || !GameState.isGameActive) return;

  // Enforce cooldown
  const now = Date.now();
  const timeSinceLast = now - GameState.lastSubmissionTime;
  if (timeSinceLast < CONFIG.SUBMISSION_COOLDOWN) {
    const wait = Math.ceil((CONFIG.SUBMISSION_COOLDOWN - timeSinceLast) / 1000);
    updateHintText(`⏳ Wait ${wait}s before submitting again!`);
    return;
  }

  // Check if canvas has anything drawn
  const imageData = GameState.ctx.getImageData(0, 0, GameState.canvas.width, GameState.canvas.height);
  const hasDrawing = imageData.data.some((val, i) => i % 4 !== 3 && val < 250);
  if (!hasDrawing) {
    updateHintText('✏️ Draw something first!');
    return;
  }

  GameState.isSubmitting = true;
  GameState.lastSubmissionTime = Date.now();
  pauseTimerForAI();
  saveGameState();

  const btn = document.getElementById('submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'SCANNING...'; btn.classList.add('scanning'); }

  updateHintText('🤖 AI is analyzing your drawing...');

  // Get base64 image from canvas
  const base64 = GameState.canvas.toDataURL('image/png').split(',')[1];

  try {
    const result = await askAI(base64, GameState.currentWord);

    if (btn) { btn.disabled = false; btn.textContent = 'SUBMIT!'; btn.classList.remove('scanning'); }

    if (result.isCorrect) {
      const earned = result.score || 100; // Use AI score directly
      GameState.wordsCorrect++;
      GameState.totalScore += earned;
      GameState.wordLog.push({ word: GameState.currentWord, score: earned });
      GameState.isSubmitting = false;
      updateRoundDisplay();

      const aiAnalysis = result.guess && result.guess !== 'error' ? `\nAI saw: "${result.guess}"` : '';
      showEffect(
        '✓ CORRECT!',
        `+${earned} pts!${aiAnalysis}\n${result.feedback || `You drew "${GameState.currentWord}" perfectly!`}`,
        '#006600',
        () => {
          if (GameState.endAfterSubmit || !GameState.isGameActive || GameState.timeLeft <= 0) {
            GameState.endAfterSubmit = false;
            GameState.isGameActive = false;
            saveGameState();
            endGame();
            return;
          }

          startNewRound();
          resumeTimerAfterAI();
        }
      );
    } else if (result.error) {
      GameState.isSubmitting = false;
      const isRateLimited = result.isRateLimited;
      showEffect(
        isRateLimited ? 'AI BUSY' : 'AI ERROR',
        isRateLimited 
          ? 'AI is thinking too hard! Wait a few seconds and try again.'
          : `${result.error}\nPlease try again in a moment.`,
        '#8b5cf6',
        null,
        3500
      );
      updateHintText(isRateLimited 
        ? '⚠️ AI is rate-limited. Keep drawing and try again soon.'
        : '⚠️ The drawing service had an error. Try again.');

      if (GameState.endAfterSubmit || !GameState.isGameActive || GameState.timeLeft <= 0) {
        GameState.endAfterSubmit = false;
        GameState.isGameActive = false;
        saveGameState();
        endGame();
      } else {
        resumeTimerAfterAI();
      }
    } else {
      GameState.isSubmitting = false;

      const normalizedGuess = String(result.guess || '').trim().toLowerCase();
      const normalizedWord = String(GameState.currentWord || '').trim().toLowerCase();
      const guessMatchesTarget = normalizedGuess && normalizedWord && normalizedGuess === normalizedWord;
      const aiAnalysis = result.guess && result.guess !== 'error' ? `AI saw: "${result.guess}"` : 'Keep analyzing...';

      const title = guessMatchesTarget ? 'ALMOST!' : 'TRY AGAIN!';
      const subtitle = guessMatchesTarget
        ? `The AI guessed the right word, but confidence was only ${formatConfidence(result.confidence)}.\n${aiAnalysis}`
        : `${aiAnalysis}\nTarget: "${GameState.currentWord}"`;

      showEffect(
        title,
        `${subtitle}\n${result.feedback || 'Keep drawing!'}`,
        '#cc0000',
        null,
        3500
      );
      updateHintText(`Hint: Think about the key features of "${GameState.currentWord}"`);

      if (GameState.endAfterSubmit || !GameState.isGameActive || GameState.timeLeft <= 0) {
        GameState.endAfterSubmit = false;
        GameState.isGameActive = false;
        saveGameState();
        endGame();
      } else {
        resumeTimerAfterAI();
      }
    }
  } catch (err) {
    console.error(err);
    if (btn) { btn.disabled = false; btn.textContent = 'SUBMIT!'; btn.classList.remove('scanning'); }
    GameState.isSubmitting = false;
    updateHintText('⚠️ Error connecting to AI. Try again!');

    if (GameState.endAfterSubmit || !GameState.isGameActive || GameState.timeLeft <= 0) {
      GameState.endAfterSubmit = false;
      GameState.isGameActive = false;
      saveGameState();
      endGame();
    } else {
      resumeTimerAfterAI();
    }
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
      <div style="margin-top:20px; color:#aaa; font-family:var(--font-body); font-size:0.9rem;">Click anywhere to ${autoClose > 0 ? 'dismiss' : 'continue'}</div>
    </div>
  `;

  document.body.appendChild(overlay);

  let isClosed = false;
  let timerId = null;

  const close = () => {
    if (isClosed) return;
    isClosed = true;
    if (timerId) clearTimeout(timerId);
    
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 200);
  };

  if (autoClose > 0) {
    timerId = setTimeout(close, autoClose);
  }
  
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', close, { once: true });
}

// ======= GAME END =======
function endGame() {
  if (GameState.hasEnded) return;

  GameState.hasEnded = true;
  GameState.isGameActive = false;
  GameState.isSubmitting = false;
  GameState.isPausedForAI = false;
  GameState.endAfterSubmit = false;
  clearInterval(GameState.timerInterval);
  const user = typeof Auth !== 'undefined' ? Auth.get() : null;
  clearSavedGameState();

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
        Words Drawn: ${GameState.wordsCorrect}
      </div>
      <div style="display:flex; gap:12px; justify-content:center; margin-top:24px; flex-wrap:wrap;">
        <button class="btn-manga" onclick="restartGame()">PLAY AGAIN</button>
        <a href="/leaderboard" class="btn-manga-outline">LEADERBOARD</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Submit final score to server leaderboard
  (async () => {
    try {
      const playerName = user && user.username ? user.username : 'Anonymous';
      const resp = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerName, 
          score: GameState.totalScore, 
          roundsPlayed: GameState.wordsCorrect,
          wordLog: GameState.wordLog
        })
      });

      const statusEl = document.createElement('div');
      statusEl.style.marginTop = '12px';
      statusEl.style.fontFamily = 'var(--font-body)';
      statusEl.style.color = 'var(--ink)';
      statusEl.style.opacity = '0.9';

      if (resp.ok) {
        statusEl.textContent = 'Score submitted to global leaderboard.';
      } else {
        const err = await resp.json().catch(() => ({}));
        statusEl.textContent = 'Failed to submit score: ' + (err.message || resp.statusText || resp.status);
      }

      overlay.querySelector('div')?.appendChild(statusEl);
    } catch (err) {
      const statusEl = document.createElement('div');
      statusEl.style.marginTop = '12px';
      statusEl.style.fontFamily = 'var(--font-body)';
      statusEl.style.color = 'var(--ink)';
      statusEl.style.opacity = '0.9';
      statusEl.textContent = 'Error submitting score.';
      overlay.querySelector('div')?.appendChild(statusEl);
      console.error('Submit final score error:', err);
    }
  })();
}

function restartGame() {
  document.querySelectorAll('.effect-panel').forEach(el => el.remove());
  resetGameState();
  clearCanvas();
  updateRoundDisplay();
  updateTimerDisplay();
  startNewRound();
  startTimer();
  saveGameState();
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



// ======= INIT =======
document.addEventListener('DOMContentLoaded', () => {
  // Auth check
  if (typeof Auth !== 'undefined') Auth.requireAuth();

  initCanvas();
  initToolbar();

  const restored = restoreSavedGameState();
  if (!restored) {
    resetGameState();
    startNewRound();
  } else {
    updateWordDisplay();
    updateHintText('Welcome back! Your match was restored.');
  }

  updateRoundDisplay();
  updateTimerDisplay();
  startTimer();

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (typeof Auth !== 'undefined') Auth.signOut();
  });



  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 200);
  });

  window.addEventListener('beforeunload', () => {
    if (GameState.isGameActive && !GameState.hasEnded) saveGameState();
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
    if (!GameState.isGameActive || GameState.hasEnded || GameState.isSubmitting) return;
    pauseTimerForAI();
    
    // Apply penalty
    const penalty = 15;
    GameState.timeLeft -= penalty;
    if (GameState.timeLeft < 0) GameState.timeLeft = 0;
    updateTimerDisplay();

    showEffect('SKIPPED', `-${penalty}s penalty!\nThe word was: ${GameState.currentWord.toUpperCase()}`, '#cc0000', () => {
      if (GameState.timeLeft <= 0) {
        onTimeUp();
      } else {
        startNewRound();
        resumeTimerAfterAI();
      }
    });
  });

  // Set first brush active
  setBrushSize(4);
  setEraseMode(false);
}