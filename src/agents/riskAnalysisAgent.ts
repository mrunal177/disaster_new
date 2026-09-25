import { Habitation, HazardType, PriorityWindow } from '../types';

/**
 * Analytic Hierarchy Process (AHP) criteria for multi-hazard weighting:
 * Order of criteria: [0: Flood, 1: Landslide, 2: Cyclone, 3: Cloudburst]
 */
export type AhpHazardCriteria = 'Flood' | 'Landslide' | 'Cyclone' | 'Cloudburst';

export const HAZARD_CRITERIA: AhpHazardCriteria[] = ['Flood', 'Landslide', 'Cyclone', 'Cloudburst'];

// Standard Saaty Random Consistency Index (RI) lookup table
export const RANDOM_INDEX_TABLE: Record<number, number> = {
  1: 0.00,
  2: 0.00,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41
};

/**
 * Default balanced pairwise comparison matrix for Himalayan multi-hazard sector:
 * Rows & Cols: [Flood, Landslide, Cyclone, Cloudburst]
 * - Flood is moderately more frequent than Cyclone (3) and slightly more than Landslide (1.5)
 * - Landslide is strongly more significant than Cyclone in mountain terrain (2)
 * - Cloudburst is a high-impact localized flash trigger
 */
export const DEFAULT_AHP_HAZARD_MATRIX: number[][] = [
  // Flood,  Landslide, Cyclone, Cloudburst
  [1.000,    1.500,     3.000,   1.200],   // Flood
  [0.667,    1.000,     2.500,   1.100],   // Landslide
  [0.333,    0.400,     1.000,   0.500],   // Cyclone
  [0.833,    0.909,     2.000,   1.000]    // Cloudburst
];

export interface NormalizedMatrixResult {
  normalizedMatrix: number[][];
  criteriaWeights: number[];
  columnSums: number[];
}

export interface ConsistencyRatioResult {
  lambdaMax: number;
  consistencyIndex: number;
  consistencyRatio: number;
  isConsistent: boolean;
}

export interface AhpEvaluationResult {
  isValid: boolean;
  consistencyRatio: number;
  consistencyIndex: number;
  lambdaMax: number;
  weights: Record<AhpHazardCriteria, number>;
  rejectionReason?: string;
}

export interface HabitationRiskAnalysisResult {
  habitationId: string;
  weightedHazardScore: number; // 0 - 100
  compositeRiskScore: number;  // 0 - 100
  dominantHazard: HazardType;
  priorityWindow: PriorityWindow;
  recommendedAction: string;
  ahpWeights: Record<AhpHazardCriteria, number>;
  consistencyRatio: number;
  subScores: {
    hazardExposure: number;
    historicalImpact: number;
    secondaryHazardsFactor: number;
    dynamicFeedImpact: number;
    accessRisk: number;
    populationExposure: number;
  };
}

/**
 * Normalizes a pairwise comparison matrix over hazard criteria (Flood, Landslide, Cyclone, Cloudburst).
 * 1. Computes the sum of each column.
 * 2. Divides each cell by its column sum to create the normalized matrix.
 * 3. Computes the principal priority weight vector by averaging each normalized row.
 */
export function normalizeHazardCriteriaMatrix(matrix: number[][]): NormalizedMatrixResult {
  const n = matrix.length;
  const columnSums = new Array<number>(n).fill(0);

  // 1. Compute column sums
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (matrix[i][j] <= 0) {
        throw new Error(`Pairwise comparison matrix values must be strictly positive (> 0). Invalid value at [${i}][${j}].`);
      }
      columnSums[j] += matrix[i][j];
    }
  }

  // 2. Normalize matrix & compute row averages (priority weights)
  const normalizedMatrix: number[][] = [];
  const criteriaWeights = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    normalizedMatrix[i] = new Array<number>(n);
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      const normalizedVal = matrix[i][j] / columnSums[j];
      normalizedMatrix[i][j] = normalizedVal;
      rowSum += normalizedVal;
    }
    criteriaWeights[i] = rowSum / n;
  }

  return {
    normalizedMatrix,
    criteriaWeights,
    columnSums
  };
}

/**
 * Verifies if the Consistency Ratio (CR) satisfies the Saaty threshold (CR < 0.10).
 * If CR < 0.10, the pairwise evaluations are mathematically consistent.
 */
export function verifyConsistencyRatio(cr: number, threshold = 0.10): boolean {
  return cr < threshold;
}

/**
 * Calculates the maximum eigenvalue (lambda_max), Consistency Index (CI),
 * and Consistency Ratio (CR) for a pairwise comparison matrix and its priority weights.
 */
export function calculateConsistencyRatio(
  matrix: number[][],
  criteriaWeights: number[]
): ConsistencyRatioResult {
  const n = matrix.length;

  // Compute lambda_max: (1/n) * sum_i( (A * w)_i / w_i )
  let lambdaMax = 0;
  for (let i = 0; i < n; i++) {
    let weightedRowSum = 0;
    for (let j = 0; j < n; j++) {
      weightedRowSum += matrix[i][j] * criteriaWeights[j];
    }
    lambdaMax += weightedRowSum / criteriaWeights[i];
  }
  lambdaMax = lambdaMax / n;

  // Consistency Index: CI = (lambda_max - n) / (n - 1)
  const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;

  // Random Consistency Index lookup
  const ri = RANDOM_INDEX_TABLE[n] || 0.90;

  // Consistency Ratio: CR = CI / RI
  const cr = ci / ri;

  return {
    lambdaMax,
    consistencyIndex: ci,
    consistencyRatio: cr,
    isConsistent: verifyConsistencyRatio(cr, 0.10)
  };
}

/**
 * Evaluates an AHP pairwise comparison matrix.
 * Normalizes the criteria matrix, verifies CR < 0.10, and returns the priority weights.
 * Rejects with isValid: false if CR >= 0.10 or if dimensions/values are invalid.
 */
export function evaluateAhpMatrix(matrix: number[][]): AhpEvaluationResult {
  const n = matrix.length;
  if (n !== 4) {
    return {
      isValid: false,
      consistencyRatio: 1.0,
      consistencyIndex: 1.0,
      lambdaMax: 0,
      weights: { Flood: 0.25, Landslide: 0.25, Cyclone: 0.25, Cloudburst: 0.25 },
      rejectionReason: `Hazard criteria matrix dimension must be 4x4, got ${n}x${n}`
    };
  }

  try {
    // 1. Normalize the hazard criteria matrix
    const { criteriaWeights } = normalizeHazardCriteriaMatrix(matrix);

    // 2. Calculate consistency metrics
    const { lambdaMax, consistencyIndex, consistencyRatio, isConsistent } = calculateConsistencyRatio(matrix, criteriaWeights);

    const weightsRecord: Record<AhpHazardCriteria, number> = {
      Flood: Number(criteriaWeights[0].toFixed(4)),
      Landslide: Number(criteriaWeights[1].toFixed(4)),
      Cyclone: Number(criteriaWeights[2].toFixed(4)),
      Cloudburst: Number(criteriaWeights[3].toFixed(4))
    };

    // 3. Verify consistency ratio (CR < 0.10)
    if (!isConsistent) {
      return {
        isValid: false,
        consistencyRatio: Number(consistencyRatio.toFixed(4)),
        consistencyIndex: Number(consistencyIndex.toFixed(4)),
        lambdaMax: Number(lambdaMax.toFixed(4)),
        weights: weightsRecord,
        rejectionReason: `AHP pairwise matrix failed consistency check: CR = ${consistencyRatio.toFixed(4)} (threshold: CR < 0.10). Inconsistent comparative judgments.`
      };
    }

    return {
      isValid: true,
      consistencyRatio: Number(consistencyRatio.toFixed(4)),
      consistencyIndex: Number(consistencyIndex.toFixed(4)),
      lambdaMax: Number(lambdaMax.toFixed(4)),
      weights: weightsRecord
    };
  } catch (err: any) {
    return {
      isValid: false,
      consistencyRatio: 1.0,
      consistencyIndex: 1.0,
      lambdaMax: 0,
      weights: { Flood: 0.25, Landslide: 0.25, Cyclone: 0.25, Cloudburst: 0.25 },
      rejectionReason: err?.message || 'Error during AHP matrix evaluation'
    };
  }
}

export interface DynamicFeedInput {
  habitationId: string;
  rainfallIntensityMmHr?: number;
  riverGaugeM?: number;
  landslideSlipMm?: number;
  situationalIntelligenceBonus?: number; // Ingested bulletin feed bonus (max 15)
}

/**
 * Deterministic Risk Analysis Agent
 * Executes AHP-weighted hazard synthesis over habitations.
 * Never calls an LLM. Fully auditable and mathematically reproducible.
 */
export class RiskAnalysisAgent {
  private matrix: number[][];
  private ahpResult: AhpEvaluationResult;

  constructor(customMatrix?: number[][]) {
    this.matrix = customMatrix || DEFAULT_AHP_HAZARD_MATRIX;
    this.ahpResult = evaluateAhpMatrix(this.matrix);
  }

  public getAhpResult(): AhpEvaluationResult {
    return this.ahpResult;
  }

  public updateMatrix(newMatrix: number[][]): AhpEvaluationResult {
    const evalResult = evaluateAhpMatrix(newMatrix);
    if (evalResult.isValid) {
      this.matrix = newMatrix;
      this.ahpResult = evalResult;
    }
    return evalResult;
  }

  /**
   * Analyzes an individual habitation deterministically
   */
  public analyzeHabitation(
    habitation: Habitation,
    vulnerabilityScore: number,
    dynamicFeed?: DynamicFeedInput
  ): HabitationRiskAnalysisResult {
    const weights = this.ahpResult.weights;

    // 1. Determine dominant hazard weight
    const dominant: AhpHazardCriteria = (habitation.dominantHazard in weights) 
      ? (habitation.dominantHazard as AhpHazardCriteria) 
      : 'Flood';
    const dominantWeight = weights[dominant] || 0.35;

    // 2. Secondary hazards factor (cumulative marginal hazard load)
    const secondaryCount = Array.isArray(habitation.secondaryHazards) 
      ? habitation.secondaryHazards.length 
      : 0;
    const secondaryHazardsFactor = Math.min(25, secondaryCount * 8.5);

    // 3. Dynamic feed impact (e.g. from real-time sensors or ingested intelligence)
    let dynamicFeedImpact = 0;
    if (dynamicFeed) {
      if (dynamicFeed.rainfallIntensityMmHr && dynamicFeed.rainfallIntensityMmHr > 40) {
        dynamicFeedImpact += Math.min(25, (dynamicFeed.rainfallIntensityMmHr - 40) * 0.4);
      }
      if (dynamicFeed.riverGaugeM && dynamicFeed.riverGaugeM > 2.0) {
        dynamicFeedImpact += Math.min(20, (dynamicFeed.riverGaugeM - 2.0) * 8.0);
      }
      if (dynamicFeed.landslideSlipMm && dynamicFeed.landslideSlipMm > 15) {
        dynamicFeedImpact += Math.min(25, dynamicFeed.landslideSlipMm * 0.5);
      }
      if (dynamicFeed.situationalIntelligenceBonus) {
        // Capped to prevent ingested intelligence from overwhelming sensor data
        dynamicFeedImpact += Math.min(15, dynamicFeed.situationalIntelligenceBonus);
      }
    }

    // 4. Weighted hazard score calculation
    // Base hazard exposure (50%), Historical impact (30%), Secondary hazards (10%), Dynamic Feed (10%)
    const rawHazardScore = 
      (habitation.hazardExposure * 0.50) +
      (habitation.historicalImpact * 0.30) +
      (secondaryHazardsFactor * 0.10) +
      (dynamicFeedImpact * 0.10);

    // Scale with dominant hazard's AHP criteria weight relative to mean (0.25)
    const hazardWeightMultiplier = dominantWeight / 0.25;
    const weightedHazardScore = Math.min(100, Math.max(0, Math.round(rawHazardScore * (0.8 + 0.2 * hazardWeightMultiplier))));

    // 5. Composite Risk Score:
    // Hazard (40%), Population Exposure (20%), Access Risk (20%), Vulnerability (20%)
    const popExposure = habitation.populationExposure || Math.min(100, Math.round(habitation.population / 25));
    const accessRisk = habitation.accessRisk || 50;

    const compositeScoreRaw = 
      (weightedHazardScore * 0.40) +
      (popExposure * 0.20) +
      (accessRisk * 0.20) +
      (vulnerabilityScore * 0.20);

    const compositeRiskScore = Math.min(100, Math.max(0, Math.round(compositeScoreRaw)));

    // 6. Tier assignment (Priority Window)
    let priorityWindow: PriorityWindow;
    let recommendedAction: string;

    if (compositeRiskScore >= 75 || (compositeRiskScore >= 65 && accessRisk >= 85)) {
      priorityWindow = 'Immediate';
      recommendedAction = compositeRiskScore >= 88 ? 'Evacuate Now' : 'Relocate';
    } else if (compositeRiskScore >= 50) {
      priorityWindow = 'Short-term';
      recommendedAction = 'Prepare Shelters';
    } else if (compositeRiskScore >= 30) {
      priorityWindow = 'Medium-term';
      recommendedAction = 'Stage Resources';
    } else {
      priorityWindow = 'Monitor';
      recommendedAction = 'Monitor Sensor Feeds';
    }

    return {
      habitationId: habitation.id,
      weightedHazardScore,
      compositeRiskScore,
      dominantHazard: dominant,
      priorityWindow,
      recommendedAction,
      ahpWeights: weights,
      consistencyRatio: this.ahpResult.consistencyRatio,
      subScores: {
        hazardExposure: habitation.hazardExposure,
        historicalImpact: habitation.historicalImpact,
        secondaryHazardsFactor,
        dynamicFeedImpact: Math.round(dynamicFeedImpact),
        accessRisk,
        populationExposure: popExposure
      }
    };
  }

  /**
   * Batch analysis across all habitations
   */
  public analyzeBatch(
    habitations: Habitation[],
    vulnerabilityScores: Map<string, number>,
    dynamicFeeds?: Map<string, DynamicFeedInput>
  ): Map<string, HabitationRiskAnalysisResult> {
    const results = new Map<string, HabitationRiskAnalysisResult>();
    for (const hab of habitations) {
      const vulnScore = vulnerabilityScores.get(hab.id) ?? hab.vulnerabilityScore ?? 50;
      const dynamic = dynamicFeeds?.get(hab.id);
      results.set(hab.id, this.analyzeHabitation(hab, vulnScore, dynamic));
    }
    return results;
  }
}
