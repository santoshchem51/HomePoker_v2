/**
 * Settlement Types - Epic 3: Settlement Optimization
 * Story 3.1: Early Cash-out Calculator Implementation
 * 
 * TypeScript interfaces for settlement calculations and optimization
 */

export interface EarlyCashOutRequest {
  sessionId: string;
  playerId: string;
  currentChipCount: number;
  timestamp: Date;
}

export interface EarlyCashOutResult {
  playerId: string;
  playerName: string;
  
  // Financial breakdown
  currentChipValue: number;
  totalBuyIns: number;
  netPosition: number; // positive = owed money, negative = owes money
  
  // Settlement calculation
  settlementAmount: number; // amount player receives/pays
  settlementType: 'payment_to_player' | 'payment_from_player' | 'even';
  
  // Validation and metadata
  calculationTimestamp: Date;
  calculationDurationMs: number;
  bankBalanceBefore: number;
  bankBalanceAfter: number;
  isValid: boolean;
  validationMessages: string[];
}

export interface SettlementCalculation {
  sessionId: string;
  players: PlayerSettlement[];
  
  // Optimization results
  totalTransactions: number;
  optimizedTransactions: TransactionPlan[];
  optimizationSavings: number; // percentage reduction in transaction count
  
  // Validation
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  calculationTime: number; // milliseconds
  
  // Metadata
  calculatedAt: Date;
  calculationId: string;
}

export interface PlayerSettlement {
  playerId: string;
  playerName: string;
  totalBuyIns: number;
  totalCashOuts: number;
  currentChips: number;
  netPosition: number; // positive = receives money, negative = pays money
  isActive: boolean; // false if already cashed out
}

export interface TransactionPlan {
  id: string;
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
  description: string;
}

export interface SettlementValidation {
  isValid: boolean;
  errors: SettlementError[];
  warnings: SettlementWarning[];
  auditTrail: SettlementAuditEntry[];
}

export interface SettlementError {
  code: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  affectedPlayers: string[];
  suggestedFix?: string;
}

export interface SettlementWarning {
  code: string;
  message: string;
  affectedPlayers: string[];
  canProceed: boolean;
  severity?: 'low' | 'medium' | 'high';
  timestamp?: Date;
}

// Extended warning interfaces for Settlement Warning System - Story 3.3, Task 3
export interface SettlementWarningExtended {
  warningId: string;
  code: string;
  message: string;
  severity: WarningClassification;
  
  // Problem details
  affectedPlayers: string[];
  balanceDiscrepancy: number;
  adjustmentType: ManualAdjustmentType;
  originalValue: number;
  adjustedValue: number;
  
  // Detection details
  detectedAt: Date;
  detectionMethod: 'real_time' | 'validation' | 'manual_check';
  
  // Resolution
  canProceed: boolean;
  requiresApproval: boolean;
  autoCorrection?: SettlementCorrection;
  suggestedActions: string[];
  
  // Persistence
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionAction?: string;
}

export enum WarningClassification {
  CRITICAL = 'critical',
  MAJOR = 'major', 
  MINOR = 'minor'
}

export enum ManualAdjustmentType {
  CHIP_COUNT_ADJUSTMENT = 'chip_count_adjustment',
  BUY_IN_ADJUSTMENT = 'buy_in_adjustment',
  CASH_OUT_ADJUSTMENT = 'cash_out_adjustment',
  PLAYER_REMOVAL = 'player_removal',
  TRANSACTION_VOID = 'transaction_void',
  SETTLEMENT_OVERRIDE = 'settlement_override'
}

export interface SettlementCorrection {
  correctionId: string;
  type: 'automatic' | 'suggested' | 'manual';
  description: string;
  affectedPlayers: string[];
  corrections: PlayerCorrection[];
  estimatedImpact: number;
  isReversible: boolean;
}

export interface PlayerCorrection {
  playerId: string;
  playerName: string;
  field: 'chipCount' | 'buyIn' | 'cashOut';
  originalValue: number;
  suggestedValue: number;
  reason: string;
}

export interface WarningPersistence {
  warningId: string;
  sessionId: string;
  persistedAt: Date;
  warningData: SettlementWarningExtended;
  auditTrail: WarningAuditEntry[];
}

export interface WarningAuditEntry {
  timestamp: Date;
  action: 'created' | 'escalated' | 'resolved' | 'dismissed' | 'auto_corrected';
  performedBy: string;
  details: string;
  previousState?: any;
  newState?: any;
}

export interface RealTimeMonitoringState {
  sessionId: string;
  isMonitoring: boolean;
  lastCheckAt: Date;
  activeWarnings: SettlementWarningExtended[];
  balanceHistory: BalanceSnapshot[];
  adjustmentHistory: ManualAdjustmentRecord[];
}

export interface BalanceSnapshot {
  timestamp: Date;
  totalBuyIns: number;
  totalCashOuts: number;
  totalChipsInPlay: number;
  bankBalance: number;
  discrepancy: number;
  playerCount: number;
}

export interface ManualAdjustmentRecord {
  adjustmentId: string;
  timestamp: Date;
  playerId?: string;
  adjustmentType: ManualAdjustmentType;
  fieldChanged: string;
  previousValue: number;
  newValue: number;
  adjustedBy: string;
  reason?: string;
  balanceImpact: number;
}

export interface WarningSystemConfig {
  // Monitoring settings
  enableRealTimeMonitoring: boolean;
  monitoringIntervalMs: number;
  
  // Warning thresholds
  criticalBalanceThreshold: number; // Amount that triggers critical warning
  majorBalanceThreshold: number; // Amount that triggers major warning
  minorBalanceThreshold: number; // Amount that triggers minor warning
  
  // Auto-correction settings
  enableAutoCorrection: boolean;
  autoCorrectThreshold: number; // Max amount for automatic correction
  requireApprovalThreshold: number; // Amount requiring manual approval
  
  // Persistence settings
  persistWarnings: boolean;
  maxWarningHistory: number; // Number of warnings to keep in history
  auditTrailRetentionDays: number;
}

export interface SettlementAuditEntry {
  step: number;
  operation: string;
  input: Record<string, any>;
  output: Record<string, any>;
  timestamp: Date;
  validationCheck: boolean;
}

export interface BankBalance {
  totalBuyIns: number;
  totalCashOuts: number;
  totalChipsInPlay: number;
  availableForCashOut: number;
  isBalanced: boolean;
  discrepancy?: number;
}

export interface SettlementPerformanceMetrics {
  calculationStartTime: number;
  calculationEndTime: number;
  durationMs: number;
  playerCount: number;
  transactionCount: number;
  optimizationPercentage: number;
  memoryUsageMB: number;
  cacheHits: number;
  cacheMisses: number;
}

// Service configuration and options
export interface SettlementOptions {
  // Performance settings
  maxCalculationTimeMs: number; // default: 1000ms for early cash-out
  enableOptimization: boolean; // default: true
  enableCaching: boolean; // default: true
  
  // Precision settings  
  decimalPrecision: number; // default: 2
  roundingMode: 'round' | 'floor' | 'ceil'; // default: 'round'
  
  // Validation settings
  requireBalancedSettlement: boolean; // default: true
  allowNegativeBank: boolean; // default: false
  maxDiscrepancyAmount: number; // default: 0.01
  
  // Edge case handling
  handleFractionalCents: boolean; // default: true
  minimumTransactionAmount: number; // default: 0.01
  
  // Audit and logging
  enableAuditTrail: boolean; // default: true
  logPerformanceMetrics: boolean; // default: true
}

// Error codes for settlement operations
export enum SettlementErrorCode {
  // Calculation errors
  INSUFFICIENT_BANK_BALANCE = 'INSUFFICIENT_BANK_BALANCE',
  NEGATIVE_CHIP_COUNT = 'NEGATIVE_CHIP_COUNT',
  CALCULATION_TIMEOUT = 'CALCULATION_TIMEOUT',
  INVALID_PLAYER_STATE = 'INVALID_PLAYER_STATE',
  
  // Balance validation errors
  UNBALANCED_SETTLEMENT = 'UNBALANCED_SETTLEMENT',
  BANK_DISCREPANCY = 'BANK_DISCREPANCY',
  FRACTIONAL_CENT_ERROR = 'FRACTIONAL_CENT_ERROR',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  INVALID_SESSION_STATE = 'INVALID_SESSION_STATE',
  
  // Performance errors
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
}

// Settlement operation states
export enum SettlementStatus {
  PENDING = 'pending',
  CALCULATING = 'calculating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VALIDATED = 'validated',
  APPLIED = 'applied'
}

// New interfaces for Story 3.2 - Settlement Optimization Algorithm
export interface OptimizedSettlement {
  sessionId: string;
  optimizedPayments: PaymentPlan[];
  directPayments: PaymentPlan[];
  optimizationMetrics: {
    originalPaymentCount: number;
    optimizedPaymentCount: number;
    reductionPercentage: number;
    totalAmountSettled: number;
    processingTime: number;
  };
  isValid: boolean;
  validationErrors: string[];
  mathematicalProof: BalanceValidation;
}

export interface PaymentPlan {
  id?: string; // Optional unique identifier for tracking payments
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
  priority: number; // Larger amounts get higher priority
  description?: string; // Optional description of the payment
}

export interface BalanceValidation {
  totalDebits: number;
  totalCredits: number;
  netBalance: number; // Should equal 0.00 for valid settlements
  isBalanced: boolean;
  precision: number; // Decimal precision used
  validationTimestamp: Date;
  auditSteps: ValidationStep[];
}

export interface ValidationStep {
  stepNumber: number;
  description: string;
  expectedValue: number;
  actualValue: number;
  isValid: boolean;
  tolerance: number;
}

// Validation error codes for Story 3.3
export enum ValidationErrorCode {
  // Mathematical validation errors
  MATHEMATICAL_BALANCE_FAILED = 'MATHEMATICAL_BALANCE_FAILED',
  PLAYER_POSITION_MISMATCH = 'PLAYER_POSITION_MISMATCH',
  PRECISION_VALIDATION_FAILED = 'PRECISION_VALIDATION_FAILED',
  
  // Real-time validation errors
  REALTIME_VALIDATION_FAILED = 'REALTIME_VALIDATION_FAILED',
  BANK_BALANCE_INCONSISTENCY = 'BANK_BALANCE_INCONSISTENCY',
  
  // Validation engine errors
  VALIDATION_ENGINE_FAILED = 'VALIDATION_ENGINE_FAILED',
  VALIDATION_CACHE_ERROR = 'VALIDATION_CACHE_ERROR',
  
  // Performance validation warnings
  VALIDATION_TIMEOUT = 'VALIDATION_TIMEOUT',
  INSUFFICIENT_OPTIMIZATION_WARNING = 'INSUFFICIENT_OPTIMIZATION_WARNING'
}

// Enhanced error codes for optimization
export enum OptimizationErrorCode {
  // Optimization-specific errors
  OPTIMIZATION_TIMEOUT = 'OPTIMIZATION_TIMEOUT',
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
  INVALID_SETTLEMENT_PLAN = 'INVALID_SETTLEMENT_PLAN',
  INSUFFICIENT_REDUCTION = 'INSUFFICIENT_REDUCTION',
  MATHEMATICAL_INCONSISTENCY = 'MATHEMATICAL_INCONSISTENCY',
  
  // Performance errors
  ALGORITHM_TIMEOUT = 'ALGORITHM_TIMEOUT',
  COMPLEXITY_EXCEEDED = 'COMPLEXITY_EXCEEDED',
  MEMORY_OPTIMIZATION_FAILED = 'MEMORY_OPTIMIZATION_FAILED',
}

// New interfaces for Story 3.3, Task 2 - Advanced Mathematical Proof System
export interface MathematicalProof {
  settlementId: string;
  proofId: string;
  generatedAt: Date;
  
  // Mathematical verification
  calculationSteps: ProofStep[];
  balanceVerification: BalanceValidation;
  precisionAnalysis: PrecisionReport;
  
  // Algorithm verification
  alternativeAlgorithmResults: AlgorithmVerification[];
  
  // Export formats
  humanReadableSummary: string;
  technicalDetails: ProofDetail[];
  exportFormats: {
    pdf?: string; // base64 encoded PDF (optional)
    json: ProofData;
    text: string; // WhatsApp-friendly summary
  };
  
  // Verification
  checksum: string;
  signature: string;
  isValid: boolean;
}

export interface ProofStep {
  stepNumber: number;
  operation: string;
  description: string;
  inputs: Record<string, number>;
  calculation: string; // mathematical formula
  result: number;
  precision: number;
  verification: boolean;
  tolerance: number;
  roundingApplied?: RoundingDetails;
}

export interface PrecisionReport {
  originalPrecision: number;
  calculatedPrecision: number;
  roundingOperations: RoundingOperation[];
  precisionLoss: number;
  isWithinTolerance: boolean;
  fractionalCentIssues: FractionalCentIssue[];
}

export interface RoundingOperation {
  operation: string;
  originalValue: number;
  roundedValue: number;
  roundingMode: 'round' | 'floor' | 'ceil';
  precisionLoss: number;
  step: number;
}

export interface FractionalCentIssue {
  playerId: string;
  playerName: string;
  originalAmount: number;
  adjustedAmount: number;
  adjustmentReason: string;
}

export interface RoundingDetails {
  originalValue: number;
  roundedValue: number;
  roundingMode: string;
  precisionLoss: number;
}

export interface AlgorithmVerification {
  algorithmName: string;
  algorithmType: 'greedy' | 'direct' | 'minimal_transactions' | 'balanced_flow';
  paymentPlan: PaymentPlan[];
  transactionCount: number;
  totalAmount: number;
  isBalanced: boolean;
  balanceDiscrepancy: number;
  verificationResult: boolean;
}

export interface ProofDetail {
  section: string;
  title: string;
  content: string;
  formula?: string;
  calculation?: string;
  result?: number;
  verification?: boolean;
}

export interface ProofData {
  metadata: {
    proofId: string;
    settlementId: string;
    generatedAt: Date;
    version: string;
    enhancedFeatures?: string[];
    verificationCapabilities?: {
      canVerifyBalance: boolean;
      canReconstructSettlement: boolean;
      canValidateAlgorithms: boolean;
      canDetectTampering: boolean;
    };
  };
  playerPositions: PlayerProofData[];
  settlements: SettlementProofData[];
  balanceVerification: BalanceProofData;
  algorithmComparison: AlgorithmComparisonData;
  precisionAnalysis: PrecisionAnalysisData;
  verificationSuite?: {
    balanceTests: any[];
    algorithmTests: any[];
    precisionTests: any[];
    integrityTests: any[];
  };
  auditTrail?: {
    calculationSteps: any[];
    checkpoints: any[];
    dependencies: any[];
  };
}

export interface PlayerProofData {
  playerId: string;
  playerName: string;
  buyIns: number;
  cashOuts: number;
  currentChips: number;
  netPosition: number;
  settlementAmount: number;
  settlementType: 'receive' | 'pay' | 'even';
  verification: boolean;
}

export interface SettlementProofData {
  paymentId: string;
  fromPlayer: string;
  toPlayer: string;
  amount: number;
  calculation: string;
  verification: boolean;
}

export interface BalanceProofData {
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  isBalanced: boolean;
  tolerance: number;
  precision: number;
}

export interface AlgorithmComparisonData {
  primaryAlgorithm: AlgorithmVerification;
  alternativeAlgorithms: AlgorithmVerification[];
  consensusResult: boolean;
  discrepancies: string[];
}

export interface PrecisionAnalysisData {
  decimalPrecision: number;
  roundingMode: string;
  totalRoundingOperations: number;
  maxPrecisionLoss: number;
  fractionalCentCount: number;
  precisionWarnings: string[];
}

// Export format types for Story 3.3, Task 6
export type ExportFormat = 'pdf' | 'json' | 'text' | 'csv';

export interface ExportMetadata {
  exportId: string;
  proofId: string;
  format: ExportFormat;
  exportedAt: Date;
  fileName?: string;
  filePath?: string;
  fileSize: number;
  checksum: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  processingTime: number;
}

export interface ExportOptions {
  format: ExportFormat;
  includeSignature?: boolean;
  includeTimestamp?: boolean;
  compressionLevel?: 'none' | 'medium' | 'high';
  watermark?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  error?: string;
  metadata: ExportMetadata;
}

export interface ProofIntegrityResult {
  isValid: boolean;
  checksumValid: boolean;
  signatureValid: boolean;
  mathematicallySound: boolean;
  balanceValid: boolean;
  algorithmConsensus: boolean;
  timestampValid: boolean;
  verifiedAt: Date;
  verificationTime: number;
  warnings: string[];
  errors: string[];
}

// Duplicate removed - using ExportOperationMetrics defined later

export enum ProofExportFormat {
  JSON = 'json',
  PDF = 'pdf',
  TEXT = 'text',
  HUMAN_READABLE = 'human_readable'
}

export enum ProofAlgorithm {
  GREEDY_DEBT_REDUCTION = 'greedy_debt_reduction',
  DIRECT_SETTLEMENT = 'direct_settlement',
  MINIMAL_TRANSACTIONS = 'minimal_transactions',
  BALANCED_FLOW = 'balanced_flow'
}

// New interfaces for Story 3.3, Task 4 - Alternative Settlement Options Generator
export interface AlternativeSettlement {
  optionId: string;
  name: string;
  description: string;
  algorithmType: SettlementAlgorithmType;
  
  // Settlement plan
  paymentPlan: PaymentPlan[];
  transactionCount: number;
  totalAmountSettled: number;
  
  // Scoring metrics (1-10 scale)
  score: number;
  simplicity: number; // Based on transaction count and complexity
  fairness: number; // Based on balance distribution
  efficiency: number; // Based on optimization percentage
  userFriendliness: number; // Based on payment directions and amounts
  
  // Performance metrics
  calculationTime: number;
  optimizationPercentage: number;
  
  // Comparison data
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  
  // Validation
  isValid: boolean;
  validationResults: SettlementValidation;
  mathematicalProof?: MathematicalProof;
}

export interface SettlementComparison {
  comparisonId: string;
  sessionId: string;
  generatedAt: Date;
  
  // Available options
  alternatives: AlternativeSettlement[];
  recommendedOption: AlternativeSettlement;
  
  // Comparison matrix
  comparisonMatrix: ComparisonMetric[];
  
  // Summary
  summary: {
    transactionCountRange: { min: number; max: number; };
    optimizationRange: { min: number; max: number; };
    averageScore: number;
    totalOptionsGenerated: number;
  };
}

export interface ComparisonMetric {
  metricName: string;
  description: string;
  values: { [optionId: string]: number };
  weight: number; // For recommendation scoring
  displayFormat: 'percentage' | 'number' | 'time' | 'currency';
}

export enum SettlementAlgorithmType {
  GREEDY_DEBT_REDUCTION = 'greedy_debt_reduction',
  DIRECT_SETTLEMENT = 'direct_settlement',
  HUB_BASED = 'hub_based',
  BALANCED_FLOW = 'balanced_flow',
  MINIMAL_TRANSACTIONS = 'minimal_transactions',
  MANUAL_SETTLEMENT = 'manual_settlement'
}

export interface SettlementRecommendation {
  recommendedOptionId: string;
  confidence: number; // 0-1 scale
  reasoning: string[];
  alternativeConsiderations: string[];
  
  // Context-based factors
  playerCount: number;
  complexityLevel: 'low' | 'medium' | 'high';
  disputeRisk: 'low' | 'medium' | 'high';
  
  // User preferences (if known)
  preferredAlgorithm?: SettlementAlgorithmType;
  prioritizeSimplicity?: boolean;
  prioritizeOptimization?: boolean;
}

// Using ProofIntegrityResult defined earlier with more complete definition

export interface ExportOperationMetrics {
  exportId: string;
  format: ProofExportFormat;
  fileSize: number;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}

export interface ExportOptions {
  format: ProofExportFormat;
  includeMetadata?: boolean;
  compression?: boolean;
  outputPath?: string;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
  metadata?: ExportMetadata;
}

export interface ExportMetadata {
  exportId: string;
  createdAt: Date;
  format: ProofExportFormat;
  proofId: string;
  version: string;
}

export interface ManualSettlementOption {
  optionId: string;
  description: string;
  
  // Manual settlement approach
  settlementType: 'round_robin' | 'bank_settlement' | 'custom_grouping';
  groupings: PlayerGrouping[];
  
  // Instructions for manual execution
  instructions: SettlementInstruction[];
  
  // Verification
  expectedTransactionCount: number;
  manualVerificationSteps: string[];
}

export interface PlayerGrouping {
  groupId: string;
  groupName: string;
  playerIds: string[];
  settlementApproach: string;
  expectedTransactions: number;
}

export interface SettlementInstruction {
  stepNumber: number;
  instruction: string;
  involvedPlayers: string[];
  expectedAmount?: number;
  verificationNote: string;
}

// Algorithm-specific configuration
export interface AlgorithmConfiguration {
  algorithmType: SettlementAlgorithmType;
  parameters: Record<string, any>;
  enabled: boolean;
  priority: number; // For recommendation weighting
}

export interface SettlementGenerationOptions {
  // Algorithm selection
  enabledAlgorithms: SettlementAlgorithmType[];
  includeManualOption: boolean;
  
  // Scoring preferences
  priorityWeights: {
    simplicity: number;
    fairness: number;
    efficiency: number;
    userFriendliness: number;
  };
  
  // Generation limits
  maxAlternatives: number;
  timeoutMs: number;
  
  // Validation requirements
  requireMathematicalProof: boolean;
  minimumOptimizationThreshold: number; // Percentage
}

// Note: TypeScript interfaces cannot be exported in default objects
// All exports are named exports above