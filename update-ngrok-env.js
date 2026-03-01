#!/usr/bin/env node
/**
 * update-ngrok-env.js
 *
 * Automates local OAuth testing with rotating ngrok URLs:
 *  - Fetches current HTTPS ngrok tunnel from http://127.0.0.1:4040/api/tunnels
 *  - Updates login system/.env with PUBLIC_URL, GOOGLE/GITHUB callback URLs, ALLOWED_ORIGINS
 *  - Prints values you must set in the Gateway (PUBLIC_BASE_URL) and Provider consoles (Google/GitHub)
 *
 * Usage:
 *   1) Start ngrok:  ngrok http 2816
 *   2) Run:          node update-ngrok-env.js
 *   3) Restart Auth and Gateway. Update provider consoles with the printed callback URLs.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';
const workspaceRoot = path.resolve(__dirname);
const authEnvPath = path.join(workspaceRoot, 'login system', '.env');

function fetchNgrokHttpsUrl() {
  return new Promise((resolve, reject) => {
    http.get(NGROK_API, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tunnels = Array.isArray(json.tunnels) ? json.tunnels : [];
          const https = tunnels.find(t => typeof t.public_url === 'string' && t.public_url.startsWith('https://'));
          if (!https) return reject(new Error('No HTTPS ngrok tunnel found. Start with: ngrok http 2816'));
          const url = https.public_url.replace(/\/$/, '');
          resolve(url);
        } catch (e) {
          reject(new Error('Failed to parse ngrok API response'));
        }
      });
    }).on('error', (err) => reject(new Error('Cannot reach ngrok API at 127.0.0.1:4040')));
  });
}

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const map = new Map();
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  return { lines, map };
}

function renderEnv(origLines, updates) {
  const out = [];
  const seen = new Set();
  for (const line of origLines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && Object.prototype.hasOwnProperty.call(updates, m[1])) {
      out.push(`${m[1]}=${updates[m[1]]}`);
      seen.add(m[1]);
    } else {
      out.push(line);
    }
  }
  for (const [k, v] of Object.entries(updates)) {
    if (!seen.has(k)) out.push(`${k}=${v}`);
  }
  if (out.length === 0 || out[out.length - 1] !== '') out.push('');
  return out.join('\n');
}

(async () => {
  try {
    const origin = await fetchNgrokHttpsUrl();

    const updates = {
      PUBLIC_URL: origin,
      GOOGLE_CALLBACK_URL: `${origin}/auth/google/callback`,
      GITHUB_CALLBACK_URL: `${origin}/auth/github/callback`,
      ALLOWED_ORIGINS: origin
    };

    let original = '';
    if (fs.existsSync(authEnvPath)) {
      original = fs.readFileSync(authEnvPath, 'utf8');
    } else {
      console.log(`Creating .env at: ${authEnvPath}`);
    }

    const backupPath = authEnvPath + '.bak';
    if (original) fs.writeFileSync(backupPath, original, 'utf8');

    const { lines } = parseEnv(original);
    const nextEnv = renderEnv(lines, updates);
    fs.writeFileSync(authEnvPath, nextEnv, 'utf8');

    console.log('✅ Updated login system/.env from ngrok');
    console.log('   PUBLIC_URL              =', updates.PUBLIC_URL);
    console.log('   GOOGLE_CALLBACK_URL     =', updates.GOOGLE_CALLBACK_URL);
    console.log('   GITHUB_CALLBACK_URL     =', updates.GITHUB_CALLBACK_URL);
    console.log('   ALLOWED_ORIGINS         =', updates.ALLOWED_ORIGINS);

    console.log('\nNext steps:');
    console.log('1) Restart Auth service so .env is reloaded.');
    console.log('2) Start/Restart Gateway with env: PUBLIC_BASE_URL=', origin);
    console.log('3) Update provider consoles with callback URLs:');
    console.log('   - Google:  ', `${origin}/auth/google/callback`);
    console.log('   - GitHub:  ', `${origin}/auth/github/callback`);
    console.log('4) Open the ngrok URL on phone/laptop and test login.');
  } catch (e) {
    console.error('❌ Failed to update env from ngrok:', e.message);
    process.exit(1);
  }
})();
