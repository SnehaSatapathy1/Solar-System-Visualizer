// js/ui.js  (Phase 3)

function initUI() {
  const dateInput = document.getElementById('date-input');

  // Set today's date
  const today = new Date();
  dateInput.value = today.toISOString().split('T')[0];

  dateInput.addEventListener('change', () => {
    if (dateInput.value) {
      window.currentDate = new Date(dateInput.value + 'T12:00:00Z');
      window.timeSpeed = 0;
      updateSpeedButtons(0);
    }
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    const now = new Date();
    window.currentDate = now;
    dateInput.value = now.toISOString().split('T')[0];
    window.timeSpeed = 1;
    updateSpeedButtons(1);
  });

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      window.timeSpeed = speed;
      updateSpeedButtons(speed);
    });
  });

  document.getElementById('focus-select').addEventListener('change', (e) => {
    focusOn(e.target.value);
  });

  document.getElementById('toggle-orbits').addEventListener('change', (e) => {
    setOrbitsVisible(e.target.checked);
  });
  document.getElementById('toggle-labels').addEventListener('change', (e) => {
    setLabelsVisible(e.target.checked);
  });
  document.getElementById('toggle-trails').addEventListener('change', (e) => {
    setTrailsVisible(e.target.checked);
  });

  document.getElementById('close-info').addEventListener('click', () => {
    document.getElementById('info-panel').classList.add('hidden');
  });
}

function updateSpeedButtons(speed) {
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
  });
}

function showPlanetInfo(planet, positions) {
  const panel = document.getElementById('info-panel');
  const pos = positions[planet.key];
  const distAU = pos ? pos.r.toFixed(3) : '—';

  // List moons
  const moonNames = planet.moons && planet.moons.length > 0
    ? planet.moons.map(m => m.name).join(', ')
    : 'None';

  document.getElementById('info-name').textContent = planet.name;
  document.getElementById('info-details').innerHTML = `
    <div class="info-row"><span class="label">Distance from Sun</span><span class="value">${distAU} AU</span></div>
    <div class="info-row"><span class="label">Avg distance</span><span class="value">${planet.distanceFromSun}</span></div>
    <div class="info-row"><span class="label">Orbital period</span><span class="value">${planet.orbitalPeriod.toFixed(0)} days</span></div>
    <div class="info-row"><span class="label">Day length</span><span class="value">${Math.abs(planet.rotationPeriod).toFixed(2)} Earth days</span></div>
    <div class="info-row"><span class="label">Axial tilt</span><span class="value">${planet.axialTilt.toFixed(1)}°</span></div>
    <div class="info-row"><span class="label">Moons</span><span class="value">${moonNames}</span></div>
    <div class="info-row" style="border:none;padding-top:6px"><span class="label" style="color:var(--accent2);font-size:0.7rem">${planet.facts}</span></div>
  `;
  panel.classList.remove('hidden');
}

function updateDateDisplay(date) {
  document.getElementById('date-display').textContent = formatDate(date);
  const iso = date.toISOString().split('T')[0];
  const input = document.getElementById('date-input');
  // Only update input when not actively editing
  if (document.activeElement !== input) {
    input.value = iso;
  }
}
