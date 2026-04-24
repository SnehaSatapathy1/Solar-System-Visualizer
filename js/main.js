// js/main.js  (Phase 3)

window.currentDate = new Date();
window.timeSpeed = 1;
window.currentPositions = {};
window.showTrails = false;

let lastTimestamp = null;

function init() {
  initScene();
  initUI();

  setupClickDetection((planet) => {
    showPlanetInfo(planet, window.currentPositions);
    focusOn(planet.key);
    document.getElementById('focus-select').value = planet.key;
  });

  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 300);

  requestAnimationFrame(loop);
}

function loop(timestamp) {
  requestAnimationFrame(loop);

  if (lastTimestamp !== null && window.timeSpeed > 0) {
    const dtMs = timestamp - lastTimestamp;
    const dtDays = (dtMs / 1000) * window.timeSpeed;
    window.currentDate = new Date(window.currentDate.getTime() + dtDays * 86400000);
  }
  lastTimestamp = timestamp;

  window.currentPositions = getAllPlanetPositions(window.currentDate);
  updatePlanetPositions(window.currentPositions, window.currentDate);
  updateDateDisplay(window.currentDate);

  render(timestamp);
}

init();
