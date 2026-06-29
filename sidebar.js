// sidebar.js — call buildSidebar(activePage, me, branches) to inject nav

function buildSidebar(activePage, me, branches = []) {
  const initials = (me.full_name || me.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const branchItems = branches.map(b => `
    <a class="nav-item ${activePage === 'branch-' + b.id ? 'active' : ''}" href="/tasks?branch=${b.id}">
      <span class="nav-branch-dot" style="background:${b.colour};"></span>
      ${escHtml(b.name)}
    </a>
  `).join('');

  const adminItem = me.is_admin ? `
    <div class="nav-section-label" style="margin-top:8px;">Admin</div>
    <a class="nav-item ${activePage === 'admin' ? 'active' : ''}" href="/admin">
      <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Users
    </a>
  ` : '';

  const html = `
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
      </div>
      <div>
        <div class="logo-text">Productivity</div>
        <div class="logo-sub">Tracker</div>
      </div>
    </div>

    <nav class="nav">
      <div class="nav-section-label">Main</div>
      <a class="nav-item ${activePage === 'dashboard' ? 'active' : ''}" href="/dashboard">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Dashboard
      </a>
      <a class="nav-item ${activePage === 'calendar' ? 'active' : ''}" href="/calendar">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Timesheet
      </a>
      <a class="nav-item ${activePage === 'tasks' ? 'active' : ''}" href="/tasks">
        <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Tasks
      </a>
      <a class="nav-item ${activePage === 'scratchpad' ? 'active' : ''}" href="/scratchpad">
        <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Scratchpad
      </a>
      <a class="nav-item ${activePage === 'reports' ? 'active' : ''}" href="/reports">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Reports
      </a>

      <div class="nav-section-label" style="margin-top:8px;">Branches</div>
      ${branchItems}
      <button class="nav-item" id="new-branch-btn" style="color:var(--text-3);font-size:12px;">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New branch
      </button>

      ${adminItem}
    </nav>

    <div class="sidebar-footer">
      <div class="user-row">
        <div class="avatar">${initials}</div>
        <div style="flex:1;min-width:0;">
          <div class="user-name">${escHtml(me.full_name || me.email)}</div>
          <div class="user-role">${me.is_admin ? 'Admin' : 'Member'}</div>
        </div>
        <button class="signout-btn" onclick="signOut()" title="Sign out">
          <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = html;

  // Wire new-branch button
  const nb = document.getElementById('new-branch-btn');
  if (nb) nb.addEventListener('click', () => openModal('modal-branch'));
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function signOut() {
  await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/';
}
