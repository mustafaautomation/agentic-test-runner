import { describe, it, expect } from 'vitest';
import { validateSyntax } from '../../src/validators/syntax-validator';

const VALID_TEST = `import { test, expect } from '@playwright/test';

test.describe('Example', () => {
  test('should load page', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveURL(/example/);
  });
});`;

describe('validateSyntax', () => {
  it('should pass valid Playwright test', () => {
    const result = validateSyntax(VALID_TEST);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when missing test import', () => {
    const code = `import { expect } from '@playwright/test';
test('x', async ({ page }) => {});`;
    const result = validateSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('test import'))).toBe(true);
  });

  it('should fail when missing expect import', () => {
    const code = `import { test } from '@playwright/test';
test.describe('x', () => { test('y', async ({ page }) => {}); });`;
    const result = validateSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('expect import'))).toBe(true);
  });

  it('should detect unbalanced braces', () => {
    const code = `import { test, expect } from '@playwright/test';
test.describe('x', () => {
  test('y', async ({ page }) => {
    await page.goto('https://example.com');
  });`;
    const result = validateSyntax(code);
    expect(result.errors.some((e) => e.includes('braces'))).toBe(true);
  });

  it('should warn about deprecated page.click', () => {
    const code = `import { test, expect } from '@playwright/test';
test.describe('x', () => {
  test('y', async ({ page }) => {
    await page.click('#button');
  });
});`;
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('page.click'))).toBe(true);
  });

  it('should warn about require()', () => {
    const code = `import { test, expect } from '@playwright/test';
const fs = require('fs');
test.describe('x', () => {
  test('y', async ({ page }) => {
    await page.goto('https://example.com');
  });
});`;
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('require'))).toBe(true);
  });

  it('should warn about hardcoded waits', () => {
    const code = `import { test, expect } from '@playwright/test';
test.describe('x', () => {
  test('y', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForTimeout(5000);
  });
});`;
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('hardcoded wait'))).toBe(true);
  });
});
