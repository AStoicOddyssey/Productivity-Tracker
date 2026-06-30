// sidebar.js — call buildSidebar(activePage, me, branches) to inject nav

function buildSidebar(activePage, me, branches = []) {
  const initials = (me.full_name || me.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const branchItems = branches.map(b => `
    <div class="nav-item-branch" style="display:flex;align-items:center;border-radius:6px;overflow:hidden;">
      <a class="nav-item ${activePage === 'branch-' + b.id ? 'active' : ''}"
        href="/tasks?branch=${b.id}"
        style="flex:1;display:flex;align-items:center;gap:10px;padding:7px 6px 7px 10px;text-decoration:none;color:inherit;font-size:13px;font-weight:500;border-radius:0;">
        <span style="width:8px;height:8px;border-radius:50%;background:${b.colour};flex-shrink:0;display:inline-block;"></span>
        ${escHtml(b.name)}
      </a>
      <button onclick="editBranch('${b.id}','${escHtml(b.name)}','${b.colour}',${b.hourly_rate})"
        style="background:none;border:none;cursor:pointer;color:var(--text-3);padding:4px 8px;font-size:12px;line-height:1;flex-shrink:0;"
        title="Edit branch">✎</button>
    </div>
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

    <!-- BRANCH MODALS (injected into every page via sidebar) -->
    <div class="modal-backdrop" id="modal-branch-new" style="display:none;">
      <div class="modal">
        <div class="modal-title">New branch</div>
        <div class="form-field">
          <label class="form-label">Branch name *</label>
          <input class="form-input" id="sb-branch-name" placeholder="e.g. Aloware" />
        </div>
        <div class="form-field">
          <label class="form-label">Colour</label>
          <div class="colour-picker" id="sb-colour-picker-new"></div>
          <input type="hidden" id="sb-branch-colour-new" value="#58a6ff" />
        </div>
        <div class="form-field">
          <label class="form-label">Hourly rate (R/hr)</label>
          <input class="form-input" type="number" id="sb-branch-rate-new" step="0.01" value="133.33" />
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" onclick="closeModal('modal-branch-new')">Cancel</button>
          <button class="btn-primary" onclick="sbSaveBranch()">Create</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" id="modal-branch-edit" style="display:none;">
      <div class="modal">
        <div class="modal-title">Edit branch</div>
        <input type="hidden" id="sb-edit-branch-id" />
        <div class="form-field">
          <label class="form-label">Branch name *</label>
          <input class="form-input" id="sb-edit-branch-name" placeholder="e.g. Aloware" />
        </div>
        <div class="form-field">
          <label class="form-label">Colour</label>
          <div class="colour-picker" id="sb-colour-picker-edit"></div>
          <input type="hidden" id="sb-branch-colour-edit" value="#58a6ff" />
        </div>
        <div class="form-field">
          <label class="form-label">Hourly rate (R/hr)</label>
          <input class="form-input" type="number" id="sb-branch-rate-edit" step="0.01" />
        </div>
        <div class="modal-footer">
          <button class="btn-danger" style="margin-right:auto;" onclick="sbDeleteBranch()">Delete branch</button>
          <button class="btn-ghost" onclick="closeModal('modal-branch-edit')">Cancel</button>
          <button class="btn-primary" onclick="sbUpdateBranch()">Save</button>
        </div>
      </div>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = html;

  // Wire new-branch button
  const nb = document.getElementById('new-branch-btn');
  if (nb) nb.addEventListener('click', () => {
    buildSwatches('sb-colour-picker-new', 'sb-branch-colour-new', '#58a6ff');
    openModal('modal-branch-new');
  });
}

function buildSwatches(pickerId, inputId, selectedColour) {
  const picker = document.getElementById(pickerId);
  if (!picker) return;
  picker.innerHTML = '';
  PALETTE.forEach(c => {
    const sw = document.createElement('div');
    sw.className = 'colour-swatch' + (c === selectedColour ? ' active' : '');
    sw.style.background = c;
    sw.onclick = () => {
      picker.querySelectorAll('.colour-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      document.getElementById(inputId).value = c;
    };
    picker.appendChild(sw);
  });
}

function editBranch(id, name, colour, rate) {
  document.getElementById('sb-edit-branch-id').value = id;
  document.getElementById('sb-edit-branch-name').value = name;
  document.getElementById('sb-branch-colour-edit').value = colour;
  document.getElementById('sb-branch-rate-edit').value = rate;
  buildSwatches('sb-colour-picker-edit', 'sb-branch-colour-edit', colour);
  openModal('modal-branch-edit');
}

async function sbSaveBranch() {
  const name   = document.getElementById('sb-branch-name').value.trim();
  const colour = document.getElementById('sb-branch-colour-new').value;
  const rate   = parseFloat(document.getElementById('sb-branch-rate-new').value) || 133.33;
  if (!name) { toast('Branch name required', 'error'); return; }
  try {
    await POST('branches', { name, colour, hourly_rate: rate });
    closeModal('modal-branch-new');
    toast('Branch created', 'success');
    setTimeout(() => location.reload(), 600);
  } catch(e) { toast(e.message, 'error'); }
}

async function sbUpdateBranch() {
  const id     = document.getElementById('sb-edit-branch-id').value;
  const name   = document.getElementById('sb-edit-branch-name').value.trim();
  const colour = document.getElementById('sb-branch-colour-edit').value;
  const rate   = parseFloat(document.getElementById('sb-branch-rate-edit').value) || 133.33;
  if (!name) { toast('Branch name required', 'error'); return; }
  try {
    await PATCH('branches', { id, name, colour, hourly_rate: rate });
    closeModal('modal-branch-edit');
    toast('Branch updated', 'success');
    setTimeout(() => location.reload(), 600);
  } catch(e) { toast(e.message, 'error'); }
}

async function sbDeleteBranch() {
  const id = document.getElementById('sb-edit-branch-id').value;
  if (!confirm('Delete this branch? Tasks will become unassigned.')) return;
  try {
    await DELETE('branches', { id });
    closeModal('modal-branch-edit');
    toast('Branch deleted', 'success');
    setTimeout(() => location.reload(), 600);
  } catch(e) { toast(e.message, 'error'); }
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function signOut() {
  await fetch('/api/auth?action=logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/';
}
