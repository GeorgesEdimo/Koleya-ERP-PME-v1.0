#!/usr/bin/env node

const SupervisorEngine = require('./engine');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Charger la config
const configPath = path.join(__dirname, 'config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

// CLI
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  const supervisor = new SupervisorEngine(config);

  if (command === 'validate') {
    const owner = args.find(a => a.startsWith('--owner='))?.split('=')[1];
    const repo = args.find(a => a.startsWith('--repo='))?.split('=')[1];
    const pr = parseInt(args.find(a => a.startsWith('--pr='))?.split('=')[1]);

    if (!owner || !repo || !pr) {
      console.error('Usage: node cli.js validate --owner=OWNER --repo=REPO --pr=NUMBER');
      process.exit(1);
    }

    console.log(`🤖 Superviseur: Validating PR #${pr} in ${owner}/${repo}`);

    try {
      await supervisor.validatePR(owner, repo, pr);
      console.log('✅ Validation completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  } else {
    console.error('Unknown command:', command);
    console.log('Available commands:');
    console.log('  validate --owner=OWNER --repo=REPO --pr=NUMBER');
    process.exit(1);
  }
}

main();
