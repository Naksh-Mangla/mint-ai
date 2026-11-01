#!/usr/bin/env node
/**
 * Mint AI: Headless E2E Test Suite Runner
 * 
 * Executes all 4 Tiers of automated tests directly in terminal via Node.js.
 * Reports pass/fail badges, summary statistics, and exit code.
 */

const { runAllTests } = require('./test-runner.js');

// ANSI Color helper functions for clean terminal styling
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  mint: '\x1b[38;2;0;229;153m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

async function main() {
  console.log('\n' + colors.mint + colors.bold + '╔════════════════════════════════════════════════════════════╗' + colors.reset);
  console.log(colors.mint + colors.bold + '║           MINT AI — AUTOMATED E2E TEST SUITE               ║' + colors.reset);
  console.log(colors.mint + colors.bold + '║   Tiers 1-4: Feature Coverage, Corner Cases & Scenarios   ║' + colors.reset);
  console.log(colors.mint + colors.bold + '╚════════════════════════════════════════════════════════════╝\n' + colors.reset);

  const startTime = Date.now();
  const summary = await runAllTests();
  const elapsed = Date.now() - startTime;

  // Group results by tier
  const tierGroups = {};
  summary.results.forEach(res => {
    if (!tierGroups[res.tier]) {
      tierGroups[res.tier] = { passed: 0, failed: 0, items: [] };
    }
    if (res.status === 'PASS') {
      tierGroups[res.tier].passed++;
    } else {
      tierGroups[res.tier].failed++;
    }
    tierGroups[res.tier].items.push(res);
  });

  // Display Tier Breakdown
  Object.keys(tierGroups).forEach(tierName => {
    const group = tierGroups[tierName];
    const badge = group.failed === 0 
      ? colors.green + colors.bold + '[ALL PASS]' + colors.reset 
      : colors.red + colors.bold + `[${group.failed} FAILED]` + colors.reset;

    console.log(`${colors.cyan + colors.bold}► ${tierName}${colors.reset} — ${badge} ${colors.dim}(${group.passed} passed, ${group.failed} failed)${colors.reset}`);
    
    // Print individual test assertions
    group.items.forEach(item => {
      if (item.status === 'PASS') {
        console.log(`   ${colors.green}✓${colors.reset} ${colors.gray}${item.message}${colors.reset}`);
      } else {
        console.log(`   ${colors.red}✗ ${colors.bold}${item.message}${colors.reset}`);
        if (item.details) {
          console.log(`     ${colors.red}${item.details}${colors.reset}`);
        }
      }
    });
    console.log('');
  });

  // Final Summary Banner
  console.log(colors.dim + '─'.repeat(64) + colors.reset);
  if (summary.failed === 0) {
    console.log(colors.green + colors.bold + `\n✨ ALL ${summary.total} ASSERTIONS PASSED CLEANLY (${elapsed}ms) ✨\n` + colors.reset);
    console.log(`- Tier 1 (Feature Coverage):       ${tierGroups['Tier 1: Feature Coverage']?.passed || 0} passed`);
    console.log(`- Tier 2 (Boundary & Corner Cases):${tierGroups['Tier 2: Boundary & Corner Cases']?.passed || 0} passed`);
    console.log(`- Tier 3 (Cross-Feature Pairwise): ${tierGroups['Tier 3: Cross-Feature Interactions']?.passed || 0} passed`);
    console.log(`- Tier 4 (Real-World Scenarios):   ${tierGroups['Tier 4: Real-World Scenarios']?.passed || 0} passed`);
    console.log(`- Total Assertions Verified:       ${summary.total}`);
    console.log(`- Zero Failures Encountered\n`);
    process.exit(0);
  } else {
    console.log(colors.red + colors.bold + `\n❌ TEST SUITE FAILED: ${summary.failed} of ${summary.total} assertions failed\n` + colors.reset);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(colors.red + colors.bold + 'FATAL EXCEPTION DURING TEST RUNNER:' + colors.reset, err);
  process.exit(1);
});
