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
