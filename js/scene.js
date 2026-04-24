// js/scene.js  (Phase 5 - dynamic zoom focus, free roam, moon selection)

let renderer, scene, camera, controls;
let sunMesh, sunCorona;
let planetMeshes = {};
let orbitLines = {};
let labelSprites = {};
let trailLines = {};
let trailPositions = {};
let bodyRegistry = new Map();
const SCENE_DEG = Math.PI / 180;

const followState = {
  key: "sun",
  active: false,
  boostFrames: 0,
  offset: new THREE.Vector3(37.5, 26.25, 75),
};

function initScene() {
  const container = document.getElementById("canvas-container");

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
  controls.enablePan = true;
  controls.minDistance = 1.2;
  controls.maxDistance = 800;

  controls.addEventListener("start", () => {
    if (followState.key !== "sun") {
      followState.active = false;
      followState.boostFrames = 0;
    }
  });

  createStarfield();
  setupLighting();
  createSun();

  for (const planet of PLANET_DATA) {
    createPlanet(planet);
    createOrbitLine(planet);
    trailPositions[planet.key] = [];
  }

  window.addEventListener("resize", onResize);
}

function createStarfield() {
  const count = 8000;
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 900 + Math.random() * 200;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.55,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
  });

  scene.add(new THREE.Points(geo, mat));
}

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

function createSun() {
  const geo = new THREE.SphereGeometry(SCALE.SUN_SIZE, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffcc33,
    emissive: 0xff8800,
    emissiveIntensity: 1.2,
    roughness: 0.8,
  });

  const sunTex = makePlanetTexture("banded", ["#ffaa00", "#ffcc33", "#ff8800", "#ffdd44"], 256);
  mat.map = sunTex;

  sunMesh = new THREE.Mesh(geo, mat);
  scene.add(sunMesh);

  const coroCanvas = document.createElement("canvas");
  coroCanvas.width = 256;
  coroCanvas.height = 256;
  const ctx = coroCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,220,80,0.95)");
  gradient.addColorStop(0.25, "rgba(255,140,20,0.5)");
  gradient.addColorStop(0.6, "rgba(255,60,0,0.12)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const spriteMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(coroCanvas),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  sunCorona = new THREE.Sprite(spriteMat);
  sunCorona.scale.set(11, 11, 1);
  sunMesh.add(sunCorona);
}

function makeMoonKey(parentKey, moonName) {
  return `${parentKey}:${moonName.toLowerCase().replace(/\s+/g, "-")}`;
}

function createPlanet(planet) {
  const tiltPivot = new THREE.Object3D();
  tiltPivot.rotation.z = (planet.axialTilt || 0) * SCENE_DEG;
  scene.add(tiltPivot);

  const geo = new THREE.SphereGeometry(SCALE.PLANET_SIZE * planet.size, 36, 36);
  const mat = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: 0.75,
    metalness: 0.0,
  });

  if (planet.texStyle) {
    const tex = makePlanetTexture(planet.texStyle, planet.texColors);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mat.map = tex;
    mat.color.set(0xffffff);
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const body = {
    kind: "planet",
    key: planet.key,
    name: planet.name,
    data: planet,
  };

  mesh.userData = { body };
  tiltPivot.add(mesh);

  if (planet.hasAtmosphere) {
    addAtmosphere(mesh, planet);
  }

  if (planet.hasRings) {
    addRings(mesh, planet);
  }

  const label = createLabel(planet.name);
  label.position.y = SCALE.PLANET_SIZE * planet.size + 0.55;
  mesh.add(label);
  labelSprites[planet.key] = label;

  const moonObjects = [];
  for (const moonData of (planet.moons || [])) {
    const moonObj = createMoon(moonData, planet);
    tiltPivot.add(moonObj.pivot);
    moonObjects.push(moonObj);
  }

  planetMeshes[planet.key] = { pivot: tiltPivot, mesh, moons: moonObjects };
  bodyRegistry.set(body.key, { body, mesh, pivot: tiltPivot });
}

function addAtmosphere(mesh, planet) {
  const r = SCALE.PLANET_SIZE * planet.size;
  const atmGeo = new THREE.SphereGeometry(r * 1.12, 32, 32);

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

  const pos = ringGeo.attributes.position;
  const uv = ringGeo.attributes.uv;
  const v3 = new THREE.Vector3();
  const inner = r * 1.35;
  const outer = r * 2.5;

  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const len = v3.length();
    uv.setXY(i, (len - inner) / (outer - inner), 0.5);
  }

  const ringCanvas = document.createElement("canvas");
  ringCanvas.width = 512;
  ringCanvas.height = 4;
  const rctx = ringCanvas.getContext("2d");
  const gradient = rctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, "rgba(200,170,80,0.0)");
  gradient.addColorStop(0.08, "rgba(200,170,80,0.7)");
  gradient.addColorStop(0.3, "rgba(220,200,100,0.9)");
  gradient.addColorStop(0.55, "rgba(180,150,60,0.5)");
  gradient.addColorStop(0.75, "rgba(200,180,80,0.8)");
  gradient.addColorStop(0.9, "rgba(180,150,60,0.3)");
  gradient.addColorStop(1, "rgba(180,150,60,0.0)");
  rctx.fillStyle = gradient;
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

function createMoon(moonData, parentPlanet) {
  const pivot = new THREE.Object3D();

  const geo = new THREE.SphereGeometry(SCALE.PLANET_SIZE * moonData.size, 20, 20);
  const mat = new THREE.MeshStandardMaterial({
    color: moonData.color,
    roughness: 0.9,
  });

  if (moonData.texStyle) {
    const tex = makePlanetTexture(moonData.texStyle, moonData.texColors || ["#888888", "#999999"], 128);
    mat.map = tex;
    mat.color.set(0xffffff);
  }

  const body = {
    kind: "moon",
    key: makeMoonKey(parentPlanet.key, moonData.name),
    name: moonData.name,
    data: moonData,
    parentKey: parentPlanet.key,
    parentName: parentPlanet.name,
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.x = moonData.orbitRadius;
  mesh.userData = { body };
  pivot.add(mesh);

  const moonOrbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    moonOrbitPoints.push(
      new THREE.Vector3(
        Math.cos(a) * moonData.orbitRadius,
        0,
        Math.sin(a) * moonData.orbitRadius
      )
    );
  }

  const moonOrbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x334466,
      transparent: true,
      opacity: 0.25,
    })
  );

  pivot.add(moonOrbitLine);

  bodyRegistry.set(body.key, { body, mesh, pivot });

  return { pivot, mesh, data: moonData, body };
}

function createLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = '600 20px "Courier New"';
  ctx.fillStyle = "rgba(190, 220, 255, 0.92)";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 36);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.5, 0.62, 1);
  return sprite;
}

function createOrbitLine(planet) {
  const points = getOrbitPath(planet);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0x2a3d55,
    transparent: true,
    opacity: 0.5,
  });

  const line = new THREE.Line(geo, mat);
  scene.add(line);
  orbitLines[planet.key] = line;
}

function updatePlanetPositions(positions, currentDate) {
  const daysSinceEpoch = currentDate.getTime() / 86400000;

  for (const planet of PLANET_DATA) {
    const pos = positions[planet.key];
    const obj = planetMeshes[planet.key];
    if (!obj || !pos) continue;

    obj.pivot.position.set(pos.sceneX, pos.sceneY, pos.sceneZ);

    const rotRate = planet.rotationPeriod !== 0
      ? (2 * Math.PI / planet.rotationPeriod) * (1 / 60)
      : 0;

    if (window.timeSpeed > 0) {
      obj.mesh.rotation.y += rotRate * Math.sign(planet.rotationPeriod || 1);
    }

    for (const moon of obj.moons) {
      if (window.timeSpeed > 0) {
        const period = Math.abs(moon.data.period);
        const dir = moon.data.period < 0 ? -1 : 1;
        const angle = (daysSinceEpoch / period) * Math.PI * 2 * dir;
        moon.pivot.rotation.y = angle;
      }
    }

    if (window.timeSpeed > 0) {
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
            color: planet.color,
            transparent: true,
            opacity: 0.25,
          })
        );
        scene.add(tLine);
        trailLines[planet.key] = tLine;
      }
    }
  }
}

function setOrbitsVisible(visible) {
  for (const key of Object.keys(orbitLines)) {
    orbitLines[key].visible = visible;
  }
}

function setLabelsVisible(visible) {
  for (const key of Object.keys(labelSprites)) {
    labelSprites[key].visible = visible;
  }
}

function setTrailsVisible(visible) {
  window.showTrails = visible;
  for (const key of Object.keys(trailLines)) {
    if (trailLines[key]) {
      trailLines[key].visible = visible;
    }
  }
}

function resolveBody(target) {
  if (!target || target === "sun" || target.key === "sun") {
    return { kind: "star", key: "sun", name: "Sun" };
  }

  if (typeof target === "string") {
    return bodyRegistry.get(target)?.body || { kind: "star", key: "sun", name: "Sun" };
  }

  return bodyRegistry.get(target.key)?.body || target;
}

function getFocusTargetPosition(target) {
  const body = resolveBody(target);

  if (body.key === "sun") {
    return new THREE.Vector3(0, 0, 0);
  }

  const entry = bodyRegistry.get(body.key);
  if (!entry) {
    return new THREE.Vector3(0, 0, 0);
  }

  if (body.kind === "moon") {
    const worldPos = new THREE.Vector3();
    entry.mesh.getWorldPosition(worldPos);
    return worldPos;
  }

  return entry.pivot.position.clone();
}

function getFocusDistance(body) {
  if (!body || body.key === "sun") {
    return 75;
  }

  const size = body.data?.size || 1;
  const sceneRadius = SCALE.PLANET_SIZE * size;

  if (body.kind === "moon") {
    return THREE.MathUtils.clamp(sceneRadius * 30, 2.5, 6);
  }

  return THREE.MathUtils.clamp(sceneRadius * 20, 4, 14);
}

function getCurrentViewDirection() {
  const direction = camera.position.clone().sub(controls.target);

  if (direction.lengthSq() < 0.0001) {
    return new THREE.Vector3(0.5, 0.35, 1).normalize();
  }

  return direction.normalize();
}

function focusOn(target) {
  const body = resolveBody(target);
  const distance = getFocusDistance(body);
  const direction = getCurrentViewDirection();

  followState.key = body.key;
  followState.offset.copy(direction.multiplyScalar(distance));
  followState.boostFrames = 60;
  followState.active = body.key !== "sun";
}

function updateCameraFollow() {
  if (!followState.active && followState.boostFrames <= 0) {
    return;
  }

  const targetPos = getFocusTargetPosition(followState.key);
  const desiredCameraPos = targetPos.clone().add(followState.offset);

  const cameraLerp = followState.boostFrames > 0 ? 0.12 : 0.08;
  const targetLerp = followState.boostFrames > 0 ? 0.16 : 0.08;

  camera.position.lerp(desiredCameraPos, cameraLerp);
  controls.target.lerp(targetPos, targetLerp);

  if (followState.boostFrames > 0) {
    followState.boostFrames--;
  }
}

function setupClickDetection(onBodyClick) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener("click", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const clickableMeshes = Array.from(bodyRegistry.values()).map((entry) => entry.mesh);
    const hits = raycaster.intersectObjects(clickableMeshes, false);

    if (hits.length > 0) {
      onBodyClick(hits[0].object.userData.body);
    }
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(timestamp) {
  updateCameraFollow();
  controls.update();

  if (sunCorona) {
    const s = 10 + Math.sin(timestamp * 0.001) * 1.2;
    sunCorona.scale.set(s, s, 1);
  }

  if (sunMesh && window.timeSpeed > 0) {
    sunMesh.rotation.y += 0.001;
  }

  renderer.render(scene, camera);
}
