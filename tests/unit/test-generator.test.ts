import { describe, it, expect } from 'vitest';
import { TestGenerator, MockLLMClient } from '../../src/generators/test-generator';

describe('TestGenerator', () => {
  it('should generate a test from spec using mock LLM', async () => {
    const generator = new TestGenerator(new MockLLMClient());
    const result = await generator.generate({
      description: 'Homepage loads correctly',
      url: 'https://example.com',
      assertions: ['Page title visible', 'Body content present'],
    });

    expect(result.framework).toBe('playwright');
    expect(result.language).toBe('typescript');
    expect(result.code).toContain("@playwright/test");
    expect(result.code).toContain('example.com');
    expect(result.timestamp).toBeDefined();
  });

  it('should generate batch of tests', async () => {
    const generator = new TestGenerator(new MockLLMClient());
    const results = await generator.generateBatch([
      { description: 'Test A', url: 'https://a.com', assertions: [] },
      { description: 'Test B', url: 'https://b.com', assertions: [] },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].code).toContain('a.com');
    expect(results[1].code).toContain('b.com');
  });

  it('should clean markdown code fences from LLM output', async () => {
    const client = {
      async generate(): Promise<string> {
        return '```typescript\nconst x = 1;\n```';
      },
    };
    const generator = new TestGenerator(client);
    const result = await generator.generate({
      description: 'Test',
      url: 'https://example.com',
      assertions: [],
    });

    expect(result.code).not.toContain('```');
    expect(result.code).toBe('const x = 1;');
  });
});
