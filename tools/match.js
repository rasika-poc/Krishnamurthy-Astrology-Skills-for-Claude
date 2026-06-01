#!/usr/bin/env node
/**
 * KP Jyotisha — Thirumana Porutham (Marriage Compatibility) Calculator
 *
 * Calculates all 10 poruthams + Nadi deterministically.
 * Accepts nakshatra and rasi names in Tamil, Sanskrit, or Sinhala.
 *
 * Usage:
 *   node tools/match.js --boy-star 7  --girl-star 23 --boy-rasi 4  --girl-rasi 11
 *   node tools/match.js --boy-star "Punarvasu" --girl-star "Dhanishtha" --boy-rasi "Cancer" --girl-rasi "Aquarius"
 *   node tools/match.js --boy-star "පුනර්වසු" --girl-star "ධනිෂ්ඨා" --boy-rasi "කටක" --girl-rasi "කුම්භ"
 *
 * Options:
 *   --boy-star    Boy's nakshatra (1-27, or name in Tamil/Sanskrit/Sinhala)
 *   --girl-star   Girl's nakshatra (1-27, or name)
 *   --boy-rasi    Boy's Moon sign (1-12, or name) — needed for Rasi/Vasya/Adhipati checks
 *   --girl-rasi   Girl's Moon sign (1-12, or name)
 *   --boy-gana    Override Gana if already known (Deva/Manushya/Rakshasa)
 *   --girl-gana   Override Gana if already known
 *   --system      8 | 10 | 20  (default: 10)
 *   --format      pretty (default) | json
 *   --help        Show this help
 */

'use strict';

const { GANA, NADI, RAJJU, YONI, SIGN_LORDS } = require('./kp-lib');

// ── Nakshatra name → number lookup (Tamil + Sanskrit + Sinhala + common variants) ──

const NAKSHATRA_LOOKUP = {
  // Sanskrit
  ashwini:1, bharani:2, krittika:3, rohini:4, mrigashira:5, ardra:6,
  punarvasu:7, pushya:8, ashlesha:9, magha:10, purva_phalguni:11, uttara_phalguni:12,
  hasta:13, chitra:14, swati:15, vishakha:16, anuradha:17, jyeshtha:18,
  moola:19, mula:19, purva_ashadha:20, uttara_ashadha:21, shravana:22, dhanishtha:23,
  shatabhisha:24, purva_bhadrapada:25, uttara_bhadrapada:26, revati:27,
  // Common spelling variants
  mrigasira:5, mrigasirsha:5, arudra:6, punarpoosam:7, jyeshta:18, jyesta:18,
  // Tamil
  aswini:1, asvini:1, bharani:2, karthigai:3, karthikai:3, krithigai:3,
  rohini:4, mirugasirisham:5, mirugashirisham:5, thiruvathirai:6, punarpoosam_t:7,
  poosam:8, pusam:8, ayilyam:9, aayilyam:9, magam:10, pooram:11, uthiram:12,
  hastham:13, chithirai:14, swathi:15, visakam:16, anusham:17, kettai:18,
  moolam:19, pooradam:20, uthiradam:21, thiruvonam:22, avittam:23, sadayam:24,
  poorattathi:25, uthirattathi:26, revathi:27,
  // Sinhala (transliterated)
  ashwani:1, bharani:2, ruththika:3, rohini:4, mruugashira:5,
  punarvasu:7, pushya:8, ashlesha:9,
  // Sinhala unicode
  'අශ්වනී':1, 'භරණී':2, 'කෘත්තිකා':3, 'රොහිණී':4, 'මෘගශිරා':5,
  'ආර්ද්‍රා':6, 'පුනර්වසු':7, 'පුෂ්‍ය':8, 'ආශ්ලේෂා':9, 'මාඝ':10,
  'පූර්ව ඵල්ගුනී':11, 'උත්තර ඵල්ගුනී':12, 'හස්ත':13, 'චිත්‍රා':14,
  'ස්වාතී':15, 'විශාඛා':16, 'අනුරාධා':17, 'ජ්‍යේෂ්ඨා':18, 'මූල':19,
  'පූර්ව ආෂාඪ':20, 'උත්තර ආෂාඪ':21, 'ශ්‍රවණ':22, 'ධනිෂ්ඨා':23,
  'ශතභිෂා':24, 'පූර්ව භාද්‍රපද':25, 'උත්තර භාද්‍රපද':26, 'රේවතී':27,
};

const NAKSHATRA_NAMES = [
  '', 'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// ── Rasi name → number lookup ─────────────────────────────────────────────

const RASI_LOOKUP = {
  aries:1, mesha:1, mesa:1, 'மேஷம்':1, 'மேஷ':1, 'மேஷ ராசி':1, 'මේෂ':1,
  taurus:2, vrishabha:2, 'ரிஷபம்':2, 'வ்ருஷபம்':2, 'වෘෂභ':2,
  gemini:3, mithuna:3, 'மிதுனம்':3, 'மிதுன':3, 'මිථුන':3,
  cancer:4, kataka:4, karkata:4, 'கடகம்':4, 'கர்கடகம்':4, 'කටක':4,
  leo:5, simha:5, 'சிம்மம்':5, 'சிம்ம':5, 'සිංහ':5,
  virgo:6, kanya:6, 'கன்னி':6, 'கன்யா':6, 'කන්‍යා':6,
  libra:7, tula:7, thula:7, 'துலாம்':7, 'துலா':7, 'තුලා':7,
  scorpio:8, vrischika:8, 'விருச்சிகம்':8, 'வ்ருஷ்சிக':8, 'වෘශ්චික':8,
  sagittarius:9, dhanu:9, dhanus:9, 'தனுசு':9, 'தனுர்':9, 'ධනු':9,
  capricorn:10, makara:10, 'மகரம்':10, 'மகர':10, 'මකර':10,
  aquarius:11, kumbha:11, 'கும்பம்':11, 'கும்ப':11, 'කුම්භ':11,
  pisces:12, meena:12, 'மீனம்':12, 'மீன':12, 'මීන':12,
};

const RASI_NAMES = [
  '', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// ── Resolution helpers ────────────────────────────────────────────────────

function resolveNakshatra(input) {
  if (!input) return null;
  const n = parseInt(input);
  if (!isNaN(n) && n >= 1 && n <= 27) return n;
  const key = String(input).toLowerCase().replace(/[\s\-]/g, '_');
  return NAKSHATRA_LOOKUP[key] || NAKSHATRA_LOOKUP[String(input)] || null;
}

function resolveRasi(input) {
  if (!input) return null;
  const n = parseInt(input);
  if (!isNaN(n) && n >= 1 && n <= 12) return n;
  const key = String(input).toLowerCase().replace(/[\s\-]/g, '_');
  return RASI_LOOKUP[key] || RASI_LOOKUP[String(input)] || null;
}

// ── Porutham lookup tables ─────────────────────────────────────────────────

// Ega Porutham (same star): which stars pass when boy = girl
const EGA_OK  = new Set([4,6,10,13,16,22,26,27]); // Rohini,Ardra,Magha,Hasta,Vishakha,Shravana,Uttara Bhadrapada,Revati
const EGA_BAD = new Set([2,9,18,19,23,24,25]);     // Bharani,Ashlesha,Jyeshtha,Mula,Dhanishtha,Shatabhisha,Purva Bhadrapada

// Mahendra: agree if count ∈ these values
const MAHENDRA_COUNTS = new Set([4,7,10,13,16,19,22,25]);

// Yoni animal extraction and enemy pairs
function yoniAnimal(nak) {
  const y = YONI[nak] || '';
  return y.replace(/\([MF]\)/, '').trim(); // 'Horse(M)' → 'Horse'
}

const YONI_ENEMY_PAIRS = [
  ['Cat', 'Rat'],
  ['Dog', 'Deer'],
  ['Serpent', 'Mongoose'],
  ['Elephant', 'Lion'],
  ['Horse', 'Buffalo'],
  ['Tiger', 'Deer'],
  ['Cow', 'Tiger'],
  ['Monkey', 'Goat'],
];

function yoniRelation(nak1, nak2) {
  const a = yoniAnimal(nak1);
  const b = yoniAnimal(nak2);
  if (a === b) return 'same';
  for (const [x, y] of YONI_ENEMY_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) return 'enemy';
  }
  return 'neutral';
}

// Rasi Adhipati — planet friendships
const PLANET_FRIENDS = {
  Sun:['Moon','Mars','Jupiter'], Moon:['Sun','Mercury'],
  Mars:['Sun','Moon','Jupiter'], Mercury:['Sun','Venus'],
  Jupiter:['Sun','Moon','Mars'], Venus:['Mercury','Saturn'],
  Saturn:['Mercury','Venus'],
};
const PLANET_NEUTRALS = {
  Sun:['Mercury'], Moon:['Mars','Jupiter','Venus','Saturn'],
  Mars:['Venus','Saturn'], Mercury:['Mars','Jupiter','Saturn'],
  Jupiter:['Saturn'], Venus:['Mars','Jupiter'], Saturn:['Mars','Jupiter'],
};

function planetRelation(a, b) {
  if (a === b) return 'same';
  if ((PLANET_FRIENDS[a] || []).includes(b)) {
    return (PLANET_FRIENDS[b] || []).includes(a) ? 'mutual_friend' : 'one_friend';
  }
  if ((PLANET_NEUTRALS[a] || []).includes(b)) {
    if ((PLANET_FRIENDS[b] || []).includes(a)) return 'one_friend';
    return (PLANET_NEUTRALS[b] || []).includes(a) ? 'both_neutral' : 'one_enemy';
  }
  // a treats b as enemy
  if ((PLANET_FRIENDS[b] || []).includes(a)) return 'one_friend';
  if ((PLANET_NEUTRALS[b] || []).includes(a)) return 'one_enemy';
  return 'both_enemy';
}

// Vasya: girl_rasi → array of rasis it attracts (vasya of girl)
const VASYA = {
  1:[5,8], 2:[4,7], 3:[6,9], 4:[8,9], 5:[7],
  6:[12,3], 7:[10,6], 8:[4], 9:[12], 10:[11,1], 11:[1], 12:[10],
};

// Rajju groups
const RAJJU_GROUPS = {
  Siro:  new Set([5,14,23]),
  Kantha:new Set([4,6,13,15,22,24]),
  Nabhi: new Set([3,7,12,16,21,25]),
  Kati:  new Set([2,8,11,17,20,26]),
  Paada: new Set([1,9,10,18,19,27]),
};
function rajjuOf(nak) {
  for (const [name, set] of Object.entries(RAJJU_GROUPS)) {
    if (set.has(nak)) return name;
  }
  return null;
}

// Vedha pairs (mutual)
const VEDHA_MAP = new Map([
  [1,18],[18,1],[2,17],[17,2],[3,16],[16,3],[4,15],[15,4],[5,14],[14,5],
  [6,22],[22,6],[7,21],[21,7],[8,20],[20,8],[9,19],[19,9],[10,27],[27,10],
  [11,26],[26,11],[12,25],[25,12],[13,24],[24,13],
]);

// ── Count helpers ─────────────────────────────────────────────────────────

// Count from girl's star to boy's star (girl = 1, going forward through 27)
function starCount(girl, boy) {
  return ((boy - girl + 27) % 27) + 1;
}

// Count from girl's rasi to boy's rasi (girl = 1, going forward through 12)
function rasiCount(girl, boy) {
  return ((boy - girl + 12) % 12) + 1;
}

// ── Individual porutham calculators ──────────────────────────────────────

function calcDina(boyNak, girlNak) {
  const count = starCount(girlNak, boyNak);
  const rem   = count % 9;

  let pass, grade, note;

  if (count === 1) {
    // Same star — check ega porutham
    if (EGA_OK.has(boyNak)) {
      pass = true; grade = 'Ega Porutham'; note = `Same star (${NAKSHATRA_NAMES[boyNak]}) — Ega OK`;
    } else if (EGA_BAD.has(boyNak)) {
      pass = false; grade = 'Ega Dosha'; note = `Same star (${NAKSHATRA_NAMES[boyNak]}) — Ega not acceptable`;
    } else {
      pass = false; grade = 'Fail'; note = `Same star — not in Ega OK list`;
    }
  } else if ([10, 19].includes(count)) {
    pass = false; grade = 'Rajju Dosha trigger'; note = `Count ${count} — triggers Rajju dosha even if remainder agrees`;
  } else if ([0, 2, 4, 6].includes(rem)) {
    pass = true; grade = 'Agree'; note = `Count ${count} — remainder ${rem} = agree`;
  } else {
    pass = false; grade = 'Disagree'; note = `Count ${count} — remainder ${rem} = disagree`;
  }

  return { pass, grade, count, remainder: rem, note };
}

function calcGana(boyNak, girlNak, boyGanaOverride, girlGanaOverride) {
  const bg = boyGanaOverride  || GANA[boyNak];
  const gg = girlGanaOverride || GANA[girlNak];

  let pass, grade, note;
  if (bg === 'Deva'     && gg === 'Deva')     { pass = true;  grade = 'Ati Uttamam'; note = 'Deva + Deva — best'; }
  else if (bg === 'Manushya' && gg === 'Manushya') { pass = true;  grade = 'Uttamam'; note = 'Manushya + Manushya — good'; }
  else if (bg === 'Deva'     && gg === 'Manushya') { pass = true;  grade = 'Madhyamam'; note = 'Deva + Manushya — acceptable'; }
  else if (bg === 'Manushya' && gg === 'Deva')     { pass = true;  grade = 'Madhyamam'; note = 'Manushya + Deva — acceptable'; }
  else if (bg === 'Rakshasa' && gg === 'Rakshasa') { pass = null;  grade = 'Conditional'; note = 'Rakshasa + Rakshasa — acceptable only if same rasi'; }
  else { pass = false; grade = 'Dosha'; note = `${bg} + ${gg} — Gana mismatch, not acceptable`; }

  return { pass, grade, boyGana: bg, girlGana: gg, note };
}

function calcMahendra(boyNak, girlNak) {
  const count = starCount(girlNak, boyNak);
  const pass  = MAHENDRA_COUNTS.has(count);
  return {
    pass, count,
    grade: pass ? 'Agree' : 'Disagree',
    note: `Count ${count} — ${pass ? 'in auspicious set {4,7,10,13,16,19,22,25}' : 'not in auspicious set'}`,
  };
}

function calcStreeDeergha(boyNak, girlNak) {
  const count = starCount(girlNak, boyNak);
  let pass, grade, note;
  if (count >= 13)     { pass = true;  grade = 'Uttamam';    note = `Count ${count} ≥ 13 — excellent`; }
  else if (count >= 7) { pass = true;  grade = 'Madhyamam';  note = `Count ${count} = 7–12 — acceptable (marginal)`; }
  else                 { pass = false; grade = 'Fail';        note = `Count ${count} < 7 — wife's longevity/prosperity affected`; }
  return { pass, grade, count, note };
}

function calcYoni(boyNak, girlNak) {
  const relation = yoniRelation(boyNak, girlNak);
  const bYoni    = YONI[boyNak];
  const gYoni    = YONI[girlNak];
  let pass, grade, note;
  if (relation === 'same')   { pass = true;  grade = 'Uttamam'; note = `Same yoni (${bYoni}) — best`; }
  else if (relation === 'enemy') { pass = false; grade = 'Dosha'; note = `Enemy yoni pair (${yoniAnimal(boyNak)} ↔ ${yoniAnimal(girlNak)}) — Yoni Dosha`; }
  else { pass = true; grade = 'Madhyamam'; note = `Neutral yoni pair (${bYoni} / ${gYoni}) — acceptable`; }
  return { pass, grade, boyYoni: bYoni, girlYoni: gYoni, relation, note };
}

function calcRasi(boyRasi, girlRasi) {
  if (!boyRasi || !girlRasi) return { pass: null, grade: 'N/A', note: 'Rasi not provided' };
  const count = rasiCount(girlRasi, boyRasi);
  let pass, grade, note;
  if (count === 7)              { pass = true;  grade = 'Uttamam';    note = `Count ${count} — 7th house opposition, best`; }
  else if ([1,5,9].includes(count))  { pass = true;  grade = 'Ati Uttamam'; note = `Count ${count} — same or trine, very good`; }
  else if ([3,11].includes(count))   { pass = true;  grade = 'Uttamam';    note = `Count ${count} — good`; }
  else if ([4,10].includes(count))   { pass = true;  grade = 'Madhyamam';  note = `Count ${count} — moderate, acceptable in most traditions`; }
  else if ([2,12].includes(count))   { pass = null;  grade = 'Marginal';   note = `Count ${count} — poor but some exceptions exist`; }
  else if ([6,8].includes(count))    { pass = false; grade = 'Dosha';      note = `Count ${count} — Shashta-Ashtama Dosha, not recommended`; }
  else                               { pass = null;  grade = 'Unknown';    note = `Count ${count}`; }
  return { pass, grade, count, boyRasi: RASI_NAMES[boyRasi], girlRasi: RASI_NAMES[girlRasi], note };
}

function calcRasiAdhipati(boyRasi, girlRasi) {
  if (!boyRasi || !girlRasi) return { pass: null, grade: 'N/A', note: 'Rasi not provided' };
  const bLord = SIGN_LORDS[boyRasi];
  const gLord = SIGN_LORDS[girlRasi];
  if (bLord === gLord) return { pass: true, grade: 'Uttamam', boyLord: bLord, girlLord: gLord, note: 'Same lord — good' };
  const rel = planetRelation(bLord, gLord);
  let pass, grade, note;
  if (rel === 'mutual_friend') { pass = true;  grade = 'Uttamam';   note = `${bLord} and ${gLord} — mutual friends`; }
  else if (rel === 'one_friend')    { pass = true;  grade = 'Uttamam';   note = `${bLord} and ${gLord} — one friend + one neutral, good`; }
  else if (rel === 'both_neutral')  { pass = true;  grade = 'Madhyamam'; note = `${bLord} and ${gLord} — both neutral, acceptable`; }
  else if (rel === 'one_enemy')     { pass = false; grade = 'Poor';      note = `${bLord} and ${gLord} — one treats the other as enemy`; }
  else                              { pass = false; grade = 'Avoid';     note = `${bLord} and ${gLord} — mutual enemies or both enemies`; }
  return { pass, grade, boyLord: bLord, girlLord: gLord, relation: rel, note };
}

function calcVasya(boyRasi, girlRasi) {
  if (!boyRasi || !girlRasi) return { pass: null, grade: 'N/A', note: 'Rasi not provided' };
  const boyInGirlVasya  = (VASYA[girlRasi] || []).includes(boyRasi);
  const girlInBoyVasya  = (VASYA[boyRasi]  || []).includes(girlRasi);
  const pass = boyInGirlVasya || girlInBoyVasya;
  let note;
  if (boyInGirlVasya)  note = `${RASI_NAMES[boyRasi]} is vasya of ${RASI_NAMES[girlRasi]}`;
  else if (girlInBoyVasya) note = `${RASI_NAMES[girlRasi]} is vasya of ${RASI_NAMES[boyRasi]}`;
  else note = `Neither rasi is vasya of the other`;
  return { pass, grade: pass ? 'Agree' : 'Disagree', boyRasi: RASI_NAMES[boyRasi], girlRasi: RASI_NAMES[girlRasi], note };
}

function calcRajju(boyNak, girlNak) {
  const bRajju = rajjuOf(boyNak);
  const gRajju = rajjuOf(girlNak);

  if (bRajju === gRajju) {
    const effects = {
      Siro:'Husband\'s death', Kantha:'Wife\'s death',
      Nabhi:'Children\'s death / poverty', Kati:'Poverty and suffering',
      Paada:'Wandering, instability',
    };
    return {
      pass: false, grade: 'Dosha ⚠️',
      boyRajju: bRajju, girlRajju: gRajju,
      effect: effects[bRajju] || 'Adverse',
      note: `Both in ${bRajju} Rajju — Rajju Dosha: ${effects[bRajju]}. CRITICAL.`,
    };
  }
  return {
    pass: true, grade: 'Agree',
    boyRajju: bRajju, girlRajju: gRajju,
    note: `Different Rajju groups (${bRajju} ≠ ${gRajju}) — no Rajju Dosha`,
  };
}

function calcVedha(boyNak, girlNak, dinaPass, mahendraPass, streePass) {
  const paired = VEDHA_MAP.get(boyNak) === girlNak;

  if (!paired) {
    return { pass: true, grade: 'Agree', note: `No Vedha pair between ${NAKSHATRA_NAMES[boyNak]} and ${NAKSHATRA_NAMES[girlNak]}` };
  }

  // Exception: Vedha dosha waived if Dina, Mahendra, and Stree Deergha all agree
  if (dinaPass && mahendraPass && streePass) {
    return {
      pass: true, grade: 'Waived',
      note: `Vedha pair (${NAKSHATRA_NAMES[boyNak]} ↔ ${NAKSHATRA_NAMES[girlNak]}) but waived — Dina+Mahendra+Stree all agree`,
    };
  }

  return {
    pass: false, grade: 'Dosha ⚠️',
    note: `Vedha pair: ${NAKSHATRA_NAMES[boyNak]} ↔ ${NAKSHATRA_NAMES[girlNak]}. CRITICAL. Cannot be waived (Dina/Mahendra/Stree not all passing).`,
  };
}

function calcNadi(boyNak, girlNak) {
  const bNadi = NADI[boyNak];
  const gNadi = NADI[girlNak];
  if (bNadi === gNadi) {
    return { pass: false, grade: 'Dosha ⚠️', boyNadi: bNadi, girlNadi: gNadi, note: `Same Nadi (${bNadi}) — Nadi Dosha: serious health issues, possible infertility` };
  }
  return { pass: true, grade: 'Agree', boyNadi: bNadi, girlNadi: gNadi, note: `Different Nadi (${bNadi} ≠ ${gNadi}) — compatible` };
}

// ── Main calculation ──────────────────────────────────────────────────────

function calculate(boyNak, girlNak, boyRasi, girlRasi, boyGana, girlGana, system = 10) {
  const dina      = calcDina(boyNak, girlNak);
  const gana      = calcGana(boyNak, girlNak, boyGana, girlGana);
  const mahendra  = calcMahendra(boyNak, girlNak);
  const stree     = calcStreeDeergha(boyNak, girlNak);
  const yoni      = calcYoni(boyNak, girlNak);
  const rasi      = calcRasi(boyRasi, girlRasi);
  const adhipati  = calcRasiAdhipati(boyRasi, girlRasi);
  const vasya     = calcVasya(boyRasi, girlRasi);
  const rajju     = calcRajju(boyNak, girlNak);
  const vedha     = calcVedha(boyNak, girlNak, dina.pass, mahendra.pass, stree.pass);
  const nadi      = calcNadi(boyNak, girlNak);

  // Score: count clear passes out of 10 (Rajju and Vedha are pass/fail critical)
  const poruthams10 = [dina, gana, mahendra, stree, yoni, rasi, adhipati, vasya, rajju, vedha];
  const score10 = poruthams10.filter(p => p.pass === true).length;

  const criticalDoshas = [];
  if (!rajju.pass) criticalDoshas.push(`Rajju Dosha (${rajju.grade}) — ${rajju.effect || ''}`);
  if (!vedha.pass) criticalDoshas.push('Vedha Dosha');
  if (!nadi.pass)  criticalDoshas.push('Nadi Dosha');

  let verdict, verdictGrade;
  if (criticalDoshas.length > 0) {
    verdictGrade = 'Adhamam';
    verdict = `Not recommended — critical dosha(s) present: ${criticalDoshas.join('; ')}`;
  } else if (score10 >= 8) {
    verdictGrade = 'Uttamam';
    verdict = 'Excellent match — highly recommended';
  } else if (score10 >= 6) {
    verdictGrade = 'Madhyamam';
    verdict = 'Good match — recommended with minor issues';
  } else if (score10 >= 5) {
    verdictGrade = 'Acceptable';
    verdict = 'Minimum threshold — proceed with caution and remedies';
  } else {
    verdictGrade = 'Adhamam';
    verdict = 'Poor match — not recommended';
  }

  return {
    input: {
      boyNakshatra: NAKSHATRA_NAMES[boyNak], boyNakshatraNum: boyNak,
      girlNakshatra: NAKSHATRA_NAMES[girlNak], girlNakshatraNum: girlNak,
      boyRasi: boyRasi ? RASI_NAMES[boyRasi] : null, boyRasiNum: boyRasi || null,
      girlRasi: girlRasi ? RASI_NAMES[girlRasi] : null, girlRasiNum: girlRasi || null,
      system,
    },
    results: { dina, gana, mahendra, stree, yoni, rasi, adhipati, vasya, rajju, vedha, nadi },
    score: score10,
    outOf: 10,
    criticalDoshas,
    verdictGrade,
    verdict,
  };
}

// ── Output formatters ─────────────────────────────────────────────────────

function symbol(pass) {
  if (pass === true)  return '✅';
  if (pass === false) return '❌';
  return '⚠️';
}

function prettyPrint(result) {
  const { input, results: r, score, criticalDoshas, verdictGrade, verdict } = result;
  const hr = '─'.repeat(70);

  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          திருமண பொருத்தம் — THIRUMANA PORUTHAM                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  console.log(`  Boy  : ${input.boyNakshatra} (#${input.boyNakshatraNum})` + (input.boyRasi ? ` | Rasi: ${input.boyRasi}` : ''));
  console.log(`  Girl : ${input.girlNakshatra} (#${input.girlNakshatraNum})` + (input.girlRasi ? ` | Rasi: ${input.girlRasi}` : ''));
  console.log(`\n${hr}`);
  console.log(`  #   Porutham            Result   Grade           Notes`);
  console.log(`${hr}`);

  const rows = [
    ['1', 'Dina',           r.dina],
    ['2', 'Gana',           r.gana],
    ['3', 'Mahendra',       r.mahendra],
    ['4', 'Stree Deergha',  r.stree],
    ['5', 'Yoni',           r.yoni],
    ['6', 'Rasi',           r.rasi],
    ['7', 'Rasi Adhipati',  r.adhipati],
    ['8', 'Vasya',          r.vasya],
    ['9', 'Rajju ⚠️',      r.rajju],
    ['10','Vedha ⚠️',       r.vedha],
    ['11','Nadi',           r.nadi],
  ];

  for (const [num, name, data] of rows) {
    const sym   = symbol(data.pass);
    const grade = (data.grade || '').padEnd(16);
    const note  = data.note || '';
    console.log(`  ${num.padEnd(4)}${name.padEnd(20)}${sym}  ${grade} ${note}`);
  }

  console.log(`\n${hr}`);
  console.log(`  Score (10-porutham): ${score} / 10`);
  if (criticalDoshas.length > 0) {
    console.log(`  Critical Doshas    : ${criticalDoshas.join(', ')}`);
  } else {
    console.log(`  Critical Doshas    : None`);
  }
  const color = verdictGrade === 'Uttamam' ? '\x1b[32m' : verdictGrade === 'Adhamam' ? '\x1b[31m' : '\x1b[33m';
  console.log(`  Verdict            : ${color}${verdictGrade}\x1b[0m — ${verdict}`);
  console.log('');
}

// ── CLI ───────────────────────────────────────────────────────────────────

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
Thirumana Porutham Calculator
──────────────────────────────────────────────────────────────────────
Usage:
  node tools/match.js --boy-star 7 --girl-star 23 --boy-rasi 4 --girl-rasi 11
  node tools/match.js --boy-star "Punarvasu" --girl-star "Dhanishtha" \\
                      --boy-rasi "Cancer"   --girl-rasi "Aquarius"

Options:
  --boy-star    Boy's nakshatra  (1-27 or Tamil/Sanskrit/Sinhala name)
  --girl-star   Girl's nakshatra (1-27 or name)
  --boy-rasi    Boy's Moon sign  (1-12 or name) — needed for Rasi, Vasya, Adhipati
  --girl-rasi   Girl's Moon sign (1-12 or name)
  --boy-gana    Override gana    (Deva | Manushya | Rakshasa)
  --girl-gana   Override gana
  --system      8 | 10 | 20  (default: 10)
  --format      pretty (default) | json
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args['boy-star'] && !args['girl-star'])) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const boyNak  = resolveNakshatra(args['boy-star']);
  const girlNak = resolveNakshatra(args['girl-star']);

  if (!boyNak) {
    console.error(`Error: could not resolve boy's nakshatra from "${args['boy-star']}"`);
    process.exit(1);
  }
  if (!girlNak) {
    console.error(`Error: could not resolve girl's nakshatra from "${args['girl-star']}"`);
    process.exit(1);
  }

  const boyRasi  = resolveRasi(args['boy-rasi']);
  const girlRasi = resolveRasi(args['girl-rasi']);

  if (args['boy-rasi']  && !boyRasi)  process.stderr.write(`Warning: could not resolve boy's rasi "${args['boy-rasi']}" — Rasi/Vasya/Adhipati skipped\n`);
  if (args['girl-rasi'] && !girlRasi) process.stderr.write(`Warning: could not resolve girl's rasi "${args['girl-rasi']}" — Rasi/Vasya/Adhipati skipped\n`);

  const system = parseInt(args.system) || 10;
  const result = calculate(boyNak, girlNak, boyRasi, girlRasi, args['boy-gana'], args['girl-gana'], system);

  if (args.format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    prettyPrint(result);
  }
}

if (require.main === module) main();

module.exports = { calculate, resolveNakshatra, resolveRasi };
