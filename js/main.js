// ============================================================
// CineZoneBD – Main JavaScript
// ============================================================

const ITEMS_PER_PAGE = 16;
let currentPage = 1;
let activeFilters = { type: null, lang: null, genre: null, special: null, status: null, dubbed: null };
let searchQuery = '';
let hideAdult = true;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderGrid();
  setupEventListeners();
  updateTotalCount();
});

function loadFromStorage() {
  // Merge admin-added content from localStorage
  const adminContent = JSON.parse(localStorage.getItem('czbd_content') || '[]');
  if (adminContent.length > 0) {
    // Merge: replace existing by id, add new ones
    adminContent.forEach(item => {
      const idx = window.ALL_CONTENT.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        window.ALL_CONTENT[idx] = item;
      } else {
        window.ALL_CONTENT.unshift(item);
      }
    });
  }
}

function getFilteredContent() {
  let items = [...window.ALL_CONTENT];

  // Only show visible items
  items = items.filter(item => item.visible !== false);

  // Apply filters
  if (activeFilters.type) items = items.filter(i => i.type === activeFilters.type);
  if (activeFilters.lang) items = items.filter(i => i.language === activeFilters.lang);
  if (activeFilters.genre) items = items.filter(i => i.genre && i.genre.includes(activeFilters.genre));
  if (activeFilters.special === 'pinned') items = items.filter(i => i.pinned);
  if (activeFilters.special === 'new') {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    items = items.filter(i => new Date(i.addedDate) >= cutoff);
  }
  if (activeFilters.status) items = items.filter(i => i.status === activeFilters.status);
  if (activeFilters.dubbed === 'true') items = items.filter(i => i.dubbed);

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i => i.title.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
  }

  // Sort: pinned/featured first, then by date
  items.sort((a, b) => {
    if (b.pinned !== a.pinned) return b.pinned ? 1 : -1;
    if (b.featured !== a.featured) return b.featured ? 1 : -1;
    return new Date(b.addedDate) - new Date(a.addedDate);
  });

  return items;
}

function renderGrid(reset = true) {
  if (reset) {
    currentPage = 1;
  }
  const grid = document.getElementById('contentGrid');
  const noResults = document.getElementById('noResults');
  const loadMoreWrap = document.getElementById('loadMoreWrap');

  const filtered = getFilteredContent();
  const paginated = filtered.slice(0, currentPage * ITEMS_PER_PAGE);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'flex';
    loadMoreWrap.style.display = 'none';
    return;
  }

  noResults.style.display = 'none';
  grid.innerHTML = paginated.map(item => createCardHTML(item)).join('');

  // Load more button
  if (filtered.length > paginated.length) {
    loadMoreWrap.style.display = 'flex';
    document.getElementById('loadMoreBtn').textContent = `আরো দেখুন (${filtered.length - paginated.length} বাকি)`;
  } else {
    loadMoreWrap.style.display = 'none';
  }

  updateTotalCount();
  renderActiveFilters();
}

function createCardHTML(item) {
  const qualityClass = getQualityClass(item.quality);
  const typeClass = `type-${item.type}`;
  const langLabel = getLangLabel(item.language);
  const pinnedBadge = item.pinned ? '<span class="badge-pinned"><i class="fas fa-thumbtack"></i> PINNED</span>' : '';
  const ratingBadge = item.rating ? `<span class="badge-rating"><i class="fas fa-star"></i> ${item.rating}</span>` : '';
  const episodeBadge = item.episodes ? `<span class="badge-episode">${item.episodes}</span>` : '';
  const featuredClass = item.featured ? 'card-featured' : '';

  return `
  <div class="content-card ${featuredClass}" data-id="${item.id}" onclick="openModal('${item.id}')">
    <div class="card-poster">
      <img src="${item.poster}" alt="${item.title}" loading="lazy" onerror="this.src='https://placehold.co/300x420/1a1a2e/666?text=No+Poster'" />
      <div class="card-overlays">
        ${pinnedBadge}
        ${ratingBadge}
        <span class="badge-quality ${qualityClass}">${item.quality || 'WEB-DL'}</span>
      </div>
      <div class="card-bottom-badges">
        <span class="badge-lang">${langLabel}</span>
        <span class="badge-type ${typeClass}">${capitalize(item.type)}</span>
      </div>
      ${episodeBadge ? `<div class="card-episode-badge">${episodeBadge}</div>` : ''}
      <div class="card-hover-overlay">
        <button class="btn-play"><i class="fas fa-play"></i></button>
        <p class="hover-title">${item.title}</p>
      </div>
    </div>
    <div class="card-meta">
      <div class="meta-row">
        <span class="meta-views"><i class="fas fa-eye"></i> ${item.views || '0'}</span>
        <span class="meta-date"><i class="fas fa-clock"></i> ${formatDate(item.addedDate)}</span>
      </div>
      <h3 class="card-title">${item.title}</h3>
    </div>
  </div>`;
}

function getQualityClass(quality) {
  if (!quality) return 'q-webdl';
  const q = quality.toLowerCase();
  if (q.includes('4k')) return 'q-4k';
  if (q.includes('hdtc') || q.includes('tc')) return 'q-hdtc';
  if (q.includes('bluray') || q.includes('blu-ray')) return 'q-bluray';
  return 'q-webdl';
}

function getLangLabel(lang) {
  const map = { bangla: '🇧🇩 Bangla', hindi: '🇮🇳 Hindi', english: '🇺🇸 English', dual: '🌐 Dual Audio' };
  return map[lang] || lang;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / (1000*60*60*24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

// ---- Modal ----
function openModal(id) {
  const item = window.ALL_CONTENT.find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  const tagsHTML = (item.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('');
  const genreHTML = (item.genre || []).map(g => `<span class="genre-pill">${capitalize(g)}</span>`).join('');

  content.innerHTML = `
    <div class="modal-grid">
      <div class="modal-poster">
        <img src="${item.poster}" alt="${item.title}" />
        <div class="modal-badges-over">
          ${item.pinned ? '<span class="badge-pinned"><i class="fas fa-thumbtack"></i> PINNED</span>' : ''}
          ${item.featured ? '<span class="badge-featured"><i class="fas fa-star"></i> FEATURED</span>' : ''}
        </div>
      </div>
      <div class="modal-details">
        <h2 class="modal-title">${item.title}</h2>
        <div class="modal-meta-row">
          ${item.rating ? `<span class="modal-rating"><i class="fas fa-star"></i> ${item.rating}/10</span>` : ''}
          <span class="modal-year"><i class="fas fa-calendar"></i> ${item.year || ''}</span>
          <span class="modal-type badge-type type-${item.type}">${capitalize(item.type)}</span>
          <span class="modal-quality badge-quality ${getQualityClass(item.quality)}">${item.quality}</span>
        </div>
        <p class="modal-desc">${item.description || 'No description available.'}</p>
        <div class="modal-info-table">
          <div class="info-row"><span class="info-label">Language</span><span class="info-val">${getLangLabel(item.language)}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-val status-${item.status}">${capitalize(item.status)}</span></div>
          ${item.episodes ? `<div class="info-row"><span class="info-label">Episodes</span><span class="info-val">${item.episodes}</span></div>` : ''}
          <div class="info-row"><span class="info-label">Added</span><span class="info-val">${formatDate(item.addedDate)}</span></div>
          <div class="info-row"><span class="info-label">Views</span><span class="info-val"><i class="fas fa-eye"></i> ${item.views}</span></div>
          ${item.dubbed ? '<div class="info-row"><span class="info-label">Dubbed</span><span class="info-val">✅ Yes</span></div>' : ''}
        </div>
        <div class="modal-genres">
          <strong>Genres:</strong> ${genreHTML || 'N/A'}
        </div>
        <div class="modal-tags">
          <strong>Tags:</strong> ${tagsHTML || 'N/A'}
        </div>
        <div class="modal-actions">
          <button class="btn-watch" onclick="showToast('🎬 Demo Site – No actual stream available!')">
            <i class="fas fa-play"></i> Watch Now
          </button>
          <button class="btn-download" onclick="showToast('📥 Demo Site – No actual download available!')">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
    </div>`;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModalBtn();
}

function closeModalBtn() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ---- Filters ----
function setupEventListeners() {
  // Category pills
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      handlePillClick(pill);
    });
  });

  // Promo chips
  document.querySelectorAll('.promo-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      const lang = chip.dataset.lang;
      const status = chip.dataset.status;
      const dubbed = chip.dataset.dubbed;

      if (filter) { activeFilters.type = filter === activeFilters.type ? null : filter; }
      if (lang) { activeFilters.lang = lang === activeFilters.lang ? null : lang; }
      if (status) { activeFilters.status = status === activeFilters.status ? null : status; }
      if (dubbed) { activeFilters.dubbed = dubbed === activeFilters.dubbed ? null : dubbed; }

      chip.classList.toggle('active');
      renderGrid();
    });
  });

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    showSuggestions();
    renderGrid();
  });
  searchBtn.addEventListener('click', () => {
    searchQuery = searchInput.value;
    closeSuggestions();
    renderGrid();
  });
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') { searchQuery = searchInput.value; closeSuggestions(); renderGrid(); }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) closeSuggestions();
  });

  // Load more
  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    currentPage++;
    renderGrid(false);
  });

  // Toggle adult
  document.getElementById('toggleAdult').addEventListener('click', function() {
    hideAdult = !hideAdult;
    document.getElementById('adultStatus').textContent = hideAdult ? 'ON' : 'OFF';
    this.classList.toggle('active-toggle', hideAdult);
  });

  // Keyboard close modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModalBtn();
  });
}

function handlePillClick(pill) {
  const filter = pill.dataset.filter;
  const lang = pill.dataset.lang;
  const genre = pill.dataset.genre;
  const special = pill.dataset.special;

  // Remove active from siblings in same group
  if (filter !== undefined) {
    document.querySelectorAll('.cat-pill[data-filter]').forEach(p => p.classList.remove('active'));
    activeFilters.type = filter === 'all' ? null : filter;
    if (filter === 'all') {
      clearAllFilters(); return;
    }
  }
  if (lang !== undefined) {
    document.querySelectorAll('.cat-pill[data-lang]').forEach(p => p.classList.remove('active'));
    activeFilters.lang = lang === activeFilters.lang ? null : lang;
  }
  if (genre !== undefined) {
    document.querySelectorAll('.cat-pill[data-genre]').forEach(p => p.classList.remove('active'));
    activeFilters.genre = genre === activeFilters.genre ? null : genre;
  }
  if (special !== undefined) {
    document.querySelectorAll('.cat-pill[data-special]').forEach(p => p.classList.remove('active'));
    activeFilters.special = special === activeFilters.special ? null : special;
  }

  pill.classList.toggle('active', true);
  if (lang !== undefined && !activeFilters.lang) pill.classList.remove('active');
  if (genre !== undefined && !activeFilters.genre) pill.classList.remove('active');
  if (special !== undefined && !activeFilters.special) pill.classList.remove('active');

  renderGrid();
}

function clearAllFilters() {
  activeFilters = { type: null, lang: null, genre: null, special: null, status: null, dubbed: null };
  searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('.cat-pill[data-filter="all"]').classList.add('active');
  document.querySelectorAll('.promo-chip').forEach(p => p.classList.remove('active'));
  renderGrid();
}

function renderActiveFilters() {
  const el = document.getElementById('activeFilters');
  const chips = [];
  if (activeFilters.type) chips.push(`Type: ${capitalize(activeFilters.type)}`);
  if (activeFilters.lang) chips.push(`Lang: ${capitalize(activeFilters.lang)}`);
  if (activeFilters.genre) chips.push(`Genre: ${capitalize(activeFilters.genre)}`);
  if (activeFilters.special) chips.push(`Special: ${capitalize(activeFilters.special)}`);
  if (activeFilters.status) chips.push(`Status: ${capitalize(activeFilters.status)}`);
  if (activeFilters.dubbed) chips.push('Dubbed Only');
  if (searchQuery) chips.push(`Search: "${searchQuery}"`);

  if (chips.length) {
    el.innerHTML = chips.map(c => `<span class="af-chip">${c} <i class="fas fa-times" onclick="clearAllFilters()"></i></span>`).join('') +
      `<button class="af-clear" onclick="clearAllFilters()"><i class="fas fa-times-circle"></i> Clear All</button>`;
    el.style.display = 'flex';
  } else {
    el.style.display = 'none';
  }
}

function updateTotalCount() {
  const filtered = getFilteredContent();
  document.getElementById('totalCount').textContent = filtered.length.toLocaleString();
}

// ---- Search Suggestions ----
function showSuggestions() {
  const val = document.getElementById('searchInput').value.toLowerCase().trim();
  const box = document.getElementById('searchSuggestions');
  if (!val || val.length < 2) { closeSuggestions(); return; }

  const matches = window.ALL_CONTENT.filter(i => i.title.toLowerCase().includes(val)).slice(0, 6);
  if (!matches.length) { closeSuggestions(); return; }

  box.innerHTML = matches.map(m => `
    <div class="suggestion-item" onclick="selectSuggestion('${m.id}', '${m.title.replace(/'/g, "\\'")}')">
      <img src="${m.poster}" width="36" height="50" loading="lazy" />
      <div>
        <div class="sg-title">${m.title}</div>
        <div class="sg-meta">${capitalize(m.type)} • ${capitalize(m.language)} • ${m.year}</div>
      </div>
    </div>`).join('');
  box.style.display = 'block';
}

function closeSuggestions() {
  document.getElementById('searchSuggestions').style.display = 'none';
}

function selectSuggestion(id, title) {
  document.getElementById('searchInput').value = title;
  closeSuggestions();
  openModal(id);
}

// ---- Toast ----
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
