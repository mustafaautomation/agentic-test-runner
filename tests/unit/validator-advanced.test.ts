import { describe, it, expect } from 'vitest';
import { validateSyntax } from '../../src/validators/syntax-validator';

const VALID_TEST = `
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('https://example.com');
    await page.locator('#username').fill('user');
    await page.locator('#password').fill('pass');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.dashboard')).toBeVisible();
  });
});
`;

describe('validateSyntax — valid code', () => {
  it('should pass for well-formed Playwright test', () => {
    const result = validateSyntax(VALID_TEST);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass with getByRole locators', () => {
    const code = `
import { test, expect } from '@playwright/test';
test.describe('A', () => {
  test('b', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});`;
    const result = validateSyntax(code);
    expect(result.valid).toBe(true);
  });
});

describe('validateSyntax — missing imports', () => {
  it('should error when test import is missing', () => {
    const code = `
import { expect } from '@playwright/test';
test.describe('A', () => { test('b', async ({ page }) => {}); });`;
    const result = validateSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('test import'))).toBe(true);
  });

  it('should error when expect import is missing', () => {
    const code = `
import { test } from '@playwright/test';
test.describe('A', () => { test('b', async ({ page }) => {}); });`;
    const result = validateSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('expect import'))).toBe(true);
  });

  it('should error when no imports at all', () => {
    const code = `test('broken', async ({ page }) => { await page.goto('/'); });`;
    const result = validateSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateSyntax — anti-patterns', () => {
  it('should warn on require()', () => {
    const code = VALID_TEST.replace(
      "import { test, expect } from '@playwright/test';",
      "import { test, expect } from '@playwright/test';\nconst fs = require('fs');",
    );
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('require()'))).toBe(true);
  });

  it('should warn on long hardcoded waits', () => {
    const code = VALID_TEST + '\nawait page.waitForTimeout(5000);';
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('hardcoded wait'))).toBe(true);
  });

  it('should warn on deprecated page.$()', () => {
    const code = VALID_TEST + "\nawait page.$('.old-selector');";
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('page.$()'))).toBe(true);
  });

  it('should warn on deprecated page.click()', () => {
    const code = VALID_TEST + "\nawait page.click('#button');";
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('page.click()'))).toBe(true);
  });

  it('should not warn on short waits', () => {
    const code = VALID_TEST + '\nawait page.waitForTimeout(500);';
    const result = validateSyntax(code);
    expect(result.warnings.every((w) => !w.includes('hardcoded wait'))).toBe(true);
  });
});

describe('validateSyntax — brace/paren balancing', () => {
  it('should error on unbalanced braces', () => {
    const code = `
import { test, expect } from '@playwright/test';
test.describe('A', () => {
  test('b', async ({ page }) => {
    await page.goto('/');
  });
`; // missing closing brace
    const result = validateSyntax(code);
    expect(result.errors.some((e) => e.includes('braces'))).toBe(true);
  });

  it('should error on unbalanced parentheses', () => {
    const code = `
import { test, expect } from '@playwright/test';
test.describe('A', () => {
  test('b', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.x').toBeVisible();
  });
});`;
    const result = validateSyntax(code);
    expect(result.errors.some((e) => e.includes('parentheses'))).toBe(true);
  });
});

describe('validateSyntax — structure warnings', () => {
  it('should warn when test.describe is missing', () => {
    const code = `
import { test, expect } from '@playwright/test';
test('standalone', async ({ page }) => {
  await page.goto('/');
});`;
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('test.describe'))).toBe(true);
  });

  it('should warn when page fixture destructuring is missing', () => {
    const code = `
import { test, expect } from '@playwright/test';
test.describe('A', () => {
  test('b', async () => {
    // no page
  });
});`;
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('page fixture'))).toBe(true);
  });
});

describe('validateSyntax — await detection', () => {
  it('should warn when page operations miss await', () => {
    const code = `
import { test, expect } from '@playwright/test';
test.describe('A', () => {
  test('b', async ({ page }) => {
    page.goto('/');
    page.locator('#btn').click();
  });
});`;
    const result = validateSyntax(code);
    expect(result.warnings.some((w) => w.includes('missing await'))).toBe(true);
  });
});
