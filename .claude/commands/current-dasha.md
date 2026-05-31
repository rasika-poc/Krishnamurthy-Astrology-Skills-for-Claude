---
description: Calculate and interpret Vimshottari Dasha periods using the jothisha-lib tool. Shows full dasha timeline, current Mahadasha/Bhukti/Antara with predictions.
argument-hint: [birth-date] [birth-time] [timezone] [city or lat,lon]
---

## Step 1: Collect Birth Data
Ask for: birth date (YYYY-MM-DD), time (HH:MM), timezone (±HH:MM), and birth place (for lat/lon).

## Step 2: Run the Tool
```bash
node /Users/rasika/Desktop/KrishnaMurthi/tools/chart.js \
  --date "YYYY-MM-DD" --time "HH:MM" --tz "+05:30" --lat LAT --lon LON
```
The Dasha section (with ◄ markers) shows the current period.

## Step 3: Interpret

You are a KP Jyotisha expert calculating Vimshottari Dasha periods. Determine the current dasha sequence and interpret what life areas are activated.

## Vimshottari Dasha System

The complete 120-year cycle starting from Moon's nakshatra at birth:

| Planet | Dasha Years | Order |
|--------|-------------|-------|
| Ketu   | 7           | 1     |
| Venus  | 20          | 2     |
| Sun    | 6           | 3     |
| Moon   | 10          | 4     |
| Mars   | 7           | 5     |
| Rahu   | 18          | 6     |
| Jupiter| 16          | 7     |
| Saturn | 19          | 8     |
| Mercury| 17          | 9     |

## Dasha Calculation Method

### Step 1: Find Moon's Nakshatra at Birth
- Need the Moon's sidereal position at birth
- Nakshatra = floor(Moon_longitude / 13.333) + 1
- The planet that rules this nakshatra determines the first dasha

### Step 2: Calculate Balance of First Dasha
The balance of the first dasha depends on how much of the nakshatra the Moon has already traversed:
- Remaining balance = (1 - (position_in_nakshatra / 13.333)) × dasha_years
- This fraction of the first dasha has already elapsed at birth

### Step 3: Sequence From Birth
After the first dasha's balance, the remaining dashas follow the fixed Vimshottari sequence in full.

### Step 4: Bhukti (Sub-Period) Calculation
Within each Mahadasha, the 9 Bhukti lords follow the same Vimshottari sequence starting from the Mahadasha lord:
- Bhukti duration = (Mahadasha_years × Bhukti_years) / 120 years

### Step 5: Antara (Sub-Sub-Period)
Within each Bhukti, the 9 Antara lords follow the same pattern:
- Antara duration = (Mahadasha_years × Bhukti_years × Antara_years) / (120 × 120) years

## How to Calculate

### If Birth Star (Nakshatra) is Known
Ask the user for:
1. Birth nakshatra
2. Date of birth (to calculate elapsed time)
3. How far into the nakshatra was Moon at birth (if known, for precision)

### If Only Birth Date is Known
Search online: "birth nakshatra for [birth date]" or use:
- mpanchang.com to find Moon's nakshatra on birth date
- Calculate elapsed dasha balance

### Example: Moon in Rohini (Moon's star) at birth
- First dasha: Moon dasha (10 years)
- If Moon is at 15° Rohini (middle of nakshatra), about half the Moon dasha is remaining
- Remaining Moon dasha ≈ 5 years from birth

## Dasha Interpretations (KP Framework)

For each current dasha/bhukti, analyze what houses each lord signifies in the natal chart. The events that manifest are those related to the houses signified by both the Mahadasha lord AND the Bhukti lord.

### General Planet Characteristics in Dasha
**Sun Dasha (6 years)**: Authority, father, government, career advancement, health of heart/bones, ego matters. Positive if Sun signifies 1,2,6,10,11.

**Moon Dasha (10 years)**: Mind, emotions, mother, home, public life, travel, liquids, change. Positive if Moon signifies favorable houses.

**Mars Dasha (7 years)**: Energy, siblings, property, accidents, surgery, courage, land, technical work. Can be intense period.

**Rahu Dasha (18 years)**: Foreign connections, unconventional paths, sudden changes, obsessions, technology, ambitions. Acts as its sign lord and conjunction partner.

**Jupiter Dasha (16 years)**: Wisdom, children, wealth, dharma, higher education, spirituality, expansion. Generally beneficial.

**Saturn Dasha (19 years)**: Discipline, karma, delays, service, hard work, chronic conditions, old age matters. Long-term gains through perseverance.

**Mercury Dasha (17 years)**: Communication, commerce, intellect, writing, cousins, short journeys, business. Analytical period.

**Ketu Dasha (7 years)**: Moksha, spirituality, isolation, past-life karma, sudden events, health issues. Mystical period.

**Venus Dasha (20 years)**: Relationships, luxury, arts, marriage, vehicles, pleasures, finance. Generally enjoyable if well-placed.

## Output Format

```
## Vimshottari Dasha Report

**Person**: [Name if provided]
**Birth Date**: [Date]
**Birth Nakshatra**: [Nakshatra] — Star Lord: [Planet]

---

### Dasha Sequence from Birth

| Dasha | Planet | Start Date | End Date | Years |
|-------|--------|------------|----------|-------|
| 1st   |        |            |          |       |
| 2nd   |        |            |          |       |
| ...   |        |            |          |       |

---

### Current Period (as of [today])

**Mahadasha**: [Planet] ([start] – [end])
**Bhukti**: [Planet] ([start] – [end])
**Antara**: [Planet] (approx [start] – [end])

---

### Upcoming Dasha Changes (Next 2 Years)
[List upcoming bhukti/mahadasha transitions with dates]

---

### Current Period Interpretation

**What This Period Activates**:
[Based on the houses signified by the current Mahadasha and Bhukti lords]

**Expected Life Areas**:
- Career: [assessment]
- Relationships: [assessment]
- Finance: [assessment]
- Health: [assessment]
- Spirituality: [assessment]

**Key Themes**: [2-3 main themes for current period]

**When to Expect Events**: [Based on Antara lords aligning with transit planets]

---

### Advice for Current Period
[Practical guidance based on current dasha energies]
```

## Notes
- For precise dasha calculations, birth time accuracy matters (determines exact Moon position in nakshatra)
- If birth time is unknown, give the nakshatra for noon and note that dasha balance may vary by up to a few months
- Always cross-reference with natal chart significators for specific predictions
- The Antara lord brings the specific event — both Mahadasha and Bhukti lords must also signify the relevant houses
