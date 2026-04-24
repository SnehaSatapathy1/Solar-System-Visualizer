// js/ui.js  (Phase 5 - smart selection, moon info, free-roam-friendly focus)

const MOON_INFO = {
  "earth:moon": {
    classification: "Natural satellite",
    distanceFromParent: "384,400 km",
    facts: "Earth's only natural satellite and the main driver of ocean tides.",
  },
  "jupiter:io": {
    classification: "Galilean moon",
    distanceFromParent: "421,700 km",
    facts: "The most volcanically active world in the Solar System.",
  },
  "jupiter:europa": {
    classification: "Galilean moon",
    distanceFromParent: "671,100 km",
    facts: "Believed to hide a global ocean beneath its icy crust.",
  },
  "jupiter:ganymede": {
    classification: "Galilean moon",
    distanceFromParent: "1,070,400 km",
    facts: "The largest moon in the Solar System.",
  },
  "jupiter:callisto": {
    classification: "Galilean moon",
    distanceFromParent: "1,882,700 km",
    facts: "A heavily cratered moon with one of the oldest surfaces around Jupiter.",
  },
  "saturn:titan": {
    classification: "Major moon",
    distanceFromParent: "1,221,900 km",
    facts: "The only moon known to have a thick atmosphere.",
  },
  "neptune:triton": {
    classification: "Major moon",
    distanceFromParent: "354,800 km",
    facts: "A large retrograde moon likely captured from the Kuiper Belt.",
  },
};

function getPlanetByKey(key) {
  return PLANET_DATA.find((planet) => planet.key === key) || null;
}

function initUI() {
  const dateInput = document.getElementById("date-input");

  window.selectedPlanetKey = "sun";

  const today = new Date();
  dateInput.value = today.toISOString().split("T")[0];

  updateSpeedButtons(window.timeSpeed);
  updateSelectionDisplay({ kind: "star", key: "sun", name: "Sun" });
  updateSimulationStatus();

  dateInput.addEventListener("change", () => {
    if (dateInput.value) {
      window.currentDate = new Date(dateInput.value + "T12:00:00Z");
      window.timeSpeed = 0;
      updateSpeedButtons(0);
      updateSimulationStatus();
    }
  });

  document.getElementById("today-btn").addEventListener("click", () => {
    const now = new Date();
    window.currentDate = now;
    dateInput.value = now.toISOString().split("T")[0];
    window.timeSpeed = 1;
    updateSpeedButtons(1);
    updateSimulationStatus();
  });

  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const speed = parseFloat(btn.dataset.speed);
      window.timeSpeed = speed;
      updateSpeedButtons(speed);
      updateSimulationStatus();
    });
  });

  document.getElementById("focus-select").addEventListener("change", (e) => {
    selectPlanetFromUI(e.target.value);
  });

  document.getElementById("reset-view-btn").addEventListener("click", () => {
    selectPlanetFromUI("sun");
  });

  document.getElementById("toggle-orbits").addEventListener("change", (e) => {
    setOrbitsVisible(e.target.checked);
  });

  document.getElementById("toggle-labels").addEventListener("change", (e) => {
    setLabelsVisible(e.target.checked);
  });

  document.getElementById("toggle-trails").addEventListener("change", (e) => {
    setTrailsVisible(e.target.checked);
  });

  document.getElementById("close-info").addEventListener("click", () => {
    document.getElementById("info-panel").classList.add("hidden");
  });
}

function selectPlanetFromUI(key) {
  if (key === "sun") {
    selectBody({ kind: "star", key: "sun", name: "Sun" });
    return;
  }

  const planet = getPlanetByKey(key);
  if (!planet) return;

  selectBody({
    kind: "planet",
    key: planet.key,
    name: planet.name,
    data: planet,
  });
}

function selectBody(body) {
  focusOn(body);
  updateSelectionDisplay(body);
  syncFocusSelect(body);

  if (body.key === "sun") {
    document.getElementById("info-panel").classList.add("hidden");
    return;
  }

  showBodyInfo(body, window.currentPositions || {});
}

function syncFocusSelect(body) {
  const focusSelect = document.getElementById("focus-select");
  if (!focusSelect) return;

  if (body.kind === "moon") {
    focusSelect.value = body.parentKey;
    return;
  }

  focusSelect.value = body.key;
}

function updateSpeedButtons(speed) {
  document.querySelectorAll(".speed-btn").forEach((btn) => {
    btn.classList.toggle("active", parseFloat(btn.dataset.speed) === speed);
  });
}

function updateSelectionDisplay(body) {
  const selectionDisplay = document.getElementById("selection-display");
  if (!selectionDisplay) return;

  if (!body || body.key === "sun") {
    window.selectedPlanetKey = "sun";
    selectionDisplay.textContent = "Viewing: Sun";
    return;
  }

  if (body.kind === "planet") {
    window.selectedPlanetKey = body.key;
  } else if (body.kind === "moon") {
    window.selectedPlanetKey = body.parentKey;
  }

  selectionDisplay.textContent = `Viewing: ${body.name}`;
}

function updateSimulationStatus() {
  const status = document.getElementById("sim-status");
  if (!status) return;

  if (window.timeSpeed === 0) {
    status.textContent = "Paused";
    status.classList.add("paused");
  } else {
    status.textContent = `Playing ${window.timeSpeed}x`;
    status.classList.remove("paused");
  }
}

function showBodyInfo(body, positions) {
  const panel = document.getElementById("info-panel");

  if (body.kind === "planet") {
    const pos = positions[body.key];
    const distAU = pos ? pos.r.toFixed(3) : "-";
    const moonCount = body.data.moons ? body.data.moons.length : 0;
    const orbitalAngle = pos ? pos.nu.toFixed(1) : "-";

    const moonNames = moonCount > 0
      ? body.data.moons.map((moon) => moon.name).join(", ")
      : "None";

    document.getElementById("info-name").textContent = body.name;
    document.getElementById("info-details").innerHTML = `
      <div class="info-row"><span class="label">Distance from Sun</span><span class="value">${distAU} AU</span></div>
      <div class="info-row"><span class="label">Average distance</span><span class="value">${body.data.distanceFromSun}</span></div>
      <div class="info-row"><span class="label">Orbital period</span><span class="value">${body.data.orbitalPeriod.toFixed(0)} days</span></div>
      <div class="info-row"><span class="label">Day length</span><span class="value">${Math.abs(body.data.rotationPeriod).toFixed(2)} Earth days</span></div>
      <div class="info-row"><span class="label">Axial tilt</span><span class="value">${body.data.axialTilt.toFixed(1)} deg</span></div>
      <div class="info-row"><span class="label">Orbital angle</span><span class="value">${orbitalAngle} deg</span></div>
      <div class="info-row"><span class="label">Moon count</span><span class="value">${moonCount}</span></div>
      <div class="info-row"><span class="label">Moons</span><span class="value">${moonNames}</span></div>
      <div class="info-row" style="border:none;padding-top:6px"><span class="label" style="color:var(--accent2);font-size:0.7rem">${body.data.facts}</span></div>
    `;
    panel.classList.remove("hidden");
    return;
  }

  if (body.kind === "moon") {
    const moonMeta = MOON_INFO[body.key] || {};
    const direction = body.data.period < 0 ? "Retrograde" : "Prograde";
    const periodDays = Math.abs(body.data.period).toFixed(2);
    const classification = moonMeta.classification || "Natural satellite";
    const distanceFromParent = moonMeta.distanceFromParent || "Not added yet";
    const facts = moonMeta.facts || `A moon orbiting ${body.parentName}.`;

    document.getElementById("info-name").textContent = body.name;
    document.getElementById("info-details").innerHTML = `
      <div class="info-row"><span class="label">Parent planet</span><span class="value">${body.parentName}</span></div>
      <div class="info-row"><span class="label">Type</span><span class="value">${classification}</span></div>
      <div class="info-row"><span class="label">Orbital period</span><span class="value">${periodDays} days</span></div>
      <div class="info-row"><span class="label">Orbit direction</span><span class="value">${direction}</span></div>
      <div class="info-row"><span class="label">Distance from parent</span><span class="value">${distanceFromParent}</span></div>
      <div class="info-row"><span class="label">Surface style</span><span class="value">${body.data.texStyle || "Unknown"}</span></div>
      <div class="info-row" style="border:none;padding-top:6px"><span class="label" style="color:var(--accent2);font-size:0.7rem">${facts}</span></div>
    `;
    panel.classList.remove("hidden");
  }
}

function updateDateDisplay(date) {
  document.getElementById("date-display").textContent = formatDate(date);
  updateSimulationStatus();

  const iso = date.toISOString().split("T")[0];
  const input = document.getElementById("date-input");

  if (document.activeElement !== input) {
    input.value = iso;
  }
}
