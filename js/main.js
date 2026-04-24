// js/main.js  (Phase 5 - startup safety + unified body selection)

window.currentDate = new Date();
window.timeSpeed = 1;
window.currentPositions = {};
window.showTrails = false;
window.selectedPlanetKey = "sun";

let lastTimestamp = null;

function hideLoading() {
  const loading = document.getElementById("loading");
  if (loading) {
    loading.classList.add("hidden");
  }
}

function showStartupError(error) {
  console.error(error);

  const loading = document.getElementById("loading");
  if (!loading) return;

  loading.innerHTML = `
    <div style="max-width: 28rem; text-align: center; padding: 0 1.5rem;">
      <h2 style="margin-bottom: 0.75rem; color: #ffb36b; font-family: Georgia, serif;">Startup Error</h2>
      <p style="margin-bottom: 0.5rem; color: #d0e8ff;">The visualizer could not finish loading.</p>
      <p style="color: #8fb0d6; font-size: 0.9rem; line-height: 1.5;">
        Open the browser console to see the exact error, then reload after fixing it.
      </p>
    </div>
  `;
  loading.classList.remove("hidden");
}

function init() {
  initScene();
  initUI();

  setupClickDetection((body) => {
    selectBody(body);
  });

  setTimeout(hideLoading, 300);
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

try {
  init();
} catch (error) {
  showStartupError(error);
}
