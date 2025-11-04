#!/usr/bin/env node
/**
 * Python Detection Test Script
 * Tests if Python can be found and if dependencies are installed
 */

import { execSync } from 'child_process';

console.log('🔮 Celestia Arcana - Python Detection Test\n');

// Test Python executable detection
const candidates = [
  'python3',
  'python',
  '/usr/bin/python3',
  '/usr/local/bin/python3',
  '/bin/python3',
  '/opt/homebrew/bin/python3'
];

console.log('Testing Python executable candidates:');
let foundPython = null;

for (const cmd of candidates) {
  try {
    const result = execSync(`${cmd} --version`, {
      stdio: 'pipe',
      timeout: 5000
    });
    const version = result.toString().trim();
    console.log(`  ✅ ${cmd} - ${version}`);
    if (!foundPython) foundPython = cmd;
  } catch {
    console.log(`  ❌ ${cmd} - not found`);
  }
}

if (!foundPython) {
  console.log('\n❌ ERROR: Python not found!');
  console.log('\nPlease install Python 3.6+ from:');
  console.log('  - https://python.org (all platforms)');
  console.log('  - apt-get install python3 (Ubuntu/Debian)');
  console.log('  - brew install python3 (macOS)');
  process.exit(1);
}

console.log(`\n✅ Python found: ${foundPython}\n`);

// Test Python dependencies
console.log('Testing Python dependencies:');

const dependencies = [
  { name: 'openai', import: 'import openai; print(openai.__version__)' },
  { name: 'requests', import: 'import requests; print(requests.__version__)' }
];

let missingDeps = [];

for (const dep of dependencies) {
  try {
    const result = execSync(`${foundPython} -c "${dep.import}"`, {
      stdio: 'pipe',
      timeout: 5000
    });
    const version = result.toString().trim();
    console.log(`  ✅ ${dep.name} - v${version}`);
  } catch {
    console.log(`  ❌ ${dep.name} - not installed`);
    missingDeps.push(dep.name);
  }
}

if (missingDeps.length > 0) {
  console.log(`\n⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
  console.log('\nTo install, run:');
  console.log(`  pip3 install -r requirements.txt`);
  console.log('or:');
  console.log(`  ${foundPython} -m pip install -r requirements.txt`);
  process.exit(1);
}

console.log('\n✅ All Python dependencies are installed!');

// Test OpenAI API key
console.log('\nChecking OpenAI API key:');
try {
  const fs = await import('fs');
  const envContent = fs.readFileSync('.env', 'utf-8');
  if (envContent.includes('OPENAI_API_KEY=') && !envContent.includes('your_openai_api_key_here')) {
    console.log('  ✅ OpenAI API key is configured');
  } else {
    console.log('  ⚠️  OpenAI API key not set or using placeholder');
    console.log('     Add your key to .env file');
  }
} catch {
  console.log('  ⚠️  .env file not found');
  console.log('     Run: cp .env.example .env');
  console.log('     Then add your OPENAI_API_KEY');
}

console.log('\n🎉 Setup verification complete!');
console.log('\nYou can now run:');
console.log('  bun run dev\n');
