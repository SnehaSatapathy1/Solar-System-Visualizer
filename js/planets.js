// js/planets.js  (Phase 6 - clearer distances + scale modes)

const EARTH_RADIUS_KM = 6371.0;
const SUN_RADIUS_KM = 695700.0;
const AU_KM = 149597870.7;

const PLANET_DATA = [
  {
    name: "Mercury",
    key: "mercury",
    color: 0x8c7853,
    texStyle: "rocky",
    texColors: ["#7a6545", "#8c7853", "#9d8d6a", "#6b5a3a"],
    radiusKm: 2439.7,
    orbitalPeriod: 87.97,
    rotationPeriod: 58.65,
    axialTilt: 0.034,
    distanceFromSun: "57.9 million km",
    facts: "Smallest planet | Extreme temperatures | No atmosphere",
    size: 0.5,
    moons: [],
  },
  {
    name: "Venus",
    key: "venus",
    color: 0xe8cda0,
    texStyle: "cloudy",
    texColors: ["#d4b870", "#e8cda0", "#f0ddb0", "#c8a860"],
    radiusKm: 6051.8,
    hasAtmosphere: true,
    atmosphereColor: 0xffdd88,
    orbitalPeriod: 224.7,
    rotationPeriod: -243.02,
    axialTilt: 177.4,
    distanceFromSun: "108.2 million km",
    facts: "Hottest planet | Retrograde rotation | Thick CO2 atmosphere",
    size: 0.9,
    moons: [],
  },
  {
    name: "Earth",
    key: "earth",
    color: 0x2a7fc4,
    texStyle: "earth",
    texColors: ["#1a5fa0", "#2a7fc4", "#3a9040", "#8aaa60"],
    radiusKm: 6371.0,
    hasAtmosphere: true,
    atmosphereColor: 0x4488ff,
    orbitalPeriod: 365.25,
    rotationPeriod: 1.0,
    axialTilt: 23.44,
    distanceFromSun: "149.6 million km",
    facts: "Only known life-bearing world | 71% water surface",
    size: 1.0,
    moons: [
      {
        name: "Moon",
        color: 0xaaaaaa,
        texStyle: "rocky",
        texColors: ["#888888", "#aaaaaa", "#bbbbbb", "#777777"],
        radiusKm: 1737.4,
        semiMajorAxisKm: 384400,
        orbitRadius: 1.8,
        period: 27.32,
        inclination: 5.145,
        size: 0.27,
      },
    ],
  },
  {
    name: "Mars",
    key: "mars",
    color: 0xc1440e,
    texStyle: "rocky",
    texColors: ["#a03010", "#c1440e", "#d05520", "#8a2808"],
    radiusKm: 3389.5,
    orbitalPeriod: 686.97,
    rotationPeriod: 1.026,
    axialTilt: 25.19,
    distanceFromSun: "227.9 million km",
    facts: "Red iron-oxide surface | Olympus Mons tallest volcano",
    size: 0.7,
    moons: [
      {
        name: "Phobos",
        color: 0x888880,
        texStyle: "rocky",
        texColors: ["#777770", "#888880", "#999988", "#666660"],
        radiusKm: 11.3,
        semiMajorAxisKm: 9376,
        orbitRadius: 0.85,
        period: 0.319,
        inclination: 1.1,
        size: 0.11,
      },
      {
        name: "Deimos",
        color: 0x998877,
        texStyle: "rocky",
        texColors: ["#887766", "#998877", "#aa9988", "#776655"],
        radiusKm: 6.2,
        semiMajorAxisKm: 23463,
        orbitRadius: 1.2,
        period: 1.263,
        inclination: 1.8,
        size: 0.08,
      },
    ],
  },
  {
    name: "Jupiter",
    key: "jupiter",
    color: 0xc88b3a,
    texStyle: "banded",
    texColors: ["#c88b3a", "#e0aa50", "#a06820", "#d4a060"],
    radiusKm: 69911,
    orbitalPeriod: 4332.59,
    rotationPeriod: 0.414,
    axialTilt: 3.13,
    distanceFromSun: "778.5 million km",
    facts: "Largest planet | Great Red Spot | 95 known moons",
    size: 2.4,
    moons: [
      {
        name: "Io",
        color: 0xf0c040,
        texStyle: "rocky",
        texColors: ["#e0b030", "#f0c040", "#ffd050", "#c09020"],
        radiusKm: 1821.6,
        semiMajorAxisKm: 421700,
        orbitRadius: 3.2,
        period: 1.769,
        inclination: 0.04,
        size: 0.28,
      },
      {
        name: "Europa",
        color: 0xd0b8a0,
        texStyle: "rocky",
        texColors: ["#c0a890", "#d0b8a0", "#e0c8b0", "#b09880"],
        radiusKm: 1560.8,
        semiMajorAxisKm: 671100,
        orbitRadius: 4.2,
        period: 3.551,
        inclination: 0.47,
        size: 0.24,
      },
      {
        name: "Ganymede",
        color: 0x998877,
        texStyle: "rocky",
        texColors: ["#887766", "#998877", "#aa9988", "#776655"],
        radiusKm: 2634.1,
        semiMajorAxisKm: 1070400,
        orbitRadius: 5.5,
        period: 7.155,
        inclination: 0.2,
        size: 0.37,
      },
      {
        name: "Callisto",
        color: 0x665544,
        texStyle: "rocky",
        texColors: ["#554433", "#665544", "#776655", "#443322"],
        radiusKm: 2410.3,
        semiMajorAxisKm: 1882700,
        orbitRadius: 7.0,
        period: 16.69,
        inclination: 0.28,
        size: 0.34,
      },
    ],
  },
  {
    name: "Saturn",
    key: "saturn",
    color: 0xe4d191,
    texStyle: "banded",
    texColors: ["#d4c070", "#e4d191", "#f0dda0", "#c0a860"],
    radiusKm: 58232,
    orbitalPeriod: 10759.22,
    rotationPeriod: 0.444,
    axialTilt: 26.73,
    distanceFromSun: "1.43 billion km",
    facts: "Iconic ring system | Least dense planet | 146 known moons",
    size: 2.0,
    hasRings: true,
    moons: [
      {
        name: "Titan",
        color: 0xddaa55,
        texStyle: "cloudy",
        texColors: ["#cc9944", "#ddaa55", "#eebb66", "#bb8833"],
        radiusKm: 2574.7,
        semiMajorAxisKm: 1221900,
        orbitRadius: 6.5,
        period: 15.945,
        inclination: 0.35,
        size: 0.37,
      },
      {
        name: "Rhea",
        color: 0xbbbbaa,
        texStyle: "rocky",
        texColors: ["#aaaaaa", "#bbbbaa", "#ccccbb", "#999988"],
        radiusKm: 763.8,
        semiMajorAxisKm: 527100,
        orbitRadius: 5.0,
        period: 4.518,
        inclination: 0.33,
        size: 0.22,
      },
      {
        name: "Dione",
        color: 0xccccbb,
        texStyle: "rocky",
        texColors: ["#bbbbaa", "#ccccbb", "#ddddcc", "#aaaaaa"],
        radiusKm: 561.4,
        semiMajorAxisKm: 377400,
        orbitRadius: 4.2,
        period: 2.737,
        inclination: 0.02,
        size: 0.19,
      },
    ],
  },
  {
    name: "Uranus",
    key: "uranus",
    color: 0x7de8e8,
    texStyle: "cloudy",
    texColors: ["#60d0d0", "#7de8e8", "#90f0f0", "#50b8b8"],
    radiusKm: 25362,
    hasAtmosphere: true,
    atmosphereColor: 0x88ffff,
    orbitalPeriod: 30688.5,
    rotationPeriod: -0.718,
    axialTilt: 97.77,
    distanceFromSun: "2.87 billion km",
    facts: "Rolls on its side (98 deg axial tilt) | Ice giant",
    size: 1.5,
    moons: [
      {
        name: "Titania",
        color: 0xbbbbbb,
        texStyle: "rocky",
        texColors: ["#aaaaaa", "#bbbbbb", "#cccccc", "#999999"],
        radiusKm: 788.9,
        semiMajorAxisKm: 436300,
        orbitRadius: 3.5,
        period: 8.706,
        inclination: 0.34,
        size: 0.25,
      },
      {
        name: "Oberon",
        color: 0x999988,
        texStyle: "rocky",
        texColors: ["#888877", "#999988", "#aaaa99", "#777766"],
        radiusKm: 761.4,
        semiMajorAxisKm: 583500,
        orbitRadius: 4.5,
        period: 13.46,
        inclination: 0.07,
        size: 0.23,
      },
    ],
  },
  {
    name: "Neptune",
    key: "neptune",
    color: 0x4b70dd,
    texStyle: "cloudy",
    texColors: ["#3050bb", "#4b70dd", "#6080ee", "#2040aa"],
    radiusKm: 24622,
    hasAtmosphere: true,
    atmosphereColor: 0x2244ff,
    orbitalPeriod: 60195.0,
    rotationPeriod: 0.671,
    axialTilt: 28.32,
    distanceFromSun: "4.50 billion km",
    facts: "Strongest winds in Solar System | 16 known moons",
    size: 1.4,
    moons: [
      {
        name: "Triton",
        color: 0xaabbcc,
        texStyle: "rocky",
        texColors: ["#99aabb", "#aabbcc", "#bbccdd", "#889aaa"],
        radiusKm: 1353.4,
        semiMajorAxisKm: 354800,
        orbitRadius: 3.2,
        period: -5.877,
        inclination: 156.9,
        size: 0.21,
      },
    ],
  },
];

const SCALE = {
  CONVENTIONAL_AU_TO_UNITS: 8,
  REALISTIC_AU_TO_UNITS: 120,
  BASE_BODY_RADIUS: 0.22,
  SUN_CONVENTIONAL_RADIUS: 1.4,
};

function getSizeScaleMode() {
  return window.sizeScaleMode || "conventional";
}

function getDistanceScaleMode() {
  return window.distanceScaleMode || "conventional";
}

function getSunDisplayRadius() {
  if (getSizeScaleMode() === "realistic") {
    return SCALE.BASE_BODY_RADIUS * (SUN_RADIUS_KM / EARTH_RADIUS_KM);
  }
  return SCALE.SUN_CONVENTIONAL_RADIUS;
}

function getPlanetDisplayRadius(planet) {
  if (getSizeScaleMode() === "realistic") {
    return SCALE.BASE_BODY_RADIUS * (planet.radiusKm / EARTH_RADIUS_KM);
  }
  return SCALE.BASE_BODY_RADIUS * planet.size;
}

function getMoonDisplayRadius(moonData) {
  if (getSizeScaleMode() === "realistic") {
    return SCALE.BASE_BODY_RADIUS * (moonData.radiusKm / EARTH_RADIUS_KM);
  }
  return SCALE.BASE_BODY_RADIUS * moonData.size;
}

function getBodyDisplayRadius(body) {
  if (!body || body.key === "sun") {
    return getSunDisplayRadius();
  }

  if (body.kind === "planet") {
    return getPlanetDisplayRadius(body.data);
  }

  if (body.kind === "moon") {
    return getMoonDisplayRadius(body.data);
  }

  return SCALE.BASE_BODY_RADIUS;
}

function getMoonOrbitDisplayRadius(moonData) {
  if (getDistanceScaleMode() === "realistic" && moonData.semiMajorAxisKm) {
    return (moonData.semiMajorAxisKm / AU_KM) * SCALE.REALISTIC_AU_TO_UNITS;
  }
  return moonData.orbitRadius;
}

function orbitScale(distanceAu) {
  if (getDistanceScaleMode() === "realistic") {
    return distanceAu * SCALE.REALISTIC_AU_TO_UNITS;
  }

  if (distanceAu < 2) {
    return distanceAu * SCALE.CONVENTIONAL_AU_TO_UNITS;
  }

  return (2 * SCALE.CONVENTIONAL_AU_TO_UNITS) + Math.log(distanceAu - 1) * 14;
}

function toScenePosition(x, y, z) {
  if (getDistanceScaleMode() === "realistic") {
    const scale = SCALE.REALISTIC_AU_TO_UNITS;
    return {
      x: x * scale,
      y: z * scale * 0.5,
      z: -y * scale,
    };
  }

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

function makePlanetTexture(style, colors, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (style === "banded") {
    for (let y = 0; y < size; y++) {
      const t = y / size;
      const band = Math.floor(t * 12);
      const c = colors[band % colors.length];
      ctx.fillStyle = c;
      ctx.fillRect(0, y, size, 1);
    }

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * size;
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#000000";
      ctx.fillRect(0, y, size, 1 + Math.random() * 2);
    }
    ctx.globalAlpha = 1;
  } else if (style === "earth") {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = 20 + Math.random() * 60;
      const h = 15 + Math.random() * 40;
      ctx.fillStyle = colors[2 + (i % 2)];
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        25 + Math.random() * 30,
        8 + Math.random() * 12,
        Math.random(),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (style === "cloudy") {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        20 + Math.random() * 50,
        10 + Math.random() * 20,
        Math.random(),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 3 + Math.random() * 18;
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.globalAlpha = 0.3 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 8;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  return new THREE.CanvasTexture(canvas);
}
