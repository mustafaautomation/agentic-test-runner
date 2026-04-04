# Agentic Test Runner

[![CI](https://github.com/mustafaautomation/agentic-test-runner/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/agentic-test-runner/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

AI-powered test generation agent. Write test specs in natural language (JSON), and the agent generates, validates, and optionally executes Playwright tests. Pluggable LLM backend (Anthropic, OpenAI, or custom).

---

## How It Works

```
Test Specs (JSON) → LLM Prompt Builder → Code Generator → Syntax Validator → Test Executor
                                                                                    ↓
                                                                              Report (pass/fail)
```

1. **Spec** — Describe what to test in plain English (URL + assertions)
2. **Generate** — LLM converts spec into Playwright TypeScript code
3. **Validate** — Syntax checker ensures proper imports, structure, and no anti-patterns
4. **Execute** — Optionally runs the generated test with Playwright
5. **Self-heal** — If test fails, agent generates a fix prompt (loop)

---

## Quick Start

```bash
npm install agentic-test-runner

# Generate tests from a spec file (mock LLM for demo)
npx atr generate examples/saucedemo-specs.json --mock --dry-run

# Validate existing test files
npx atr validate tests/*.spec.ts
```

---

## Spec Format

```json
[
  {
    "description": "Login page loads and accepts credentials",
    "url": "https://www.saucedemo.com",
    "assertions": [
      "Login form is visible",
      "Username field accepts input",
      "Login button is clickable"
    ],
    "tags": ["smoke", "auth"]
  }
]
```

---

## Library API

### TestGenerator

```typescript
import { TestGenerator, MockLLMClient } from 'agentic-test-runner';

// Use any LLM client that implements { generate(prompt: string): Promise<string> }
const generator = new TestGenerator(new MockLLMClient());

const test = await generator.generate({
  description: 'Homepage loads',
  url: 'https://example.com',
  assertions: ['Title visible', 'Body present'],
});
// test.code → Playwright TypeScript
```

### Custom LLM Integration

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropicClient = {
  async generate(prompt: string): Promise<string> {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
};

const generator = new TestGenerator(anthropicClient);
```

### Syntax Validator

```typescript
import { validateSyntax } from 'agentic-test-runner';

const result = validateSyntax(playwrightCode);
// { valid: true/false, errors: [...], warnings: [...] }
```

Checks for:
- Required `@playwright/test` imports
- `test.describe` / `test` block structure
- `async ({ page })` fixture destructuring
- Anti-patterns (deprecated APIs, hardcoded waits, `require()`)
- Balanced braces/parentheses
- Missing `await` on async operations

---

## CLI Commands

| Command | Description |
|---|---|
| `atr generate <spec.json>` | Generate tests from spec file |
| `atr generate <spec.json> --dry-run` | Generate and validate only |
| `atr generate <spec.json> --mock` | Use mock LLM (no API key needed) |
| `atr validate <files...>` | Validate test files for best practices |

---

## Project Structure

```
agentic-test-runner/
├── src/
│   ├── core/
│   │   ├── types.ts             # TestSpec, GeneratedTest, AgentReport types
│   │   └── prompt-builder.ts    # LLM prompt templates (generate + self-heal)
│   ├── generators/
│   │   └── test-generator.ts    # LLMClient interface + MockLLMClient
│   ├── validators/
│   │   └── syntax-validator.ts  # Playwright code validation (7 checks)
│   ├── runners/
│   │   └── test-executor.ts     # Write + execute generated tests
│   ├── reporters/
│   │   └── console.reporter.ts  # Pipeline report with pass/fail
│   ├── cli.ts
│   └── index.ts
├── tests/unit/
│   ├── prompt-builder.test.ts   # 4 tests
│   ├── syntax-validator.test.ts # 7 tests
│   └── test-generator.test.ts   # 3 tests
├── examples/
│   └── saucedemo-specs.json     # 3 example test specs
└── .github/workflows/ci.yml
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│          Test Specs (JSON)              │
├─────────────────────────────────────────┤
│    Prompt Builder                        │
│    buildTestGenerationPrompt()           │
│    buildSelfHealPrompt()                 │
├─────────────────────────────────────────┤
│    LLM Client (pluggable)               │
│    Anthropic │ OpenAI │ Mock │ Custom    │
├─────────────────────────────────────────┤
│    Test Generator                        │
│    generate() │ generateBatch()          │
├─────────────────────────────────────────┤
│    Syntax Validator                      │
│    imports │ structure │ anti-patterns    │
├─────────────────────────────────────────┤
│    Test Executor                         │
│    write file │ npx playwright test      │
├─────────────────────────────────────────┤
│    Report                                │
│    specs → generated → valid → executed  │
└─────────────────────────────────────────┘
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
