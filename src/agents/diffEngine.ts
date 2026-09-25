import { Habitation, RelocationSite, GeneratedPlanResult, PriorityWindow } from '../types';
import { PlanDiffPayload, ExplanationAgent, ExplainOutput } from './explanationAgent';

export interface HabitationDiffItem {
  habitationId: string;
  habitationName: string;
  oldTier: PriorityWindow;
  newTier: PriorityWindow;
  oldScore: number;
  newScore: number;
  scoreDelta: number;
  dominantHazard: string;
  tierEscalated: boolean;
}

export interface SiteCapacityStrainItem {
  siteId: string;
  siteName: string;
  status: 'SUFFICIENT_TO_INSUFFICIENT' | 'EXCEEDED';
  baselineRemaining: number;
  simulatedRemaining: number;
  assignedPopulation: number;
  maxCapacity: number;
}

export interface AssignmentDiffItem {
  habitationId: string;
  habitationName: string;
  population: number;
  changeType: 'NEWLY_ASSIGNED' | 'REROUTED' | 'UNASSIGNED_DEFICIT';
  fromSiteId?: string;
  fromSiteName?: string;
  toSiteId?: string;
  toSiteName?: string;
  distanceDeltaKm?: number;
  reason: string;
}

export interface StructuredPlanDiff {
  timestamp: string;
  totalHabitationsEvaluated: number;
  tierChanges: HabitationDiffItem[];
  capacityStrains: SiteCapacityStrainItem[];
  assignmentChanges: AssignmentDiffItem[];
  residualTemporaryShelterCount: number;
  residualTemporaryShelterPersons: number;
  diffPayload: PlanDiffPayload;
  explanationSummary?: ExplainOutput;
}

/**
 * Deterministic Diff Engine
 * Compares live baseline state against simulated scenario results.
 * Identifies priority escalations, capacity saturations, and broken shelter assignments.
 */
export class DiffEngine {
  private explanationAgent: ExplanationAgent;

  constructor(explanationAgent?: ExplanationAgent) {
    this.explanationAgent = explanationAgent || new ExplanationAgent();
  }

  /**
   * Computes the structured difference between live state and simulation outputs
   */
  public async computeDiff(
    liveHabitations: Habitation[],
    simulatedHabitations: Habitation[],
    livePlan: GeneratedPlanResult | null,
    simulatedPlan: GeneratedPlanResult,
    liveSites: RelocationSite[],
    simulatedSites: RelocationSite[]
  ): Promise<StructuredPlanDiff> {
    const liveHabMap = new Map(liveHabitations.map(h => [h.id, h]));
    const liveSiteMap = new Map(liveSites.map(s => [s.id, s]));

    // 1. Habitation Tier & Score Changes
    const tierChanges: HabitationDiffItem[] = [];
    const tierRanks: Record<PriorityWindow, number> = {
      'Immediate': 4,
      'Short-term': 3,
      'Medium-term': 2,
      'Monitor': 1
    };

    for (const simHab of simulatedHabitations) {
      const liveHab = liveHabMap.get(simHab.id);
      if (!liveHab) continue;

      const scoreDelta = simHab.riskScore - liveHab.riskScore;
      const tierChanged = simHab.priorityWindow !== liveHab.priorityWindow;

      if (tierChanged || Math.abs(scoreDelta) >= 4) {
        const liveRank = tierRanks[liveHab.priorityWindow] || 1;
        const simRank = tierRanks[simHab.priorityWindow] || 1;
        tierChanges.push({
          habitationId: simHab.id,
          habitationName: simHab.name,
          oldTier: liveHab.priorityWindow,
          newTier: simHab.priorityWindow,
          oldScore: liveHab.riskScore,
          newScore: simHab.riskScore,
          scoreDelta,
          dominantHazard: simHab.dominantHazard,
          tierEscalated: simRank > liveRank
        });
      }
    }

    // 2. Site Capacity Strains (sufficient -> insufficient)
    const capacityStrains: SiteCapacityStrainItem[] = [];
    for (const simSite of simulatedSites) {
      const liveSite = liveSiteMap.get(simSite.id);
      const baselineRem = liveSite ? liveSite.remainingCapacity : simSite.remainingCapacity;
      const simRem = simSite.remainingCapacity;

      // Check if site had capacity in baseline but became saturated/insufficient in simulation
      if (baselineRem > 0 && simRem <= 0) {
        const assignedPop = simSite.currentOccupancy;
        capacityStrains.push({
          siteId: simSite.id,
          siteName: simSite.name,
          status: 'SUFFICIENT_TO_INSUFFICIENT',
          baselineRemaining: baselineRem,
          simulatedRemaining: simRem,
          assignedPopulation: assignedPop,
          maxCapacity: simSite.maxCapacity
        });
      }
    }

    // 3. Assignment Changes (Rerouted, Unassigned deficit, Newly assigned)
    const liveAssignmentMap = new Map<string, string>();
    if (livePlan) {
      livePlan.assignments.forEach(a => liveAssignmentMap.set(a.habitationId, a.assignedSiteId));
    }

    const simAssignmentMap = new Map<string, string>();
    simulatedPlan.assignments.forEach(a => simAssignmentMap.set(a.habitationId, a.assignedSiteId));

    const assignmentChanges: AssignmentDiffItem[] = [];
    for (const simHab of simulatedHabitations) {
      const liveSiteId = liveAssignmentMap.get(simHab.id);
      const simSiteId = simAssignmentMap.get(simHab.id);

      const simAssignment = simulatedPlan.assignments.find(a => a.habitationId === simHab.id);
      const liveAssignment = livePlan?.assignments.find(a => a.habitationId === simHab.id);

      if (!liveSiteId && simSiteId) {
        // Newly assigned
        assignmentChanges.push({
          habitationId: simHab.id,
          habitationName: simHab.name,
          population: simHab.population,
          changeType: 'NEWLY_ASSIGNED',
          toSiteId: simSiteId,
          toSiteName: simAssignment?.assignedSiteName,
          reason: 'Escalated hazard tier necessitated new relocation allocation.'
        });
      } else if (liveSiteId && simSiteId && liveSiteId !== simSiteId) {
        // Rerouted to a different site
        assignmentChanges.push({
          habitationId: simHab.id,
          habitationName: simHab.name,
          population: simHab.population,
          changeType: 'REROUTED',
          fromSiteId: liveSiteId,
          fromSiteName: liveAssignment?.assignedSiteName,
          toSiteId: simSiteId,
          toSiteName: simAssignment?.assignedSiteName,
          distanceDeltaKm: (simAssignment?.distanceKm ?? 0) - (liveAssignment?.distanceKm ?? 0),
          reason: 'Original shelter saturated or compromised; re-routed to secondary safe enclave.'
        });
      } else if (liveSiteId && !simSiteId) {
        // Unassigned deficit (cannot be accommodated due to capacity exhaust)
        assignmentChanges.push({
          habitationId: simHab.id,
          habitationName: simHab.name,
          population: simHab.population,
          changeType: 'UNASSIGNED_DEFICIT',
          fromSiteId: liveSiteId,
          fromSiteName: liveAssignment?.assignedSiteName,
          reason: 'All regional safe sites within distance ceiling saturated.'
        });
      }
    }

    // 4. Residual Temporary Shelter Deficits
    const residualCount = simulatedPlan.unassignedHabitationsCount || 0;
    const residualPersons = simulatedPlan.unassignedPopulation || 0;

    // 5. Diff payload formatted for ExplanationAgent
    const diffPayload: PlanDiffPayload = {
      totalHabitationsEvaluated: simulatedHabitations.length,
      tierChanges: tierChanges.map(t => ({
        habitationName: t.habitationName,
        oldTier: t.oldTier,
        newTier: t.newTier,
        oldScore: t.oldScore,
        newScore: t.newScore
      })),
      capacityStrains: capacityStrains.map(s => ({
        siteName: s.siteName,
        status: s.status,
        remainingCapacity: s.simulatedRemaining,
        assignedPopulation: s.assignedPopulation
      })),
      reassignedHabitations: assignmentChanges.map(a => ({
        habitationName: a.habitationName,
        fromSiteName: a.fromSiteName,
        toSiteName: a.toSiteName,
        reason: a.reason
      })),
      residualTemporaryShelterCount: residualCount,
      residualTemporaryShelterPersons: residualPersons
    };

    // 6. Generate AI Summary Narrative of the Diff
    const explanationSummary = await this.explanationAgent.explainPlanDiff(diffPayload);

    return {
      timestamp: new Date().toISOString(),
      totalHabitationsEvaluated: simulatedHabitations.length,
      tierChanges,
      capacityStrains,
      assignmentChanges,
      residualTemporaryShelterCount: residualCount,
      residualTemporaryShelterPersons: residualPersons,
      diffPayload,
      explanationSummary
    };
  }
}
