document.addEventListener('DOMContentLoaded', () => {
  const categoryTabsEl = document.getElementById('category-tabs');
  const appListEl = document.getElementById('app-list');
  const appCountEl = document.getElementById('app-count');
  const emptyStateEl = document.getElementById('empty-state');

  let activeCategory = 'All';

  // GitHub 옥토캣 아이콘 SVG
  const GITHUB_ICON_SVG = `
    <svg viewBox="0 0 16 16" class="w-4 h-4 fill-current" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  `;

  // 카테고리별 레트로 설계도 플레이스홀더 아이콘
  function getCategorySchematicSvg(category) {
    if (category.toLowerCase() === 'game') {
      return `
        <svg viewBox="0 0 48 32" class="w-12 h-8 text-ink/75" fill="none" stroke="currentColor" stroke-width="2" shape-rendering="crispEdges" aria-hidden="true">
          <rect x="4" y="6" width="40" height="20" fill="#FAF9F5"/>
          <path d="M13 12v8M9 16h8"/>
          <rect x="30" y="13" width="3" height="3" fill="#E05A2B" stroke="none"/>
          <rect x="35" y="16" width="3" height="3" fill="#1D4ED8" stroke="none"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 48 32" class="w-12 h-8 text-ink/75" fill="none" stroke="currentColor" stroke-width="2" shape-rendering="crispEdges" aria-hidden="true">
        <rect x="6" y="4" width="36" height="24" fill="#FAF9F5"/>
        <path d="M12 12l5 4-5 4M20 20h10"/>
        <rect x="34" y="8" width="4" height="4" fill="#1D4ED8" stroke="none"/>
      </svg>
    `;
  }

  // 플레이스홀더 UI 마크업
  function createPlaceholderHtml(app, index) {
    const modCode = `MOD-${String(index + 1).padStart(2, '0')}`;
    return `
      <div class="thumb-placeholder w-full h-full thumb-blueprint relative flex flex-col items-center justify-center p-4 select-none">
        <div class="scanline-overlay absolute inset-0 pointer-events-none"></div>
        <!-- Corner Alignment Ticks -->
        <span class="absolute top-2 left-2 font-mono-tech text-[10px] text-ink/60">${modCode}</span>
        <span class="absolute bottom-2 left-2 font-mono-tech text-[10px] text-ink/50">16:9 // PREVIEW</span>
        <div class="relative z-10 flex flex-col items-center gap-2">
          ${getCategorySchematicSvg(app.category)}
          <span class="font-pixel text-[10px] tracking-wider px-2 py-0.5 bg-panel border border-ink text-ink">
            ${app.category.toUpperCase()} MODULE
          </span>
        </div>
      </div>
    `;
  }

  // 1. 카테고리 필터 탭 렌더링
  function renderCategories() {
    const categories = ['All', ...new Set(PORTAL_APPS.map(app => app.category))];
    categoryTabsEl.innerHTML = categories
      .map(cat => {
        const isActive = cat === activeCategory;
        const activeClasses = isActive
          ? 'bg-cobalt text-white border-ink hw-btn-active'
          : 'bg-recessed text-ink border-ink hover:bg-white';
        return `
          <button
            type="button"
            data-category="${cat}"
            aria-pressed="${isActive}"
            class="category-btn hw-btn font-pixel px-3 py-1.5 text-xs font-bold border-2 whitespace-nowrap ${activeClasses}"
          >
            ${cat.toUpperCase()}
          </button>
        `;
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

  // 2. 앱 카드 그리드 렌더링
  function renderApps() {
    const filtered = PORTAL_APPS.filter(
      app => activeCategory === 'All' || app.category === activeCategory
    );

    appCountEl.textContent = `${filtered.length}`;

    if (filtered.length === 0) {
      appListEl.innerHTML = '';
      emptyStateEl.classList.remove('hidden');
      return;
    }

    emptyStateEl.classList.add('hidden');
    appListEl.innerHTML = filtered
      .map((app, index) => {
        const hasThumb = Boolean(app.thumbnail && app.thumbnail.trim());
        const badgeColor =
          app.category.toLowerCase() === 'game'
            ? 'bg-signal text-white'
            : 'bg-cobalt text-white';

        const thumbnailContent = hasThumb
          ? `
            <img
              src="${app.thumbnail}"
              alt="${app.name} 미리보기"
              loading="lazy"
              class="thumb-img w-full h-full object-cover"
            />
            <div class="thumb-fallback hidden w-full h-full">
              ${createPlaceholderHtml(app, index)}
            </div>
          `
          : createPlaceholderHtml(app, index);

        return `
          <article
            role="link"
            tabindex="0"
            data-url="${app.url}"
            aria-label="${app.name} 앱 실행"
            class="hw-card group cursor-pointer bg-panel border-2 border-ink flex flex-col overflow-hidden focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-2 focus:ring-offset-paper"
          >
            <!-- Preview Thumbnail Frame -->
            <div class="relative aspect-video w-full border-b-2 border-ink bg-recessed overflow-hidden">
              ${thumbnailContent}

              <!-- GitHub Repo Corner Icon Button -->
              <a
                href="${app.repoUrl}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="${app.name} GitHub 저장소 열기"
                title="GitHub Repository"
                class="repo-link hw-btn absolute top-2.5 right-2.5 z-20 p-2 bg-panel border-2 border-ink text-ink hover:bg-ink hover:text-paper"
              >
                ${GITHUB_ICON_SVG}
              </a>
            </div>

            <!-- Card Body -->
            <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="font-pixel text-[10px] px-2 py-0.5 border border-ink ${badgeColor}">
                    ${app.category.toUpperCase()}
                  </span>
                  <span class="font-pixel text-[11px] text-muted group-hover:text-cobalt transition-colors">
                    LAUNCH &rarr;
                  </span>
                </div>
                <h2 class="font-pixel text-base sm:text-lg font-bold tracking-tight text-ink truncate group-hover:text-cobalt transition-colors">
                  ${app.name}
                </h2>
                <p class="mt-1.5 font-sans-body text-xs sm:text-sm text-muted leading-relaxed line-clamp-2">
                  ${app.description || ''}
                </p>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // 이미지 로드 실패 시 레트로 플레이스홀더로 안전하게 전환
    appListEl.querySelectorAll('.thumb-img').forEach(img => {
      img.addEventListener('error', () => {
        img.classList.add('hidden');
        const fallback = img.nextElementSibling;
        if (fallback) fallback.classList.remove('hidden');
      });
    });

    // GitHub 아이콘 클릭 시 카드 전체 실행 이벤트 전파 차단
    appListEl.querySelectorAll('.repo-link').forEach(link => {
      link.addEventListener('click', e => {
        e.stopPropagation();
      });
      link.addEventListener('keydown', e => {
        e.stopPropagation();
      });
    });

    // 카드 전체 클릭 및 키보드(Enter/Space) 실행
    appListEl.querySelectorAll('.hw-card').forEach(card => {
      const launchUrl = card.dataset.url;
      card.addEventListener('click', () => {
        if (launchUrl) {
          window.open(launchUrl, '_blank', 'noopener,noreferrer');
        }
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (launchUrl) {
            window.open(launchUrl, '_blank', 'noopener,noreferrer');
          }
        }
      });
    });
  }

  renderCategories();
  renderApps();
});
