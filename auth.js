// ===== AUTH.JS — SKE-IT AUTHENTICATION =====
// Mock system ready for Supabase integration.
// To use Supabase: replace MOCK_DB calls with supabase.auth.signUp / signInWithPassword

// ======= MOCK DATABASE (replace with Supabase) =======
const MOCK_DB = {
  users: JSON.parse(localStorage.getItem('skeit_users') || '[]'),

  save() {
    localStorage.setItem('skeit_users', JSON.stringify(this.users));
  },

  findByUsername(username) {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  findByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  addUser(user) {
    this.users.push(user);
    this.save();
  }
};

// ======= SESSION MANAGEMENT =======
const Session = {
  set(user) {
    sessionStorage.setItem('skeit_session', JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || null,
      score: user.score || 0,
      createdAt: user.createdAt
    }));
  },

  get() {
    const data = sessionStorage.getItem('skeit_session');
    return data ? JSON.parse(data) : null;
  },

  clear() {
    sessionStorage.removeItem('skeit_session');
  },

  isLoggedIn() {
    return !!this.get();
  }
};

// ======= AUTH FUNCTIONS =======
const Auth = {
  /**
   * Sign up a new user.
   * SUPABASE VERSION:
   *   const { data, error } = await supabase.auth.signUp({ email, password });
   *   then: await supabase.from('profiles').insert({ id: data.user.id, username });
   */
  async signUp(username, email, password) {
    // Validation
    if (!username || username.length < 3) throw new Error('Username must be at least 3 characters.');
    if (!email || !email.includes('@')) throw new Error('Enter a valid email address.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

    if (MOCK_DB.findByUsername(username)) throw new Error('Username is already taken!');
    if (MOCK_DB.findByEmail(email)) throw new Error('Email is already registered!');

    // Hash password (simple mock — use bcrypt/Supabase in prod)
    const hash = btoa(password + '_skeit_salt');

    const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      password: hash,
      score: 0,
      gamesPlayed: 0,
      createdAt: new Date().toISOString()
    };

    MOCK_DB.addUser(newUser);
    Session.set(newUser);
    return newUser;
  },

  /**
   * Sign in an existing user.
   * SUPABASE VERSION:
   *   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   */
  async signIn(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) throw new Error('Please fill in all fields.');

    const user = MOCK_DB.findByUsername(usernameOrEmail) || MOCK_DB.findByEmail(usernameOrEmail);
    if (!user) throw new Error('No account found. Check your username or sign up!');

    const hash = btoa(password + '_skeit_salt');
    if (user.password !== hash) throw new Error('Wrong password! Try again.');

    Session.set(user);
    return user;
  },

  /**
   * Sign out.
   * SUPABASE VERSION: await supabase.auth.signOut();
   */
  signOut() {
    Session.clear();
    window.location.href = 'login.html';
  },

  /**
   * Update score after a game.
   * SUPABASE VERSION:
   *   await supabase.from('profiles').update({ score }).eq('id', userId);
   */
  updateScore(points) {
    const user = Session.get();
    if (!user) return;

    const dbUser = MOCK_DB.findByUsername(user.username);
    if (dbUser) {
      dbUser.score = (dbUser.score || 0) + points;
      dbUser.gamesPlayed = (dbUser.gamesPlayed || 0) + 1;
      MOCK_DB.save();
      Session.set(dbUser);
    }
  },

  /**
   * Get leaderboard data.
   * SUPABASE VERSION:
   *   const { data } = await supabase.from('profiles').select('*').order('score', { ascending: false }).limit(20);
   */
  getLeaderboard() {
    return [...MOCK_DB.users]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 20)
      .map((u, i) => ({
        rank: i + 1,
        username: u.username,
        score: u.score || 0,
        gamesPlayed: u.gamesPlayed || 0
      }));
  },

  /** Redirect to login if not authenticated */
  requireAuth() {
    if (!Session.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

// ======= UI HELPERS (used by login.html) =======
function showError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 600);
}

function showSuccess(msg) {
  const el = document.getElementById('auth-success');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearMessages() {
  ['auth-error', 'auth-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ======= THEME TOGGLE (shared) =======
function initTheme() {
  const saved = localStorage.getItem('skeit_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeToggle(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('skeit_theme', next);
  updateThemeToggle(next);
}

function updateThemeToggle(theme) {
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(t => {
    t.setAttribute('data-icon', theme === 'dark' ? '☀️' : '🌙');
    t.setAttribute('title', theme === 'dark' ? 'Switch to Light' : 'Switch to Dark');
  });
}

// ======= INIT ON PAGE LOAD =======
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});