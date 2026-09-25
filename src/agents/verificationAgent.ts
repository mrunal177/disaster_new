import { 
  Habitation, 
  RelocationSite, 
  RelocationAssignment, 
  GeneratedPlanResult, 
  OptimizationParameters 
} from '../types';
import { SiteCapacityStatus } from './capacityAgent';
import { calculateGeodesicDistanceKm } from './relocationPlanningAgent';

export type ViolationType = 
  | 'CAPACITY_OVERRUN'
  | 'HAZARD_ZONE_VIOLATION'
  | 'DISTANCE_VIOLATION'
  | 'POPULATION_TAMPERING'
  | 'DISQUALIFIED_SITE_ASSIGNMENT';

export interface VerificationViolation {
  id: string;
  type: ViolationType;
  severity: 'CRITICAL' | 'HIGH';
  siteId?: string;
  siteName?: string;
  habitationId?: string;
  habitationName?: string;
  message: string;
  details: {
    allocated?: number;
    limit?: number;
    actualDistanceKm?: number;
    allowedDistanceKm?: number;
    hazardDetails?: string;
  };
}

export interface VerificationResult {
  approved: boolean;
  timestamp: string;
  totalChecksEvaluated: number;
  violations: VerificationViolation[];
  summaryMessage: string;
}

/**
 * Deterministic Independent Verification Agent
 * Acts as an automated compliance auditor.
 * Checks for zero tolerance on capacity overruns, hazard zone exposures, and hidden distance violations.
 */
export class VerificationAgent {
  /**
   * Re-evaluates a generated plan independently from the planning agent
   */
  public verifyPlan(
    plan: GeneratedPlanResult,
    habitations: Habitation[],
    sites: RelocationSite[],
    capacityLedger: Record<string, SiteCapacityStatus>,
    parameters: OptimizationParameters
  ): VerificationResult {
    const violations: VerificationViolation[] = [];
    const habMap = new Map<string, Habitation>(habitations.map(h => [h.id, h]));
    const siteMap = new Map<string, RelocationSite>(sites.map(s => [s.id, s]));

    // Track total allocated population per site
    const siteAllocations = new Map<string, number>();

    let totalChecks = 0;

    for (const assignment of plan.assignments) {
      totalChecks++;
      const hab = habMap.get(assignment.habitationId);
      const site = siteMap.get(assignment.assignedSiteId);

      // 1. Integrity check: Habitation & Site exist
      if (!hab) {
        violations.push({
          id: `VIOL-${violations.length + 1}`,
          type: 'POPULATION_TAMPERING',
          severity: 'CRITICAL',
          habitationId: assignment.habitationId,
          message: `Unknown habitation ID "${assignment.habitationId}" in plan assignment.`,
          details: {}
        });
        continue;
      }

      if (!site) {
        violations.push({
          id: `VIOL-${violations.length + 1}`,
          type: 'DISQUALIFIED_SITE_ASSIGNMENT',
          severity: 'CRITICAL',
          siteId: assignment.assignedSiteId,
          habitationId: assignment.habitationId,
          message: `Assignment targets non-existent site ID "${assignment.assignedSiteId}".`,
          details: {}
        });
        continue;
      }

      // 2. Population tampering check
      if (assignment.population !== hab.population) {
        violations.push({
          id: `VIOL-${violations.length + 1}`,
          type: 'POPULATION_TAMPERING',
          severity: 'CRITICAL',
          habitationId: hab.id,
          habitationName: hab.name,
          message: `Population mismatch: Plan assigned ${assignment.population} persons, but census baseline is ${hab.population}.`,
          details: { allocated: assignment.population, limit: hab.population }
        });
      }

      // 3. Accumulate capacity per site
      const currentSiteLoad = (siteAllocations.get(site.id) || 0) + assignment.population;
      siteAllocations.set(site.id, currentSiteLoad);

      // 4. Hazard Zone check
      totalChecks++;
      if (site.hazardExposure === 'Moderate') {
        const details = (site.hazardDetails || '').toLowerCase();
        if (details.includes('active') || details.includes('subsidence') || details.includes('flood plain')) {
          violations.push({
            id: `VIOL-${violations.length + 1}`,
            type: 'HAZARD_ZONE_VIOLATION',
            severity: 'CRITICAL',
            siteId: site.id,
            siteName: site.name,
            habitationId: hab.id,
            habitationName: hab.name,
            message: `CRITICAL SAFETY BREACH: Habitation assigned to site ${site.name} located in active hazard zone (${site.hazardDetails}).`,
            details: { hazardDetails: site.hazardDetails }
          });
        }
      }

      // 5. Distance check (no silently violated distance limit)
      totalChecks++;
      const actualDist = calculateGeodesicDistanceKm(
        hab.coords.lat,
        hab.coords.lng,
        site.coords.lat,
        site.coords.lng
      );

      const isRelaxed = assignment.bindingConstraints?.some(c => c.toLowerCase().includes('relaxed-distance'));
      const allowedDist = isRelaxed 
        ? Math.round(parameters.maxDistanceKm * 1.6 + 20) 
        : parameters.maxDistanceKm;

      if (actualDist > allowedDist) {
        violations.push({
          id: `VIOL-${violations.length + 1}`,
          type: 'DISTANCE_VIOLATION',
          severity: 'HIGH',
          siteId: site.id,
          siteName: site.name,
          habitationId: hab.id,
          habitationName: hab.name,
          message: `Distance constraint silently violated: ${actualDist} km exceeds authorized limit of ${allowedDist} km.`,
          details: { actualDistanceKm: actualDist, allowedDistanceKm: allowedDist }
        });
      }
    }

    // 6. Site Capacity Overrun Check
    for (const [siteId, totalAllocated] of siteAllocations.entries()) {
      totalChecks++;
      const site = siteMap.get(siteId);
      if (!site) continue;

      const ledgerStatus = capacityLedger[siteId];
      const maxAllowed = ledgerStatus ? ledgerStatus.availableCapacity : site.remainingCapacity;

      if (totalAllocated > maxAllowed) {
        const overrun = totalAllocated - maxAllowed;
        violations.push({
          id: `VIOL-${violations.length + 1}`,
          type: 'CAPACITY_OVERRUN',
          severity: 'CRITICAL',
          siteId: site.id,
          siteName: site.name,
          message: `CAPACITY OVERRUN: Site ${site.name} allocated ${totalAllocated} residents, exceeding available buffer-clamped capacity of ${maxAllowed} (Overrun: ${overrun} persons).`,
          details: { allocated: totalAllocated, limit: maxAllowed }
        });
      }
    }

    const approved = violations.length === 0;
    const summaryMessage = approved
      ? `Verification PASSED: ${totalChecks} constraints evaluated. Zero capacity overruns, zero hazard zone assignments, and verified distance compliance.`
      : `Verification FAILED: ${violations.length} critical constraint violations detected. Plan cannot be approved.`;

    return {
      approved,
      timestamp: new Date().toISOString(),
      totalChecksEvaluated: totalChecks,
      violations,
      summaryMessage
    };
  }
}
