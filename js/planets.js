// js/planets.js  (Phase 3 — procedural textures + moons)
// Textures are generated via canvas — no external URLs needed, works on localhost

const PLANET_DATA = [
  {
    name: "Mercury", key: "mercury",
    color: 0x8c7853, texStyle: 'rocky', texColors: ['#7a6545','#8c7853','#9d8d6a','#6b5a3a'],
    semiMajorAxis: 0.387, eccentricity: 0.2056,
    inclination: 7.005, longitudeAscNode: 48.331, argPerihelion: 29.124,
    meanLongitude: 252.25, dailyMotion: 4.092317,
    orbitalPeriod: 87.97, rotationPeriod: 58.65, axialTilt: 0.034,
    distanceFromSun: "57.9M km",
    facts: "Smallest planet · Extreme temperatures · No atmosphere",
    moons: [], size: 0.5,
  },
  {
    name: "Venus", key: "venus",
    color: 0xe8cda0, texStyle: 'cloudy', texColors: ['#d4b870','#e8cda0','#f0ddb0','#c8a860'],
    hasAtmosphere: true, atmosphereColor: 0xffdd88,
    semiMajorAxis: 0.723, eccentricity: 0.0068,
    inclination: 3.395, longitudeAscNode: 76.680, argPerihelion: 54.884,
    meanLongitude: 181.98, dailyMotion: 1.602136,
    orbitalPeriod: 224.70, rotationPeriod: -243.02, axialTilt: 177.4,
    distanceFromSun: "108.2M km",
    facts: "Hottest planet · Retrograde rotation · Thick CO₂ atmosphere",
    moons: [], size: 0.9,
  },
  {
    name: "Earth", key: "earth",
    color: 0x2a7fc4, texStyle: 'earth', texColors: ['#1a5fa0','#2a7fc4','#3a9040','#8aaa60'],
    hasAtmosphere: true, atmosphereColor: 0x4488ff,
    semiMajorAxis: 1.000, eccentricity: 0.0167,
    inclination: 0.0, longitudeAscNode: -11.260, argPerihelion: 102.937,
    meanLongitude: 100.46, dailyMotion: 0.985608,
    orbitalPeriod: 365.25, rotationPeriod: 1.0, axialTilt: 23.44,
    distanceFromSun: "149.6M km",
    facts: "Only known life-bearing world · 71% water surface",
    size: 1.0,
    moons: [
      { name: "Moon", color: 0xaaaaaa, texStyle: 'rocky', texColors: ['#888888','#aaaaaa','#bbbbbb','#777777'],
        orbitRadius: 1.8, period: 27.32, size: 0.27 },
    ],
  },
  {
    name: "Mars", key: "mars",
    color: 0xc1440e, texStyle: 'rocky', texColors: ['#a03010','#c1440e','#d05520','#8a2808'],
    semiMajorAxis: 1.524, eccentricity: 0.0934,
    inclination: 1.850, longitudeAscNode: 49.558, argPerihelion: 286.502,
    meanLongitude: 355.45, dailyMotion: 0.524039,
    orbitalPeriod: 686.97, rotationPeriod: 1.026, axialTilt: 25.19,
    distanceFromSun: "227.9M km",
    facts: "Red iron-oxide surface · Olympus Mons tallest volcano",
    size: 0.7,
    moons: [
      { name: "Phobos", color: 0x888880, texStyle: 'rocky', texColors: ['#777770','#888880','#999988','#666660'],
        orbitRadius: 0.85, period: 0.319, size: 0.11 },
      { name: "Deimos", color: 0x998877, texStyle: 'rocky', texColors: ['#887766','#998877','#aa9988','#776655'],
        orbitRadius: 1.2, period: 1.263, size: 0.08 },
    ],
  },
  {
    name: "Jupiter", key: "jupiter",
    color: 0xc88b3a, texStyle: 'banded', texColors: ['#c88b3a','#e0aa50','#a06820','#d4a060'],
    semiMajorAxis: 5.203, eccentricity: 0.0485,
    inclination: 1.304, longitudeAscNode: 100.464, argPerihelion: 273.867,
    meanLongitude: 34.40, dailyMotion: 0.083056,
    orbitalPeriod: 4332.59, rotationPeriod: 0.414, axialTilt: 3.13,
    distanceFromSun: "778.5M km",
    facts: "Largest planet · Great Red Spot · 95 known moons",
    size: 2.4,
    moons: [
      { name: "Io",       color: 0xf0c040, texStyle: 'rocky', texColors: ['#e0b030','#f0c040','#ffd050','#c09020'], orbitRadius: 3.2, period: 1.769,  size: 0.28 },
      { name: "Europa",   color: 0xd0b8a0, texStyle: 'rocky', texColors: ['#c0a890','#d0b8a0','#e0c8b0','#b09880'], orbitRadius: 4.2, period: 3.551,  size: 0.24 },
      { name: "Ganymede", color: 0x998877, texStyle: 'rocky', texColors: ['#887766','#998877','#aa9988','#776655'], orbitRadius: 5.5, period: 7.155,  size: 0.37 },
      { name: "Callisto", color: 0x665544, texStyle: 'rocky', texColors: ['#554433','#665544','#776655','#443322'], orbitRadius: 7.0, period: 16.69,  size: 0.34 },
    ],
  },
  {
    name: "Saturn", key: "saturn",
    color: 0xe4d191, texStyle: 'banded', texColors: ['#d4c070','#e4d191','#f0dda0','#c0a860'],
    semiMajorAxis: 9.537, eccentricity: 0.0565,
    inclination: 2.485, longitudeAscNode: 113.665, argPerihelion: 339.392,
    meanLongitude: 49.94, dailyMotion: 0.033371,
    orbitalPeriod: 10759.22, rotationPeriod: 0.444, axialTilt: 26.73,
    distanceFromSun: "1.43B km",
    facts: "Iconic ring system · Least dense planet · 146 known moons",
    size: 2.0, hasRings: true,
    moons: [
      { name: "Titan",  color: 0xddaa55, texStyle: 'cloudy', texColors: ['#cc9944','#ddaa55','#eebb66','#bb8833'], orbitRadius: 6.5, period: 15.945, size: 0.37 },
      { name: "Rhea",   color: 0xbbbbaa, texStyle: 'rocky',  texColors: ['#aaaaaa','#bbbbaa','#ccccbb','#999988'], orbitRadius: 5.0, period: 4.518,  size: 0.22 },
      { name: "Dione",  color: 0xccccbb, texStyle: 'rocky',  texColors: ['#bbbbaa','#ccccbb','#ddddcc','#aaaaaa'], orbitRadius: 4.2, period: 2.737,  size: 0.19 },
    ],
  },
  {
    name: "Uranus", key: "uranus",
    color: 0x7de8e8, texStyle: 'cloudy', texColors: ['#60d0d0','#7de8e8','#90f0f0','#50b8b8'],
    hasAtmosphere: true, atmosphereColor: 0x88ffff,
    semiMajorAxis: 19.19, eccentricity: 0.0463,
    inclination: 0.773, longitudeAscNode: 74.006, argPerihelion: 96.999,
    meanLongitude: 313.23, dailyMotion: 0.011698,
    orbitalPeriod: 30688.5, rotationPeriod: -0.718, axialTilt: 97.77,
    distanceFromSun: "2.87B km",
    facts: "Rolls on its side (98° axial tilt) · Ice giant",
    size: 1.5,
    moons: [
      { name: "Titania", color: 0xbbbbbb, texStyle: 'rocky', texColors: ['#aaaaaa','#bbbbbb','#cccccc','#999999'], orbitRadius: 3.5, period: 8.706,  size: 0.25 },
      { name: "Oberon",  color: 0x999988, texStyle: 'rocky', texColors: ['#888877','#999988','#aaaa99','#777766'], orbitRadius: 4.5, period: 13.46,  size: 0.23 },
    ],
  },
  {
    name: "Neptune", key: "neptune",
    color: 0x4b70dd, texStyle: 'cloudy', texColors: ['#3050bb','#4b70dd','#6080ee','#2040aa'],
    hasAtmosphere: true, atmosphereColor: 0x2244ff,
    semiMajorAxis: 30.07, eccentricity: 0.0097,
    inclination: 1.770, longitudeAscNode: 131.784, argPerihelion: 273.187,
    meanLongitude: 304.88, dailyMotion: 0.005965,
    orbitalPeriod: 60195.0, rotationPeriod: 0.671, axialTilt: 28.32,
    distanceFromSun: "4.50B km",
    facts: "Strongest winds in Solar System · 16 known moons",
    size: 1.4,
    moons: [
      { name: "Triton", color: 0xaabbcc, texStyle: 'rocky', texColors: ['#99aabb','#aabbcc','#bbccdd','#889aaa'], orbitRadius: 3.2, period: -5.877, size: 0.21 },
    ],
  },
];

const SCALE = {
  AU_TO_UNITS: 8,
  PLANET_SIZE: 0.22,
  SUN_SIZE: 1.4,
};

function orbitScale(distanceAu) {
  if (distanceAu < 2) return distanceAu * SCALE.AU_TO_UNITS;
  return (2 * SCALE.AU_TO_UNITS) + Math.log(distanceAu - 1) * 14;
}

function toScenePosition(x, y, z) {
  const radius = Math.sqrt(x * x + y * y + z * z);

  if (radius === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const scaledRadius = orbitScale(radius);
  const factor = scaledRadius / radius;

  return {
    x: x * factor,
    y: z * factor * 0.5,
    z: -y * factor,
  };
}


// Generate procedural planet texture via canvas (no network requests)
function makePlanetTexture(style, colors, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (style === 'banded') {
    // Jupiter/Saturn style horizontal bands
    for (let y = 0; y < size; y++) {
      const t = y / size;
      const band = Math.floor(t * 12);
      const c = colors[band % colors.length];
      const noise = (Math.sin(y * 0.4) * 0.5 + Math.sin(y * 1.1) * 0.3) * 12;
      ctx.fillStyle = c;
      ctx.fillRect(0, y, size, 1);
    }
    // Add some horizontal streaks
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * size;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(0, y, size, 1 + Math.random() * 2);
    }
    ctx.globalAlpha = 1;

  } else if (style === 'earth') {
    // Blue base (ocean)
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);
    // Green landmasses
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const w = 20 + Math.random() * 60, h = 15 + Math.random() * 40;
      ctx.fillStyle = colors[2 + (i % 2)];
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // White clouds
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, 25 + Math.random()*30, 8 + Math.random()*12, Math.random(), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

  } else if (style === 'cloudy') {
    // Smooth base
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.ellipse(x, y, 20 + Math.random()*50, 10 + Math.random()*20, Math.random(), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

  } else {
    // 'rocky' — cratered, mottled surface
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);
    // Mottled patches
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 3 + Math.random() * 18;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.globalAlpha = 0.3 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Craters
    ctx.globalAlpha = 1;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const r = 2 + Math.random() * 8;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  return new THREE.CanvasTexture(canvas);
}
