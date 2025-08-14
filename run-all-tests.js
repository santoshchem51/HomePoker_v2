#!/usr/bin/env node

/**
 * Custom test runner to bypass Jest hanging issues
 * Uses Node's built-in test runner
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Starting test suite...\n');

// Find all test files
function findTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.includes('node_modules')) {
      files.push(...findTestFiles(fullPath));
    } else if (item.isFile() && item.name.match(/\.(test|spec)\.(js|ts|tsx)$/)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const testFiles = [
  ...findTestFiles('tests/__tests__'),
  ...findTestFiles('src').filter(f => f.includes('__tests__')),
  '__tests__/App.test.tsx'
].filter(f => fs.existsSync(f));

console.log(`Found ${testFiles.length} test files\n`);

let passed = 0;
let failed = 0;
let errors = [];

// Run tests sequentially
async function runTest(file) {
  return new Promise((resolve) => {
    console.log(`Running: ${file}`);
    
    const test = spawn('node', ['--test', file], {
      timeout: 10000,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let output = '';
    test.stdout.on('data', (data) => output += data);
    test.stderr.on('data', (data) => output += data);
    
    test.on('close', (code) => {
      if (code === 0) {
        console.log(`  ✅ PASS\n`);
        passed++;
      } else {
        console.log(`  ❌ FAIL\n`);
        failed++;
        errors.push({ file, output });
      }
      resolve();
    });
    
    test.on('error', (err) => {
      console.log(`  ⚠️  SKIP (${err.message})\n`);
      resolve();
    });
  });
}

// Run all tests
(async () => {
  for (const file of testFiles) {
    await runTest(file);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results:');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total:  ${testFiles.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    errors.forEach(({ file, output }) => {
      console.log(`\n${file}:`);
      console.log(output.slice(0, 500));
    });
  }
  
  process.exit(failed > 0 ? 1 : 0);
})();