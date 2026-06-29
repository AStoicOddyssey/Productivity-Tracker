// ── CONFIG ────────────────────────────────────────────────────
const PALETTE = [
  '#58a6ff', // blue
  '#3fb950', // green
  '#d29922', // yellow
  '#f85149', // red
  '#bc8cff', // purple
  '#ff7b72', // coral
  '#39d353', // bright green
  '#ffa657', // orange
  '#79c0ff', // light blue
  '#56d364', // mint
  '#e3b341', // amber
  '#db61a2', // pink
];

// ── API HELPER ────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin'
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api/' + path, opts);
  if (res.status === 401) {
    window.location.href = '/';
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const GET    = (path, params) => api('GET',    path + (params ? '?' + new URLSearchParams(params) : ''));
const POST   = (path, body)   => api('POST',   path, body);
const PATCH  = (path, body)   => api('PATCH',  path, body);
const DELETE = (path, body)   => api('DELETE', path, body);

// ── AUTH GUARD ────────────────────────────────────────────────
async function requireLogin() {
  try {
    const me = await GET('auth', { action: 'me' });
    if (!me) return null;
    return me;
  } catch {
    window.location.href = '/';
    return null;
  }
}

// ── DATE HELPERS ──────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function isOverdue(due_at) {
  if (!due_at) return false;
  return new Date(due_at) < new Date();
}

// ── SLOT HELPERS ──────────────────────────────────────────────
// Generate 30-min slots from startHour to endHour
function generateSlots(startHour = 10, endHour = 18) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2,'0')}:00`);
    slots.push(`${String(h).padStart(2,'0')}:30`);
  }
  return slots;
}

function slotEnd(slotStart) {
  const [h, m] = slotStart.split(':').map(Number);
  const total = h * 60 + m + 30;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

// ── COLOUR HELPERS ────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

function colourBg(hex, alpha = 0.15) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── TOAST NOTIFICATION ────────────────────────────────────────
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; requestAnimationFrame(() => m.classList.add('open')); }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); setTimeout(() => m.style.display = 'none', 200); }
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    setTimeout(() => e.target.style.display = 'none', 200);
  }
});

// ── REMINDER CHECK ────────────────────────────────────────────
async function checkReminder(me) {
  const settings = await GET('reminders').catch(() => null);
  if (!settings?.enabled) return;

  const now  = new Date();
  const [rh, rm] = settings.reminder_time.split(':').map(Number);
  const reminderMs = (rh * 60 + rm) * 60 * 1000;
  const nowMs = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000;

  // Fire if within 15 minutes of reminder time and not already dismissed today
  const lastDismissed = localStorage.getItem('reminder_dismissed');
  if (lastDismissed === today()) return;
  if (Math.abs(nowMs - reminderMs) > 15 * 60 * 1000) return;

  // Check if any time logged today
  const logs = await GET('time-logs', { date: today() }).catch(() => []);
  if (logs?.length > 0) return;

  showReminderBanner();
}

function showReminderBanner() {
  const banner = document.createElement('div');
  banner.className = 'reminder-banner';
  banner.innerHTML = `
    <span>⏰ You haven't logged any time today.</span>
    <div style="display:flex;gap:8px;">
      <button class="btn-primary" style="font-size:12px;padding:4px 12px;" onclick="window.location.href='/calendar'">Log time</button>
      <button class="btn-ghost" style="font-size:12px;padding:4px 12px;" onclick="dismissReminder(this.closest('.reminder-banner'))">Dismiss</button>
    </div>
  `;
  document.body.prepend(banner);
}

function dismissReminder(el) {
  localStorage.setItem('reminder_dismissed', today());
  el?.remove();
}
