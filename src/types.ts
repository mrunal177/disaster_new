export type HazardType = 'Flood' | 'Landslide' | 'Cyclone' | 'Cloudburst' | 'Multi-hazard';

export type PriorityWindow = 'Immediate' | 'Short-term' | 'Medium-term' | 'Monitor';

export type RecommendedAction = 'Relocate' | 'Evacuate Now' | 'Prepare Shelters' | 'Monitor';

export type RelocationStatus = 'Identified' | 'Assessed' | 'Assigned' | 'In Progress' | 'Relocated' | 'Pending' | 'Monitoring';

export type TrackingStatus = RelocationStatus;

export interface Demographics {
  children: number;
  elderly: number;
  livestock: number;
  kutchaHouses: number;
  medicalDependents: number;
}

export interface Accessibility {
  roadStatus: 'Good' | 'Fair' | 'Passable 4x4' | 'Cut-off Risk' | 'Impassable';
  nearestHelipadKm: number;
  telecommWorking: boolean;
  bridgeCutoffRisk: 'Low' | 'Moderate' | 'Critical';
}

export interface Habitation {
  id: string;
  code: string;
  name: string;
  taluka: string;
  district: string;
  population: number;
  // Normalized 0-100 coordinates for interactive GIS canvas
  coords: { x: number; y: number; lat: number; lng: number };
  riskScore: number; // 0-100
  vulnerabilityScore: number; // 0-100
  hazardExposure: number; // 0-100
  populationExposure: number; // 0-100
  historicalImpact: number; // 0-100
  accessRisk: number; // 0-100
  dominantHazard: HazardType;
  secondaryHazards: HazardType[] | string[];
  priorityWindow: PriorityWindow;
  recommendedAction: RecommendedAction | string;
  status: RelocationStatus;
  assignedSiteId?: string;
  assignedSiteName?: string;
  relocationDate?: string;
  historySummary: string;
  demographics: Demographics;
  accessibility: Accessibility;
}

export interface WaterAvailability {
  status: 'Adequate' | 'Moderate' | 'Limited';
  lpcd: number; // Litres per capita per day
  source: string;
}

export interface SanitationCapacity {
  status: 'Adequate' | 'Moderate' | 'Strained';
  toiletsAvailable: number;
  ratioPerPerson: number;
}

export interface RelocationSite {
  id: string;
  code: string;
  name: string;
  location: string;
  taluka: string;
  suitabilityScore: number; // 0-100
  maxCapacity: number;
  currentOccupancy: number;
  remainingCapacity: number;
  coords: { x: number; y: number; lat: number; lng: number };
  water: WaterAvailability;
  sanitation: SanitationCapacity;
  healthcareKm: number;
  healthcareDetails: string;
  schoolKm: number;
  roadAccess: 'Good' | 'Fair' | 'Poor';
  roadDetails: string;
  hazardExposure: 'Minimal' | 'Low' | 'Moderate';
  hazardDetails: string;
  terrainSlope: string;
  elevationM: number;
  assignedHabitations: string[]; // Habitation IDs
}

export interface AlternativeSiteEvaluation {
  siteId: string;
  siteName: string;
  distanceKm: number;
  suitabilityScore: number;
  rejectedReason: string;
}

export interface RelocationAssignment {
  habitationId: string;
  habitationName: string;
  population: number;
  assignedSiteId: string;
  assignedSiteName: string;
  distanceKm: number;
  siteCapacityUsedPct: number;
  priority: PriorityWindow;
  dominantHazard?: HazardType;
  reason: string;
  bindingConstraints: string[];
  reasonsList: string[];
  alternativeSites: AlternativeSiteEvaluation[];
  generatedAt?: string;
  isApproved?: boolean;
}

export interface OptimizationParameters {
  planningHorizon: '24h' | '48h' | '72h' | 'Season-long';
  priorityThreshold: 'Immediate only' | 'Immediate + Short-term' | 'All high-risk';
  objective: 'Balanced' | 'Minimize transit distance' | 'Maximize safety buffer' | 'Preserve community coherence';
  maxDistanceKm: number;
  capacityBufferMarginPct: number;
  requireMedicalFacility: boolean;
  preserveCommunityCoherence: boolean;
}

export interface PlanGenerationConfig {
  district?: string;
  priorityScope?: string;
  maxDistanceKm?: number;
  allowSurgeCapacity?: boolean;
  requireWaterSanitation?: boolean;
  requireHealthcareProximity?: boolean;
  filterSecondaryHazard?: boolean;
  keepCommunityIntact?: boolean;
}

export interface GeneratedPlanResult {
  planId: string;
  timestamp?: string;
  generatedTimestamp?: string;
  parameters?: OptimizationParameters;
  configUsed?: PlanGenerationConfig;
  totalHabitations?: number;
  totalPopulation?: number;
  assignedHabitationsCount?: number;
  assignedPopulation?: number;
  unassignedHabitationsCount?: number;
  unassignedPopulation?: number;
  sitesUsedCount?: number;
  overallCapacityUtilization?: number;
  habitationsRelocatedCount?: number;
  totalPopulationRelocated?: number;
  sitesUtilizedCount?: number;
  averageDistanceKm: number;
  capacityUtilizationPct?: number;
  assignments: RelocationAssignment[];
}

export interface AuditLogEntry {
  id: string;
  planCode?: string;
  actionType?: string;
  action?: string;
  timestamp: string;
  actor?: string;
  role?: string;
  user?: string;
  dataVintage?: string;
  entity?: string;
  details: string;
  trace?: {
    solverEngine?: string;
    solveTimeMs?: number;
    constraintsEvaluated?: string[];
    objectiveScore?: number;
    notes?: string;
  };
}

export interface DataSourceItem {
  id: string;
  acronym: string;
  fullName: string;
  name?: string;
  agency?: string;
  ministry: string;
  dataType: string;
  protocol: string;
  updateFrequency: string;
  frequency?: string;
  lastSync: string;
  lastUpdated?: string;
  coverage: string;
  vintage: string;
  status: 'Operational' | 'Active' | 'Synchronized' | 'Simulated';
  recordsCount: string;
  description: string;
  qualityRating?: string;
  parameters?: string[];
}

export type DataSourceInfo = DataSourceItem;
