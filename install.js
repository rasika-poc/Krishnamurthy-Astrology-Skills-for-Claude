#!/usr/bin/env node
/**
 * KP Jyotisha — Global Installer
 *
 * Copies skill commands into ~/.claude/commands/ and registers the MCP
 * server in ~/.claude/settings.json so the skills are available in every
 * Claude Code session, not just when you open this directory.
 *
 * Usage:
 *   node install.js           — install globally
 *   node install.js --remove  — uninstall
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PLUGIN_DIR   = __dirname;
const CLAUDE_DIR   = path.join(os.homedir(), '.claude');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

const SKILL_NAMES = ['read-chart', 'current-sky', 'current-dasha', 'match-making'];
const MCP_KEY     = 'kp-jyotisha';

// ── helpers ─────────────────────────────────────────────────────────────────

function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch { return {}; }
}

function saveSettings(settings) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n');
}

function ok(msg)   { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function info(msg) { console.log(`  \x1b[2m${msg}\x1b[0m`); }
function warn(msg) { console.log(`  \x1b[33m!\x1b[0m ${msg}`); }

// ── install ──────────────────────────────────────────────────────────────────

function install() {
  console.log('\nInstalling KP Jyotisha skills into Claude Code…\n');

  // 1. Copy command files to ~/.claude/commands/
  fs.mkdirSync(COMMANDS_DIR, { recursive: true });
  const srcDir = path.join(PLUGIN_DIR, '.claude', 'commands');

  for (const name of SKILL_NAMES) {
    const src  = path.join(srcDir, `${name}.md`);
    const dest = path.join(COMMANDS_DIR, `${name}.md`);
    if (!fs.existsSync(src)) { warn(`${name}.md not found — skipping`); continue; }
    fs.copyFileSync(src, dest);
    ok(`/${name}`);
  }

  // 2. Register MCP server in ~/.claude/settings.json
  const settings = loadSettings();
  settings.mcpServers = settings.mcpServers || {};
  settings.mcpServers[MCP_KEY] = {
    command: 'node',
    args:    [path.join(PLUGIN_DIR, 'tools', 'mcp-server.js')],
  };
  saveSettings(settings);
  ok(`MCP server registered in ~/.claude/settings.json`);
  info(`  → ${path.join(PLUGIN_DIR, 'tools', 'mcp-server.js')}`);

  console.log('\n\x1b[1mDone.\x1b[0m Restart Claude Code, then try:\n');
  console.log('  /read-chart     — generate a KP birth chart');
  console.log('  /current-sky    — today\'s planetary positions');
  console.log('  /current-dasha  — Vimshottari Dasha timeline');
  console.log('  /match-making   — Tamil/Sinhala marriage compatibility\n');
}

// ── uninstall ────────────────────────────────────────────────────────────────

function uninstall() {
  console.log('\nRemoving KP Jyotisha skills from Claude Code…\n');

  for (const name of SKILL_NAMES) {
    const dest = path.join(COMMANDS_DIR, `${name}.md`);
    if (fs.existsSync(dest)) { fs.unlinkSync(dest); ok(`/${name} removed`); }
    else { info(`/${name} not found — skipping`); }
  }

  const settings = loadSettings();
  if (settings.mcpServers && settings.mcpServers[MCP_KEY]) {
    delete settings.mcpServers[MCP_KEY];
    if (Object.keys(settings.mcpServers).length === 0) delete settings.mcpServers;
    saveSettings(settings);
    ok(`MCP server removed from ~/.claude/settings.json`);
  } else {
    info(`MCP server entry not found — skipping`);
  }

  console.log('\nDone. Restart Claude Code to apply changes.\n');
}

// ── main ─────────────────────────────────────────────────────────────────────

if (process.argv.includes('--remove')) {
  uninstall();
} else {
  install();
}
