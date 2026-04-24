// js/astronomy.js
// Orbital mechanics using Kepler's equations
// Reference: Jean Meeus "Astronomical Algorithms" Ch. 33

const DEG = Math.PI / 180;

// Julian Date helpers
function toJulianDate(date) {
  // date is a JS Date object
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60) / 24;

  let Y = y, M = m;
  if (M <= 2) { Y--; M += 12; }

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
}

// Days since J2000.0 (January 1.5, 2000)
function daysSinceJ2000(date) {
  const J2000 = 2451545.0;
  return toJulianDate(date) - J2000;
}

// Solve Kepler's equation: M = E - e*sin(E)
// Returns eccentric anomaly E in radians
function solveKepler(M_deg, e) {
  let M = M_deg * DEG;
  // Normalize M to [0, 2π]
  M = M - Math.PI * 2 * Math.floor(M / (Math.PI * 2));

  let E = M; // initial guess
  for (let i = 0; i < 100; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  return E;
}

// Calculate heliocentric ecliptic coordinates (x, y, z) in AU
// at a given date for a planet defined by its orbital elements
function calcPlanetPosition(planet, date) {
  const T = daysSinceJ2000(date);

  // Mean longitude → Mean anomaly
  const L = planet.meanLongitude + planet.dailyMotion * T;
  const M = L - planet.argPerihelion - planet.longitudeAscNode;

  // Eccentric anomaly
  const E = solveKepler(M, planet.eccentricity);

  // True anomaly
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const e = planet.eccentricity;
  const nu = Math.atan2(
    Math.sqrt(1 - e * e) * sinE,
    cosE - e
  );

  // Distance from Sun (AU)
  const r = planet.semiMajorAxis * (1 - e * cosE);

  // Heliocentric ecliptic coordinates
  const inc = planet.inclination * DEG;
  const omega = planet.argPerihelion * DEG;      // argument of perihelion
  const Omega = planet.longitudeAscNode * DEG;   // longitude of ascending node

  const x_orb = r * Math.cos(nu);
  const y_orb = r * Math.sin(nu);

  // Rotate to ecliptic plane
  const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
  const cosI = Math.cos(inc),   sinI = Math.sin(inc);
  const cosW = Math.cos(omega), sinW = Math.sin(omega);

  const x =
    (cosO * cosW - sinO * sinW * cosI) * x_orb +
    (-cosO * sinW - sinO * cosW * cosI) * y_orb;
  const y =
    (sinO * cosW + cosO * sinW * cosI) * x_orb +
    (-sinO * sinW + cosO * cosW * cosI) * y_orb;
  const z =
    (sinW * sinI) * x_orb +
    (cosW * sinI) * y_orb;

  return { x, y, z, r, nu: nu / DEG };
}

// Calculate all planet positions at a date
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


// Generate orbit path points (for drawing orbit rings)
function getOrbitPath(planet, numPoints = 128) {
  const points = [];
  const e = planet.eccentricity;
  const a = planet.semiMajorAxis;
  const inc = planet.inclination * DEG;
  const omega = planet.argPerihelion * DEG;
  const Omega = planet.longitudeAscNode * DEG;

  const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
  const cosI = Math.cos(inc),   sinI = Math.sin(inc);
  const cosW = Math.cos(omega), sinW = Math.sin(omega);

  for (let i = 0; i <= numPoints; i++) {
    const nu = (i / numPoints) * Math.PI * 2;
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu));

    const x_orb = r * Math.cos(nu);
    const y_orb = r * Math.sin(nu);

    const x = (cosO * cosW - sinO * sinW * cosI) * x_orb + (-cosO * sinW - sinO * cosW * cosI) * y_orb;
    const y = (sinO * cosW + cosO * sinW * cosI) * x_orb + (-sinO * sinW + cosO * cosW * cosI) * y_orb;
    const z = (sinW * sinI) * x_orb + (cosW * sinI) * y_orb;
    
    const scenePos = toScenePosition(x, y, z);

    points.push(new THREE.Vector3(
      scenePos.x,
      scenePos.y,
      scenePos.z
    ));

  }
  return points;
}

// Format date nicely
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
}

// Distance between two positions in AU
function distanceBetween(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(3);
}
