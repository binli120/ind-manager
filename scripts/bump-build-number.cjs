#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const buildFilePath = path.join(process.cwd(), 'config', 'build-number.json');

if (!fs.existsSync(buildFilePath)) {
  console.error(`Build number file not found: ${buildFilePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(buildFilePath, 'utf8');
const parsed = JSON.parse(raw);
const currentBuild = parsed.buildNumber;

if (typeof currentBuild !== 'string') {
  console.error('Invalid build number file: "buildNumber" must be a string.');
  process.exit(1);
}

const match = currentBuild.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match) {
  console.error(`Invalid build format: ${currentBuild}. Expected format: major.minor.patch (e.g., 0.1.000).`);
  process.exit(1);
}

const [, major, minor, patch] = match;
const patchWidth = patch.length;
const nextPatchNumber = String(Number(patch) + 1).padStart(patchWidth, '0');
const nextBuild = `${major}.${minor}.${nextPatchNumber}`;

const updated = {
  ...parsed,
  buildNumber: nextBuild,
};

fs.writeFileSync(buildFilePath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
console.log(`Build number updated: ${currentBuild} -> ${nextBuild}`);
