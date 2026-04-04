#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import { TestSpec } from './core/types';
import { TestGenerator, MockLLMClient } from './generators/test-generator';
import { TestExecutor } from './runners/test-executor';
import { printReport, buildReport } from './reporters/console.reporter';

const program = new Command();

program
  .name('atr')
  .description('AI-powered test generation agent')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate Playwright tests from a spec file')
  .argument('<specFile>', 'JSON file with test specifications')
  .option('-o, --output <dir>', 'Output directory for generated tests', '.atr/generated')
  .option('--dry-run', 'Generate and validate only, do not execute')
  .option('--mock', 'Use mock LLM (for demos without API key)')
  .action(async (specFile: string, options) => {
    if (!fs.existsSync(specFile)) {
      console.error(`Spec file not found: ${specFile}`);
      process.exit(1);
    }

    const specs: TestSpec[] = JSON.parse(fs.readFileSync(specFile, 'utf-8'));

    // Use mock client by default (real LLM requires API key setup)
    const client = new MockLLMClient();
    const generator = new TestGenerator(client);
    const executor = new TestExecutor(options.output);

    console.log(`Generating tests from ${specs.length} specs...`);

    const generated = await generator.generateBatch(specs);
    const results = await executor.executeBatch(generated, options.dryRun ?? true);

    const report = buildReport(results);
    printReport(report);

    if (report.failed > 0) {
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate existing test files for Playwright best practices')
  .argument('<files...>', 'Test files to validate')
  .action((files: string[]) => {
    const { validateSyntax } = require('./validators/syntax-validator');
    let hasErrors = false;

    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        continue;
      }

      const code = fs.readFileSync(file, 'utf-8');
      const result = validateSyntax(code);

      const icon = result.valid ? '\x1b[32m✓' : '\x1b[31m✗';
      console.log(`${icon}\x1b[0m ${file}`);

      for (const err of result.errors) {
        console.log(`  \x1b[31m✗ ${err}\x1b[0m`);
        hasErrors = true;
      }
      for (const warn of result.warnings) {
        console.log(`  \x1b[33m⚠ ${warn}\x1b[0m`);
      }
    }

    if (hasErrors) process.exit(1);
  });

program.parse();
