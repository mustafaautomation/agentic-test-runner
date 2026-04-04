import { ValidationResult } from '../core/types';

const REQUIRED_IMPORTS = [
  { pattern: /import\s+\{[^}]*test[^}]*\}\s+from\s+['"]@playwright\/test['"]/, name: 'test import' },
  { pattern: /import\s+\{[^}]*expect[^}]*\}\s+from\s+['"]@playwright\/test['"]/, name: 'expect import' },
];

const STRUCTURE_CHECKS = [
  { pattern: /test\.describe\s*\(/, name: 'test.describe block' },
  { pattern: /test\s*\(/, name: 'test block' },
  { pattern: /async\s*\(\s*\{\s*page\s*\}/, name: 'page fixture destructuring' },
];

const ANTI_PATTERNS = [
  { pattern: /require\s*\(/, message: 'Uses require() instead of ES import' },
  { pattern: /page\.waitForTimeout\s*\(\s*\d{4,}/, message: 'Long hardcoded wait detected (use waitFor* instead)' },
  { pattern: /page\.\$\(/, message: 'Uses deprecated page.$() — use page.locator()' },
  { pattern: /page\.click\s*\(/, message: 'Uses deprecated page.click() — use locator.click()' },
];

export function validateSyntax(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required imports
  for (const check of REQUIRED_IMPORTS) {
    if (!check.pattern.test(code)) {
      errors.push(`Missing required ${check.name} from @playwright/test`);
    }
  }

  // Check test structure
  for (const check of STRUCTURE_CHECKS) {
    if (!check.pattern.test(code)) {
      warnings.push(`Missing ${check.name} — tests may not execute correctly`);
    }
  }

  // Check for anti-patterns
  for (const check of ANTI_PATTERNS) {
    if (check.pattern.test(code)) {
      warnings.push(check.message);
    }
  }

  // Check for await on async operations
  const asyncOps = code.match(/page\.\w+\(/g) || [];
  const awaitedOps = code.match(/await\s+page\.\w+\(/g) || [];
  if (asyncOps.length > awaitedOps.length) {
    warnings.push(`${asyncOps.length - awaitedOps.length} page operations may be missing await`);
  }

  // Check balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening vs ${closeBraces} closing`);
  }

  // Check balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} opening vs ${closeParens} closing`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
