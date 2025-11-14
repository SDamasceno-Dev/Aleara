#!/usr/bin/env node
/* eslint-disable no-console */
import fs from 'node:fs';
import url from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const envLocal = path.join(projectRoot, '.env.local');
const envFile = fs.existsSync(envLocal) ? envLocal : null;

// Load .env.local manually (Next.js loads it for the app, but this script runs before Next)
if (envFile) {
  const content = fs.readFileSync(envFile, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // Strip optional quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
} else {
  console.warn('[env] .env.local not found. Reading only from current process.env.');
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
let ok = true;

for (const key of required) {
  const val = process.env[key];
  if (!val || !String(val).trim()) {
    console.error(`[env] Missing required env var: ${key}`);
    ok = false;
  }
}

// Basic shape check for SUPABASE URL
try {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const u = new URL(raw);
  if (!u.host.endsWith('.supabase.co')) {
    console.error('[env] NEXT_PUBLIC_SUPABASE_URL must point to *.supabase.co');
    ok = false;
  }
} catch {
  console.error('[env] NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
  ok = false;
}

if (!ok) {
  console.error('[env] Fix the variables above and try again.');
  process.exit(1);
} else {
  console.log('[env] Environment looks good.');
}


