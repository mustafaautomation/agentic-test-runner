import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GeneratedTest, TestRunResult } from '../core/types';
import { validateSyntax } from '../validators/syntax-validator';

export class TestExecutor {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  async execute(test: GeneratedTest, dryRun = false): Promise<TestRunResult> {
    const validation = validateSyntax(test.code);

    const result: TestRunResult = {
      spec: test.spec,
      generatedCode: test.code,
      validation,
    };

    if (!validation.valid) {
      return result;
    }

    // Write test file
    const slug = test.spec.description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filePath = path.join(this.outputDir, `${slug}.spec.ts`);
    fs.writeFileSync(filePath, test.code, 'utf-8');

    if (dryRun) {
      result.execution = {
        passed: true,
        duration: 0,
        stdout: `[dry-run] Test written to ${filePath}`,
      };
      return result;
    }

    // Execute with Playwright
    const start = Date.now();
    try {
      const stdout = execSync(`npx playwright test "${filePath}" --reporter=line`, {
        encoding: 'utf-8',
        timeout: 60000,
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      result.execution = {
        passed: true,
        duration: Date.now() - start,
        stdout,
      };
    } catch (err) {
      const error = err as { stdout?: string; stderr?: string };
      result.execution = {
        passed: false,
        duration: Date.now() - start,
        error: error.stderr || error.stdout || 'Unknown execution error',
        stdout: error.stdout,
      };
    }

    return result;
  }

  async executeBatch(tests: GeneratedTest[], dryRun = false): Promise<TestRunResult[]> {
    const results: TestRunResult[] = [];
    for (const test of tests) {
      results.push(await this.execute(test, dryRun));
    }
    return results;
  }

  getOutputDir(): string {
    return this.outputDir;
  }
}
