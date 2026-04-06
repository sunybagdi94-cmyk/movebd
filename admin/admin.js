// ============================================================
// CineZoneBD – Admin Panel JavaScript
// ============================================================

const ADMIN_CREDENTIALS = { user: 'admin', pass: 'admin123' };
let currentPage = 'dashboard';
let adminContent = [];
let tableCurrentPage = 1;
const TABLE_PAGE_SIZE = 12;
let tableFilter = { search: '', type: '', status: '' };
let deleteTargetId = null;

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (localStorage.getItem('czbd_admin_logged_in') === 'true') {
    const user = localStorage.getItem('czbd_admin_user') || 'Admin';
    loginSuccess(user);
  }

  loadAdminContent();
  setupLogin();
  setupNav();
  setupSidebar();
  setupContentForm();
  setupPosterPreview();
});

function loadAdminContent() {
  adminContent = JSON.parse(localStorage.getItem('czbd_content') || '[]');
}

function saveAdminContent() {
  localStorage.setItem('czbd_content', JSON.stringify(adminContent));
}

// ---- LOGIN ----
function setupLogin() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginError');

    if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
      errEl.style.display = 'none';
      localStorage.setItem('czbd_admin_logged_in', 'true');
      localStorage.setItem('czbd_admin_user', user);
      loginSuccess(user);
    } else {
      errEl.style.display = 'flex';
      document.getElementById('loginPass').value = '';
    }
  });

  // Password toggle
  document.getElementById('pwToggle').addEventListener('click', function() {
    const input = document.getElementById('loginPass');
    const icon = this.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('czbd_admin_logged_in');
    localStorage.removeItem('czbd_admin_user');
    document.getElementById('adminLayout').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    showAdminToast('Logged out successfully');
  });
}

function loginSuccess(username) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  document.getElementById('adminUsername').textContent = username;
  navigateTo('dashboard');
}

// ---- NAVIGATION ----
function setupNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
      // Close sidebar on mobile
      document.getElementById('adminSidebar').classList.remove('open');
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');

  const titles = { dashboard: 'Dashboard', content: 'Content Library', add: 'Add New Content', categories: 'Categories & Tags', settings: 'Site Settings' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'content': tableCurrentPage = 1; renderContentPage(); break;
    case 'add':
      currentPage = 'content';
      tableCurrentPage = 1;
      renderContentPage();
      setTimeout(() => openContentModal(null), 50);
      break;
    case 'categories': renderCategoriesPage(); break;
    case 'settings': renderSettingsPage(); break;
  }
}

// ---- SIDEBAR MOBILE ----
function setupSidebar() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });
  document.getElementById('sidebarClose').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.remove('open');
  });
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const all = getAllItems();
  const movies = all.filter(i => i.type === 'movie').length;
  const series = all.filter(i => i.type === 'series').length;
  const anime = all.filter(i => i.type === 'anime').length;
  const pinned = all.filter(i => i.pinned).length;
  const featured = all.filter(i => i.featured).length;
  const recent = [...all].sort((a,b) => new Date(b.addedDate) - new Date(a.addedDate)).slice(0, 8);

  document.getElementById('adminContent').innerHTML = `
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card stat-total">
        <div class="stat-icon"><i class="fas fa-database"></i></div>
        <div class="stat-info"><h3>${all.length}</h3><p>Total Content</p></div>
      </div>
      <div class="stat-card stat-movie">
        <div class="stat-icon"><i class="fas fa-film"></i></div>
        <div class="stat-info"><h3>${movies}</h3><p>Movies</p></div>
      </div>
      <div class="stat-card stat-series">
        <div class="stat-icon"><i class="fas fa-tv"></i></div>
        <div class="stat-info"><h3>${series}</h3><p>Series</p></div>
      </div>
      <div class="stat-card stat-anime">
        <div class="stat-icon"><i class="fas fa-dragon"></i></div>
        <div class="stat-info"><h3>${anime}</h3><p>Anime</p></div>
      </div>
      <div class="stat-card stat-pinned">
        <div class="stat-icon"><i class="fas fa-thumbtack"></i></div>
        <div class="stat-info"><h3>${pinned}</h3><p>Pinned</p></div>
      </div>
      <div class="stat-card stat-featured">
        <div class="stat-icon"><i class="fas fa-star"></i></div>
        <div class="stat-info"><h3>${featured}</h3><p>Featured</p></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section-block" style="margin-bottom:20px">
      <div class="section-block-header">
        <h3><i class="fas fa-bolt"></i> Quick Actions</h3>
      </div>
      <div style="padding:16px;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn-sm" onclick="openContentModal(null)"><i class="fas fa-plus"></i> Add Content</button>
        <button class="btn-sm btn-sm-outline" onclick="navigateTo('content')"><i class="fas fa-list"></i> View Library</button>
        <button class="btn-sm btn-sm-outline" onclick="navigateTo('categories')"><i class="fas fa-tags"></i> Categories</button>
        <button class="btn-sm" style="background:#8b5cf6" onclick="navigateTo('settings')"><i class="fas fa-cog"></i> Settings</button>
      </div>
    </div>

    <!-- Recent Content -->
    <div class="section-block">
      <div class="section-block-header">
        <h3><i class="fas fa-clock"></i> Recently Added</h3>
        <button class="btn-sm btn-sm-outline" onclick="navigateTo('content')">View All</button>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr>
            <th>Title</th>
            <th>Type</th>
            <th>Language</th>
            <th>Status</th>
            <th>Pinned</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${recent.map(item => buildTableRow(item)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

// ============================================================
// CONTENT LIBRARY
// ============================================================
function renderContentPage() {
  navigateToDashboardSection('content');
}

function navigateToDashboardSection(tab) {
  document.getElementById('adminContent').innerHTML = `
    <div class="filter-bar">
      <input type="text" id="tableSearch" placeholder="🔍 Search title..." value="${tableFilter.search}" oninput="updateTableFilter()" />
      <select id="typeFilter" onchange="updateTableFilter()">
        <option value="">All Types</option>
        <option value="movie" ${tableFilter.type==='movie'?'selected':''}>🎬 Movie</option>
        <option value="series" ${tableFilter.type==='series'?'selected':''}>📺 Series</option>
        <option value="anime" ${tableFilter.type==='anime'?'selected':''}>🐉 Anime</option>
      </select>
      <select id="statusFilter" onchange="updateTableFilter()">
        <option value="">All Status</option>
        <option value="ongoing" ${tableFilter.status==='ongoing'?'selected':''}>Ongoing</option>
        <option value="completed" ${tableFilter.status==='completed'?'selected':''}>Completed</option>
        <option value="upcoming" ${tableFilter.status==='upcoming'?'selected':''}>Upcoming</option>
      </select>
      <button class="btn-sm" onclick="openContentModal(null)"><i class="fas fa-plus"></i> Add New</button>
    </div>
    <div class="section-block">
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr>
            <th>Title</th>
            <th>Type</th>
            <th>Language</th>
            <th>Quality</th>
            <th>Status</th>
            <th>Visible</th>
            <th>Pinned</th>
            <th>Actions</th>
          </tr></thead>
          <tbody id="contentTableBody"></tbody>
        </table>
      </div>
      <div id="paginationArea"></div>
    </div>`;

  renderContentTable();
}

function updateTableFilter() {
  tableFilter.search = document.getElementById('tableSearch')?.value || '';
  tableFilter.type = document.getElementById('typeFilter')?.value || '';
  tableFilter.status = document.getElementById('statusFilter')?.value || '';
  tableCurrentPage = 1;
  renderContentTable();
}

function renderContentTable() {
  const all = getAllItems();
  let filtered = all;

  if (tableFilter.search) {
    const q = tableFilter.search.toLowerCase();
    filtered = filtered.filter(i => i.title.toLowerCase().includes(q));
  }
  if (tableFilter.type) filtered = filtered.filter(i => i.type === tableFilter.type);
  if (tableFilter.status) filtered = filtered.filter(i => i.status === tableFilter.status);

  const total = filtered.length;
  const totalPages = Math.ceil(total / TABLE_PAGE_SIZE);
  const start = (tableCurrentPage - 1) * TABLE_PAGE_SIZE;
  const page = filtered.slice(start, start + TABLE_PAGE_SIZE);

  const tbody = document.getElementById('contentTableBody');
  if (!tbody) return;

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No Content Found</h3>
        <p>Try changing filters or add new content</p>
      </div>
    </td></tr>`;
  } else {
    tbody.innerHTML = page.map(item => buildTableRowFull(item)).join('');
  }

  // Pagination
  const paginationArea = document.getElementById('paginationArea');
  if (paginationArea && totalPages > 1) {
    let paginationHTML = `<div class="pagination"><span class="page-info">${start+1}-${Math.min(start+TABLE_PAGE_SIZE, total)} of ${total}</span>`;
    if (tableCurrentPage > 1) paginationHTML += `<button class="page-btn" onclick="goToPage(${tableCurrentPage-1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i <= 3 || i > totalPages-2 || Math.abs(i - tableCurrentPage) <= 1) {
        paginationHTML += `<button class="page-btn ${i===tableCurrentPage?'active':''}" onclick="goToPage(${i})">${i}</button>`;
      } else if (i === 4 && tableCurrentPage > 4) {
        paginationHTML += `<span class="page-btn">…</span>`;
      }
    }
    if (tableCurrentPage < totalPages) paginationHTML += `<button class="page-btn" onclick="goToPage(${tableCurrentPage+1})"><i class="fas fa-chevron-right"></i></button>`;
    paginationHTML += `</div>`;
    paginationArea.innerHTML = paginationHTML;
  } else if (paginationArea) {
    paginationArea.innerHTML = '';
  }
}

function goToPage(page) {
  tableCurrentPage = page;
  renderContentTable();
}

function buildTableRow(item) {
  return `<tr>
    <td><div class="td-title">
      <img class="td-poster" src="${item.poster}" onerror="this.src='https://placehold.co/38x54/1a1a2e/666?text=?'" />
      <span class="td-title-text">${item.title}</span>
    </div></td>
    <td><span class="badge badge-${item.type}">${capitalize(item.type)}</span></td>
    <td>${getLangShort(item.language)}</td>
    <td><span class="badge badge-${item.status}">${capitalize(item.status)}</span></td>
    <td>${item.pinned ? '<span class="badge badge-pinned">📌 Yes</span>' : '<span class="badge badge-no">No</span>'}</td>
    <td class="td-actions">
      <button class="btn-action btn-edit" onclick="openContentModal('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="btn-action btn-delete" onclick="confirmDelete('${item.id}')" title="Delete"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`;
}

function buildTableRowFull(item) {
  return `<tr>
    <td><div class="td-title">
      <img class="td-poster" src="${item.poster}" onerror="this.src='https://placehold.co/38x54/1a1a2e/666?text=?'" />
      <span class="td-title-text">${item.title}</span>
    </div></td>
    <td><span class="badge badge-${item.type}">${capitalize(item.type)}</span></td>
    <td>${getLangShort(item.language)}</td>
    <td><span class="badge badge-no" style="background:rgba(0,212,170,0.1);color:#00d4aa">${item.quality || 'WEB-DL'}</span></td>
    <td><span class="badge badge-${item.status}">${capitalize(item.status)}</span></td>
    <td>${item.visible !== false ? '<span class="badge badge-visible">Visible</span>' : '<span class="badge badge-hidden">Hidden</span>'}</td>
    <td>${item.pinned ? '<span class="badge badge-pinned">📌</span>' : '—'}</td>
    <td class="td-actions">
      <button class="btn-action btn-edit" onclick="openContentModal('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
      <button class="btn-action btn-pin" onclick="togglePin('${item.id}')" title="${item.pinned ? 'Unpin' : 'Pin'}"><i class="fas fa-thumbtack"></i></button>
      <button class="btn-action btn-vis" onclick="toggleVisible('${item.id}')" title="${item.visible !== false ? 'Hide' : 'Show'}"><i class="fas fa-eye${item.visible !== false ? '' : '-slash'}"></i></button>
      <button class="btn-action btn-delete" onclick="confirmDelete('${item.id}')" title="Delete"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`;
}

// ============================================================
// CONTENT FORM (ADD/EDIT)
// ============================================================
function setupContentForm() {
  document.getElementById('contentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveContentItem();
  });
}

function setupPosterPreview() {
  // Use event delegation since the form is always in the DOM
  document.getElementById('f_poster').addEventListener('input', function() {
    const img = document.getElementById('posterPreviewImg');
    if (img) img.src = this.value || 'https://placehold.co/80x112/1a1a2e/666?text=Preview';
  });
}

function openContentModal(id) {
  const modal = document.getElementById('contentModal');
  const form = document.getElementById('contentForm');
  const titleEl = document.getElementById('modalFormTitle');

  // Reset form
  form.reset();
  document.getElementById('f_visible').checked = true;
  document.getElementById('posterPreviewImg').src = 'https://placehold.co/80x112/1a1a2e/666?text=Preview';

  // Set default date to today
  document.getElementById('f_date').value = new Date().toISOString().split('T')[0];

  if (id) {
    // Edit mode
    const item = getAllItems().find(i => i.id === id);
    if (!item) return;
    titleEl.textContent = 'Edit Content';
    document.getElementById('editItemId').value = id;
    document.getElementById('f_title').value = item.title || '';
    document.getElementById('f_poster').value = item.poster || '';
    document.getElementById('posterPreviewImg').src = item.poster || 'https://placehold.co/80x112/1a1a2e/666?text=Preview';
    document.getElementById('f_type').value = item.type || 'movie';
    document.getElementById('f_language').value = item.language || 'bangla';
    document.getElementById('f_quality').value = item.quality || 'WEB-DL';
    document.getElementById('f_status').value = item.status || 'ongoing';
    document.getElementById('f_year').value = item.year || '';
    document.getElementById('f_rating').value = item.rating || '';
    document.getElementById('f_views').value = item.views || '';
    document.getElementById('f_episodes').value = item.episodes || '';
    document.getElementById('f_desc').value = item.description || '';
    document.getElementById('f_genre').value = (item.genre || []).join(', ');
    document.getElementById('f_tags').value = (item.tags || []).join(', ');
    document.getElementById('f_date').value = item.addedDate || '';
    document.getElementById('f_pinned').checked = !!item.pinned;
    document.getElementById('f_featured').checked = !!item.featured;
    document.getElementById('f_dubbed').checked = !!item.dubbed;
    document.getElementById('f_visible').checked = item.visible !== false;
  } else {
    titleEl.textContent = 'Add New Content';
    document.getElementById('editItemId').value = '';
  }

  modal.classList.add('active');
}

function closeContentModal(e) {
  if (e.target === document.getElementById('contentModal')) closeContentModalBtn();
}
function closeContentModalBtn() {
  document.getElementById('contentModal').classList.remove('active');
}

function saveContentItem() {
  const id = document.getElementById('editItemId').value;
  const title = document.getElementById('f_title').value.trim();
  const poster = document.getElementById('f_poster').value.trim();

  if (!title) { showAdminToast('Title is required!', true); return; }

  const item = {
    id: id || 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title,
    poster: poster || 'https://placehold.co/300x420/1a1a2e/666?text=No+Poster',
    type: document.getElementById('f_type').value,
    language: document.getElementById('f_language').value,
    quality: document.getElementById('f_quality').value,
    status: document.getElementById('f_status').value,
    year: parseInt(document.getElementById('f_year').value) || new Date().getFullYear(),
    rating: document.getElementById('f_rating').value || null,
    views: document.getElementById('f_views').value || '0',
    episodes: document.getElementById('f_episodes').value || null,
    description: document.getElementById('f_desc').value || '',
    genre: document.getElementById('f_genre').value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    tags: document.getElementById('f_tags').value.split(',').map(s => s.trim()).filter(Boolean),
    addedDate: document.getElementById('f_date').value || new Date().toISOString().split('T')[0],
    pinned: document.getElementById('f_pinned').checked,
    featured: document.getElementById('f_featured').checked,
    dubbed: document.getElementById('f_dubbed').checked,
    visible: document.getElementById('f_visible').checked,
  };

  if (id) {
    // Update in adminContent
    const idx = adminContent.findIndex(c => c.id === id);
    if (idx >= 0) {
      adminContent[idx] = item;
    } else {
      adminContent.unshift(item);
    }
    showAdminToast('✅ Content updated successfully!');
  } else {
    adminContent.unshift(item);
    showAdminToast('✅ Content added successfully!');
  }

  saveAdminContent();
  closeContentModalBtn();

  // Re-render current page
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'content') renderContentPage();
}

// ---- Quick Toggle ----
function togglePin(id) {
  const item = findAndModify(id, i => { i.pinned = !i.pinned; });
  if (item) {
    saveAdminContent();
    renderContentPage();
    showAdminToast(item.pinned ? '📌 Content pinned!' : 'Unpinned');
  }
}

function toggleVisible(id) {
  const item = findAndModify(id, i => { i.visible = i.visible === false ? true : false; });
  if (item) {
    saveAdminContent();
    renderContentPage();
    showAdminToast(item.visible !== false ? '👁️ Content is now visible' : '🙈 Content hidden');
  }
}

function findAndModify(id, modifier) {
  // Check adminContent first
  let item = adminContent.find(i => i.id === id);
  if (item) {
    modifier(item);
    return item;
  }
  // Clone from ALL_CONTENT into adminContent
  const base = window.ALL_CONTENT.find(i => i.id === id);
  if (base) {
    const clone = { ...base };
    modifier(clone);
    adminContent.push(clone);
    return clone;
  }
  return null;
}

// ---- DELETE ----
function confirmDelete(id) {
  deleteTargetId = id;
  document.getElementById('confirmModal').style.display = 'flex';
  document.getElementById('confirmDeleteBtn').onclick = () => {
    deleteItem(deleteTargetId);
    closeConfirm();
  };
}
function closeConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
  deleteTargetId = null;
}
function deleteItem(id) {
  // Remove from adminContent
  const idx = adminContent.findIndex(i => i.id === id);
  if (idx >= 0) adminContent.splice(idx, 1);
  // Mark as deleted in a deletedIds list (for sample data)
  const deleted = JSON.parse(localStorage.getItem('czbd_deleted') || '[]');
  if (!deleted.includes(id)) deleted.push(id);
  localStorage.setItem('czbd_deleted', JSON.stringify(deleted));

  saveAdminContent();
  showAdminToast('🗑️ Content deleted');
  if (currentPage === 'dashboard') renderDashboard();
  else renderContentPage();
}

// ---- All Items (merged) ----
function getAllItems() {
  const deleted = JSON.parse(localStorage.getItem('czbd_deleted') || '[]');
  const adminIds = new Set(adminContent.map(i => i.id));
  // Merge: admin items + sample items (excluding deleted and overridden)
  const sampleItems = window.ALL_CONTENT.filter(i => !deleted.includes(i.id) && !adminIds.has(i.id));
  return [...adminContent.filter(i => !deleted.includes(i.id)), ...sampleItems];
}

// ============================================================
// CATEGORIES PAGE
// ============================================================
function renderCategoriesPage() {
  const all = getAllItems();
  const categories = window.CATEGORIES || [];

  const catCounts = {};
  all.forEach(item => {
    (item.genre || []).forEach(g => { catCounts[g] = (catCounts[g] || 0) + 1; });
  });

  // Languages
  const langCount = { bangla: 0, hindi: 0, english: 0, dual: 0 };
  all.forEach(i => { if (langCount[i.language] !== undefined) langCount[i.language]++; });

  document.getElementById('adminContent').innerHTML = `
    <div class="section-block" style="margin-bottom:20px">
      <div class="section-block-header">
        <h3><i class="fas fa-tags"></i> Genres (${categories.length})</h3>
        <button class="btn-sm" onclick="addCategoryPrompt()"><i class="fas fa-plus"></i> Add Genre</button>
      </div>
      <div class="cat-grid">
        ${categories.map(cat => `
          <div class="cat-item" id="cat_${cat.id}">
            <div class="cat-item-left">
              <div class="cat-icon"><i class="fas ${cat.icon || 'fa-tag'}"></i></div>
              <div>
                <div class="cat-name">${cat.name}</div>
                <div class="cat-count">${catCounts[cat.slug] || 0} items</div>
              </div>
            </div>
            <button class="btn-action btn-delete" onclick="deleteCategory('${cat.id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>`).join('')}
      </div>
    </div>

    <div class="section-block" style="margin-bottom:20px">
      <div class="section-block-header">
        <h3><i class="fas fa-language"></i> Languages</h3>
      </div>
      <div class="cat-grid">
        ${[
          { name: 'Bangla', icon: '🇧🇩', key: 'bangla' },
          { name: 'Hindi', icon: '🇮🇳', key: 'hindi' },
          { name: 'English', icon: '🇺🇸', key: 'english' },
          { name: 'Dual Audio', icon: '🌐', key: 'dual' }
        ].map(l => `
          <div class="cat-item">
            <div class="cat-item-left">
              <div class="cat-icon" style="font-size:1.2rem;background:rgba(0,212,170,0.1)">${l.icon}</div>
              <div>
                <div class="cat-name">${l.name}</div>
                <div class="cat-count">${langCount[l.key]} items</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <div class="section-block">
      <div class="section-block-header">
        <h3><i class="fas fa-film"></i> Content Types</h3>
      </div>
      <div class="cat-grid">
        ${[
          { name: 'Movies', key: 'movie', icon: 'fa-film', color: 'rgba(233,69,96,0.15)', colorText: '#e94560' },
          { name: 'Series', key: 'series', icon: 'fa-tv', color: 'rgba(59,130,246,0.15)', colorText: '#3b82f6' },
          { name: 'Anime', key: 'anime', icon: 'fa-dragon', color: 'rgba(139,92,246,0.15)', colorText: '#8b5cf6' }
        ].map(t => `
          <div class="cat-item">
            <div class="cat-item-left">
              <div class="cat-icon" style="background:${t.color};color:${t.colorText}"><i class="fas ${t.icon}"></i></div>
              <div>
                <div class="cat-name">${t.name}</div>
                <div class="cat-count">${all.filter(i=>i.type===t.key).length} items</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function addCategoryPrompt() {
  const name = prompt('Enter new genre/category name:');
  if (name && name.trim()) {
    const cats = window.CATEGORIES || [];
    cats.push({
      id: 'cat_' + Date.now(),
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      icon: 'fa-tag'
    });
    window.CATEGORIES = cats;
    showAdminToast('✅ Category added: ' + name.trim());
    renderCategoriesPage();
  }
}

function deleteCategory(id) {
  if (!confirm('Delete this category?')) return;
  window.CATEGORIES = (window.CATEGORIES || []).filter(c => c.id !== id);
  showAdminToast('🗑️ Category deleted');
  renderCategoriesPage();
}

// ============================================================
// SETTINGS PAGE
// ============================================================
function renderSettingsPage() {
  const settings = JSON.parse(localStorage.getItem('czbd_settings') || '{}');
  document.getElementById('adminContent').innerHTML = `
    <div class="settings-section">
      <h3><i class="fas fa-info-circle"></i> Site Information</h3>
      <div class="settings-form">
        <div class="form-group">
          <label>Site Name</label>
          <input type="text" id="s_name" value="${settings.siteName || 'CineZoneBD'}" placeholder="CineZoneBD" />
        </div>
        <div class="form-group">
          <label>Tagline</label>
          <input type="text" id="s_tagline" value="${settings.tagline || '13,500+ Movies, Series & Anime – Watch & Chill'}" />
        </div>
        <div class="form-group">
          <label>Admin Email</label>
          <input type="email" id="s_email" value="${settings.email || ''}" placeholder="admin@example.com" />
        </div>
        <button class="btn-save-settings" onclick="saveSettings()"><i class="fas fa-save"></i> Save Settings</button>
      </div>
    </div>

    <div class="settings-section">
      <h3><i class="fas fa-shield-alt"></i> Admin Credentials</h3>
      <div class="settings-form">
        <div class="form-group">
          <label>Change Username</label>
          <input type="text" id="s_newuser" placeholder="New username" />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="s_newpass" placeholder="New password" />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" id="s_confpass" placeholder="Confirm new password" />
        </div>
        <button class="btn-save-settings" onclick="changeCredentials()"><i class="fas fa-key"></i> Update Credentials</button>
      </div>
    </div>

    <div class="settings-section">
      <h3><i class="fas fa-database"></i> Data Management</h3>
      <div class="settings-form">
        <p style="font-size:0.85rem;color:#9ca3af;margin-bottom:10px;">
          <i class="fas fa-info-circle"></i> All content is stored in your browser's localStorage. Export to backup.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn-save-settings" onclick="exportData()"><i class="fas fa-download"></i> Export Data (JSON)</button>
          <button class="btn-danger" onclick="clearAllAdminData()"><i class="fas fa-trash-alt"></i> Clear All Admin Data</button>
        </div>
      </div>
    </div>`;
}

function saveSettings() {
  const settings = {
    siteName: document.getElementById('s_name').value,
    tagline: document.getElementById('s_tagline').value,
    email: document.getElementById('s_email').value
  };
  localStorage.setItem('czbd_settings', JSON.stringify(settings));
  showAdminToast('✅ Settings saved!');
}

function changeCredentials() {
  const newUser = document.getElementById('s_newuser').value.trim();
  const newPass = document.getElementById('s_newpass').value;
  const confPass = document.getElementById('s_confpass').value;
  if (!newUser || !newPass) { showAdminToast('Please fill all fields', true); return; }
  if (newPass !== confPass) { showAdminToast('Passwords do not match!', true); return; }
  ADMIN_CREDENTIALS.user = newUser;
  ADMIN_CREDENTIALS.pass = newPass;
  localStorage.setItem('czbd_admin_creds', JSON.stringify({ user: newUser, pass: newPass }));
  showAdminToast('✅ Credentials updated!');
}

function exportData() {
  const data = JSON.stringify(getAllItems(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'czbd_data_export.json';
  a.click();
  URL.revokeObjectURL(url);
  showAdminToast('📥 Data exported!');
}

function clearAllAdminData() {
  if (!confirm('⚠️ This will clear all admin-added content and settings. Are you sure?')) return;
  localStorage.removeItem('czbd_content');
  localStorage.removeItem('czbd_deleted');
  adminContent = [];
  showAdminToast('🗑️ All admin data cleared');
  renderSettingsPage();
}

// ============================================================
// HELPERS
// ============================================================
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
function getLangShort(lang) {
  const map = { bangla: '🇧🇩 BN', hindi: '🇮🇳 HI', english: '🇺🇸 EN', dual: '🌐 Dual' };
  return map[lang] || lang;
}

function showAdminToast(msg, isError = false) {
  const toast = document.getElementById('adminToast');
  toast.textContent = msg;
  toast.className = 'admin-toast show' + (isError ? ' error' : '');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
