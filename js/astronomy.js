// js/astronomy.js
// Upgraded local analytical ephemeris-style positions for heliocentric overview.
// Planets use date-varying orbital elements computed locally.
// Earth's Moon is added as a date-based heliocentric body with correct orbital tilt.

const DEG = Math.PI / 180;
const EARTH_RADIUS_AU = 6378.14 / AU_KM;

function toJulianDate(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate()
    + (date.getUTCHours()
    + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3600) / 24;

  let Y = y;
  let M = m;

  if (M <= 2) {
    Y -= 1;
    M += 12;
  }

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (Y + 4716))
    + Math.floor(30.6001 * (M + 1))
    + d + B - 1524.5;
}

function daysSinceJ2000(date) {
  return toJulianDate(date) - 2451545.0;
}

function normalizeRadians(angle) {
  const fullTurn = Math.PI * 2;
  return angle - fullTurn * Math.floor(angle / fullTurn);
}

function normalizeDegrees(angle) {
  return angle - 360 * Math.floor(angle / 360);
}

function solveKepler(Mrad, e) {
  let E = Mrad;
  for (let i = 0; i < 30; i++) {
    const delta = (E - e * Math.sin(E) - Mrad) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-10) {
      break;
    }
  }
  return E;
}

function getPlanetElements(key, d) {
  switch (key) {
    case "mercury":
      return {
        N: 48.3313 + 3.24587e-5 * d,
        i: 7.0047 + 5.0e-8 * d,
        w: 29.1241 + 1.01444e-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59e-10 * d,
        M: 168.6562 + 4.0923344368 * d,
      };
    case "venus":
      return {
        N: 76.6799 + 2.46590e-5 * d,
        i: 3.3946 + 2.75e-8 * d,
        w: 54.8910 + 1.38374e-5 * d,
        a: 0.723330,
        e: 0.006773 - 1.302e-9 * d,
        M: 48.0052 + 1.6021302244 * d,
      };
    case "earth":
      return {
        N: 0.0,
        i: 0.0,
        w: 282.9404 + 4.70935e-5 * d,
        a: 1.0,
        e: 0.016709 - 1.151e-9 * d,
        M: 356.0470 + 0.9856002585 * d,
      };
    case "mars":
      return {
        N: 49.5574 + 2.11081e-5 * d,
        i: 1.8497 - 1.78e-8 * d,
        w: 286.5016 + 2.92961e-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516e-9 * d,
        M: 18.6021 + 0.5240207766 * d,
      };
    case "jupiter":
      return {
        N: 100.4542 + 2.76854e-5 * d,
        i: 1.3030 - 1.557e-7 * d,
        w: 273.8777 + 1.64505e-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469e-9 * d,
        M: 19.8950 + 0.0830853001 * d,
      };
    case "saturn":
      return {
        N: 113.6634 + 2.38980e-5 * d,
        i: 2.4886 - 1.081e-7 * d,
        w: 339.3939 + 2.97661e-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499e-9 * d,
        M: 316.9670 + 0.0334442282 * d,
      };
    case "uranus":
      return {
        N: 74.0005 + 1.3978e-5 * d,
        i: 0.7733 + 1.9e-8 * d,
        w: 96.6612 + 3.0565e-5 * d,
        a: 19.18171 - 1.55e-8 * d,
        e: 0.047318 + 7.45e-9 * d,
        M: 142.5905 + 0.011725806 * d,
      };
    case "neptune":
      return {
        N: 131.7806 + 3.0173e-5 * d,
        i: 1.77 - 2.55e-7 * d,
        w: 272.8461 - 6.027e-6 * d,
        a: 30.05826 + 3.313e-8 * d,
        e: 0.008606 + 2.15e-9 * d,
        M: 260.2471 + 0.005995147 * d,
      };
    default:
      throw new Error(`No orbital elements found for ${key}`);
  }
}

function orbitalElementsToHeliocentric(elements) {
  const N = elements.N * DEG;
  const i = elements.i * DEG;
  const w = elements.w * DEG;
  const M = normalizeRadians(elements.M * DEG);
  const a = elements.a;
  const e = elements.e;

  const E = solveKepler(M, e);

  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));

  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  const zh = r * (Math.sin(v + w) * Math.sin(i));

  return {
    x: xh,
    y: yh,
    z: zh,
    r,
    nu: normalizeDegrees(v / DEG),
  };
}

function calcPlanetPosition(planet, date) {
  const d = daysSinceJ2000(date);
  return orbitalElementsToHeliocentric(getPlanetElements(planet.key, d));
}

function getEarthMoonHeliocentricPosition(date) {
  const d = daysSinceJ2000(date);
  const earthPos = orbitalElementsToHeliocentric(getPlanetElements("earth", d));

  const moonGeo = orbitalElementsToHeliocentric({
    N: 125.1228 - 0.0529538083 * d,
    i: 5.1454,
    w: 318.0634 + 0.1643573223 * d,
    a: 60.2666 * EARTH_RADIUS_AU,
    e: 0.054900,
    M: 115.3654 + 13.0649929509 * d,
  });

  return {
    x: earthPos.x + moonGeo.x,
    y: earthPos.y + moonGeo.y,
    z: earthPos.z + moonGeo.z,
    r: Math.sqrt(
      (earthPos.x + moonGeo.x) ** 2 +
      (earthPos.y + moonGeo.y) ** 2 +
      (earthPos.z + moonGeo.z) ** 2
    ),
    rEarth: moonGeo.r,
    nu: moonGeo.nu,
  };
}

function getEarthMoonScenePosition(date) {
  const moonPos = getEarthMoonHeliocentricPosition(date);
  const scenePos = toScenePosition(moonPos.x, moonPos.y, moonPos.z);

  return {
    ...moonPos,
    sceneX: scenePos.x,
    sceneY: scenePos.y,
    sceneZ: scenePos.z,
  };
}

function getAllPlanetPositions(date) {
  const positions = {};

  for (const planet of PLANET_DATA) {
    const pos = calcPlanetPosition(planet, date);
    const scenePos = toScenePosition(pos.x, pos.y, pos.z);

    positions[planet.key] = {
      ...pos,
      sceneX: scenePos.x,
      sceneY: scenePos.y,
      sceneZ: scenePos.z,
    };
  }

  return positions;
}

function getOrbitPath(planet, numPoints = 180) {
  const points = [];
  const d = daysSinceJ2000(window.currentDate || new Date());
  const elements = getPlanetElements(planet.key, d);
  const a = elements.a;
  const e = elements.e;
  const N = elements.N * DEG;
  const i = elements.i * DEG;
  const w = elements.w * DEG;

  for (let step = 0; step <= numPoints; step++) {
    const v = (step / numPoints) * Math.PI * 2;
    const r = a * (1 - e * e) / (1 + e * Math.cos(v));

    const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
    const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
    const zh = r * (Math.sin(v + w) * Math.sin(i));

    const scenePos = toScenePosition(xh, yh, zh);
    points.push(new THREE.Vector3(scenePos.x, scenePos.y, scenePos.z));
  }

  return points;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function distanceBetween(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(3);
}
