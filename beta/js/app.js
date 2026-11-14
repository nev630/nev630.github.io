const categoryTabsEl = document.getElementById('category-tabs');
const appListEl = document.getElementById('app-list');
const appCountEl = document.getElementById('app-count');
const emptyStateEl = document.getElementById('empty-state');

let activeCategory = 'ALL';

function getCategories() {
  const cats = new Set(['ALL']);
  PORTAL_APPS.forEach((app) => {
    if (app.category) cats.add(app.category.toUpperCase());
  });
  return Array.from(cats);
}

function renderTabs() {
  const categories = getCategories();
  categoryTabsEl.innerHTML = categories
    .map((cat) => {
      const isActive = cat === activeCategory;
      return `
        <button
          type="button"
          data-category="${cat}"
          class="px-3 py-1.5 text-xs font-bold border-2 transition-all shrink-0 ${
            isActive
              ? 'bg-indigo-600 text-white border-slate-900 dark:border-indigo-300 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.9)]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-900 dark:hover:border-indigo-400'
          }"
        >
          ${cat}
        </button>
      `;
    })
    .join('');

  categoryTabsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      renderTabs();
      renderApps();
    });
  });
}

function renderApps() {
  const filtered =
    activeCategory === 'ALL'
      ? PORTAL_APPS
      : PORTAL_APPS.filter((app) => (app.category || '').toUpperCase() === activeCategory);

  appCountEl.textContent = filtered.length;

  if (filtered.length === 0) {
    appListEl.innerHTML = '';
    emptyStateEl.classList.remove('hidden');
    return;
  }

  emptyStateEl.classList.add('hidden');
  appListEl.innerHTML = filtered
    .map(
      (app) => `
      <article class="voxel-card group relative bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-indigo-400/70 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.92)] dark:shadow-[6px_6px_0px_0px_rgba(99,102,241,0.45)] p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <span class="inline-block px-2 py-0.5 mb-2 text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-400">
              ${(app.category || 'APP').toUpperCase()}
            </span>
            <h2 class="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              ${app.name}
            </h2>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${
              app.repoUrl
                ? `<a href="${app.repoUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 text-xs border-2 border-slate-900 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">REPO</a>`
                : ''
            }
            <a href="${app.url}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 dark:border-indigo-300 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.9)] transition-colors">
              LAUNCH
            </a>
          </div>
        </div>
      </article>
    `
    )
    .join('');
}

function initVoxelBackground() {
  const canvas = document.getElementById('voxel-wave-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? 'rgba(129, 140, 248, 0.14)' : 'rgba(99, 102, 241, 0.12)';
    ctx.lineWidth = 1;

    const spacing = 44;
    for (let x = 0; x < width + spacing; x += spacing) {
      for (let y = 0; y < height + spacing; y += spacing) {
        const offset = Math.sin(x * 0.015 + t) * 6 + Math.cos(y * 0.015 + t) * 6;
        ctx.strokeRect(x + offset * 0.3, y + offset * 0.3, 14, 14);
      }
    }
    t += 0.02;
    requestAnimationFrame(draw);
  }
  draw();
}

renderTabs();
renderApps();
initVoxelBackground();
