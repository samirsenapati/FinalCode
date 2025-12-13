/* eslint-disable no-console */

const { existsSync } = require('fs');
const { spawn } = require('child_process');

const hasBuild = existsSync('.next');

const isProd = process.env.NODE_ENV === 'production' || process.env.FINALCODE_FORCE_PROD === '1';

const cmd = 'node';

// If a production build exists and we are in prod mode -> next start
// Otherwise fallback to next dev (useful for local dev + this environment)
const args = hasBuild && isProd ? ['node_modules/next/dist/bin/next', 'start', '-p', process.env.PORT || '3000', '-H', process.env.HOST || '0.0.0.0'] : ['node_modules/next/dist/bin/next', 'dev', '-p', process.env.PORT || '3000', '-H', process.env.HOST || '0.0.0.0'];

console.log(`[FinalCode] Starting Next.js with: ${hasBuild && isProd ? 'next start' : 'next dev'} (PORT=${process.env.PORT || '3000'})`);

const child = spawn(cmd, args, { stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code ?? 0));
