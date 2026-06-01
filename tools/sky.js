#!/usr/bin/env node
/**
 * KP Jyotisha — Current Sky Calculator
 *
 * Shows where all 9 planets are right now (or on any given date/time) in the
 * sidereal zodiac. Uses the same jothisha-lib engine as chart.js — no external
 * web API calls. Provides sign-level positions and Moon nakshatra.
 *
 * NOTE: The library gives sign-level placement only. Exact degrees and nakshatra
 * sub-lords require a Swiss Ephemeris backend. Moon's exact nakshatra is derived
 * from its sign + the dasha balance star lord.
 *
 * Usage:
 *   node tools/sky.js --zone lk --lat 6.9271 --lon 79.8612
 *   node tools/sky.js --date "2026-06-01" --time "12:00" --zone lk --lat 6.93 --lon 80.00
 *   node tools/sky.js --zone lk --lat 6.93 --lon 80.00 --natal-lagna 12
 *
 * Options:
 *   --date          YYYY-MM-DD (default: today)
 *   --time          HH:MM 24h (default: 12:00)
 *   --zone          IANA zone or shorthand (lk, in, uk, us-eastern …)
 *   --tz            Explicit UTC offset ±HH:MM (if zone not given)
 *   --lat           Latitude decimal degrees
 *   --lon           Longitude decimal degrees
 *   --natal-lagna   Natal lagna sign number 1-12 (for transit house calculation)
 *   --format        pretty (default) | json
 *   --help
 */

'use strict';

const { generateAstroChartFromISO } = require('@jothisha-apps/jothisha-lib');
const {
  SIGN_NAMES, SIGN_NAMES_SI, SIGN_LORDS,
  NAKSHATRA_NAMES, NAKSHATRA_NAMES_SI, NAKSHATRA_LORDS,
  PLANET_ABBR, PLANET_NAMES_SI,
  deriveMoonNakshatra, signToHouse,
  resolveOffset, resolveZoneAlias,
} = require('./kp-lib');

// ── Helpers ────────────────────────────────────────────────────────────────

const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

const DAY_LORDS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];

function dayLord(date) {
  // Day 0 = Sun (Sunday), 1 = Moon (Monday), etc.
  return DAY_LORDS[new Date(date).getDay()];
}

function pad(s, n) { return String(s).padEnd(n); }

// Nakshatra candidates for a sign (3 per sign, may span sign boundary)
const SIGN_NAKSHATRAS = {
  1:  ['Ashwini (Ketu)','Bharani (Venus)','Krittika-start (Sun)'],
  2:  ['Krittika-end (Sun)','Rohini (Moon)','Mrigashira-start (Mars)'],
  3:  ['Mrigashira-end (Mars)','Ardra (Rahu)','Punarvasu-start (Jupiter)'],
  4:  ['Punarvasu-end (Jupiter)','Pushya (Saturn)','Ashlesha (Mercury)'],
  5:  ['Magha (Ketu)','Purva Phalguni (Venus)','Uttara Phalguni-start (Sun)'],
  6:  ['Uttara Phalguni-end (Sun)','Hasta (Moon)','Chitra-start (Mars)'],
  7:  ['Chitra-end (Mars)','Swati (Rahu)','Vishakha-start (Jupiter)'],
  8:  ['Vishakha-end (Jupiter)','Anuradha (Saturn)','Jyeshtha (Mercury)'],
  9:  ['Moola (Ketu)','Purva Ashadha (Venus)','Uttara Ashadha-start (Sun)'],
  10: ['Uttara Ashadha-end (Sun)','Shravana (Moon)','Dhanishtha-start (Mars)'],
  11: ['Dhanishtha-end (Mars)','Shatabhisha (Rahu)','Purva Bhadrapada-start (Jupiter)'],
  12: ['Purva Bhadrapada-end (Jupiter)','Uttara Bhadrapada (Saturn)','Revati (Mercury)'],
};

// ── Build current sky data ─────────────────────────────────────────────────

function buildSky(isoTimestamp, lat, lon, natalLagna) {
  const result = generateAstroChartFromISO(isoTimestamp, lat, lon);
  const { birthChartPlanetPositions: chart, dashaShesa } = result;
  const bal = dashaShesa.dashaBalance;

  // Invert chart: abbr → sign number
  const planetSign = {};
  for (let s = 1; s <= 12; s++) {
    for (const abbr of (chart[s] || [])) {
      const full = PLANET_ABBR[abbr] || abbr;
      if (full !== 'As') planetSign[full] = s;
    }
  }

  // Moon nakshatra — derived from sign + star lord
  const moonSign = planetSign['Moon'];
  const moonStarLord = bal.planet;
  const moonNakNum  = moonSign ? deriveMoonNakshatra(moonSign, moonStarLord) : null;

  // Build planet rows
  const planets = PLANET_ORDER.map(name => {
    const sign = planetSign[name];
    const house = (sign && natalLagna) ? signToHouse(sign, natalLagna) : null;

    let nakshatra = null;
    if (name === 'Moon' && moonNakNum) {
      nakshatra = `${NAKSHATRA_NAMES[moonNakNum]} (${NAKSHATRA_LORDS[moonNakNum]})`;
    } else if (sign) {
      nakshatra = SIGN_NAKSHATRAS[sign]?.join(' / ') || '—';
    }

    return {
      name,
      nameSI:    PLANET_NAMES_SI[name] || name,
      sign:      sign ? SIGN_NAMES[sign]    : '—',
      signSI:    sign ? SIGN_NAMES_SI[sign] : '—',
      signNum:   sign || null,
      signLord:  sign ? SIGN_LORDS[sign]    : '—',
      house,
      nakshatra,
      moonExact: name === 'Moon' && moonNakNum
        ? { num: moonNakNum, name: NAKSHATRA_NAMES[moonNakNum], sinhala: NAKSHATRA_NAMES_SI[moonNakNum], lord: NAKSHATRA_LORDS[moonNakNum] }
        : null,
    };
  });

  // Sade Sati / Ashtama Sani (if natal Moon sign provided separately — we can compute from planets)
  const currentMoonSign  = planetSign['Moon'];
  const currentSaturnSign = planetSign['Saturn'];

  return {
    isoTimestamp,
    lat, lon,
    date:       isoTimestamp.slice(0, 10),
    dayLord:    dayLord(isoTimestamp.slice(0, 10)),
    planets,
    moonSign:   currentMoonSign ? { num: currentMoonSign, name: SIGN_NAMES[currentMoonSign], lord: SIGN_LORDS[currentMoonSign] } : null,
    moonStarLord,
    moonNakshatra: moonNakNum ? {
      num: moonNakNum,
      name: NAKSHATRA_NAMES[moonNakNum],
      sinhala: NAKSHATRA_NAMES_SI[moonNakNum],
      lord: NAKSHATRA_LORDS[moonNakNum],
    } : null,
    saturnSign: currentSaturnSign || null,
    natalLagna: natalLagna || null,
    note: 'Sign-level placement only. Exact degrees and sub-lords require Swiss Ephemeris.',
  };
}

// ── Output formatters ──────────────────────────────────────────────────────

function prettyPrint(sky) {
  const hr = '─'.repeat(74);

  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  KP JYOTISHA — CURRENT SKY                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Date    : ${sky.date}`);
  console.log(`  Day Lord: ${sky.dayLord}`);
  console.log(`  Location: ${sky.lat >= 0 ? '+' : ''}${sky.lat}°, ${sky.lon >= 0 ? '+' : ''}${sky.lon}°`);
  if (sky.natalLagna) console.log(`  Natal Lagna: ${SIGN_NAMES[sky.natalLagna]} (sign ${sky.natalLagna}) — house column shows transit houses`);

  console.log(`\n── PLANETARY POSITIONS (Sidereal) ${'─'.repeat(40)}`);
  const houseCol = sky.natalLagna ? ' House |' : '';
  console.log(`  ${'Planet'.padEnd(10)} | ${'Sign'.padEnd(14)} | ${'Sign Lord'.padEnd(9)} |${houseCol} Nakshatra (possible)`);
  console.log(`  ${hr}`);

  for (const p of sky.planets) {
    const houseStr = sky.natalLagna ? ` H${String(p.house || '?').padStart(2)}  |` : '';
    const nak = p.moonExact
      ? `${p.moonExact.name} (${p.moonExact.lord}) ← exact`
      : (p.nakshatra || '—');
    console.log(`  ${pad(p.name, 10)} | ${pad(p.sign, 14)} | ${pad(p.signLord, 9)} |${houseStr} ${nak}`);
  }

  console.log(`\n── MOON TODAY ${'─'.repeat(60)}`);
  if (sky.moonNakshatra) {
    console.log(`  Sign       : ${sky.moonSign?.name || '—'} — Lord: ${sky.moonSign?.lord || '—'}`);
    console.log(`  Nakshatra  : ${sky.moonNakshatra.name} (#${sky.moonNakshatra.num}) — Star Lord: ${sky.moonNakshatra.lord}`);
    console.log(`  Sinhala    : ${sky.moonNakshatra.sinhala}`);
  } else {
    console.log(`  Moon sign  : ${sky.moonSign?.name || '—'} — Star Lord: ${sky.moonStarLord || '—'} (nakshatra ambiguous near sign boundary)`);
  }

  console.log(`\n── RULING PLANETS TODAY ${'─'.repeat(50)}`);
  console.log(`  Day Lord       : ${sky.dayLord}`);
  console.log(`  Moon Sign Lord : ${sky.moonSign?.lord || '—'}`);
  console.log(`  Moon Star Lord : ${sky.moonStarLord || '—'}`);
  console.log(`  (Lagna Sign/Star Lord: location + time dependent — run with specific time for precision)`);

  console.log(`\n  Note: ${sky.note}\n`);
}

// ── CLI ────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      out[argv[i].slice(2)] = argv[i + 1] !== undefined ? argv[i + 1] : true;
      i++;
    }
  }
  return out;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function usage() {
  console.log(`
KP Jyotisha — Current Sky
──────────────────────────────────────────────────────────────────────
Shows current planetary positions in the sidereal zodiac.
Uses local calculation — no web API required.

Usage:
  node tools/sky.js --zone lk --lat 6.9271 --lon 79.8612
  node tools/sky.js --date "2026-06-01" --time "14:30" --zone lk --lat 6.93 --lon 80.00 --natal-lagna 12

Options:
  --date          YYYY-MM-DD           (default: today)
  --time          HH:MM 24h            (default: 12:00 noon)
  --zone          Zone shorthand or IANA name  e.g. lk, in, uk, us-eastern, Asia/Colombo
  --tz            Explicit offset ±HH:MM       (if --zone not given)
  --lat           Latitude  decimal degrees
  --lon           Longitude decimal degrees
  --natal-lagna   Natal lagna sign 1-12  (adds transit house column)
  --format        pretty (default) | json
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) { usage(); process.exit(0); }

  const lat = parseFloat(args.lat ?? '6.9271');
  const lon = parseFloat(args.lon ?? '79.8612');

  if (isNaN(lat) || isNaN(lon)) {
    console.error('Error: --lat and --lon required.');
    process.exit(1);
  }

  const date = args.date || todayISO();
  const time = args.time || '12:00';

  let tz = args.tz;
  if (!tz && args.zone) {
    const ianaZone = resolveZoneAlias(args.zone) || args.zone;
    tz = resolveOffset(ianaZone, date, time);
    process.stderr.write(`[zone] ${args.zone} → ${ianaZone} → ${tz} on ${date}\n`);
  }
  if (!tz) {
    process.stderr.write(`[zone] no --zone given, defaulting to +05:30 (Sri Lanka)\n`);
    tz = '+05:30';
  }

  const isoTimestamp = `${date}T${time}:00${tz}`;
  const natalLagna   = args['natal-lagna'] ? parseInt(args['natal-lagna']) : null;

  try {
    const sky = buildSky(isoTimestamp, lat, lon, natalLagna);
    if (args.format === 'json') {
      console.log(JSON.stringify(sky, null, 2));
    } else {
      prettyPrint(sky);
    }
  } catch (err) {
    console.error('Sky calculation failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { buildSky };
