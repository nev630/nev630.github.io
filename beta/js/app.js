document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const searchInput = document.getElementById('search-input');
  const categoryTabsEl = document.getElementById('category-tabs');
  const appGridEl = document.getElementById('app-grid');
  const appCountEl = document.getElementById('app-count');
  const emptyStateEl = document.getElementById('empty-state');

  let activeCategory = 'All';
  let searchQuery = '';

  // 1. 테마 초기화 및 토글
  function applyTheme(isDark) {
    if (isDark) {
      htmlEl.classList.add('dark');
      themeIcon.textContent = '☀️';
    } else {
      htmlEl.classList.remove('dark');
      themeIcon.textContent = '🌙';
    }
  }

  const savedTheme = localStorage.getItem('portal_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme ? savedTheme === 'dark' : prefersDark);

  themeToggleBtn.addEventListener('click', () => {
    const nextDark = !htmlEl.classList.contains('dark');
    localStorage.setItem('portal_theme', nextDark ? 'dark' : 'light');
    applyTheme(nextDark);
  });

  // 2. 카테고리 탭 렌더링
  function renderCategories() {
    const categories = ['All', ...new Set(PORTAL_APPS.map(app => app.category))];
    categoryTabsEl.innerHTML = categories
      .map(cat => {
        const isActive = cat === activeCategory;
        const activeClasses = isActive
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-surface-light dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400';
        return `<button type="button" data-category="${cat}" class="category-btn px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${activeClasses}">${cat}</button>`;
      })
      .join('');

    categoryTabsEl.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.category;
        renderCategories();
        renderApps();
      });
    });
  }

  // 3. 앱 카드 그리드 렌더링
  function renderApps() {
    const q = searchQuery.trim().toLowerCase();
    const filtered = PORTAL_APPS.filter(app => {
      const matchCat = activeCategory === 'All' || app.category === activeCategory;
      const matchQuery =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.tags.some(tag => tag.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });

    appCountEl.textContent = `${filtered.length}개`;

    if (filtered.length === 0) {
      appGridEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');
    appGridEl.innerHTML = filtered
      .map(app => {
        const tagsHtml = app.tags
          .map(
            tag =>
              `<span class="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300">${tag}</span>`
          )
          .join('');

        const betaLinkHtml = app.betaUrl
          ? `<a href="${app.betaUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition">Beta</a>`
          : '';

        const repoLinkHtml = app.repoUrl
          ? `<a href="${app.repoUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">GitHub</a>`
          : '';

        return `
          <article class="app-card flex flex-col justify-between p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-sm">
            <div>
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-2xl shrink-0">
                    ${app.icon}
                  </div>
                  <div>
                    <span class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">${app.category}</span>
                    <h2 class="text-base font-bold leading-snug">${app.name}</h2>
                  </div>
                </div>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ${app.status}
                </span>
              </div>

              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                ${app.description}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div class="flex flex-wrap gap-1.5">
                ${tagsHtml}
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                ${repoLinkHtml}
                ${betaLinkHtml}
                <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm">
                  열기 ↗
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  // 4. 검색 이벤트
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderApps();
  });

  renderCategories();
  renderApps();
});
