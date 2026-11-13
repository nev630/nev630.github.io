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
  let pinnedIds = JSON.parse(localStorage.getItem('portal_pins') || '[]');

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

  // 2. 즐겨찾기 토글
  function togglePin(appId) {
    if (pinnedIds.includes(appId)) {
      pinnedIds = pinnedIds.filter(id => id !== appId);
    } else {
      pinnedIds.push(appId);
    }
    localStorage.setItem('portal_pins', JSON.stringify(pinnedIds));
    renderApps();
  }

  // 3. 카테고리 탭 렌더링
  function renderCategories() {
    const categories = ['All', ...new Set(PORTAL_APPS.map(app => app.category))];
    categoryTabsEl.innerHTML = categories
      .map(cat => {
        const isActive = cat === activeCategory;
        const activeClasses = isActive
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent hover:border-indigo-400';
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

  // 4. 벤토 그리드 앱 카드 렌더링 (Beta 접근 버튼 제외)
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

    // 즐겨찾기 및 featured 우선 정렬
    const sorted = [...filtered].sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 1 : 0;
      const bPin = pinnedIds.includes(b.id) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

    appCountEl.textContent = `${sorted.length}개`;

    if (sorted.length === 0) {
      appGridEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');
    appGridEl.innerHTML = sorted
      .map(app => {
        const isPinned = pinnedIds.includes(app.id);
        const isFeatured = Boolean(app.featured);
        const bentoSpanClass = isFeatured ? 'md:col-span-2 lg:col-span-2' : '';
        const bentoCardStyle = isFeatured
          ? 'bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border-indigo-200/80 dark:border-indigo-500/30'
          : 'bg-surface-light dark:bg-surface-dark border-slate-200/80 dark:border-slate-800';

        const tagsHtml = app.tags
          .map(
            tag =>
              `<span class="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300">${tag}</span>`
          )
          .join('');

        const repoLinkHtml = app.repoUrl
          ? `<a href="${app.repoUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">GitHub</a>`
          : '';

        const featuredBadge = isFeatured
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Featured</span>`
          : '';

        return `
          <article class="app-card ${bentoSpanClass} ${bentoCardStyle} flex flex-col justify-between p-5 rounded-2xl border hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-sm">
            <div>
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <div class="${isFeatured ? 'w-12 h-12 text-2xl' : 'w-11 h-11 text-xl'} rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
                    ${app.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">${app.category}</span>
                      ${featuredBadge}
                    </div>
                    <h2 class="${isFeatured ? 'text-lg' : 'text-base'} font-bold leading-snug">${app.name}</h2>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-pin="${app.id}"
                    aria-label="즐겨찾기"
                    class="pin-btn w-7 h-7 rounded-lg flex items-center justify-center text-sm transition ${
                      isPinned
                        ? 'bg-amber-400/15 text-amber-500'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }"
                  >
                    ${isPinned ? '★' : '☆'}
                  </button>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ${app.status}
                  </span>
                </div>
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
                <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm">
                  열기 ↗
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    appGridEl.querySelectorAll('.pin-btn').forEach(btn => {
      btn.addEventListener('click', () => togglePin(btn.dataset.pin));
    });
  }

  // 5. 검색 이벤트
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderApps();
  });

  renderCategories();
  renderApps();
});
