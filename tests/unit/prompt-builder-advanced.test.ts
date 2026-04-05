import { describe, it, expect } from 'vitest';
import { buildTestGenerationPrompt, buildSelfHealPrompt } from '../../src/core/prompt-builder';
import { TestSpec } from '../../src/core/types';

describe('buildTestGenerationPrompt', () => {
  it('should include URL in prompt', () => {
    const spec: TestSpec = {
      description: 'Test login',
      url: 'https://saucedemo.com',
      assertions: ['User can login'],
    };
    const prompt = buildTestGenerationPrompt(spec);
    expect(prompt).toContain('https://saucedemo.com');
  });

  it('should include all assertions', () => {
    const spec: TestSpec = {
      description: 'Test checkout',
      url: 'https://example.com',
      assertions: ['Cart has items', 'Total is correct', 'Confirmation shown'],
    };
    const prompt = buildTestGenerationPrompt(spec);
    expect(prompt).toContain('Cart has items');
    expect(prompt).toContain('Total is correct');
    expect(prompt).toContain('Confirmation shown');
  });

  it('should include description', () => {
    const spec: TestSpec = {
      description: 'Verify product filtering by category',
      url: 'https://shop.com',
      assertions: ['Products filtered'],
    };
    const prompt = buildTestGenerationPrompt(spec);
    expect(prompt).toContain('Verify product filtering by category');
  });

  it('should include Playwright-specific requirements', () => {
    const spec: TestSpec = { description: 'test', url: '/', assertions: ['works'] };
    const prompt = buildTestGenerationPrompt(spec);
    expect(prompt).toContain('@playwright/test');
    expect(prompt).toContain('test.describe');
    expect(prompt).toContain('page.goto');
    expect(prompt).toContain('await');
    expect(prompt).toContain('locator');
  });

  it('should request TypeScript output only', () => {
    const spec: TestSpec = { description: 'test', url: '/', assertions: ['works'] };
    const prompt = buildTestGenerationPrompt(spec);
    expect(prompt).toContain('.spec.ts');
    expect(prompt).toContain('ONLY');
  });

  it('should handle single assertion', () => {
    const spec: TestSpec = { description: 'simple', url: '/', assertions: ['Page loads'] };
    const prompt = buildTestGenerationPrompt(spec);
    expect(prompt).toContain('Page loads');
  });

  it('should handle many assertions', () => {
    const assertions = Array.from({ length: 10 }, (_, i) => `Assertion ${i + 1}`);
    const spec: TestSpec = { description: 'complex', url: '/', assertions };
    const prompt = buildTestGenerationPrompt(spec);
    assertions.forEach((a) => expect(prompt).toContain(a));
  });
});

describe('buildSelfHealPrompt', () => {
  it('should include original code', () => {
    const code = 'await page.locator("#missing").click();';
    const prompt = buildSelfHealPrompt(code, 'Element not found');
    expect(prompt).toContain(code);
  });

  it('should include error message', () => {
    const prompt = buildSelfHealPrompt('code', 'Timeout waiting for selector');
    expect(prompt).toContain('Timeout waiting for selector');
  });

  it('should request fixed code only', () => {
    const prompt = buildSelfHealPrompt('code', 'error');
    expect(prompt).toContain('ONLY');
    expect(prompt).toContain('fixed');
  });

  it('should suggest resilient selectors', () => {
    const prompt = buildSelfHealPrompt('code', 'element not found');
    expect(prompt).toContain('resilient selectors');
  });

  it('should request minimal changes', () => {
    const prompt = buildSelfHealPrompt('code', 'error');
    expect(prompt).toContain("don't rewrite");
  });
});
