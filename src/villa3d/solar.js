// Low-precision solar position (NOAA / Astronomical Almanac approximation,
// accurate to roughly ±0.5° for 1950–2050). Pure function, no dependencies.
// Used to turn the EXIF timestamps of the owner's camera photos into sun
// azimuths, which constrain the (otherwise unknown) orientation of the façade.

const RAD = Math.PI / 180;

/**
 * @param {Date} date  instant (UTC-aware JS Date)
 * @param {number} latDeg  latitude, north positive
 * @param {number} lonDeg  longitude, east positive
 * @returns {{altitudeDeg:number, azimuthDeg:number}} azimuth clockwise from north
 */
export function solarPosition(date, latDeg, lonDeg) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0; // days since J2000.0
  const g = RAD * mod(357.529 + 0.98560028 * n, 360); // mean anomaly
  const q = mod(280.459 + 0.98564736 * n, 360); // mean longitude
  const lambda = RAD * mod(q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g), 360);
  const eps = RAD * (23.439 - 0.00000036 * n);
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmstHours = mod(18.697374558 + 24.06570982441908 * n, 24);
  const lst = RAD * mod(gmstHours * 15 + lonDeg, 360);
  const h = lst - ra; // hour angle
  const lat = RAD * latDeg;
  const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h));
  const az = Math.atan2(-Math.sin(h), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(h));
  return { altitudeDeg: alt / RAD, azimuthDeg: mod(az / RAD, 360) };
}

export function mod(a, m) {
  return ((a % m) + m) % m;
}

/** Signed smallest difference a-b in degrees, in (-180, 180]. */
export function angleDiff(a, b) {
  let d = mod(a - b, 360);
  if (d > 180) d -= 360;
  return d;
}
