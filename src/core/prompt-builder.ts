import { TestSpec } from './types';

export function buildTestGenerationPrompt(spec: TestSpec): string {
  const assertions = spec.assertions.map((a) => `  - ${a}`).join('\n');

  return `Generate a Playwright test in TypeScript for the following scenario.

## Test Specification
- **URL:** ${spec.url}
- **Description:** ${spec.description}
- **Assertions:**
${assertions}

## Requirements
1. Use \`@playwright/test\` imports (\`test\`, \`expect\`, \`Page\`)
2. Use \`test.describe\` and \`test\` blocks
3. Use \`page.goto()\` to navigate to the URL
4. Use Playwright locators (\`page.locator()\`, \`page.getByRole()\`, \`page.getByText()\`)
5. Use \`expect()\` assertions from Playwright
6. Add \`await\` for all async operations
7. Do NOT import external libraries beyond \`@playwright/test\`
8. Generate ONLY the test code — no markdown, no explanation

## Output Format
Return ONLY valid TypeScript code that can be saved as a \`.spec.ts\` file and executed with \`npx playwright test\`.`;
}

export function buildSelfHealPrompt(originalCode: string, error: string): string {
  return `The following Playwright test failed. Fix the test code to resolve the error.

## Original Test Code
\`\`\`typescript
${originalCode}
\`\`\`

## Error
\`\`\`
${error}
\`\`\`

## Requirements
1. Return ONLY the fixed TypeScript code
2. Keep the same test structure and assertions
3. Fix the specific error — don't rewrite unnecessarily
4. Use more resilient selectors if the issue is element not found

Return ONLY the fixed code — no markdown, no explanation.`;
}
