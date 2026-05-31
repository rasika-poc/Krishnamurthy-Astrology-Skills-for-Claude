#!/usr/bin/env node
/**
 * KP Jyotisha Chart Calculator
 *
 * Wraps @jothisha-apps/jothisha-lib to produce Rashi/D9 chart layout and
 * Vimshottari Dasha timeline from birth data.
 *
 * NOTE: The library provides sign-level planet placement and dasha data.
 * Exact planet longitudes, nakshatra sub-lords, and Placidus cusps require a
 * Swiss Ephemeris backend and are not available here. The Janma Nakshatra is
 * derived from Moon sign + birth dasha lord (may be ambiguous near sign boundaries).
 *
 * Usage:
 *   node tools/chart.js --iso "1990-05-15T06:30:00+05:30" --lat 13.0827 --lon 80.2707
 *   node tools/chart.js --date "1990-05-15" --time "06:30" --tz "+05:30" --lat 13.0827 --lon 80.2707
 *   node tools/chart.js --date "1990-05-15" --time "06:30" --tz "-05:00" --lat 40.7128 --lon -74.0060
 *
 * Options:
 *   --iso     ISO 8601 timestamp with timezone offset
 *   --date    Birth date YYYY-MM-DD
 *   --time    Birth time HH:MM (24h)
 *   --tz      Timezone offset ±HH:MM (e.g. +05:30, -05:00, +00:00)
 *   --lat     Birth latitude in decimal degrees
 *   --lon     Birth longitude in decimal degrees
 *   --format  pretty (default) | json
 *   --help    Show this help
 */

'use strict';

const { generateAstroChartFromISO } = require('@jothisha-apps/jothisha-lib');
const {
  SIGN_NAMES, SIGN_LORDS, SIGN_NAMES_SI,
  NAKSHATRA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES_SI,
  PLANET_NAMES_SI,
  GANA, NADI, YONI, RAJJU,
  GANA_SI, NADI_SI, RAJJU_SI,
  PLANET_ABBR,
  deriveMoonNakshatra, buildChartJSON,
} = require('./kp-lib');

// ── Formatting helpers ─────────────────────────────────────────────────────

function pad(s, n) { return String(s).padEnd(n); }
function fmtDate(d) { return new Date(d).toISOString().slice(0, 10); }

// Bilingual label: "සිංහල / English"
function bi(si, en) { return `${si} / ${en}`; }

function prettyPrint(result, isoTimestamp, lat, lon, sinhala = false) {
  const { lagna, nawanshaka, birthChartPlanetPositions,
          nawanshakaChartPlanetPositions, dashaShesa } = result;
  const bal = dashaShesa.dashaBalance;
  const now = new Date();

  // Helpers that emit bilingual strings when --lang si is active
  const signLabel  = (n) => sinhala ? bi(SIGN_NAMES_SI[n], SIGN_NAMES[n])  : SIGN_NAMES[n];
  const lordLabel  = (p) => sinhala ? bi(PLANET_NAMES_SI[p] || p, p)        : p;
  const planetLabel = (p) => sinhala ? `${p} (${PLANET_NAMES_SI[p] || p})`  : p;

  const divider = (title) => `\n── ${title} ${'─'.repeat(Math.max(0, 66 - title.length))}`;

  const header = sinhala
    ? '║               KP ජ්‍යෝතිෂ — ජන්ම පත්‍රිකාව                        ║'
    : '║                   KP JYOTISHA — BIRTH CHART                         ║';

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log(header);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Born : ${isoTimestamp}`);
  console.log(`  Place: ${lat >= 0 ? '+' : ''}${lat}°, ${lon >= 0 ? '+' : ''}${lon}°`);

  // ── Lagna ──────────────────────────────────────────────────────────────
  const lagnaTitle = sinhala ? 'ලග්නය (Ascendant)' : 'LAGNA (Ascendant)';
  console.log(divider(lagnaTitle));
  console.log(`  Rashi   : ${signLabel(lagna.sign)} — Lord: ${lordLabel(SIGN_LORDS[lagna.sign])}`);
  console.log(`  Navamsha: ${sinhala ? bi(nawanshaka.sinhala || '', nawanshaka.name) : nawanshaka.name}`);
  console.log(`  Note    : Exact degree/nakshatra needs a Swiss Ephemeris source.`);

  // ── Rashi chart ────────────────────────────────────────────────────────
  const rashiTitle = sinhala ? 'රාශි චක්‍රය (D1)' : 'RASHI CHART (D1)';
  console.log(divider(rashiTitle));
  for (let s = 1; s <= 12; s++) {
    const planets = (birthChartPlanetPositions[s] || []).map(a => {
      const full = PLANET_ABBR[a] || a;
      return sinhala ? `${full}(${PLANET_NAMES_SI[full] || a})` : full;
    }).join(', ') || '—';
    const label = sinhala ? bi(SIGN_NAMES_SI[s], SIGN_NAMES[s]) : SIGN_NAMES[s];
    console.log(`  ${String(s).padStart(2)}. ${pad(label, sinhala ? 22 : 14)}: ${planets}`);
  }

  // ── Navamsha chart ─────────────────────────────────────────────────────
  const navTitle = sinhala ? 'නවාංශ චක්‍රය (D9)' : 'NAVAMSHA CHART (D9)';
  console.log(divider(navTitle));
  for (let s = 1; s <= 12; s++) {
    const planets = (nawanshakaChartPlanetPositions[s] || []).map(a => {
      const full = PLANET_ABBR[a] || a;
      return sinhala ? `${full}(${PLANET_NAMES_SI[full] || a})` : full;
    }).join(', ') || '—';
    const label = sinhala ? bi(SIGN_NAMES_SI[s], SIGN_NAMES[s]) : SIGN_NAMES[s];
    console.log(`  ${String(s).padStart(2)}. ${pad(label, sinhala ? 22 : 14)}: ${planets}`);
  }

  // ── Vimshottari Dasha ──────────────────────────────────────────────────
  const dashaTitle = sinhala ? 'විංශෝත්තර දශා' : 'VIMSHOTTARI DASHA';
  console.log(divider(dashaTitle));
  const balPlanet = sinhala ? planetLabel(bal.planet) : bal.planet;
  console.log(`  Balance at birth: ${balPlanet} — ${bal.yearsRemaining}y ${bal.monthsRemaining}m ${bal.daysRemaining}d remaining\n`);

  for (const maha of dashaShesa.mahaDashas) {
    const start = fmtDate(maha.startDate);
    const end   = fmtDate(maha.endDate);
    const isCurrent = now >= new Date(maha.startDate) && now <= new Date(maha.endDate);
    const mahaLabel = sinhala ? planetLabel(maha.planet) : maha.planet;
    console.log(`  ${pad(mahaLabel, sinhala ? 18 : 10)}  ${start} → ${end}${isCurrent ? '  ◄ CURRENT MAHADASHA' : ''}`);
    if (isCurrent && maha.antarDashas) {
      for (const antar of maha.antarDashas) {
        const as = fmtDate(antar.startDate);
        const ae = fmtDate(antar.endDate);
        const isCurAntar = now >= new Date(antar.startDate) && now <= new Date(antar.endDate);
        const antarLabel = sinhala ? planetLabel(antar.planet) : antar.planet;
        console.log(`    └─ ${pad(antarLabel, sinhala ? 18 : 10)}  ${as} → ${ae}${isCurAntar ? '  ◄ CURRENT BHUKTI' : ''}`);
      }
    }
  }

  // ── Birth star summary ─────────────────────────────────────────────────
  const starTitle = sinhala ? 'ජන්ම නක්ෂත්‍රය' : 'BIRTH STAR SUMMARY';
  console.log(divider(starTitle));

  let moonSign = null;
  for (let s = 1; s <= 12; s++) {
    if ((birthChartPlanetPositions[s] || []).includes('Mo')) { moonSign = s; break; }
  }

  if (moonSign) {
    console.log(`  Moon Rasi : ${signLabel(moonSign)} — Lord: ${lordLabel(SIGN_LORDS[moonSign])}`);
  }
  const dashaLordLabel = sinhala ? planetLabel(bal.planet) : bal.planet;
  console.log(`  Birth dasha lord (Moon's star lord): ${dashaLordLabel}`);

  if (moonSign) {
    const derivedNak = deriveMoonNakshatra(moonSign, bal.planet);
    if (derivedNak) {
      const nakLabel = sinhala
        ? `${NAKSHATRA_NAMES_SI[derivedNak]} / ${NAKSHATRA_NAMES[derivedNak]}`
        : NAKSHATRA_NAMES[derivedNak];
      const nakLord = lordLabel(NAKSHATRA_LORDS[derivedNak]);
      console.log(`  Janma Nakshatra : ${nakLabel} (#${derivedNak}) — ${nakLord}`);
      const gana  = sinhala ? bi(GANA_SI[GANA[derivedNak]], GANA[derivedNak])   : GANA[derivedNak];
      const nadi  = sinhala ? bi(NADI_SI[NADI[derivedNak]], NADI[derivedNak])   : NADI[derivedNak];
      const rajju = sinhala ? bi(RAJJU_SI[RAJJU[derivedNak]], RAJJU[derivedNak]): RAJJU[derivedNak];
      console.log(`  Gana: ${gana}   Nadi: ${nadi}   Rajju: ${rajju}   Yoni: ${YONI[derivedNak]}`);
    } else {
      console.log(`  Janma Nakshatra : ambiguous — Moon near a sign boundary; provide exact birth time.`);
    }
  }
  console.log('');
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

function usage() {
  console.log(`
KP Jyotisha Chart Calculator
────────────────────────────────────────────────────────────────────────
Computes Rashi (D1) / Navamsha (D9) chart layout and Vimshottari Dasha
timeline from birth data using @jothisha-apps/jothisha-lib.

Usage:
  node tools/chart.js --iso "1990-05-15T06:30:00+05:30" --lat 13.0827 --lon 80.2707
  node tools/chart.js --date "1990-05-15" --time "06:30" --tz "+05:30" --lat 13.0827 --lon 80.2707

Options:
  --iso     ISO 8601 timestamp with tz offset    e.g. 1990-05-15T06:30:00+05:30
  --date    Birth date YYYY-MM-DD
  --time    Birth time HH:MM (24h)
  --tz      Timezone offset ±HH:MM              e.g. +05:30  -05:00  +00:00
  --lat     Latitude  decimal degrees            e.g. 13.0827  (Chennai)
  --lon     Longitude decimal degrees            e.g. 80.2707  (Chennai)
  --format  pretty (default) | json
  --lang    si  — show Sinhala names alongside English (pretty mode only)

Common timezone offsets:
  India / Sri Lanka  +05:30    UAE / Dubai    +04:00
  UK (GMT)           +00:00    Singapore      +08:00
  UK (BST)           +01:00    Japan          +09:00
  US Eastern         -05:00    Australia/Syd  +10:00
  US Pacific         -08:00
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.iso && !args.date)) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const lat = parseFloat(args.lat);
  const lon = parseFloat(args.lon);
  if (isNaN(lat) || isNaN(lon)) {
    console.error('Error: --lat and --lon are required (decimal degrees).');
    process.exit(1);
  }

  let isoTimestamp;
  if (args.iso) {
    isoTimestamp = args.iso;
  } else {
    if (!args.date || !args.time || !args.tz) {
      console.error('Error: provide --date, --time, and --tz when not using --iso.');
      process.exit(1);
    }
    isoTimestamp = `${args.date}T${args.time}:00${args.tz}`;
  }

  try {
    const result = generateAstroChartFromISO(isoTimestamp, lat, lon);
    if (args.format === 'json') {
      console.log(JSON.stringify(buildChartJSON(result, isoTimestamp, lat, lon), null, 2));
    } else {
      prettyPrint(result, isoTimestamp, lat, lon, args.lang === 'si');
    }
  } catch (err) {
    console.error('Chart generation failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) main();
