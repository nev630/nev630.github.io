import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const waveCanvas = document.getElementById('voxel-wave-bg');
  const categoryTabsEl = document.getElementById('category-tabs');
  const appListEl = document.getElementById('app-list');
  const appCountEl = document.getElementById('app-count');
  const emptyStateEl = document.getElementById('empty-state');

  let activeCategory = 'All';

  // 1. 시스템 다크 모드 자동 연동
  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let isDarkMode = darkMediaQuery.matches;

  function syncSystemTheme(dark) {
    isDarkMode = dark;
    htmlEl.classList.toggle('dark', dark);
    updateWaveTheme();
  }
  htmlEl.classList.toggle('dark', isDarkMode);
  darkMediaQuery.addEventListener('change', e => syncSystemTheme(e.matches));

  // 2. 아이소메트릭 Voxel 웨이브 배경 (Three.js InstancedMesh)
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(13, 14, 13);
  camera.lookAt(0, -1, 0);

  const renderer = new THREE.WebGLRenderer({ canvas: waveCanvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Voxel 음영용 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(10, 18, 8);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0x818cf8, 0.55);
  rimLight.position.set(-10, 6, -10);
  scene.add(rimLight);

  const GRID_SIZE = 22;
  const SPACING = 0.88;
  const TOTAL_CUBES = GRID_SIZE * GRID_SIZE;
  const cubeGeo = new THREE.BoxGeometry(0.76, 1.4, 0.76);
  const cubeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const instancedWave = new THREE.InstancedMesh(cubeGeo, cubeMat, TOTAL_CUBES);
  scene.add(instancedWave);

  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  function updateWaveTheme() {
    const bgHex = isDarkMode ? 0x020617 : 0xf1f5f9;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.036);

    const palette = isDarkMode
      ? [0x1e1b4b, 0x312e81, 0x4338ca, 0x3730a3]
      : [0xc7d2fe, 0xa5b4fc, 0x818cf8, 0xe0e7ff];

    for (let i = 0; i < TOTAL_CUBES; i++) {
      tempColor.setHex(palette[i % palette.length]);
      instancedWave.setColorAt(i, tempColor);
    }
    if (instancedWave.instanceColor) {
      instancedWave.instanceColor.needsUpdate = true;
    }
  }
  updateWaveTheme();

  const clock = new THREE.Clock();
  function animateWave() {
    requestAnimationFrame(animateWave);
    const t = clock.getElapsedTime() * 1.15;
    const scrollPhase = window.scrollY * 0.007;
    const half = (GRID_SIZE - 1) * 0.5;

    let idx = 0;
    for (let gx = 0; gx < GRID_SIZE; gx++) {
      for (let gz = 0; gz < GRID_SIZE; gz++) {
        const x = (gx - half) * SPACING;
        const z = (gz - half) * SPACING;

        const wave1 = Math.sin(gx * 0.38 + t + scrollPhase);
        const wave2 = Math.cos(gz * 0.38 + t * 0.85 - scrollPhase * 0.5);
        const y = (wave1 + wave2) * 0.45 - 1.2;

        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        instancedWave.setMatrixAt(idx++, dummy.matrix);
      }
    }
    instancedWave.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animateWave();

  // 3. 카테고리 탭 렌더링
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

  // 4. 2.5D 세로 스크롤 Voxel 카드 렌더링 (repo 제목 + GITHUB 버튼 + OPEN 버튼)
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
          <article class="voxel-card bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-2 border-slate-900 dark:border-indigo-400/70 shadow-[6px_6px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[6px_6px_0px_0px_rgba(99,102,241,0.45)] p-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 class="text-base sm:text-lg font-bold tracking-tight truncate">${app.name}</h2>

              <div class="flex items-center gap-2 shrink-0">
                <a
                  href="${app.repoUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.85)] dark:shadow-[3px_3px_0px_0px_rgba(71,85,105,0.6)] text-center transition"
                >
                  GITHUB
                </a>
                <a
                  href="${app.url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="px-4 py-2 text-xs font-bold bg-indigo-600 border-2 border-slate-900 dark:border-indigo-300 text-white hover:bg-indigo-500 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.9)] dark:shadow-[3px_3px_0px_0px_rgba(165,180,252,0.5)] text-center transition"
                >
                  OPEN
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    attachCard25DEffects();
    updateScrollDepth();
  }

  // 5. 스크롤 기반 2.5D 깊이·기울기 & 데스크톱 포인터 틸트
  function updateScrollDepth() {
    const cards = appListEl.querySelectorAll('.voxel-card');
    const vh = window.innerHeight;
    const centerY = vh * 0.5;

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

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    updateScrollDepth();
  });

  renderCategories();
  renderApps();
});
