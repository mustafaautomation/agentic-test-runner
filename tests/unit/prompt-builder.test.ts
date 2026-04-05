import { describe, it, expect } from 'vitest';
import { buildTestGenerationPrompt, buildSelfHealPrompt } from '../../src/core/prompt-builder';

describe('buildTestGenerationPrompt', () => {
  it('should include URL in prompt', () => {
    const prompt = buildTestGenerationPrompt({
      description: 'Login test',
      url: 'https://example.com/login',
      assertions: ['Page loads', 'Form is visible'],
    });
    expect(prompt).toContain('https://example.com/login');
  });

  it('should include all assertions', () => {
    const prompt = buildTestGenerationPrompt({
      description: 'Test',
      url: 'https://example.com',
      assertions: ['Assert A', 'Assert B', 'Assert C'],
    });
    expect(prompt).toContain('Assert A');
    expect(prompt).toContain('Assert B');
    expect(prompt).toContain('Assert C');
  });

  it('should request Playwright format', () => {
    const prompt = buildTestGenerationPrompt({
      description: 'Test',
      url: 'https://example.com',
      assertions: [],
    });
    expect(prompt).toContain('@playwright/test');
    expect(prompt).toContain('page.goto');
  });
});

describe('buildSelfHealPrompt', () => {
  it('should include original code and error', () => {
    const prompt = buildSelfHealPrompt('const x = 1;', 'TypeError: x is not a function');
    expect(prompt).toContain('const x = 1;');
    expect(prompt).toContain('TypeError: x is not a function');
  });
});
