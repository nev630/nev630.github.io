document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const categoryTabsEl = document.getElementById('category-tabs');
  const appListEl = document.getElementById('app-list');
  const appCountEl = document.getElementById('app-count');
  const emptyStateEl = document.getElementById('empty-state');
  const gridPlaneEl = document.querySelector('.voxel-grid-plane');

  let activeCategory = 'All';
  let pinnedIds = JSON.parse(localStorage.getItem('portal_pins') || '[]');

  // 1. 시스템 다크 모드 자동 연동
  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function syncSystemTheme(isDark) {
    htmlEl.classList.toggle('dark', isDark);
  }
  syncSystemTheme(darkMediaQuery.matches);
  darkMediaQuery.addEventListener('change', e => syncSystemTheme(e.matches));

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
          ? 'bg-indigo-600 text-white border-slate-900 dark:border-indigo-300 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.9)]'
          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400';
        return `<button type="button" data-category="${cat}" class="category-btn px-3 py-1 text-xs font-mono font-semibold border-2 whitespace-nowrap transition ${activeClasses}">${cat}</button>`;
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

  // 4. 2.5D 세로 스크롤 Voxel 카드 렌더링
  function renderApps() {
    const filtered = PORTAL_APPS.filter(app => activeCategory === 'All' || app.category === activeCategory);

    const sorted = [...filtered].sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 1 : 0;
      const bPin = pinnedIds.includes(b.id) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

    appCountEl.textContent = `${sorted.length}`;

    if (sorted.length === 0) {
      appListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');
    appListEl.innerHTML = sorted
      .map(app => {
        const isPinned = pinnedIds.includes(app.id);
        const isFeatured = Boolean(app.featured);

        const tagsHtml = (app.tags || [])
          .map(
            tag =>
              `<span class="px-2 py-0.5 text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">${tag}</span>`
          )
          .join('');

        const repoLinkHtml = app.repoUrl
          ? `<a href="${app.repoUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition">GitHub</a>`
          : '';

        const featuredBadge = isFeatured
          ? `<span class="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-mono font-bold">FEATURED</span>`
          : '';

        const cardBorder = isFeatured
          ? 'border-indigo-600 dark:border-indigo-400 shadow-[6px_6px_0px_0px_rgba(79,70,229,0.85)] dark:shadow-[6px_6px_0px_0px_rgba(99,102,241,0.55)]'
          : 'border-slate-900 dark:border-slate-700 shadow-[5px_5px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[5px_5px_0px_0px_rgba(51,65,85,0.7)]';

        return `
          <article class="voxel-card bg-white dark:bg-slate-900 border-2 ${cardBorder} p-5">
            <!-- 상단 Voxel 악센트 스트립 -->
            <div class="h-1.5 w-full ${isFeatured ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'} mb-4"></div>

            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-12 h-12 bg-indigo-600 text-white font-mono font-bold text-sm border-2 border-slate-900 dark:border-indigo-300 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.85)] flex items-center justify-center shrink-0">
                  ${app.code || 'APP'}
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span class="text-[11px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400">${app.category}</span>
                    ${featuredBadge}
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 border border-emerald-600/40 bg-emerald-500/10 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      <span class="w-1.5 h-1.5 bg-emerald-500"></span>${app.status}
                    </span>
                  </div>
                  <h2 class="text-base sm:text-lg font-bold leading-snug truncate">${app.name}</h2>
                </div>
              </div>

              <button
                type="button"
                data-pin="${app.id}"
                aria-label="즐겨찾기"
                class="pin-btn px-2 h-8 border-2 font-mono text-[11px] font-bold flex items-center justify-center transition shrink-0 ${
                  isPinned
                    ? 'bg-amber-400 border-slate-900 text-slate-900'
                    : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-amber-400 hover:text-amber-500'
                }"
              >
                ${isPinned ? 'PIN' : '☆'}
              </button>
            </div>

            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              ${app.description}
            </p>

            <div class="pt-3.5 border-t-2 border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div class="flex flex-wrap gap-1.5">
                ${tagsHtml}
              </div>
              <div class="flex items-center gap-2 shrink-0">
                ${repoLinkHtml}
                <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 text-xs font-mono font-bold bg-indigo-600 border-2 border-slate-900 dark:border-indigo-300 text-white hover:bg-indigo-500 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[2px_2px_0px_0px_rgba(165,180,252,0.5)] transition">
                  OPEN
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    appListEl.querySelectorAll('.pin-btn').forEach(btn => {
      btn.addEventListener('click', () => togglePin(btn.dataset.pin));
    });

    attachCard25DEffects();
    updateScrollDepth();
  }

  // 5. 스크롤 기반 2.5D 깊이·기울기 & 데스크톱 포인터 틸트
  function updateScrollDepth() {
    const cards = appListEl.querySelectorAll('.voxel-card');
    const vh = window.innerHeight;
    const centerY = vh * 0.5;

    if (gridPlaneEl) {
      gridPlaneEl.style.setProperty('--grid-offset', `${(window.scrollY * 0.25) % 40}px`);
    }

    cards.forEach(card => {
      if (card.dataset.hovered === 'true') return;
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height * 0.5;
      const norm = Math.max(-1, Math.min(1, (cardCenter - centerY) / (vh * 0.65)));

      const rotateX = (-norm * 7).toFixed(2);
      const scale = (1 - Math.abs(norm) * 0.035).toFixed(3);
      const translateZ = (-Math.abs(norm) * 24).toFixed(1);

      card.style.transform = `translate3d(0, 0, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
    });
  }

  function attachCard25DEffects() {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    appListEl.querySelectorAll('.voxel-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        card.dataset.hovered = 'true';
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translate3d(0, -3px, 12px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.dataset.hovered = 'false';
        updateScrollDepth();
      });
    });
  }

  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          updateScrollDepth();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', updateScrollDepth);

  renderCategories();
  renderApps();
});
