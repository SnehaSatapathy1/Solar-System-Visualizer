// js/ui.js  (Phase 6 - better wording, scale toggles, moon picker)

const MOON_INFO = {
  "earth:moon": {
    classification: "Natural satellite",
    distanceFromParent: "384,400 km from Earth",
    facts: "Earth's only natural satellite and the main driver of ocean tides.",
  },
  "jupiter:io": {
    classification: "Galilean moon",
    distanceFromParent: "421,700 km from Jupiter",
    facts: "The most volcanically active world in the Solar System.",
  },
  "jupiter:europa": {
    classification: "Galilean moon",
    distanceFromParent: "671,100 km from Jupiter",
    facts: "Believed to hide a global ocean beneath its icy crust.",
  },
  "jupiter:ganymede": {
    classification: "Galilean moon",
    distanceFromParent: "1,070,400 km from Jupiter",
    facts: "The largest moon in the Solar System.",
  },
  "jupiter:callisto": {
    classification: "Galilean moon",
    distanceFromParent: "1,882,700 km from Jupiter",
    facts: "A heavily cratered moon with one of the oldest surfaces around Jupiter.",
  },
  "saturn:titan": {
    classification: "Major moon",
    distanceFromParent: "1,221,900 km from Saturn",
    facts: "The only moon known to have a thick atmosphere.",
  },
  "neptune:triton": {
    classification: "Major moon",
    distanceFromParent: "354,800 km from Neptune",
    facts: "A large retrograde moon likely captured from the Kuiper Belt.",
  },
};

function getPlanetByKey(key) {
  return PLANET_DATA.find((planet) => planet.key === key) || null;
}

function makeMoonInfoKey(parentKey, moonName) {
  return `${parentKey}:${moonName.toLowerCase().replace(/\s+/g, "-")}`;
}

function formatOrbitalPeriod(days) {
  if (days >= 730) {
    const years = days / 365.25;
    return years >= 10 ? `${years.toFixed(0)} years` : `${years.toFixed(1)} years`;
  }

  return days >= 100 ? `${days.toFixed(0)} days` : `${days.toFixed(1)} days`;
}

function initUI() {
  const dateInput = document.getElementById("date-input");

  window.selectedPlanetKey = "sun";
  window.selectedBody = { kind: "star", key: "sun", name: "Sun" };

  const today = new Date();
  dateInput.value = today.toISOString().split("T")[0];

  document.getElementById("size-scale-select").value = window.sizeScaleMode;
  document.getElementById("distance-scale-select").value = window.distanceScaleMode;

  updateSpeedButtons(window.timeSpeed);
  updateSelectionDisplay(window.selectedBody);
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

  document.getElementById("size-scale-select").addEventListener("change", (e) => {
    setSizeScaleMode(e.target.value);
  });

  document.getElementById("distance-scale-select").addEventListener("change", (e) => {
    setDistanceScaleMode(e.target.value);
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

function selectMoonFromPlanet(planet, moonName) {
  const moon = planet.moons.find((item) => item.name === moonName);
  if (!moon) return;

  selectBody({
    kind: "moon",
    key: makeMoonInfoKey(planet.key, moon.name),
    name: moon.name,
    data: moon,
    parentKey: planet.key,
    parentName: planet.name,
  });
}

function selectBody(body) {
  window.selectedBody = body;
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

function attachMoonPicker(planet) {
  const picker = document.getElementById("moon-picker");
  if (!picker) return;

  picker.addEventListener("change", (e) => {
    if (!e.target.value) return;
    selectMoonFromPlanet(planet, e.target.value);
    e.target.value = "";
  });
}

function showBodyInfo(body, positions) {
  const panel = document.getElementById("info-panel");

  if (body.kind === "planet") {
    const pos = positions[body.key];
    const distAU = pos ? pos.r.toFixed(3) : "-";
    const moonCount = body.data.moons ? body.data.moons.length : 0;
    const orbitalAngle = pos ? pos.nu.toFixed(1) : "-";
    const orbitalPeriod = formatOrbitalPeriod(body.data.orbitalPeriod);

    const moonOptions = moonCount > 0
      ? body.data.moons.map((moon) => `<option value="${moon.name}">${moon.name}</option>`).join("")
      : "";

    const moonNames = moonCount > 0
      ? body.data.moons.map((moon) => moon.name).join(", ")
      : "None";

    document.getElementById("info-name").textContent = body.name;
    document.getElementById("info-details").innerHTML = `
      <div class="info-row"><span class="label">Distance from Sun</span><span class="value">${distAU} AU</span></div>
      <div class="info-row"><span class="label">Average distance from Sun</span><span class="value">${body.data.distanceFromSun}</span></div>
      <div class="info-row"><span class="label">Orbital period</span><span class="value">${orbitalPeriod}</span></div>
      <div class="info-row"><span class="label">Day length</span><span class="value">${Math.abs(body.data.rotationPeriod).toFixed(2)} Earth days</span></div>
      <div class="info-row"><span class="label">Axial tilt</span><span class="value">${body.data.axialTilt.toFixed(1)} deg</span></div>
      <div class="info-row"><span class="label">Orbital angle</span><span class="value">${orbitalAngle} deg</span></div>
      <div class="info-row"><span class="label">Moon count</span><span class="value">${moonCount}</span></div>
      <div class="info-row"><span class="label">Known moons shown here</span><span class="value">${moonNames}</span></div>
      ${moonCount > 0 ? `
        <div class="info-block">
          <span class="label">Jump to moon</span>
          <select id="moon-picker">
            <option value="">Select a moon</option>
            ${moonOptions}
          </select>
        </div>
      ` : ""}
      <div class="info-row" style="border:none;padding-top:6px"><span class="label" style="color:var(--accent2);font-size:0.7rem">${body.data.facts}</span></div>
    `;
    panel.classList.remove("hidden");
    attachMoonPicker(body.data);
    return;
  }

  if (body.kind === "moon") {
    const moonMeta = MOON_INFO[body.key] || {};
    const direction = body.data.period < 0 ? "Retrograde" : "Prograde";
    const periodText = formatOrbitalPeriod(Math.abs(body.data.period));
    const classification = moonMeta.classification || "Natural satellite";
    const distanceFromParent = moonMeta.distanceFromParent || "Not added yet";
    const facts = moonMeta.facts || `A moon orbiting ${body.parentName}.`;

    document.getElementById("info-name").textContent = body.name;
    document.getElementById("info-details").innerHTML = `
      <div class="info-row"><span class="label">Parent planet</span><span class="value">${body.parentName}</span></div>
      <div class="info-row"><span class="label">Type</span><span class="value">${classification}</span></div>
      <div class="info-row"><span class="label">Orbital period</span><span class="value">${periodText}</span></div>
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
