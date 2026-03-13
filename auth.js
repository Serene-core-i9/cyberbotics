'use strict';

const API_BASE = 'https://cyberbotics.onrender.com';
window._cbApiBase = API_BASE;

let currentUser  = null;
let authToken    = null;
window._cbLoggedIn = false;
window._cbToken    = null;

/* ── MODAL OPEN / CLOSE ─────────────────────────────────── */
function openAuth(tab = 'login') {
  document.getElementById('authOverlay').classList.add('open');
  switchAuthTab(tab);
  document.body.style.overflow = 'hidden';
}

function closeAuth() {
  document.getElementById('authOverlay').classList.remove('open');
  document.body.style.overflow = '';
  clearAuthStatus();
}

function closeAuthOnBg(e) {
  if (e.target === document.getElementById('authOverlay')) closeAuth();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAuth(); });

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  const form   = document.getElementById('form-' + tab);
  const tabBtn = document.getElementById('tab-' + tab);
  if (form)   form.classList.add('active');
  if (tabBtn) tabBtn.classList.add('active');
  clearAuthStatus();
}

function setAuthStatus(msg, type = 'info') {
  const el = document.getElementById('authStatus');
  el.textContent = msg;
  el.className   = `auth-status show ${type}`;
}
function clearAuthStatus() {
  const el = document.getElementById('authStatus');
  el.className   = 'auth-status';
  el.textContent = '';
}

/* ── PASSWORD UX ────────────────────────────────────────── */
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else                           { input.type = 'password'; btn.textContent = '👁'; }
}

(function initStrength() {
  const input = document.getElementById('signup-password');
  if (!input) return;
  input.addEventListener('input', () => {
    const score  = calcStrength(input.value);
    const fill   = document.getElementById('strengthFill');
    const label  = document.getElementById('strengthLabel');
    const levels = [
      { pct: 0,   color: 'var(--advanced)',     text: '—' },
      { pct: 20,  color: 'var(--advanced)',     text: 'WEAK' },
      { pct: 45,  color: 'var(--orange)',       text: 'FAIR' },
      { pct: 70,  color: 'var(--intermediate)', text: 'GOOD' },
      { pct: 90,  color: 'var(--green)',        text: 'STRONG' },
      { pct: 100, color: '#00ffcc',             text: 'EXCELLENT' },
    ];
    const lvl = levels[score];
    fill.style.width      = lvl.pct + '%';
    fill.style.background = lvl.color;
    label.textContent     = lvl.text;
    label.style.color     = lvl.color;
  });
})();

function calcStrength(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (pwd.length >= 12)         s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

/* ── API HELPER ─────────────────────────────────────────── */
function setLoading(submitId, loaderId, loading) {
  const btn    = document.getElementById(submitId);
  const loader = document.getElementById(loaderId);
  const text   = btn && btn.querySelector('.submit-text');
  if (!btn) return;
  btn.disabled = loading;
  if (loader) loader.classList.toggle('hidden', !loading);
  if (text)   text.style.opacity = loading ? '0.4' : '1';
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  const res  = await fetch(API_BASE + path, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Server error');
  return data;
}

/* ── LOGIN ──────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  clearAuthStatus();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('remember').checked;

  setLoading('login-submit', 'login-loader', true);
  setAuthStatus('Authenticating...', 'info');

  try {
    const data  = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    authToken   = data.token;
    currentUser = data.user;

    const store = remember ? localStorage : sessionStorage;
    store.setItem('cb_token', authToken);
    store.setItem('cb_user',  JSON.stringify(currentUser));

    setAuthStatus(`Welcome back, ${currentUser.username}!`, 'success');
    setTimeout(() => { closeAuth(); onLoginSuccess(); }, 900);
  } catch (err) {
    setAuthStatus('❌ ' + err.message, 'error');
  } finally {
    setLoading('login-submit', 'login-loader', false);
  }
}

/* ── SIGNUP ─────────────────────────────────────────────── */
async function handleSignup(e) {
  e.preventDefault();
  clearAuthStatus();

  const username = document.getElementById('signup-username').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;

  if (password !== confirm) { setAuthStatus('❌ Passwords do not match.', 'error'); return; }
  if (calcStrength(password) < 2) { setAuthStatus('❌ Password too weak. Add uppercase, numbers, or symbols.', 'error'); return; }

  setLoading('signup-submit', 'signup-loader', true);
  setAuthStatus('Creating account...', 'info');

  try {
    const data  = await apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) });
    authToken   = data.token;
    currentUser = data.user;

    sessionStorage.setItem('cb_token', authToken);
    sessionStorage.setItem('cb_user',  JSON.stringify(currentUser));

    setAuthStatus(`✅ Account created! Welcome, ${currentUser.username}!`, 'success');
    setTimeout(() => { closeAuth(); onLoginSuccess(); }, 1000);
  } catch (err) {
    setAuthStatus('❌ ' + err.message, 'error');
  } finally {
    setLoading('signup-submit', 'signup-loader', false);
  }
}

/* ── FORGOT PASSWORD ────────────────────────────────────── */
async function handleForgot(e) {
  e.preventDefault();
  clearAuthStatus();
  const email = document.getElementById('forgot-email').value.trim();
  setAuthStatus('Sending reset link...', 'info');
  try {
    await apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    setAuthStatus('✅ Reset link sent! Check your inbox.', 'success');
  } catch (err) {
    setAuthStatus('❌ ' + err.message, 'error');
  }
}

/* ── LOGOUT ─────────────────────────────────────────────── */
function logout() {
  authToken   = null;
  currentUser = null;
  window._cbLoggedIn = false;
  window._cbToken    = null;
  localStorage.removeItem('cb_token');
  localStorage.removeItem('cb_user');
  sessionStorage.removeItem('cb_token');
  sessionStorage.removeItem('cb_user');
  onLogoutSuccess();
}

function oauthNotice(provider) {
  setAuthStatus(`ℹ️ ${provider} OAuth requires backend configuration. See deployment guide.`, 'info');
}

/* ── POST-LOGIN / POST-LOGOUT ───────────────────────────── */
function onLoginSuccess() {
  window._cbLoggedIn = true;
  window._cbToken    = authToken;

  document.getElementById('navAuth').classList.add('hidden');
  document.getElementById('navUser').classList.remove('hidden');
  document.getElementById('navUserName').textContent = currentUser.username.toUpperCase();

  if (typeof applyGating === 'function') applyGating(true);

  showToast(`SYSTEM ACCESS GRANTED — ${currentUser.username.toUpperCase()}`);
}

function onLogoutSuccess() {
  document.getElementById('navAuth').classList.remove('hidden');
  document.getElementById('navUser').classList.add('hidden');

  if (typeof applyGating === 'function') applyGating(false);

  showToast('SESSION TERMINATED');
}

/* ── TOAST ──────────────────────────────────────────────── */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className   = 'cb-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

/* ── SESSION RESTORE ────────────────────────────────────── */
(function restoreSession() {
  const token = localStorage.getItem('cb_token') || sessionStorage.getItem('cb_token');
  const user  = localStorage.getItem('cb_user')  || sessionStorage.getItem('cb_user');

  if (token && user) {
    try {
      authToken   = token;
      currentUser = JSON.parse(user);
      apiFetch('/api/auth/me').then(data => {
        currentUser = data.user;
        onLoginSuccess();
      }).catch(() => logout());
    } catch (_) {
      logout();
    }
  }
})();

/* ── TOAST STYLES ───────────────────────────────────────── */
(function injectToastStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .cb-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
      background: rgba(4,15,8,0.95); border: 1px solid var(--border);
      font-family: 'Share Tech Mono', monospace; font-size: 0.7rem;
      letter-spacing: 2px; color: var(--green); padding: 12px 24px;
      z-index: 9999; opacity: 0; transition: all 0.35s; white-space: nowrap;
      clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    }
    .cb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(style);
})();
