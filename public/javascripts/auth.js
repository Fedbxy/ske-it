// ===== AUTH.JS — SKE-IT AUTHENTICATION (SERVER-BACKED) =====
// Uses MongoDB backend for user persistence

// ======= SESSION MANAGEMENT =======
const Auth = {
  /**
   * Sign up a new user via server
   */
  async signUp(username, password) {
    // Client-side validation
    if (!username || username.length < 3) throw new Error('Username must be at least 3 characters.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

    try {
      const resp = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Signup failed');

      // User is now in session
      sessionStorage.setItem('skeit_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Sign in an existing user via server
   */
  async signIn(username, password) {
    if (!username || !password) throw new Error('Please fill in all fields.');

    try {
      const resp = await fetch('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Signin failed');

      sessionStorage.setItem('skeit_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      sessionStorage.removeItem('skeit_user');
      window.location.href = '/login';
    }
  },

  /**
   * Get current user from session
   */
  get() {
    const data = sessionStorage.getItem('skeit_user');
    return data ? JSON.parse(data) : null;
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.get();
  },

  /**
   * Get leaderboard data
   */
  async getLeaderboard(limit = 20) {
    try {
      const resp = await fetch(`/auth/leaderboard?limit=${limit}`);
      const data = await resp.json();
      return data.leaderboard || [];
    } catch (err) {
      console.error('Get leaderboard error:', err);
      return [];
    }
  },

  /**
   * Redirect to login if not authenticated
   */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login';
      return false;
    }
    return true;
  }
};

// ======= UI HELPERS =======
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

// ======= THEME TOGGLE =======
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

// ======= INIT =======
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});
