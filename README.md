# KP Jyotisha — Krishnamurti Paddhati Astrology Skillset

A Claude Code skillset for Krishnamurti Paddhati (KP) Vedic astrology, Tamil/Sinhala matchmaking (Thirumana Porutham), and planetary transit analysis. Powered by a local calculation engine — no external websites required.

---

## Installation

### Prerequisites

- [Claude Code](https://claude.ai/code) installed
- [Node.js](https://nodejs.org/) v18 or later

### Quick Install

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/kp-jyotisha.git
cd kp-jyotisha

# 2. Install dependencies
npm install

# 3. Install skills globally into Claude Code
node install.js
```

`install.js` does two things:
- Copies the 4 skill command files into `~/.claude/commands/`
- Registers the MCP server in `~/.claude/settings.json`

**Restart Claude Code** after running the installer. The skills will be available in every session.

### Verify Installation

Open Claude Code and type `/read-chart` — you should see the skill prompt appear.

To uninstall:
```bash
node install.js --remove
```

---

## Using Within This Project Directory

If you open Claude Code directly in this folder, the skills work automatically — no install step needed. The `.claude/commands/` and `.claude/settings.json` files are picked up by Claude Code from the project directory.

The only requirement is `npm install` to have the calculation library available.

---

## Skills

### `/read-chart` — Full KP Life Reading

Generates a birth chart and delivers a complete reading:
- Rashi (D1) and Navamsha (D9) chart layout
- Full house map with correct house numbers (auto-converted from the lagna)
- Personality analysis and natural talents
- Life story through Vimshottari Dasha periods
- Current transit analysis vs natal positions
- Future outlook with milestone predictions
- Matchmaking data (nakshatra, gana, nadi, rajju)
- **Bilingual output** — pass `--lang si` for Sinhala alongside English

**Usage:** `/read-chart` then provide name (optional), date, time, place

---

### `/current-sky` — Today's Planetary Positions

Shows where all 9 planets are right now in the sidereal zodiac:
- Sign placements with nakshatra details
- Transit house analysis relative to your natal lagna
- Sade Sati and Ashtama Sani check
- Major transit highlights (Saturn, Jupiter, Rahu/Ketu)
- Day lord and ruling planets

**Usage:** `/current-sky` or `/current-sky 2026-06-15`

---

### `/current-dasha` — Vimshottari Dasha Timeline

Calculates and interprets planetary periods from birth:
- Complete Mahadasha timeline from birth
- Current Mahadasha / Bhukti with exact dates
- Upcoming transitions (next 2 years)
- Life area predictions for the current period

**Usage:** `/current-dasha` then provide birth date, time, place

---

### `/match-making` — Tamil & Sinhala Marriage Compatibility

Calculates Thirumana Porutham compatibility:
- **8, 10, or 20 Porutham** systems
- Accepts Tamil, Sanskrit, or **Sinhala** nakshatra names
- Critical dosha checks: Rajju, Vedha, Nadi
- Overall verdict with traditional interpretation
- Pariharam (remedy) suggestions for doshas

**Usage:** `/match-making` then provide both birth details or nakshatra names directly

---

## Tools

The skills run a local Node.js calculation engine. You can also use it directly from the command line.

### `tools/chart.js` — Birth Chart Calculator

```bash
# Using zone auto-resolution (recommended — handles historical timezone changes)
node tools/chart.js --date "1995-02-13" --time "09:51" --zone lk --lat 6.68 --lon 80.40

# Using explicit ISO timestamp
node tools/chart.js --iso "1995-02-13T09:51:00+05:30" --lat 6.68 --lon 80.40

# JSON output
node tools/chart.js --date "1995-02-13" --time "09:51" --zone lk \
  --lat 6.68 --lon 80.40 --format json

# Bilingual Sinhala output
node tools/chart.js --date "1995-02-13" --time "09:51" --zone lk \
  --lat 6.68 --lon 80.40 --lang si
```

**Zone shorthands** (auto-resolves correct historical UTC offset):

| Shorthand | Country / Region |
|-----------|-----------------|
| `lk` | Sri Lanka |
| `in` | India |
| `uk` | UK (handles BST/GMT automatically) |
| `uae` | UAE / Dubai |
| `sg` | Singapore |
| `jp` | Japan |
| `us-eastern` | USA Eastern (handles EDT/EST) |
| `us-pacific` | USA Pacific (handles PDT/PST) |
| `au-sydney` | Australia/Sydney (handles AEDT/AEST) |

Full IANA names also accepted: `Asia/Colombo`, `Europe/London`, `America/New_York`, etc.

> **Why `--zone` matters:** Sri Lanka alone has had 8 timezone changes since 1880 (including offsets of +05:20, +06:00, and +06:30 at different periods). Using the wrong offset shifts the ascendant and invalidates the entire chart. `--zone lk` looks up the correct historical offset automatically from the IANA database.

### `tools/mcp-server.js` — MCP Server

Exposes chart calculation as a structured MCP tool so Claude can call it directly without shell commands.

```bash
npm run mcp
```

Registered automatically in `.claude/settings.json` when you run `install.js`.

---

## Technical Notes

### Calculation Engine
- Uses `@jothisha-apps/jothisha-lib` for Rashi (D1), Navamsha (D9), and Vimshottari Dasha calculation
- All positions are **sidereal (Nirayana)** — approximately 24° less than Western tropical
- Current Lahiri ayanamsa (2026): ~24°08'
- Rahu and Ketu are always 180° apart — the tool verifies this on every chart

### Library Limitations
The library provides sign-level planet placement and dasha data. The following require a Swiss Ephemeris backend (not included):
- Exact planet longitudes in degrees
- KP sub-lords per planet (requires exact longitude)
- Placidus house cusps
- KP Horary (1–249 number system)

For exact sub-lord analysis, supplement with an ephemeris source.

### House Number Output
The JSON output includes a `houseMap` field keyed directly by house number (1–12), already converted from the lagna sign. Use `houseMap` for all interpretation — never use `rashiChart` (which is keyed by zodiac sign number and causes house numbering mistakes).

---

## What is KP Jyotisha?

**Krishnamurti Paddhati (KP)** is a precise system of Vedic astrology developed by Prof. K.S. Krishnamurti in the 1960s:

- **Sub-Lord System**: 249 sub-divisions of the zodiac (27 nakshatras × 9 subs), providing surgical precision in predictions
- **Placidus Houses**: Unequal houses based on exact birth latitude
- **KP Ayanamsa**: Slightly different from Lahiri (~6 arc-minutes less)
- **Significator Hierarchy**: Four-level system — star-of-occupant > occupant > star-of-lord > lord
- **Event Prediction**: Yes/no answers for specific life events based on cuspal sub-lord analysis
- **Ruling Planets**: Real-time verification using 5 simultaneous planetary influences

## What is Thirumana Porutham?

Traditional Tamil marriage compatibility based on the birth nakshatra (Moon's star) of bride and groom. The 10 poruthams assess different dimensions of married life:

| Priority | Porutham | Governs |
|----------|----------|---------|
| ⚠️ Critical | Rajju | Spouse longevity |
| ⚠️ Critical | Vedha | Freedom from afflictions |
| ⚠️ Critical | Nadi | Health compatibility |
| High | Gana | Temperament match |
| High | Yoni | Physical compatibility |
| High | Dinam | Daily health & harmony |
| Medium | Rasi | Emotional bond |
| Medium | Rasi Adhipati | Planetary friendship |
| Lower | Mahendram | Children & wealth |
| Lower | Stree Deergham | Wife's prosperity |

Minimum: 5 out of 10 must agree. Rajju and Vedha must never fail.
