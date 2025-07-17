#!/usr/bin/env node

/**
 * Script to find and optionally remove console.log statements
 * Run with: node scripts/remove-console-logs.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCLUDED_DIRS = ['node_modules', 'dist', '.git', 'build'];
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

let totalFound = 0;
const findings = [];

function findConsoleLogs(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        findConsoleLogs(filePath);
      }
    } else if (FILE_EXTENSIONS.includes(path.extname(file))) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('console.') && !line.includes('// eslint-disable') && !line.trim().startsWith('//')) {
          totalFound++;
          findings.push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  });
}

console.log('Searching for console statements...\n');
findConsoleLogs(path.join(path.dirname(__dirname), 'src'));

console.log(`Found ${totalFound} console statements:\n`);

// Group by file
const byFile = {};
findings.forEach(finding => {
  if (!byFile[finding.file]) {
    byFile[finding.file] = [];
  }
  byFile[finding.file].push(finding);
});

// Display findings
Object.entries(byFile).forEach(([file, items]) => {
  console.log(`\n${file}:`);
  items.forEach(item => {
    console.log(`  Line ${item.line}: ${item.content}`);
  });
});

console.log('\nTo fix these:');
console.log('1. Add: import { logger } from "@/utils/logger";');
console.log('2. Replace console.log with logger.log');
console.log('3. Replace console.error with logger.error');
console.log('4. Remove any logs that expose sensitive data');