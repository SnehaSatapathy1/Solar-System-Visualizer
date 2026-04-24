// js/scene.js  (Phase 3 — textures, moons, atmospheres, corona)

let renderer, scene, camera, controls;
let sunMesh, sunCorona;
let planetMeshes = {};   // key → { pivot, mesh, moons: [{pivot, mesh}] }
let orbitLines = {};
let labelSprites = {};
let trailLines = {}, trailPositions = {};
const SCENE_DEG = Math.PI / 180;

function initScene() {
  const container = document.getElementById('canvas-container');

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010208);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 5000);
  camera.position.set(0, 35, 75);
  camera.lookAt(0, 0, 0);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.5;
  controls.maxDistance = 800;

  createStarfield();
  setupLighting();
  createSun();

  for (const planet of PLANET_DATA) {
    createPlanet(planet);
    createOrbitLine(planet);
    trailPositions[planet.key] = [];
  }

  window.addEventListener('resize', onResize);
}

// ── Starfield ──────────────────────────────────────────────────
function createStarfield() {
  const count = 8000;
  const pos = new Float32Array(count * 3);
  const brightness = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 900 + Math.random() * 200;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
    brightness[i] = 0.3 + Math.random() * 0.7;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.55,
    sizeAttenuation: true,
    transparent: true, opacity: 0.85,
  });
  scene.add(new THREE.Points(geo, mat));
}

// ── Lighting ───────────────────────────────────────────────────
function setupLighting() {
  scene.add(new THREE.AmbientLight(0x111133, 0.6));

  const sun = new THREE.PointLight(0xfff5e0, 3.0, 0, 1.1);
  sun.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 500;
  scene.add(sun);
}

// ── Sun ────────────────────────────────────────────────────────
function createSun() {
  const geo = new THREE.SphereGeometry(SCALE.SUN_SIZE, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffcc33,
    emissive: 0xff8800,
    emissiveIntensity: 1.2,
    roughness: 0.8,
  });

  // Procedural sun texture
  const sunTex = makePlanetTexture('banded', ['#ffaa00','#ffcc33','#ff8800','#ffdd44'], 256);
  mat.map = sunTex;

  sunMesh = new THREE.Mesh(geo, mat);
  scene.add(sunMesh);

  // Outer corona glow (sprite)
  const coroCanvas = document.createElement('canvas');
  coroCanvas.width = 256; coroCanvas.height = 256;
  const ctx = coroCanvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0,   'rgba(255,220,80,0.95)');
  g.addColorStop(0.25,'rgba(255,140,20,0.5)');
  g.addColorStop(0.6, 'rgba(255,60,0,0.12)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const spriteMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(coroCanvas),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  sunCorona = new THREE.Sprite(spriteMat);
  sunCorona.scale.set(11, 11, 1);
  sunMesh.add(sunCorona);
}

// ── Planet creation ────────────────────────────────────────────
function createPlanet(planet) {
  // Pivot for axial tilt
  const tiltPivot = new THREE.Object3D();
  tiltPivot.rotation.z = (planet.axialTilt || 0) * SCENE_DEG;
  scene.add(tiltPivot);

  const geo = new THREE.SphereGeometry(SCALE.PLANET_SIZE * planet.size, 36, 36);
  const mat = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: 0.75,
    metalness: 0.0,
  });

  // Generate procedural texture (works on localhost, no network needed)
  if (planet.texStyle) {
    const tex = makePlanetTexture(planet.texStyle, planet.texColors);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mat.map = tex;
    mat.color.set(0xffffff);
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { planet };
  tiltPivot.add(mesh);

  // Atmosphere glow
  if (planet.hasAtmosphere) {
    addAtmosphere(mesh, planet);
  }

  // Saturn rings
  if (planet.hasRings) {
    addRings(mesh, planet);
  }

  // Label
  const label = createLabel(planet.name);
  label.position.y = SCALE.PLANET_SIZE * planet.size + 0.55;
  mesh.add(label);
  labelSprites[planet.key] = label;

  // Moons
  const moonObjects = [];
  for (const moonData of (planet.moons || [])) {
    const moonObj = createMoon(moonData, planet);
    mesh.add(moonObj.pivot);
    moonObjects.push(moonObj);
  }

  planetMeshes[planet.key] = { pivot: tiltPivot, mesh, moons: moonObjects };
}

function addAtmosphere(mesh, planet) {
  const r = SCALE.PLANET_SIZE * planet.size;
  const atmGeo = new THREE.SphereGeometry(r * 1.12, 32, 32);

  // Canvas-based atmosphere texture
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 40, 64, 64, 64);
  g.addColorStop(0,   'rgba(0,0,0,0)');
  g.addColorStop(0.7, 'rgba(0,0,0,0)');
  g.addColorStop(1,   'rgba(255,255,255,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const atmMat = new THREE.MeshStandardMaterial({
    color: planet.atmosphereColor || 0x4488ff,
    transparent: true,
    opacity: 0.18,
    side: THREE.FrontSide,
    depthWrite: false,
  });
  const atm = new THREE.Mesh(atmGeo, atmMat);
  mesh.add(atm);
}

function addRings(mesh, planet) {
  const r = SCALE.PLANET_SIZE * planet.size;
  const ringGeo = new THREE.RingGeometry(r * 1.35, r * 2.5, 80);

  // Fix RingGeometry UVs (Three.js r128 quirk)
  const pos = ringGeo.attributes.position;
  const uv  = ringGeo.attributes.uv;
  const v3  = new THREE.Vector3();
  const inner = r * 1.35, outer = r * 2.5;
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const len = v3.length();
    uv.setXY(i, (len - inner) / (outer - inner), 0.5);
  }

  // Ring texture via canvas gradient
  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = 512; ringCanvas.height = 4;
  const rctx = ringCanvas.getContext('2d');
  const rg = rctx.createLinearGradient(0, 0, 512, 0);
  rg.addColorStop(0,    'rgba(200,170,80,0.0)');
  rg.addColorStop(0.08, 'rgba(200,170,80,0.7)');
  rg.addColorStop(0.3,  'rgba(220,200,100,0.9)');
  rg.addColorStop(0.55, 'rgba(180,150,60,0.5)');
  rg.addColorStop(0.75, 'rgba(200,180,80,0.8)');
  rg.addColorStop(0.9,  'rgba(180,150,60,0.3)');
  rg.addColorStop(1,    'rgba(180,150,60,0.0)');
  rctx.fillStyle = rg;
  rctx.fillRect(0, 0, 512, 4);

  const ringTex = new THREE.CanvasTexture(ringCanvas);
  const ringMat = new THREE.MeshBasicMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });

  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.rotation.x = Math.PI / 2;
  mesh.add(rings);
}

function createMoon(moonData, planet) {
  const pivot = new THREE.Object3D();

  const geo = new THREE.SphereGeometry(SCALE.PLANET_SIZE * moonData.size, 20, 20);
  const mat = new THREE.MeshStandardMaterial({ color: moonData.color, roughness: 0.9 });

  if (moonData.texStyle) {
    const tex = makePlanetTexture(moonData.texStyle, moonData.texColors || ['#888888','#999999'], 128);
    mat.map = tex;
    mat.color.set(0xffffff);
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.x = moonData.orbitRadius;
  pivot.add(mesh);

  // Draw moon orbit ring (thin, faint)
  const moonOrbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    moonOrbitPoints.push(new THREE.Vector3(Math.cos(a) * moonData.orbitRadius, 0, Math.sin(a) * moonData.orbitRadius));
  }
  const moonOrbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.25 })
  );
  pivot.add(moonOrbitLine);

  return { pivot, mesh, data: moonData };
}

function createLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = '600 20px "Courier New"';
  ctx.fillStyle = 'rgba(190, 220, 255, 0.92)';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 36);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.62, 1);
  return sprite;
}

function createOrbitLine(planet) {
  const points = getOrbitPath(planet);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0x2a3d55, transparent: true, opacity: 0.5,
  });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  orbitLines[planet.key] = line;
}

// ── Update positions each frame ────────────────────────────────
function updatePlanetPositions(positions, currentDate) {
  const daysSinceEpoch = (currentDate.getTime() / 86400000);

  for (const planet of PLANET_DATA) {
    const pos = positions[planet.key];
    const obj = planetMeshes[planet.key];
    if (!obj || !pos) continue;

    obj.pivot.position.set(pos.sceneX, pos.sceneY, pos.sceneZ);

    // Self-rotation (approximate)
    const rotRate = planet.rotationPeriod !== 0
      ? (2 * Math.PI / planet.rotationPeriod) * (1 / 60)
      : 0;
    obj.mesh.rotation.y += rotRate * Math.sign(planet.rotationPeriod || 1);

    // Moon orbits
    for (const moon of obj.moons) {
      const period = Math.abs(moon.data.period);
      const dir = moon.data.period < 0 ? -1 : 1;
      const angle = (daysSinceEpoch / period) * Math.PI * 2 * dir;
      moon.pivot.rotation.y = angle;
    }

    // Trails
    const trail = trailPositions[planet.key];
    trail.push(new THREE.Vector3(pos.sceneX, pos.sceneY, pos.sceneZ));
    if (trail.length > 300) trail.shift();

    if (trailLines[planet.key]) {
      scene.remove(trailLines[planet.key]);
      trailLines[planet.key].geometry.dispose();
    }
    if (trail.length > 2 && window.showTrails) {
      const tLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(trail),
        new THREE.LineBasicMaterial({
          color: planet.color, transparent: true, opacity: 0.25,
        })
      );
      scene.add(tLine);
      trailLines[planet.key] = tLine;
    }
  }
}

// ── Visibility toggles ─────────────────────────────────────────
function setOrbitsVisible(v) {
  for (const k of Object.keys(orbitLines)) orbitLines[k].visible = v;
}
function setLabelsVisible(v) {
  for (const k of Object.keys(labelSprites)) labelSprites[k].visible = v;
}
function setTrailsVisible(v) {
  window.showTrails = v;
  for (const k of Object.keys(trailLines)) {
    if (trailLines[k]) trailLines[k].visible = v;
  }
}

// ── Focus camera ───────────────────────────────────────────────
function focusOn(key) {
  const targetPos = key === 'sun'
    ? new THREE.Vector3(0, 0, 0)
    : (planetMeshes[key]?.pivot.position ?? new THREE.Vector3(0, 0, 0));

  const dist = key === 'sun' ? 75 : 10;
  const from = camera.position.clone();
  const to = targetPos.clone().add(new THREE.Vector3(dist * 0.5, dist * 0.35, dist));

  let t = 0;
  const dur = 60;
  function step() {
    t++;
    const p = Math.min(t / dur, 1);
    const ease = p < 0.5 ? 2*p*p : -1 + (4 - 2*p)*p;
    camera.position.lerpVectors(from, to, ease);
    controls.target.lerp(targetPos, ease * 0.15);
    if (t < dur) requestAnimationFrame(step);
  }
  step();
}

// ── Click raycasting ───────────────────────────────────────────
function setupClickDetection(onPlanetClick) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (e) => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = Object.values(planetMeshes).map(o => o.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      onPlanetClick(hits[0].object.userData.planet);
    }
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(timestamp) {
  controls.update();
  // Animate sun corona pulse
  if (sunCorona) {
    const s = 10 + Math.sin(timestamp * 0.001) * 1.2;
    sunCorona.scale.set(s, s, 1);
  }
  sunMesh.rotation.y += 0.001;
  renderer.render(scene, camera);
}
