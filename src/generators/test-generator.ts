import { TestSpec, GeneratedTest } from '../core/types';
import { buildTestGenerationPrompt } from '../core/prompt-builder';

export interface LLMClient {
  generate(prompt: string): Promise<string>;
}

/**
 * Generates Playwright tests from natural language specs using an LLM.
 * The LLM client is injected — allowing Anthropic, OpenAI, or any provider.
 */
export class TestGenerator {
  private client: LLMClient;

  constructor(client: LLMClient) {
    this.client = client;
  }

  async generate(spec: TestSpec): Promise<GeneratedTest> {
    const prompt = buildTestGenerationPrompt(spec);
    const rawCode = await this.client.generate(prompt);
    const code = this.cleanCode(rawCode);

    return {
      spec,
      code,
      language: 'typescript',
      framework: 'playwright',
      timestamp: new Date().toISOString(),
    };
  }

  async generateBatch(specs: TestSpec[]): Promise<GeneratedTest[]> {
    const results: GeneratedTest[] = [];
    for (const spec of specs) {
      results.push(await this.generate(spec));
    }
    return results;
  }

  private cleanCode(raw: string): string {
    let code = raw.trim();

    // Remove markdown code fences if present
    if (code.startsWith('```')) {
      const lines = code.split('\n');
      lines.shift(); // Remove opening ```typescript
      if (lines[lines.length - 1]?.trim() === '```') {
        lines.pop(); // Remove closing ```
      }
      code = lines.join('\n');
    }

    return code.trim();
  }
}

/**
 * Mock LLM client for testing and demos.
 * Returns a template Playwright test based on the spec.
 */
export class MockLLMClient implements LLMClient {
  async generate(prompt: string): Promise<string> {
    // Extract URL from prompt
    const urlMatch = prompt.match(/\*\*URL:\*\*\s*(.+)/);
    const url = urlMatch?.[1] || 'https://example.com';

    const descMatch = prompt.match(/\*\*Description:\*\*\s*(.+)/);
    const desc = descMatch?.[1] || 'Generated test';

    return `import { test, expect } from '@playwright/test';

test.describe('${desc}', () => {
  test('should load page and verify content', async ({ page }) => {
    await page.goto('${url}');
    await expect(page).toHaveURL(/.*${new URL(url).hostname.replace(/\./g, '\\.')}.*/);
    await expect(page.locator('body')).toBeVisible();
  });
});`;
  }
}
