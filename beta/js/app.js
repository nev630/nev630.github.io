document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const categoryTabsEl = document.getElementById('category-tabs');
  const appListEl = document.getElementById('app-list');
  const appCountEl = document.getElementById('app-count');
  const emptyStateEl = document.getElementById('empty-state');
  const gridPlaneEl = document.querySelector('.voxel-grid-plane');

  let activeCategory = 'All';

  // 1. 시스템 다크 모드 자동 연동
  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function syncSystemTheme(isDark) {
    htmlEl.classList.toggle('dark', isDark);
  }
  syncSystemTheme(darkMediaQuery.matches);
  darkMediaQuery.addEventListener('change', e => syncSystemTheme(e.matches));

  // 2. 카테고리 탭 렌더링
  function renderCategories() {
    const categories = ['All', ...new Set(PORTAL_APPS.map(app => app.category))];
    categoryTabsEl.innerHTML = categories
      .map(cat => {
        const isActive = cat === activeCategory;
        const activeClasses = isActive
          ? 'bg-indigo-600 text-white border-slate-900 dark:border-indigo-300 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.9)]'
          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400';
        return `<button type="button" data-category="${cat}" class="category-btn px-3 py-1 text-xs font-bold border-2 whitespace-nowrap transition ${activeClasses}">${cat}</button>`;
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

  // 3. 2.5D 세로 스크롤 Voxel 카드 렌더링 (repo 제목, github 주소, OPEN 버튼만 표시)
  function renderApps() {
    const filtered = PORTAL_APPS.filter(app => activeCategory === 'All' || app.category === activeCategory);

    appCountEl.textContent = `${filtered.length}`;

    if (filtered.length === 0) {
      appListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');
    appListEl.innerHTML = filtered
      .map(app => {
        return `
          <article class="voxel-card bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-indigo-400/70 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[6px_6px_0px_0px_rgba(99,102,241,0.45)] p-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="min-w-0 space-y-1.5">
                <h2 class="text-base sm:text-lg font-bold tracking-tight truncate">${app.name}</h2>
                <a
                  href="${app.repoUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4 truncate transition"
                >
                  ${app.repoUrl}
                </a>
              </div>

              <a
                href="${app.url}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 text-xs font-bold bg-indigo-600 border-2 border-slate-900 dark:border-indigo-300 text-white hover:bg-indigo-500 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[3px_3px_0px_0px_rgba(165,180,252,0.5)] text-center shrink-0 transition"
              >
                OPEN
              </a>
            </div>
          </article>
        `;
      })
      .join('');

    attachCard25DEffects();
    updateScrollDepth();
  }

  // 4. 스크롤 기반 2.5D 깊이·기울기 & 데스크톱 포인터 틸트
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
