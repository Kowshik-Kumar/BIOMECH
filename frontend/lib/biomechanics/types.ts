export type Point2D = {
  x: number;
  y: number;
};

export type PoseFrame = {
  left_shoulder: Point2D;
  right_shoulder: Point2D;
  right_elbow: Point2D;
  right_wrist: Point2D;
  left_hip: Point2D;
  right_hip: Point2D;
  neck: Point2D;
  right_knee: Point2D;
  left_foot: Point2D;
  right_foot: Point2D;
};

export type RuleSeverity = "low" | "medium" | "high";

export type RuleOutcome = {
  rule: string;
  value: number;
  expected: string;
  severity: RuleSeverity;
  message: string;
};

export type RuleContext = {
  frame: PoseFrame;
};

export type RuleDefinition = {
  name: string;
  severity: RuleSeverity;
  expected: string;
  evaluate: (context: RuleContext) => RuleOutcome | null;
};

export type AnalysisResult = {
  timestamp: string;
  exercise: string;
  errors: RuleOutcome[];
};

export type HistoryStore = {
  sessions: AnalysisResult[];
};
