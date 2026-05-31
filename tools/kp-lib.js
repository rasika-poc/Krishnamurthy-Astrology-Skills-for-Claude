'use strict';

// ── Nakshatra / zodiac lookup tables ──────────────────────────────────────
// All arrays are 1-indexed; index 0 is a placeholder.
// Sinhala strings match what @jothisha-apps/jothisha-lib returns for signs and
// planets, and standard Pali-derived Sinhala for nakshatras and attributes.

const NAKSHATRA_NAMES = [
  '',
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Star lord repeats every 9 nakshatras (Vimshottari sequence)
const NAKSHATRA_LORDS = [
  '',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

const NAKSHATRA_NAMES_SI = [
  '',
  'අශ්වනී',      'භරණී',         'කෘත්තිකා',  'රොහිණී',       'මෘගශිරා',     'ආර්ද්‍රා',
  'පුනර්වසු',    'පුෂ්‍ය',         'ආශ්ලේෂා',   'මාඝ',           'පූර්ව ඵල්ගුනී', 'උත්තර ඵල්ගුනී',
  'හස්ත',        'චිත්‍රා',        'ස්වාතී',     'විශාඛා',        'අනුරාධා',      'ජ්‍යේෂ්ඨා',
  'මූල',          'පූර්ව ආෂාඪ',   'උත්තර ආෂාඪ', 'ශ්‍රවණ',        'ධනිෂ්ඨා',      'ශතභිෂා',
  'පූර්ව භාද්‍රපද', 'උත්තර භාද්‍රපද', 'රේවතී',
];

const SIGN_NAMES = [
  '', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Sinhala sign names — must match what jothisha-lib returns in lagna.sinhala
const SIGN_NAMES_SI = [
  '', 'මේෂ', 'වෘෂභ', 'මිථුන', 'කටක', 'සිංහ', 'කන්‍යා',
  'තුලා', 'වෘශ්චික', 'ධනු', 'මකර', 'කුම්භ', 'මීන',
];

const SIGN_LORDS = [
  '', 'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

// Sinhala planet names — must match what jothisha-lib returns in planetSinhala
const PLANET_NAMES_SI = {
  Sun: 'සූර්ය', Moon: 'චන්ද්‍ර', Mars: 'කුජ', Mercury: 'බුධ',
  Jupiter: 'ගුරු', Venus: 'ශුක්‍ර', Saturn: 'ශනි', Rahu: 'රාහු', Ketu: 'කේතු',
};

// ── Vimshottari Dasha ─────────────────────────────────────────────────────

// Sequence: Ketu → Venus → Sun → Moon → Mars → Rahu → Jupiter → Saturn → Mercury
const DASHA_PLANETS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS   = [7,      20,      6,    10,     7,     18,     16,       19,       17     ];
const DASHA_TOTAL   = 120;

// ── Matchmaking attributes (1-indexed by nakshatra number) ────────────────

const GANA_SI    = { Deva: 'දේව', Manushya: 'මනුෂ්‍ය', Rakshasa: 'රාක්ෂස' };
const NADI_SI    = { Adi: 'ආදි', Madhya: 'මධ්‍ය', Antya: 'අන්ත' };
const RAJJU_SI   = { Siro: 'ශිරෝ', Kantha: 'කණ්ඨ', Nabhi: 'නාභී', Kati: 'කටී', Paada: 'පාද' };

const GANA = {
   1:'Deva',   2:'Manushya', 3:'Rakshasa', 4:'Manushya', 5:'Deva',    6:'Manushya',
   7:'Deva',   8:'Deva',     9:'Rakshasa',10:'Rakshasa',11:'Manushya',12:'Manushya',
  13:'Deva',  14:'Rakshasa',15:'Deva',   16:'Rakshasa',17:'Deva',   18:'Rakshasa',
  19:'Rakshasa',20:'Manushya',21:'Manushya',22:'Deva',  23:'Rakshasa',
  24:'Rakshasa',25:'Manushya',26:'Manushya',27:'Deva',
};

// Traditional Nadi pattern — groups of 9 cycling: Adi(1,6,7,12,13,18,19,24,25),
// Madhya(2,5,8,11,14,17,20,23,26), Antya(3,4,9,10,15,16,21,22,27)
const NADI = {
   1:'Adi',    2:'Madhya',  3:'Antya',  4:'Antya',  5:'Madhya',  6:'Adi',
   7:'Adi',    8:'Madhya',  9:'Antya', 10:'Antya', 11:'Madhya', 12:'Adi',
  13:'Adi',   14:'Madhya', 15:'Antya', 16:'Antya', 17:'Madhya', 18:'Adi',
  19:'Adi',   20:'Madhya', 21:'Antya', 22:'Antya', 23:'Madhya', 24:'Adi',
  25:'Adi',   26:'Madhya', 27:'Antya',
};

const YONI = {
   1:'Horse(M)',   2:'Elephant(M)', 3:'Goat(M)',    4:'Serpent(F)', 5:'Serpent(M)',
   6:'Dog(F)',     7:'Cat(M)',      8:'Goat(F)',    9:'Cat(F)',    10:'Rat(M)',
  11:'Rat(F)',    12:'Cow(F)',     13:'Buffalo(F)',14:'Tiger(F)', 15:'Buffalo(M)',
  16:'Tiger(M)', 17:'Deer(M)',    18:'Deer(F)',   19:'Dog(M)',   20:'Monkey(F)',
  21:'Mongoose', 22:'Monkey(M)', 23:'Lion(F)',   24:'Horse(F)', 25:'Lion(M)',
  26:'Cow(M)',   27:'Elephant(F)',
};

const RAJJU = {
   1:'Paada', 2:'Kati',   3:'Nabhi',  4:'Kantha', 5:'Siro',   6:'Kantha',
   7:'Nabhi', 8:'Kati',   9:'Paada', 10:'Paada', 11:'Kati',  12:'Nabhi',
  13:'Kantha',14:'Siro', 15:'Kantha',16:'Nabhi', 17:'Kati',  18:'Paada',
  19:'Paada', 20:'Kati', 21:'Nabhi', 22:'Kantha',23:'Siro',  24:'Kantha',
  25:'Nabhi', 26:'Kati', 27:'Paada',
};

// Planet abbreviation → full name (as returned by jothisha-lib)
const PLANET_ABBR = {
  Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ju:'Jupiter', Ve:'Venus', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu',
};

// ── KP calculation functions ──────────────────────────────────────────────

/**
 * Return the KP sub-lord for a planet at the given sidereal longitude (degrees).
 * Uses Vimshottari proportional sub-divisions within each nakshatra (800 arc-min total).
 */
function getSubLord(longitude) {
  const lon = ((longitude % 360) + 360) % 360;
  const lonMin = lon * 60;                        // total arc-minutes
  const nakIdx = Math.floor(lonMin / 800);        // 0-based nakshatra index
  const starLordIdx = nakIdx % 9;
  const posInNak = lonMin - nakIdx * 800;

  let cursor = 0;
  for (let i = 0; i < 9; i++) {
    const pIdx = (starLordIdx + i) % 9;
    const span = (DASHA_YEARS[pIdx] / DASHA_TOTAL) * 800;
    if (posInNak < cursor + span) return DASHA_PLANETS[pIdx];
    cursor += span;
  }
  return DASHA_PLANETS[starLordIdx]; // floating-point edge fallback
}

/**
 * Enrich a raw {longitude, nakshatra, sign, ...} position with all KP metadata.
 * Requires exact longitude — use this when Swiss Ephemeris data is available.
 */
function enrichPosition(pos) {
  const nak = pos.nakshatra;
  return {
    ...pos,
    signName:      SIGN_NAMES[pos.sign]     || `Sign${pos.sign}`,
    signLord:      SIGN_LORDS[pos.sign]     || '?',
    nakshatraName: NAKSHATRA_NAMES[nak]     || `Nak${nak}`,
    nakshatraLord: NAKSHATRA_LORDS[nak]     || '?',
    subLord:       getSubLord(pos.longitude),
    gana:          GANA[nak],
    nadi:          NADI[nak],
    yoni:          YONI[nak],
    rajju:         RAJJU[nak],
  };
}

/**
 * Narrow Moon's nakshatra number from the sign it occupies and the birth dasha lord
 * (= Moon's star lord). Each sign spans ~3 nakshatras; the star lord identifies which one.
 * Returns null if the Moon sits near a sign boundary with an ambiguous match.
 */
function deriveMoonNakshatra(moonSign, birthDashaLord) {
  const baseNak = (moonSign - 1) * 3 + 1;
  for (let offset = 0; offset < 3; offset++) {
    const n = baseNak + offset;
    if (n >= 1 && n <= 27 && NAKSHATRA_LORDS[n] === birthDashaLord) return n;
  }
  return null;
}

/**
 * Expand the jothisha-lib sign→abbreviation chart map into a structured object.
 */
function expandChartMap(map) {
  const out = {};
  for (let s = 1; s <= 12; s++) {
    out[s] = {
      sign:    SIGN_NAMES[s],
      signSI:  SIGN_NAMES_SI[s],
      lord:    SIGN_LORDS[s],
      lordSI:  PLANET_NAMES_SI[SIGN_LORDS[s]] || SIGN_LORDS[s],
      planets: (map[s] || []).map(a => PLANET_ABBR[a] || a),
    };
  }
  return out;
}

/**
 * Build the standard JSON output object from a jothisha-lib BirthChartResult.
 * Note: the library does not expose raw planet longitudes, so sub-lords and
 * exact nakshatras per planet cannot be computed here — they require an external
 * Swiss Ephemeris source. The Janma Nakshatra is derived from Moon sign + dasha lord.
 */
function buildChartJSON(result, isoTimestamp, lat, lon) {
  const { lagna, nawanshaka, birthChartPlanetPositions,
          nawanshakaChartPlanetPositions, dashaShesa } = result;
  const bal = dashaShesa.dashaBalance;

  let moonSign = null;
  for (let s = 1; s <= 12; s++) {
    if ((birthChartPlanetPositions[s] || []).includes('Mo')) { moonSign = s; break; }
  }

  const derivedNak = moonSign ? deriveMoonNakshatra(moonSign, bal.planet) : null;

  return {
    input: { isoTimestamp, lat, lon },
    lagna: {
      sign: lagna.sign, name: lagna.name, sinhala: lagna.sinhala,
      lord: SIGN_LORDS[lagna.sign], lordSI: PLANET_NAMES_SI[SIGN_LORDS[lagna.sign]],
    },
    navamsha: { sign: nawanshaka.sign, name: nawanshaka.name, sinhala: nawanshaka.sinhala },
    rashiChart: expandChartMap(birthChartPlanetPositions),
    navamshaChart: expandChartMap(nawanshakaChartPlanetPositions),
    dashaBalance: {
      ...bal,
      planetSI: bal.planetSinhala || PLANET_NAMES_SI[bal.planet],
    },
    mahaDashas: dashaShesa.mahaDashas.map(m => ({
      planet:   m.planet,
      planetSI: m.planetSinhala || PLANET_NAMES_SI[m.planet],
      start:    new Date(m.startDate).toISOString().slice(0, 10),
      end:      new Date(m.endDate).toISOString().slice(0, 10),
      bhuktis: (m.antarDashas || []).map(a => ({
        planet:   a.planet,
        planetSI: a.planetSinhala || PLANET_NAMES_SI[a.planet],
        start:    new Date(a.startDate).toISOString().slice(0, 10),
        end:      new Date(a.endDate).toISOString().slice(0, 10),
      })),
    })),
    moonRasi: moonSign ? {
      sign: moonSign, name: SIGN_NAMES[moonSign], sinhala: SIGN_NAMES_SI[moonSign],
      lord: SIGN_LORDS[moonSign], lordSI: PLANET_NAMES_SI[SIGN_LORDS[moonSign]],
    } : null,
    derivedJanmaNakshatra: derivedNak ? {
      number:   derivedNak,
      name:     NAKSHATRA_NAMES[derivedNak],
      sinhala:  NAKSHATRA_NAMES_SI[derivedNak],
      lord:     NAKSHATRA_LORDS[derivedNak],
      lordSI:   PLANET_NAMES_SI[NAKSHATRA_LORDS[derivedNak]],
      gana:     GANA[derivedNak],
      ganaSI:   GANA_SI[GANA[derivedNak]],
      nadi:     NADI[derivedNak],
      nadiSI:   NADI_SI[NADI[derivedNak]],
      yoni:     YONI[derivedNak],
      rajju:    RAJJU[derivedNak],
      rajjuSI:  RAJJU_SI[RAJJU[derivedNak]],
    } : null,
    note: 'Exact planet longitudes and sub-lords require a Swiss Ephemeris backend. ' +
          'derivedJanmaNakshatra is inferred from Moon sign + birth dasha lord and ' +
          'may be ambiguous if Moon is near a sign boundary.',
  };
}

module.exports = {
  NAKSHATRA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES_SI,
  SIGN_NAMES, SIGN_LORDS, SIGN_NAMES_SI,
  PLANET_NAMES_SI,
  DASHA_PLANETS, DASHA_YEARS, DASHA_TOTAL,
  GANA, NADI, YONI, RAJJU,
  GANA_SI, NADI_SI, RAJJU_SI,
  PLANET_ABBR,
  getSubLord,
  enrichPosition,
  deriveMoonNakshatra,
  expandChartMap,
  buildChartJSON,
};
