// js/scene.js  (Phase 6 - dynamic zoom, free roam, moon labels, scale rebuild)

let renderer, scene, camera, controls;
let sunMesh, sunCorona;
let planetMeshes = {};
let orbitLines = {};
let labelSprites = {};
let moonLabelSprites = {};
let trailLines = {};
let trailPositions = {};
let bodyRegistry = new Map();
const SCENE_DEG = Math.PI / 180;

const followState = {
  key: "sun",
  active: false,
  boostFrames: 0,
  offset: new THREE.Vector3(37.5, 26.25, 75),
  smoothedTarget: new THREE.Vector3(0, 0, 0),
};

function initScene() {
  const container = document.getElementById("canvas-container");

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010208);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.05, 20000);
  camera.position.set(0, 35, 75);
  camera.lookAt(0, 0, 0);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minDistance = 1.2;
  controls.maxDistance = 15000;

  renderer.domElement.addEventListener("pointerdown", () => {
    if (followState.key !== "sun") {
      followState.active = false;
      followState.boostFrames = 0;
    }
  });

  createStarfield();
  setupLighting();
  createSun();
  rebuildSceneBodies(true);

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
  scene.add(new THREE.AmbientLight(0x111133, 0.7));

  const sun = new THREE.PointLight(0xfff5e0, 3.0, 0, 1.1);
  sun.position.set(0, 0, 0);
  scene.add(sun);
}

function createSun() {
  const geo = new THREE.SphereGeometry(getSunDisplayRadius(), 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffcc33,
    emissive: 0xff8800,
    emissiveIntensity: 1.2,
    roughness: 0.8,
  });

  const sunTex = makePlanetTexture("banded", ["#ffaa00", "#ffcc33", "#ff8800", "#ffdd44"], 256);
  mat.map = sunTex;

  if (sunMesh) {
    scene.remove(sunMesh);
  }

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
  sunCorona.scale.set(getSunDisplayRadius() * 7.5, getSunDisplayRadius() * 7.5, 1);
  sunMesh.add(sunCorona);
}

function makeMoonKey(parentKey, moonName) {
  return `${parentKey}:${moonName.toLowerCase().replace(/\s+/g, "-")}`;
}

function clearBodies() {
  for (const planetKey of Object.keys(planetMeshes)) {
    const obj = planetMeshes[planetKey];
    scene.remove(obj.pivot);

    for (const moon of obj.moons) {
      scene.remove(moon.pivot);
    }
  }

  for (const key of Object.keys(orbitLines)) {
    scene.remove(orbitLines[key]);
  }

  for (const key of Object.keys(trailLines)) {
    scene.remove(trailLines[key]);
    trailLines[key].geometry.dispose();
  }

  planetMeshes = {};
  orbitLines = {};
  labelSprites = {};
  moonLabelSprites = {};
  trailLines = {};
  trailPositions = {};
  bodyRegistry = new Map();
}

function rebuildSceneBodies(isInitial = false) {
  const selectedBody = window.selectedBody || { kind: "star", key: "sun", name: "Sun" };

  clearBodies();
  createSun();

  for (const planet of PLANET_DATA) {
    createPlanet(planet);
    createOrbitLine(planet);
    trailPositions[planet.key] = [];
  }

  if (window.currentDate) {
    window.currentPositions = getAllPlanetPositions(window.currentDate);
    updatePlanetPositions(window.currentPositions, window.currentDate);
  }

  if (!isInitial) {
    focusOn(selectedBody);
    if (selectedBody.key !== "sun" && typeof showBodyInfo === "function") {
      showBodyInfo(selectedBody, window.currentPositions || {});
    }
  }

  updateCameraConstraints();
}

function setSizeScaleMode(mode) {
  window.sizeScaleMode = mode;
  rebuildSceneBodies();
}

function setDistanceScaleMode(mode) {
  window.distanceScaleMode = mode;
  rebuildSceneBodies();
}

function createPlanet(planet) {
  const tiltPivot = new THREE.Object3D();
  tiltPivot.rotation.z = (planet.axialTilt || 0) * SCENE_DEG;
  scene.add(tiltPivot);

  const radius = getPlanetDisplayRadius(planet);
  const geo = new THREE.SphereGeometry(radius, 36, 36);
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

  const body = {
    kind: "planet",
    key: planet.key,
    name: planet.name,
    data: planet,
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = { body };
  tiltPivot.add(mesh);

  if (planet.hasAtmosphere) {
    addAtmosphere(mesh, planet);
  }

  if (planet.hasRings) {
    addRings(mesh, planet);
  }

  const label = createLabel(planet.name, 2.5, 0.62);
  label.position.y = radius + 0.55;
  mesh.add(label);
  labelSprites[planet.key] = label;

  const moonObjects = [];
  for (const moonData of (planet.moons || [])) {
    const moonObj = createMoon(moonData, planet);
    scene.add(moonObj.pivot);
    moonObjects.push(moonObj);
  }

  planetMeshes[planet.key] = { pivot: tiltPivot, mesh, moons: moonObjects };
  bodyRegistry.set(body.key, { body, mesh, pivot: tiltPivot });
}

function addAtmosphere(mesh, planet) {
  const r = getPlanetDisplayRadius(planet);
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
  const r = getPlanetDisplayRadius(planet);
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
  const radius = getMoonDisplayRadius(moonData);

  const geo = new THREE.SphereGeometry(radius, 20, 20);
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
  mesh.userData = { body };
  pivot.add(mesh);

  const label = createLabel(moonData.name, 1.6, 0.4);
  label.position.y = radius + 0.18;
  label.visible = false;
  mesh.add(label);
  moonLabelSprites[body.key] = {
    label,
    mesh,
    threshold: Math.max(10, getMoonOrbitDisplayRadius(moonData) * 1.8),
  };

  const moonOrbitPoints = [];
  const orbitRadius = getMoonOrbitDisplayRadius(moonData);
  const inclination = (moonData.inclination || 0) * SCENE_DEG;

  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const point = new THREE.Vector3(
      Math.cos(a) * orbitRadius,
      0,
      Math.sin(a) * orbitRadius
    );
    point.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
    moonOrbitPoints.push(point);
  }

  const moonOrbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x334466,
      transparent: true,
      opacity: 0.2,
    })
  );

  pivot.add(moonOrbitLine);
  bodyRegistry.set(body.key, { body, mesh, pivot });

  return { pivot, mesh, data: moonData, body };
}

function createLabel(text, scaleX, scaleY) {
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
  sprite.scale.set(scaleX, scaleY, 1);
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

    const parentWorld = new THREE.Vector3(pos.sceneX, pos.sceneY, pos.sceneZ);
    obj.pivot.position.copy(parentWorld);

    const rotRate = planet.rotationPeriod !== 0
      ? (2 * Math.PI / planet.rotationPeriod) * (1 / 60)
      : 0;

    if (window.timeSpeed > 0) {
      obj.mesh.rotation.y += rotRate * Math.sign(planet.rotationPeriod || 1);
    }

    for (const moon of obj.moons) {
      moon.pivot.position.copy(parentWorld);

      if (moon.body.key === "earth:moon") {
        const moonScenePos = getEarthMoonScenePosition(currentDate);
        moon.mesh.position.set(
          moonScenePos.sceneX - pos.sceneX,
          moonScenePos.sceneY - pos.sceneY,
          moonScenePos.sceneZ - pos.sceneZ
        );
      } else {
        const period = Math.abs(moon.data.period);
        const dir = moon.data.period < 0 ? -1 : 1;
        const angle = (daysSinceEpoch / period) * Math.PI * 2 * dir;
        const orbitRadius = getMoonOrbitDisplayRadius(moon.data);
        const inclination = (moon.data.inclination || 0) * SCENE_DEG;

        const local = new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        );
        local.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclination);
        moon.mesh.position.copy(local);
      }
    }

    if (window.timeSpeed > 0) {
      const trail = trailPositions[planet.key];
      trail.push(new THREE.Vector3(pos.sceneX, pos.sceneY, pos.sceneZ));
      if (trail.length > 300) {
        trail.shift();
      }

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
  window.labelsEnabled = visible;

  for (const key of Object.keys(labelSprites)) {
    labelSprites[key].visible = visible;
  }

  for (const key of Object.keys(moonLabelSprites)) {
    moonLabelSprites[key].label.visible = false;
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

function getBodyWorldPosition(body) {
  if (!body || body.key === "sun") {
    return new THREE.Vector3(0, 0, 0);
  }

  const entry = bodyRegistry.get(body.key);
  if (!entry) {
    return new THREE.Vector3(0, 0, 0);
  }

  const worldPos = new THREE.Vector3();
  entry.mesh.getWorldPosition(worldPos);
  return worldPos;
}

function getFocusDistance(body) {
  if (!body || body.key === "sun") {
    return Math.max(75, getSunDisplayRadius() * 4.2);
  }

  const radius = getBodyDisplayRadius(body);

  if (body.kind === "moon") {
    return THREE.MathUtils.clamp(radius * 10, 2.2, 8);
  }

  return THREE.MathUtils.clamp(radius * 7.5, 3.5, 20);
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
  const targetPos = getBodyWorldPosition(body);
  const distance = getFocusDistance(body);
  const direction = getCurrentViewDirection();

  followState.key = body.key;
  followState.offset.copy(direction.multiplyScalar(distance));
  followState.boostFrames = 60;
  followState.active = body.key !== "sun";
  followState.smoothedTarget.copy(targetPos);

  if (body.key === "sun") {
    followState.active = false;
    controls.target.set(0, 0, 0);
    camera.position.copy(targetPos.clone().add(followState.offset));
  }

  updateCameraConstraints();
}

function updateCameraFollow() {
  if (!followState.active && followState.boostFrames <= 0) {
    updateCameraConstraints();
    return;
  }

  const targetPos = getBodyWorldPosition(resolveBody(followState.key));
  const targetSmoothing = window.timeSpeed >= 30 ? 0.08 : 0.16;
  const cameraLerp = followState.boostFrames > 0 ? 0.14 : (window.timeSpeed >= 30 ? 0.18 : 0.1);
  const controlLerp = followState.boostFrames > 0 ? 0.18 : (window.timeSpeed >= 30 ? 0.16 : 0.1);

  followState.smoothedTarget.lerp(targetPos, targetSmoothing);

  const desiredCameraPos = followState.smoothedTarget.clone().add(followState.offset);
  camera.position.lerp(desiredCameraPos, cameraLerp);
  controls.target.lerp(followState.smoothedTarget, controlLerp);

  if (followState.boostFrames > 0) {
    followState.boostFrames--;
  }

  updateCameraConstraints();
}

function updateMoonLabelVisibility() {
  const enabled = window.labelsEnabled !== false;

  for (const key of Object.keys(moonLabelSprites)) {
    const item = moonLabelSprites[key];
    const worldPos = new THREE.Vector3();
    item.mesh.getWorldPosition(worldPos);

    const distance = camera.position.distanceTo(worldPos);
    item.label.visible = enabled && distance < item.threshold;
  }
}

function updateCameraConstraints() {
  const candidates = [];
  candidates.push({
    center: new THREE.Vector3(0, 0, 0),
    radius: getSunDisplayRadius(),
  });

  for (const entry of bodyRegistry.values()) {
    candidates.push({
      center: getBodyWorldPosition(entry.body),
      radius: getBodyDisplayRadius(entry.body),
    });
  }

  let minDistance = 1.2;
  for (const candidate of candidates) {
    const distanceToTarget = controls.target.distanceTo(candidate.center);
    if (distanceToTarget < candidate.radius * 3.0) {
      minDistance = Math.max(minDistance, candidate.radius * 1.12);
    }
  }

  controls.minDistance = minDistance;
  controls.maxDistance = getDistanceScaleMode() === "realistic" ? 15000 : 800;
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
  updateMoonLabelVisibility();
  controls.update();

  if (sunCorona) {
    const s = getSunDisplayRadius() * (7.2 + Math.sin(timestamp * 0.001) * 0.35);
    sunCorona.scale.set(s, s, 1);
  }

  if (sunMesh && window.timeSpeed > 0) {
    sunMesh.rotation.y += 0.001;
  }

  renderer.render(scene, camera);
}
