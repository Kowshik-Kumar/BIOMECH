import type { AnalysisResult, PoseFrame, RuleDefinition, RuleOutcome } from "./types";

export function runRuleEngine(frame: PoseFrame, rules: RuleDefinition[]): RuleOutcome[] {
  const outcomes: RuleOutcome[] = [];

  for (const rule of rules) {
    const result = rule.evaluate({ frame });
    if (result) {
      outcomes.push(result);
    }
  }

  return outcomes;
}

export function createAnalysisSession(frame: PoseFrame, exercise: string, rules: RuleDefinition[]): AnalysisResult {
  return {
    timestamp: new Date().toISOString(),
    exercise,
    errors: runRuleEngine(frame, rules),
  };
}
