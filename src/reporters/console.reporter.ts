import { AgentReport } from '../core/types';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

export function printReport(report: AgentReport): void {
  console.log();
  console.log(`${BOLD}${CYAN}Agentic Test Runner Report${RESET}`);
  console.log(`${DIM}${report.timestamp}${RESET}`);
  console.log();

  console.log(
    `  ${BOLD}Pipeline:${RESET}  ${report.specs} specs → ${report.generated} generated → ${report.valid} valid → ${report.executed} executed`,
  );
  console.log(
    `  ${BOLD}Results:${RESET}  ${GREEN}${report.passed} passed${RESET}  ${RED}${report.failed} failed${RESET}`,
  );
  console.log();

  for (const result of report.results) {
    const validIcon = result.validation.valid ? `${GREEN}✓` : `${RED}✗`;
    const execIcon = result.execution?.passed ? `${GREEN}✓` : result.execution ? `${RED}✗` : `${DIM}—`;

    console.log(
      `  ${validIcon}${RESET} ${BOLD}${result.spec.description}${RESET}`,
    );
    console.log(
      `    Validation: ${result.validation.valid ? `${GREEN}valid` : `${RED}${result.validation.errors.length} errors`}${RESET}  ` +
        `Execution: ${execIcon}${RESET}${result.execution?.duration ? ` ${DIM}${result.execution.duration}ms${RESET}` : ''}`,
    );

    for (const warn of result.validation.warnings) {
      console.log(`    ${YELLOW}⚠ ${warn}${RESET}`);
    }

    if (result.execution?.error) {
      const shortError = result.execution.error.split('\n')[0].substring(0, 100);
      console.log(`    ${RED}${shortError}${RESET}`);
    }
  }

  console.log();
}

export function buildReport(results: import('../core/types').TestRunResult[]): AgentReport {
  return {
    timestamp: new Date().toISOString(),
    specs: results.length,
    generated: results.length,
    valid: results.filter((r) => r.validation.valid).length,
    executed: results.filter((r) => r.execution).length,
    passed: results.filter((r) => r.execution?.passed).length,
    failed: results.filter((r) => r.execution && !r.execution.passed).length,
    results,
  };
}
