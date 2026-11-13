import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

document.addEventListener('DOMContentLoaded', () => {
  const htmlEl = document.documentElement;
  const canvas = document.getElementById('portal-3d');
  const categoryTabsEl = document.getElementById('category-tabs');
  const appCountEl = document.getElementById('app-count');
  const hudWrapper = document.getElementById('hud-wrapper');
  const hudIcon = document.getElementById('hud-icon');
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

  // 1. 시스템 다크 모드 자동 연동
  const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let isDarkMode = darkMediaQuery.matches;

  function syncSystemTheme(dark) {
    isDarkMode = dark;
    htmlEl.classList.toggle('dark', dark);
    if (scene) {
      scene.background = new THREE.Color(dark ? 0x020617 : 0xf8fafc);
      scene.fog = new THREE.FogExp2(dark ? 0x020617 : 0xf8fafc, 0.045);
    }
    if (coreWireMaterial) {
      coreWireMaterial.color.setHex(dark ? 0x6366f1 : 0x4f46e5);
    }
    if (particleMaterial) {
      particleMaterial.color.setHex(dark ? 0x818cf8 : 0x6366f1);
    }
    rebuildCards();
  }
  htmlEl.classList.toggle('dark', isDarkMode);
  darkMediaQuery.addEventListener('change', e => syncSystemTheme(e.matches));

  // 2. Three.js 씬 초기화
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(isDarkMode ? 0x020617 : 0xf8fafc);
  scene.fog = new THREE.FogExp2(isDarkMode ? 0x020617 : 0xf8fafc, 0.045);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 7.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0x818cf8, 1.2);
  dirLight.position.set(4, 6, 5);
  scene.add(dirLight);

  // 배경 3D 코어 오브제
  const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
  const coreWireMaterial = new THREE.MeshBasicMaterial({
    color: isDarkMode ? 0x6366f1 : 0x4f46e5,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreWireMaterial);
  coreMesh.position.set(0, 0.15, -1.2);
  scene.add(coreMesh);

  // 배경 3D 파티클
  const particleCount = 180;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 22;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: isDarkMode ? 0x818cf8 : 0x6366f1,
    size: 0.055,
    transparent: true,
    opacity: 0.55
  });
  const particles = new THREE.Points(particleGeo, particleMaterial);
  scene.add(particles);

  // 카드 캐러셀 그룹
  const carouselGroup = new THREE.Group();
  carouselGroup.position.set(0, 0.2, 0);
  scene.add(carouselGroup);

  let cardMeshes = [];
  let targetRotationY = 0;
  let currentRotationY = 0;
  let pointerX = 0;
  let pointerY = 0;

  // 3. CanvasTexture로 선명한 3D 앱 카드 텍스처 생성
  function createCardTexture(app, isSelected) {
    const c = document.createElement('canvas');
    c.width = 720;
    c.height = 460;
    const ctx = c.getContext('2d');

    // 배경 카드
    ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
    roundRect(ctx, 12, 12, 696, 436, 36);
    ctx.fill();

    // 테두리
    ctx.lineWidth = isSelected ? 6 : 3;
    ctx.strokeStyle = isSelected ? '#6366f1' : isDarkMode ? '#1e293b' : '#e2e8f0';
    roundRect(ctx, 12, 12, 696, 436, 36);
    ctx.stroke();

    // 아이콘 박스
    ctx.fillStyle = isDarkMode ? '#1e1b4b' : '#eef2ff';
    roundRect(ctx, 48, 48, 96, 96, 24);
    ctx.fill();

    ctx.font = '52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(app.icon || '🚀', 96, 98);

    // 카테고리 & 상태
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(app.category.toUpperCase(), 168, 56);

    // 제목
    ctx.fillStyle = isDarkMode ? '#f8fafc' : '#0f172a';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(truncateText(ctx, app.name, 480), 168, 92);

    // 설명
    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#475569';
    ctx.font = '24px sans-serif';
    wrapText(ctx, app.description, 48, 178, 624, 34, 3);

    // 태그
    let tagX = 48;
    const tagY = 340;
    ctx.font = 'bold 20px sans-serif';
    (app.tags || []).slice(0, 4).forEach(tag => {
      const w = ctx.measureText(tag).width + 28;
      ctx.fillStyle = isDarkMode ? '#1e293b' : '#f1f5f9';
      roundRect(ctx, tagX, tagY, w, 40, 12);
      ctx.fill();
      ctx.fillStyle = isDarkMode ? '#cbd5e1' : '#334155';
      ctx.fillText(tag, tagX + 14, tagY + 9);
      tagX += w + 12;
    });

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
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

  // 4. 3D 카드 배치 및 갱신
  function rebuildCards() {
    cardMeshes.forEach(m => {
      m.geometry.dispose();
      m.material.map?.dispose();
      m.material.dispose();
      carouselGroup.remove(m);
    });
    cardMeshes = [];

    const count = currentApps.length;
    if (count === 0) return;

    const radius = count === 1 ? 0 : Math.max(2.8, count * 0.85);
    const cardGeo = new THREE.PlaneGeometry(3.4, 2.18);

    currentApps.forEach((app, idx) => {
      const tex = createCardTexture(app, idx === selectedIndex);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(cardGeo.clone(), mat);

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
  }

  function updateTargetRotation() {
    const count = currentApps.length;
    if (count <= 1) {
      targetRotationY = 0;
      return;
    }
    targetRotationY = -(selectedIndex / count) * Math.PI * 2;
  }

  function selectIndex(idx) {
    if (currentApps.length === 0) return;
    selectedIndex = (idx + currentApps.length) % currentApps.length;
    updateTargetRotation();
    updateHud();
    rebuildCards();
  }

  // 5. 하단 HUD 업데이트
  function updateHud() {
    if (currentApps.length === 0) {
      hudWrapper.classList.add('hidden');
      return;
    }
    hudWrapper.classList.remove('hidden');
    const app = currentApps[selectedIndex];
    const isPinned = pinnedIds.includes(app.id);

    hudIcon.textContent = app.icon || '🚀';
    hudCategory.textContent = app.category;
    hudStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>${app.status}`;
    hudTitle.textContent = app.name;
    hudDesc.textContent = app.description;
    hudIndex.textContent = `${selectedIndex + 1} / ${currentApps.length}`;

    hudPin.textContent = isPinned ? '★' : '☆';
    hudPin.className = `w-8 h-8 rounded-lg flex items-center justify-center text-base transition shrink-0 ${
      isPinned
        ? 'bg-amber-400/15 text-amber-500'
        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
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
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent hover:border-indigo-400';
        return `<button type="button" data-category="${cat}" class="category-btn px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${activeClasses}">${cat}</button>`;
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
    appCountEl.textContent = `${currentApps.length}개`;
    selectedIndex = 0;
    rebuildCards();
    updateHud();
  }

  // 7. 이벤트 바인딩 (즐겨찾기, 버튼, 드래그/터치, 레이캐스팅)
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

  prevBtn.addEventListener('click', () => selectIndex(selectedIndex - 1));
  nextBtn.addEventListener('click', () => selectIndex(selectedIndex + 1));

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') selectIndex(selectedIndex - 1);
    if (e.key === 'ArrowRight') selectIndex(selectedIndex + 1);
  });

  // 터치/마우스 드래그 & 클릭 레이캐스팅
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
      selectIndex(dx > 0 ? selectedIndex - 1 : selectedIndex + 1);
      return;
    }

    // 클릭으로 카드 선택 또는 실행
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(cardMeshes);
    if (hits.length > 0) {
      const hitIdx = hits[0].object.userData.index;
      if (hitIdx === selectedIndex) {
        window.open(currentApps[hitIdx].url, '_blank', 'noopener,noreferrer');
      } else {
        selectIndex(hitIdx);
      }
    }
  });

  // 반응형 리사이즈
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // 애니메이션 루프
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    currentRotationY += (targetRotationY - currentRotationY) * 0.1;
    carouselGroup.rotation.y = currentRotationY + pointerX * 0.08;
    carouselGroup.rotation.x = -pointerY * 0.05;

    coreMesh.rotation.y = t * 0.18;
    coreMesh.rotation.x = t * 0.11;
    particles.rotation.y = t * 0.025;

    cardMeshes.forEach((mesh, i) => {
      mesh.position.y = Math.sin(t * 1.4 + i) * 0.06;
    });

    renderer.render(scene, camera);
  }

  renderCategories();
  refreshApps();
  animate();
});
