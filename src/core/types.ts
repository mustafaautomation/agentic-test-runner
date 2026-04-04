export interface TestSpec {
  description: string;
  url: string;
  assertions: string[];
  tags?: string[];
}

export interface GeneratedTest {
  spec: TestSpec;
  code: string;
  language: 'typescript' | 'javascript';
  framework: 'playwright';
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TestRunResult {
  spec: TestSpec;
  generatedCode: string;
  validation: ValidationResult;
  execution?: {
    passed: boolean;
    duration: number;
    error?: string;
    stdout?: string;
  };
}

export interface AgentConfig {
  llmProvider: 'anthropic' | 'openai' | 'local';
  apiKey?: string;
  model?: string;
  outputDir: string;
  dryRun: boolean;
}

export interface AgentReport {
  timestamp: string;
  specs: number;
  generated: number;
  valid: number;
  executed: number;
  passed: number;
  failed: number;
  results: TestRunResult[];
}

export const DEFAULT_CONFIG: AgentConfig = {
  llmProvider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  outputDir: '.atr/generated',
  dryRun: false,
};
