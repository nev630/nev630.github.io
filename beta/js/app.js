import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const canvas = document.getElementById('portal-3d');
  const categoryTabsEl = document.getElementById('category-tabs');
  const appCountEl = document.getElementById('app-count');
  const hudWrapper = document.getElementById('hud-wrapper');
  const hudCode = document.getElementById('hud-code');
  const hudCategory = document.getElementById('hud-category');
  const hudStatus = document.getElementById('hud-status');
  const hudTitle = document.getElementById('hud-title');
  const hudDesc = document.getElementById('hud-desc');
  const hudPin = document.getElementById('hud-pin');
  const hudIndex = document.getElementById('hud-index');
  const hudRepo = document.getElementById('hud-repo');
  const hudOpen = document.getElementById('hud-open');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  let activeCategory = 'All';
  let pinnedIds = JSON.parse(localStorage.getItem('portal_pins') || '[]');
  let currentApps = [];
  let selectedIndex = 0;
  let carouselStep = 0; // 연속 회전용 언래핑(unwrapped) 스텝 인덱스

  // 1. 시스템 다크 모드 자동 연동
  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let isDarkMode = darkMediaQuery.matches;

  function syncSystemTheme(dark) {
    isDarkMode = dark;
    htmlEl.classList.toggle('dark', dark);
    if (scene) {
      scene.background = new THREE.Color(dark ? 0x020617 : 0xf1f5f9);
      scene.fog = new THREE.FogExp2(dark ? 0x020617 : 0xf1f5f9, 0.02);
    }
    rebuildVoxelCore();
    rebuildVoxelParticles();
    rebuildCards();
  }
  htmlEl.classList.toggle('dark', isDarkMode);
  darkMediaQuery.addEventListener('change', e => syncSystemTheme(e.matches));

  // 2. Three.js Voxel 씬 초기화
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(isDarkMode ? 0x020617 : 0xf1f5f9);
  scene.fog = new THREE.FogExp2(isDarkMode ? 0x020617 : 0xf1f5f9, 0.02);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 150);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Voxel 음영용 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 8, 6);
  scene.add(dirLight);
  const rimLight = new THREE.DirectionalLight(0x818cf8, 0.6);
  rimLight.position.set(-5, -4, -3);
  scene.add(rimLight);

  // 배경 3D Voxel 코어 클러스터
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 0.25, -1.8);
  scene.add(coreGroup);

  function rebuildVoxelCore() {
    while (coreGroup.children.length > 0) {
      const child = coreGroup.children[0];
      child.geometry?.dispose();
      child.material?.dispose();
      coreGroup.remove(child);
    }

    const palette = isDarkMode
      ? [0x312e81, 0x4338ca, 0x6366f1, 0x1e293b]
      : [0xc7d2fe, 0x818cf8, 0x4f46e5, 0xe2e8f0];
    const boxGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const edgeGeo = new THREE.EdgesGeometry(boxGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: isDarkMode ? 0x818cf8 : 0x312e81,
      transparent: true,
      opacity: 0.35
    });

    const offsets = [
      [0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
      [1, 1, 0], [-1, -1, 0], [1, 0, -1], [-1, 0, 1]
    ];

    offsets.forEach(([ox, oy, oz], idx) => {
      const mat = new THREE.MeshLambertMaterial({
        color: palette[idx % palette.length],
        transparent: true,
        opacity: 0.45
      });
      const cube = new THREE.Mesh(boxGeo, mat);
      cube.position.set(ox * 0.46, oy * 0.46, oz * 0.46);
      const wire = new THREE.LineSegments(edgeGeo, edgeMat);
      cube.add(wire);
      coreGroup.add(cube);
    });
  }

  // 배경 떠다니는 Voxel 큐브 파티클
  const voxelParticleGroup = new THREE.Group();
  scene.add(voxelParticleGroup);
  let voxelParticles = [];

  function rebuildVoxelParticles() {
    voxelParticles.forEach(p => {
      p.geometry.dispose();
      p.material.dispose();
      voxelParticleGroup.remove(p);
    });
    voxelParticles = [];

    const pGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const pColors = isDarkMode ? [0x6366f1, 0x38bdf8, 0x334155] : [0x6366f1, 0x818cf8, 0x94a3b8];

    for (let i = 0; i < 65; i++) {
      const mat = new THREE.MeshLambertMaterial({
        color: pColors[i % pColors.length],
        transparent: true,
        opacity: 0.55
      });
      const cube = new THREE.Mesh(pGeo, mat);
      cube.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 18 - 3
      );
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      cube.userData = { speed: 0.3 + Math.random() * 0.6 };
      voxelParticleGroup.add(cube);
      voxelParticles.push(cube);
    }
  }

  // 카드 캐러셀 그룹
  const carouselGroup = new THREE.Group();
  scene.add(carouselGroup);

  let cardMeshes = [];
  let targetRotationY = 0;
  let currentRotationY = 0;
  let pointerX = 0;
  let pointerY = 0;

  // 반응형 카메라 프레이밍
  function updateCameraFraming() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    const count = currentApps.length;
    const radius = count <= 1 ? 1.4 : Math.max(2.8, count * 0.85);
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const minDistanceForWidth = (3.4 / 0.76) / (2 * tanHalfFov * aspect);
    const distFromFront = Math.max(5.2, minDistanceForWidth);

    camera.position.set(0, aspect < 0.8 ? 0.35 : 0.4, radius + distFromFront);
    carouselGroup.position.set(0, aspect < 0.8 ? 0.65 : 0.25, 0);
  }

  // 3. Voxel 스타일 2D 텍스처 생성 (둥근 모서리/이모티콘 제거)
  function createCardTexture(app, isSelected) {
    const c = document.createElement('canvas');
    c.width = 720;
    c.height = 460;
    const ctx = c.getContext('2d');

    // 하드 픽셀 오프셋 그림자
    ctx.fillStyle = isDarkMode ? '#312e81' : '#0f172a';
    ctx.fillRect(22, 22, 686, 426);

    // 메인 Voxel 카드 면
    ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
    ctx.fillRect(10, 10, 686, 426);

    // 굵은 직각 테두리
    ctx.lineWidth = isSelected ? 8 : 4;
    ctx.strokeStyle = isSelected ? '#6366f1' : isDarkMode ? '#334155' : '#0f172a';
    ctx.strokeRect(10, 10, 686, 426);

    // 상단 Voxel 그리드 악센트 바
    ctx.fillStyle = isSelected ? '#6366f1' : isDarkMode ? '#1e293b' : '#e2e8f0';
    ctx.fillRect(10, 10, 686, 18);

    // 코드 배지 박스 (이모티콘 대체)
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(48, 56, 84, 84);
    ctx.lineWidth = 4;
    ctx.strokeStyle = isDarkMode ? '#a5b4fc' : '#0f172a';
    ctx.strokeRect(48, 56, 84, 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(app.code || 'APP', 90, 100);

    // 카테고리
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 22px ui-monospace, monospace';
    ctx.fillText(app.category.toUpperCase(), 156, 60);

    // 제목
    ctx.fillStyle = isDarkMode ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(truncateText(ctx, app.name, 500), 156, 94);

    // 설명
    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#475569';
    ctx.font = '24px sans-serif';
    wrapText(ctx, app.description, 48, 174, 610, 34, 3);

    // 직각 Voxel 태그
    let tagX = 48;
    const tagY = 336;
    ctx.font = 'bold 20px ui-monospace, monospace';
    (app.tags || []).slice(0, 4).forEach(tag => {
      const w = ctx.measureText(tag).width + 26;
      ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
      ctx.fillRect(tagX, tagY, w, 40);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDarkMode ? '#475569' : '#0f172a';
      ctx.strokeRect(tagX, tagY, w, 40);
      ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#0f172a';
      ctx.fillText(tag, tagX + 13, tagY + 10);
      tagX += w + 12;
    });

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function truncateText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let t = text;
    while (t.length > 0 && ctx.measureText(t + '…').width > maxW) {
      t = t.slice(0, -1);
    }
    return t + '…';
  }

  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    const chars = [...text];
    let line = '';
    let lineCount = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxW) {
        if (lineCount === maxLines - 1) {
          ctx.fillText(line.slice(0, -1) + '…', x, y + lineCount * lineH);
          return;
        }
        ctx.fillText(line, x, y + lineCount * lineH);
        line = chars[i];
        lineCount++;
      } else {
        line = test;
      }
    }
    if (line && lineCount < maxLines) {
      ctx.fillText(line, x, y + lineCount * lineH);
    }
  }

  // 4. 두께가 있는 3D Voxel 카드 배치
  function rebuildCards() {
    cardMeshes.forEach(m => {
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach(mat => {
          mat.map?.dispose();
          mat.dispose();
        });
      }
      carouselGroup.remove(m);
    });
    cardMeshes = [];

    const count = currentApps.length;
    if (count === 0) return;

    const radius = count === 1 ? 0 : Math.max(2.8, count * 0.85);
    const cardGeo = new THREE.BoxGeometry(3.4, 2.18, 0.14);
    const sideColor = isDarkMode ? 0x312e81 : 0x1e293b;

    currentApps.forEach((app, idx) => {
      const frontTex = createCardTexture(app, idx === selectedIndex);
      const sideMat = new THREE.MeshLambertMaterial({ color: sideColor });
      const frontMat = new THREE.MeshBasicMaterial({ map: frontTex });
      const backMat = new THREE.MeshBasicMaterial({ map: frontTex });

      // [+x, -x, +y, -y, +z(앞), -z(뒤)]
      const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, backMat];
      const mesh = new THREE.Mesh(cardGeo.clone(), materials);

      if (count === 1) {
        mesh.position.set(0, 0, 1.4);
      } else {
        const angle = (idx / count) * Math.PI * 2;
        mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
        mesh.rotation.y = angle;
      }
      mesh.userData = { index: idx, app };
      carouselGroup.add(mesh);
      cardMeshes.push(mesh);
    });

    updateTargetRotation();
    updateCameraFraming();
  }

  function updateTargetRotation() {
    const count = currentApps.length;
    if (count <= 1) {
      targetRotationY = 0;
      return;
    }
    // 언래핑된 carouselStep으로 회전 방향 일관성 유지
    targetRotationY = -(carouselStep / count) * Math.PI * 2;
  }

  function stepCarousel(delta) {
    const count = currentApps.length;
    if (count === 0) return;
    carouselStep += delta;
    selectedIndex = ((carouselStep % count) + count) % count;
    updateTargetRotation();
    updateHud();
    // 선택 테두리 갱신
    cardMeshes.forEach((mesh, idx) => {
      const tex = createCardTexture(currentApps[idx], idx === selectedIndex);
      mesh.material[4].map?.dispose();
      mesh.material[4].map = tex;
      mesh.material[5].map = tex;
      mesh.material[4].needsUpdate = true;
      mesh.material[5].needsUpdate = true;
    });
  }

  function jumpToIndex(targetIdx) {
    const count = currentApps.length;
    if (count === 0) return;
    let diff = targetIdx - selectedIndex;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    stepCarousel(diff);
  }

  // 5. 하단 HUD 업데이트 (이모티콘 제거)
  function updateHud() {
    if (currentApps.length === 0) {
      hudWrapper.classList.add('hidden');
      return;
    }
    hudWrapper.classList.remove('hidden');
    const app = currentApps[selectedIndex];
    const isPinned = pinnedIds.includes(app.id);

    hudCode.textContent = app.code || 'APP';
    hudCategory.textContent = app.category;
    hudStatus.innerHTML = `<span class="w-1.5 h-1.5 bg-emerald-500"></span>${app.status}`;
    hudTitle.textContent = app.name;
    hudDesc.textContent = app.description;
    hudIndex.textContent = `${selectedIndex + 1} / ${currentApps.length}`;

    hudPin.textContent = isPinned ? 'PIN' : '☆';
    hudPin.className = `px-2 h-8 border-2 font-mono text-[11px] font-bold flex items-center justify-center transition shrink-0 ${
      isPinned
        ? 'bg-amber-400 border-slate-900 text-slate-900'
        : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-amber-400 hover:text-amber-500'
    }`;

    hudOpen.href = app.url;
    if (app.repoUrl) {
      hudRepo.href = app.repoUrl;
      hudRepo.classList.remove('hidden');
    } else {
      hudRepo.classList.add('hidden');
    }
  }

  // 6. 카테고리 & 데이터 갱신
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
        refreshApps();
      });
    });
  }

  function refreshApps() {
    const filtered = PORTAL_APPS.filter(app => activeCategory === 'All' || app.category === activeCategory);
    currentApps = [...filtered].sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 1 : 0;
      const bPin = pinnedIds.includes(b.id) ? 1 : 0;
      if (aPin !== bPin) return bPin - aPin;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
    appCountEl.textContent = `${currentApps.length}`;
    selectedIndex = 0;
    carouselStep = 0;
    currentRotationY = 0;
    rebuildCards();
    updateHud();
  }

  // 7. 이벤트 바인딩
  hudPin.addEventListener('click', () => {
    const app = currentApps[selectedIndex];
    if (!app) return;
    if (pinnedIds.includes(app.id)) {
      pinnedIds = pinnedIds.filter(id => id !== app.id);
    } else {
      pinnedIds.push(app.id);
    }
    localStorage.setItem('portal_pins', JSON.stringify(pinnedIds));
    refreshApps();
  });

  prevBtn.addEventListener('click', () => stepCarousel(-1));
  nextBtn.addEventListener('click', () => stepCarousel(1));

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') stepCarousel(-1);
    if (e.key === 'ArrowRight') stepCarousel(1);
  });

  // 터치/마우스 스와이프 & 클릭 레이캐스팅
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragStartX = 0;
  let isDragging = false;

  canvas.addEventListener('pointerdown', e => {
    dragStartX = e.clientX;
    isDragging = true;
  });

  canvas.addEventListener('pointermove', e => {
    pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  canvas.addEventListener('pointerup', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.clientX - dragStartX;

    if (Math.abs(dx) > 40) {
      // 오른쪽으로 스와이프(dx > 0) -> 이전(-1), 왼쪽으로 스와이프(dx < 0) -> 다음(+1)
      stepCarousel(dx > 0 ? -1 : 1);
      return;
    }

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(cardMeshes);
    if (hits.length > 0) {
      const hitIdx = hits[0].object.userData.index;
      if (hitIdx === selectedIndex) {
        window.open(currentApps[hitIdx].url, '_blank', 'noopener,noreferrer');
      } else {
        jumpToIndex(hitIdx);
      }
    }
  });

  // 반응형 리사이즈
  window.addEventListener('resize', () => {
    updateCameraFraming();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // 애니메이션 루프
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    currentRotationY += (targetRotationY - currentRotationY) * 0.12;
    carouselGroup.rotation.y = currentRotationY + pointerX * 0.06;
    carouselGroup.rotation.x = -pointerY * 0.04;

    coreGroup.rotation.y = t * 0.2;
    coreGroup.rotation.x = t * 0.12;

    voxelParticles.forEach((cube, i) => {
      cube.rotation.x += 0.005 * cube.userData.speed;
      cube.rotation.y += 0.007 * cube.userData.speed;
      cube.position.y += Math.sin(t + i) * 0.0015;
    });

    cardMeshes.forEach((mesh, i) => {
      mesh.position.y = Math.sin(t * 1.4 + i) * 0.06;
    });

    renderer.render(scene, camera);
  }

  rebuildVoxelCore();
  rebuildVoxelParticles();
  renderCategories();
  refreshApps();
  animate();
});
