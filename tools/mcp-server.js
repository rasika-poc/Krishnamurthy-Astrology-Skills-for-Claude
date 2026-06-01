#!/usr/bin/env node
/**
 * KP Jyotisha MCP Server
 *
 * Exposes birth chart calculation as an MCP tool over stdio (JSON-RPC 2.0).
 * Configure in .claude/settings.json:
 *
 *   "mcpServers": {
 *     "kp-jyotisha": {
 *       "command": "node",
 *       "args": ["tools/mcp-server.js"]
 *     }
 *   }
 */

'use strict';

const readline = require('readline');
const { generateAstroChartFromISO } = require('@jothisha-apps/jothisha-lib');
const { buildChartJSON, resolveOffset, resolveZoneAlias } = require('./kp-lib');
const { calculate: calculatePorutham, resolveNakshatra, resolveRasi } = require('./match');
const { buildSky } = require('./sky');

// ── Tool schema ────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'calculate_birth_chart',
    description:
      'Generate a KP Jyotisha birth chart: Rashi (D1) and Navamsha (D9) planet ' +
      'placement, complete Vimshottari Dasha timeline, and derived Janma Nakshatra ' +
      'with matchmaking attributes (Gana, Nadi, Yoni, Rajju).',
    inputSchema: {
      type: 'object',
      properties: {
        iso: {
          type: 'string',
          description: 'ISO 8601 birth datetime with timezone offset (e.g. "1990-05-15T06:30:00+05:30"). Provide this OR date+time+zone.',
        },
        date: {
          type: 'string',
          description: 'Birth date YYYY-MM-DD. Use with time and zone instead of iso.',
        },
        time: {
          type: 'string',
          description: 'Birth time HH:MM (24h local time). Use with date and zone.',
        },
        zone: {
          type: 'string',
          description: 'IANA timezone name or shorthand (e.g. "lk", "Asia/Colombo", "uk", "us-eastern"). Auto-resolves the correct historical UTC offset for the birth date.',
        },
        lat: {
          type: 'number',
          description: 'Birth place latitude in decimal degrees (e.g. 6.9271 for Colombo).',
        },
        lon: {
          type: 'number',
          description: 'Birth place longitude in decimal degrees (e.g. 79.8612 for Colombo).',
        },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'current_sky',
    description:
      'Get current planetary positions in the sidereal zodiac. Returns all 9 planets with ' +
      'their current sign, sign lord, possible nakshatra range, Moon\'s exact nakshatra, ' +
      'day lord, and ruling planets. Optionally maps transit planets to natal houses.',
    inputSchema: {
      type: 'object',
      properties: {
        date:         { type: 'string', description: 'YYYY-MM-DD (default: today)' },
        time:         { type: 'string', description: 'HH:MM 24h local time (default: 12:00)' },
        zone:         { type: 'string', description: 'IANA zone or shorthand (lk, in, uk, us-eastern …)' },
        lat:          { type: 'number', description: 'Latitude decimal degrees' },
        lon:          { type: 'number', description: 'Longitude decimal degrees' },
        natal_lagna:  { type: 'number', description: 'Natal lagna sign 1-12 for transit house mapping' },
      },
      required: [],
    },
  },
  {
    name: 'calculate_porutham',
    description:
      'Calculate all 10 Thirumana Poruthams (Tamil/Sinhala marriage compatibility) ' +
      'for a boy and girl given their birth nakshatras and Moon signs. ' +
      'Accepts nakshatra names in Tamil, Sanskrit, or Sinhala. Returns score, ' +
      'individual porutham results, critical doshas, and verdict.',
    inputSchema: {
      type: 'object',
      properties: {
        boy_star:  { type: 'string', description: 'Boy\'s nakshatra — number 1-27 or name (Tamil/Sanskrit/Sinhala). e.g. "7", "Punarvasu", "பூசம்"' },
        girl_star: { type: 'string', description: 'Girl\'s nakshatra — number 1-27 or name.' },
        boy_rasi:  { type: 'string', description: 'Boy\'s Moon sign (rasi) — number 1-12 or name. e.g. "4", "Cancer", "කටක"' },
        girl_rasi: { type: 'string', description: 'Girl\'s Moon sign (rasi) — number 1-12 or name.' },
        system:    { type: 'number', description: 'Porutham system: 8, 10, or 20 (default 10).' },
      },
      required: ['boy_star', 'girl_star'],
    },
  },
];

// ── JSON-RPC helpers ───────────────────────────────────────────────────────

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function ok(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function err(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

// ── Request dispatcher ─────────────────────────────────────────────────────

function dispatch(msg) {
  const { method, id, params = {} } = msg;

  switch (method) {
    case 'initialize':
      ok(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'kp-jyotisha', version: '1.0.0' },
      });
      break;

    case 'initialized':
      break; // notification — no response required

    case 'tools/list':
      ok(id, { tools: TOOLS });
      break;

    case 'tools/call': {
      const { name, arguments: args = {} } = params;

      // ── current_sky ───────────────────────────────────────────────────
      if (name === 'current_sky') {
        const lat  = parseFloat(args.lat ?? '6.9271');
        const lon  = parseFloat(args.lon ?? '79.8612');
        const date = args.date || new Date().toISOString().slice(0, 10);
        const time = args.time || '12:00';
        let tz = '+05:30';
        if (args.zone) {
          const ianaZone = resolveZoneAlias(args.zone) || args.zone;
          tz = resolveOffset(ianaZone, date, time);
        }
        const iso = `${date}T${time}:00${tz}`;
        const sky = buildSky(iso, lat, lon, args.natal_lagna ? parseInt(args.natal_lagna) : null);
        ok(id, { content: [{ type: 'text', text: JSON.stringify(sky, null, 2) }] });
        break;
      }

      // ── calculate_porutham ─────────────────────────────────────────────
      if (name === 'calculate_porutham') {
        const boyNak  = resolveNakshatra(args.boy_star);
        const girlNak = resolveNakshatra(args.girl_star);
        if (!boyNak)  { err(id, -32602, `Cannot resolve boy's nakshatra: "${args.boy_star}"`); break; }
        if (!girlNak) { err(id, -32602, `Cannot resolve girl's nakshatra: "${args.girl_star}"`); break; }
        const boyRasi  = args.boy_rasi  ? resolveRasi(args.boy_rasi)  : null;
        const girlRasi = args.girl_rasi ? resolveRasi(args.girl_rasi) : null;
        const result = calculatePorutham(boyNak, girlNak, boyRasi, girlRasi, null, null, args.system || 10);
        ok(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        break;
      }

      if (name !== 'calculate_birth_chart') {
        err(id, -32601, `Unknown tool: ${name}`);
        break;
      }

      const { lat, lon } = args;
      if (lat == null || lon == null) {
        err(id, -32602, 'Missing required parameters: lat, lon');
        break;
      }

      let isoTimestamp = args.iso;

      if (!isoTimestamp) {
        const { date, time, zone } = args;
        if (!date || !time || !zone) {
          err(id, -32602, 'Provide either iso, or date + time + zone');
          break;
        }
        const ianaZone = resolveZoneAlias(zone) || zone;
        const tz = resolveOffset(ianaZone, date, time);
        isoTimestamp = `${date}T${time}:00${tz}`;
      }

      const chart = generateAstroChartFromISO(isoTimestamp, parseFloat(lat), parseFloat(lon));
      const output = buildChartJSON(chart, isoTimestamp, parseFloat(lat), parseFloat(lon));
      ok(id, { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }] });
      break;
    }

    default:
      if (id != null) err(id, -32601, `Method not found: ${method}`);
  }
}

// ── Stdio loop ─────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  try {
    dispatch(msg);
  } catch (e) {
    err(msg.id ?? null, -32603, e.message);
  }
});

rl.on('close', () => process.exit(0));

process.stderr.write('[kp-jyotisha MCP] server started\n');
