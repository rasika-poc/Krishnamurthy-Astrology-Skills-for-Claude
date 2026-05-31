# KP Jyotisha — Krishnamurti Paddhati Astrology Skillset

A comprehensive Claude agent skillset for Krishnamurti Paddhati (KP) Vedic astrology, Tamil matchmaking (Thirumana Porutham), and planetary transit analysis.

## Skills Available

### `/read-chart` — KP Horoscope Reading
Read and interpret a full KP Jyotisha horoscope. Analyzes:
- Planetary positions with Nakshatra, Star Lord, Sub-Lord
- House cusps (Placidus) and cuspal sub-lords
- Four-level significator hierarchy (Level A/B/C/D)
- Current Vimshottari Dasha period
- Event predictions (marriage, career, finance, health, etc.)
- KP Horary support (1-249 number system)

**Usage**: `/read-chart DD/MM/YYYY HH:MM [place]`

---

### `/current-sky` — Today's Planetary Positions
Fetches live planetary positions and shows:
- All 9 planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) in sidereal zodiac
- Each planet's Nakshatra, Star Lord, Sub-Lord
- Today's Panchang (Tithi, Vara, Yoga, Karana)
- Ruling Planets for today
- Major transit effects (Saturn, Jupiter, Rahu/Ketu)
- Auspicious/inauspicious assessment

**Usage**: `/current-sky` or `/current-sky 2026-06-15`

---

### `/match-making` — Tamil Thirumana Porutham
Calculate marriage compatibility using traditional Tamil astrology:
- **8 Porutham**: Dinam, Ganam, Mahendram, Stree Deergham, Yoni, Rasi, Rajju, Vedha
- **10 Porutham**: Above + Rasi Adhipati, Vasya
- **20 Porutham**: Extended system with Nadi and all classical factors
- Dosha analysis (Rajju Dosha, Vedha Dosha, Nadi Dosha)
- Overall verdict with traditional Tamil astrologer perspective
- Pariharam (remedies) suggestions for doshas

**Usage**: `/match-making [boy-star] [girl-star]` or provide birth dates

---

### `/current-dasha` — Vimshottari Dasha Calculator
Calculate and interpret current planetary periods:
- Complete Dasha timeline from birth
- Current Mahadasha / Bhukti / Antara periods with dates
- Upcoming dasha transitions
- Life area predictions for current period
- Advice for navigating current planetary energies

**Usage**: `/current-dasha DD/MM/YYYY [nakshatra]`

---

## What is KP Jyotisha?

**Krishnamurti Paddhati (KP)** is a precise system of Vedic astrology developed by Prof. K.S. Krishnamurti in the 1960s. Key features:

- **Sub-Lord System**: Zodiac divided into 249 sub-divisions (27 nakshatras × 9 subs each), providing surgical precision in predictions
- **Placidus Houses**: Unequal houses based on exact birth latitude — planets can shift houses vs. traditional Vedic charts
- **KP Ayanamsa**: Slightly different from Lahiri (~6 arc-minutes less), shifts sub-lord positions
- **Significator Hierarchy**: Four-level system — star-of-occupant > occupant > star-of-lord > lord
- **Event Prediction**: Yes/no answers for specific life events based on cuspal sub-lord analysis
- **Ruling Planets**: Real-time verification tool using 5 simultaneous planetary influences

## What is Thirumana Porutham?

Traditional Tamil marriage compatibility system based on the **birth nakshatra** (Moon's star at birth) of bride and groom. The 10 poruthams (compatibility factors) assess different dimensions of married life:

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

Minimum: 5 out of 10 must agree. Rajju and Vedha must never be doshas.

## Technical Notes

- All planetary positions are **sidereal (Nirayana)** — subtract ~24° from Western tropical
- Current Lahiri ayanamsa (2026): approximately 24°08'
- Rahu and Ketu are always 180° apart; Ketu = Rahu + 180°
- This skillset uses online ephemeris sources for current positions
- For birth charts, uses KP chart calculators available at astrosage.com, vedicastro.com
