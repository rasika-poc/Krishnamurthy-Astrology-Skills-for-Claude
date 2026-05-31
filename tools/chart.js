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
 *   node tools/chart.js --date "1990-05-15" --time "06:30" --zone lk --lat 6.9271 --lon 79.8612
 *   node tools/chart.js --date "1996-10-18" --time "08:30" --zone Asia/Colombo --lat 6.9271 --lon 79.8612
 *
 * Options:
 *   --iso     ISO 8601 timestamp with timezone offset
 *   --date    Birth date YYYY-MM-DD
 *   --time    Birth time HH:MM (24h)
 *   --tz      Explicit timezone offset ±HH:MM (e.g. +05:30, -05:00)
 *   --zone    IANA timezone name OR shorthand — auto-resolves historical offset
 *             Shorthands: lk, in, uk, us-eastern, us-pacific, sg, uae, au-sydney …
 *             IANA names: Asia/Colombo, Europe/London, America/New_York …
 *   --lat     Birth latitude in decimal degrees
 *   --lon     Birth longitude in decimal degrees
 *   --format  pretty (default) | json
 *   --lang    si — show Sinhala names alongside English (pretty mode only)
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
  resolveOffset, resolveZoneAlias, ZONE_ALIASES,
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
  --tz      Explicit timezone offset ±HH:MM     e.g. +05:30  -05:00  +00:00
  --zone    IANA name or shorthand (auto-resolves historical offset)
            Shorthands: lk  in  uk  us-eastern  us-pacific  sg  uae  au-sydney
            IANA:  Asia/Colombo  Europe/London  America/New_York  ...
  --lat     Latitude  decimal degrees            e.g. 13.0827  (Chennai)
  --lon     Longitude decimal degrees            e.g. 80.2707  (Chennai)
  --format  pretty (default) | json
  --lang    si  — show Sinhala names alongside English (pretty mode only)

Zone shorthands:
  lk / sl / sri-lanka   Asia/Colombo      in / india          Asia/Kolkata
  uk / gb / london      Europe/London     uae / dubai         Asia/Dubai
  sg / singapore        Asia/Singapore    jp / japan          Asia/Tokyo
  us-eastern / us-est   America/New_York  us-pacific / us-pst America/Los_Angeles
  au-sydney / sydney    Australia/Sydney
`);
}

/**
 * Infer the most likely IANA timezone from lat/lon using bounding boxes.
 * Returns { zone, alias, label } or null if no confident match.
 * Used to give targeted tz-warning when --tz is passed without --zone.
 */
function _inferZoneFromCoords(lat, lon) {
  const regions = [
    // Sri Lanka
    { zone: 'Asia/Colombo',        alias: 'lk',          label: 'Sri Lanka',
      latMin: 5.7,  latMax: 10.0,  lonMin: 79.5, lonMax: 82.0 },
    // India (overlaps Sri Lanka — Sri Lanka checked first above)
    { zone: 'Asia/Kolkata',         alias: 'in',          label: 'India',
      latMin: 6.5,  latMax: 37.5,  lonMin: 68.0, lonMax: 98.0 },
    // UK / Ireland
    { zone: 'Europe/London',        alias: 'uk',          label: 'UK',
      latMin: 49.0, latMax: 61.0,  lonMin: -11.0, lonMax: 2.0 },
    // US Eastern
    { zone: 'America/New_York',     alias: 'us-eastern',  label: 'US Eastern',
      latMin: 24.0, latMax: 50.0,  lonMin: -85.0, lonMax: -66.0 },
    // US Central
    { zone: 'America/Chicago',      alias: 'us-central',  label: 'US Central',
      latMin: 25.0, latMax: 50.0,  lonMin: -104.0, lonMax: -85.0 },
    // US Mountain
    { zone: 'America/Denver',       alias: 'us-mountain', label: 'US Mountain',
      latMin: 25.0, latMax: 50.0,  lonMin: -116.0, lonMax: -104.0 },
    // US Pacific
    { zone: 'America/Los_Angeles',  alias: 'us-pacific',  label: 'US Pacific',
      latMin: 32.0, latMax: 50.0,  lonMin: -125.0, lonMax: -116.0 },
    // Australia/Sydney
    { zone: 'Australia/Sydney',     alias: 'au-sydney',   label: 'Australia/Sydney',
      latMin: -38.0, latMax: -28.0, lonMin: 149.0, lonMax: 154.0 },
    // Australia/Perth
    { zone: 'Australia/Perth',      alias: 'au-perth',    label: 'Australia/Perth',
      latMin: -36.0, latMax: -13.0, lonMin: 113.0, lonMax: 130.0 },
    // Singapore / Malaysia
    { zone: 'Asia/Singapore',       alias: 'sg',          label: 'Singapore',
      latMin: 1.0,  latMax: 2.0,   lonMin: 103.0, lonMax: 105.0 },
    // UAE
    { zone: 'Asia/Dubai',           alias: 'uae',         label: 'UAE',
      latMin: 22.0, latMax: 26.5,  lonMin: 51.0, lonMax: 56.5 },
    // Japan
    { zone: 'Asia/Tokyo',           alias: 'jp',          label: 'Japan',
      latMin: 24.0, latMax: 46.0,  lonMin: 122.0, lonMax: 146.0 },
  ];

  for (const r of regions) {
    if (lat >= r.latMin && lat <= r.latMax && lon >= r.lonMin && lon <= r.lonMax) {
      return { zone: r.zone, alias: r.alias, label: r.label };
    }
  }
  return null;
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
    if (!args.date || !args.time) {
      console.error('Error: provide --date and --time (plus --tz or --zone) when not using --iso.');
      process.exit(1);
    }

    let tz = args.tz;

    if (!tz && args.zone) {
      // Auto-resolve historical offset from IANA zone name or shorthand
      const ianaZone = resolveZoneAlias(args.zone) || args.zone;
      try {
        tz = resolveOffset(ianaZone, args.date, args.time);
        process.stderr.write(`[zone] ${args.zone} → ${ianaZone} → ${tz} on ${args.date}\n`);
      } catch (e) {
        console.error(`Error resolving zone "${args.zone}": ${e.message}`);
        process.exit(1);
      }
    }

    if (!tz) {
      console.error('Error: provide --tz (e.g. +05:30) or --zone (e.g. lk, Asia/Colombo).');
      process.exit(1);
    }

    // ── Timezone validation ────────────────────────────────────────────────
    // When --tz is given directly (not via --zone), infer the likely timezone
    // from lat/lon and warn if the provided offset doesn't match the historical
    // offset for that zone on this date.
    if (args.tz && !args.zone) {
      const likely = _inferZoneFromCoords(lat, lon);
      if (likely) {
        try {
          const expected = resolveOffset(likely.zone, args.date, args.time);
          if (expected !== args.tz) {
            process.stderr.write(
              `[tz-warning] --tz ${args.tz} looks wrong for ${likely.label} on ${args.date}.\n` +
              `             Historical offset was ${expected}. Use --zone ${likely.alias} to auto-resolve.\n`
            );
          }
        } catch { /* zone lookup failed — skip warning */ }
      }
    }

    isoTimestamp = `${args.date}T${args.time}:00${tz}`;
  }

  // ── Validate offset embedded in --iso timestamp ──────────────────────────
  // Extract the ±HH:MM part from the ISO string and cross-check against the
  // likely historical timezone for the given coordinates.
  if (args.iso) {
    const isoOffsetMatch = args.iso.match(/([+-]\d{2}:\d{2})$/);
    if (isoOffsetMatch) {
      const embeddedOffset = isoOffsetMatch[1];
      const isoDateMatch   = args.iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
      if (isoDateMatch) {
        const [, isoDate, isoTime] = isoDateMatch;
        const likely = _inferZoneFromCoords(lat, lon);
        if (likely) {
          try {
            const expected = resolveOffset(likely.zone, isoDate, isoTime);
            if (expected !== embeddedOffset) {
              process.stderr.write(
                `[tz-warning] ISO offset ${embeddedOffset} looks wrong for ${likely.label} on ${isoDate}.\n` +
                `             Historical offset was ${expected}.\n` +
                `             Fix: use --date "${isoDate}" --time "${isoTime}" --zone ${likely.alias} instead of --iso.\n`
              );
            }
          } catch { /* zone lookup failed — skip */ }
        }
      }
    }
  }

  try {
    const result = generateAstroChartFromISO(isoTimestamp, lat, lon);

    // ── Sanity checks ──────────────────────────────────────────────────────
    const chart = result.birthChartPlanetPositions;
    let rahuSign = null, ketuSign = null;
    for (let s = 1; s <= 12; s++) {
      if ((chart[s] || []).includes('Ra')) rahuSign = s;
      if ((chart[s] || []).includes('Ke')) ketuSign = s;
    }
    if (rahuSign && ketuSign && Math.abs(rahuSign - ketuSign) !== 6) {
      process.stderr.write(`WARNING: Rahu (sign ${rahuSign}) and Ketu (sign ${ketuSign}) are not opposite — library may have a bug.\n`);
    }

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
