import { RelocationSite } from '../types';

export interface SiteSuitabilityResult {
  siteId: string;
  siteName: string;
  isCandidate: boolean;
  disqualificationReason?: string;
  suitabilityScore: number; // 0 - 100
  subScores: {
    safetyScore: number;     // 40%
    washScore: number;       // 25% (Water & Sanitation)
    healthcareScore: number; // 15%
    logisticsScore: number;  // 20%
  };
  certifications: string[];
  warnings: string[];
}

/**
 * Deterministic Site Suitability Screening Agent
 * Applies hard safety gating before any relocation site can be evaluated as a candidate.
 * Evaluates SPHERE humanitarian standards for WASH and healthcare lifelines.
 */
export class SiteSuitabilityAgent {
  /**
   * Evaluates if a relocation site passes the mandatory hard safety threshold
   */
  public evaluateSafetyGate(site: RelocationSite): { passed: boolean; reason?: string } {
    // 1. Hazard exposure hard threshold:
    // If hazardExposure is 'Moderate' with active subsidence or river inundation, disqualify
    if (site.hazardExposure === 'Moderate') {
      const lowerDetails = (site.hazardDetails || '').toLowerCase();
      if (lowerDetails.includes('active') || lowerDetails.includes('subsidence') || lowerDetails.includes('flood plain')) {
        return {
          passed: false,
          reason: `Disqualified by Safety Gate: Active hazard risk (${site.hazardDetails}) violates zero-secondary-hazard rule.`
        };
      }
    }

    // 2. Road logistics hard threshold:
    if (site.roadAccess === 'Poor') {
      const lowerRoad = (site.roadDetails || '').toLowerCase();
      if (lowerRoad.includes('impassable') || lowerRoad.includes('severed') || lowerRoad.includes('collapsed')) {
        return {
          passed: false,
          reason: `Disqualified by Safety Gate: Road access is impassable (${site.roadDetails}). Evacuation convoys cannot reach site.`
        };
      }
    }

    // 3. Water availability hard threshold (SPHERE standard: minimum 15 LPCD emergency survival)
    if (site.water.lpcd < 15 && site.water.status === 'Limited') {
      return {
        passed: false,
        reason: `Disqualified by Safety Gate: Water yield (${site.water.lpcd} LPCD) falls below SPHERE minimum emergency survival threshold of 15 LPCD.`
      };
    }

    // 4. Sanitation hard threshold (must have viable toilet facilities)
    if (site.sanitation.toiletsAvailable <= 0) {
      return {
        passed: false,
        reason: 'Disqualified by Safety Gate: Zero sanctioned sanitary facilities. Extreme epidemic outbreak risk.'
      };
    }

    // 5. Terrain stability check
    const slopeNum = parseFloat(site.terrainSlope) || 10;
    if (slopeNum > 30) {
      return {
        passed: false,
        reason: `Disqualified by Safety Gate: Terrain slope (${site.terrainSlope}) exceeds 30° maximum threshold for emergency habitations.`
      };
    }

    return { passed: true };
  }

  /**
   * Scores a site across multi-dimensional criteria
   */
  public analyzeSite(site: RelocationSite): SiteSuitabilityResult {
    const gate = this.evaluateSafetyGate(site);
    const certifications: string[] = [];
    const warnings: string[] = [];

    // 1. Safety Score (40%)
    let safetyScore = 95;
    if (site.hazardExposure === 'Minimal') {
      safetyScore = 98;
      certifications.push('Minimal Hazard Zone (Verified Geotech Clearance)');
    } else if (site.hazardExposure === 'Low') {
      safetyScore = 82;
      certifications.push('Low Hazard Zone (Alluvial Terrace Buffer)');
    } else {
      safetyScore = 55;
      warnings.push(`Moderate Hazard Exposure: ${site.hazardDetails}`);
    }

    // Elevation safety margin bonus
    if (site.elevationM >= 1000) {
      certifications.push(`High Ground Enclave (${site.elevationM}m MSL safe from river surges)`);
    }

    // 2. WASH (Water, Sanitation, Hygiene) Score (25%)
    let washScore = 50;
    const lpcd = site.water.lpcd;
    if (lpcd >= 40) {
      washScore = 95;
      certifications.push(`SPHERE Full Compliance (${lpcd} LPCD piped water)`);
    } else if (lpcd >= 25) {
      washScore = 80;
      certifications.push(`Adequate Water Supply (${lpcd} LPCD)`);
    } else if (lpcd >= 15) {
      washScore = 65;
      warnings.push(`Marginal Water Supply (${lpcd} LPCD)`);
    } else {
      washScore = 30;
    }

    // Sanitation ratio check (SPHERE target: 1 toilet per 20 persons in camps)
    if (site.sanitation.ratioPerPerson <= 20) {
      washScore = Math.min(100, washScore + 10);
      certifications.push(`Sanitation Compliant (${site.sanitation.ratioPerPerson} persons/toilet)`);
    } else if (site.sanitation.ratioPerPerson > 35) {
      washScore = Math.max(20, washScore - 15);
      warnings.push(`Sanitation Strained (${site.sanitation.ratioPerPerson} persons/toilet)`);
    }

    // 3. Healthcare Lifeline Score (15%)
    let healthcareScore = 50;
    if (site.healthcareKm <= 3.0) {
      healthcareScore = 95;
      certifications.push(`Immediate Medical Access (${site.healthcareKm} km to hospital)`);
    } else if (site.healthcareKm <= 7.0) {
      healthcareScore = 80;
    } else if (site.healthcareKm <= 15.0) {
      healthcareScore = 60;
    } else {
      healthcareScore = 40;
      warnings.push(`Distant Healthcare Facility (${site.healthcareKm} km)`);
    }

    // 4. Logistics & Road Access Score (20%)
    let logisticsScore = 50;
    if (site.roadAccess === 'Good') {
      logisticsScore = 95;
      certifications.push('All-weather two-lane highway access');
    } else if (site.roadAccess === 'Fair') {
      logisticsScore = 75;
    } else {
      logisticsScore = 40;
      warnings.push(`Restricted Road Access: ${site.roadDetails}`);
    }

    if (!gate.passed) {
      return {
        siteId: site.id,
        siteName: site.name,
        isCandidate: false,
        disqualificationReason: gate.reason,
        suitabilityScore: 0,
        subScores: {
          safetyScore: 0,
          washScore: 0,
          healthcareScore: 0,
          logisticsScore: 0
        },
        certifications: [],
        warnings: [gate.reason || 'Safety gate rejected']
      };
    }

    // Composite Suitability Score (0-100)
    const compositeSuitability = Math.min(100, Math.max(0, Math.round(
      (safetyScore * 0.40) +
      (washScore * 0.25) +
      (healthcareScore * 0.15) +
      (logisticsScore * 0.20)
    )));

    return {
      siteId: site.id,
      siteName: site.name,
      isCandidate: true,
      suitabilityScore: compositeSuitability,
      subScores: {
        safetyScore,
        washScore,
        healthcareScore,
        logisticsScore
      },
      certifications,
      warnings
    };
  }

  /**
   * Filter and rank all candidate relocation sites
   */
  public filterAndScoreSites(sites: RelocationSite[]): {
    candidateSites: RelocationSite[];
    siteScores: Map<string, SiteSuitabilityResult>;
    disqualifiedSites: Array<{ site: RelocationSite; reason: string }>;
  } {
    const siteScores = new Map<string, SiteSuitabilityResult>();
    const candidateSites: RelocationSite[] = [];
    const disqualifiedSites: Array<{ site: RelocationSite; reason: string }> = [];

    for (const site of sites) {
      const evaluation = this.analyzeSite(site);
      siteScores.set(site.id, evaluation);
      if (evaluation.isCandidate) {
        candidateSites.push({
          ...site,
          suitabilityScore: evaluation.suitabilityScore
        });
      } else {
        disqualifiedSites.push({
          site,
          reason: evaluation.disqualificationReason || 'Failed safety gate'
        });
      }
    }

    // Sort candidate sites by suitability score descending
    candidateSites.sort((a, b) => (b.suitabilityScore || 0) - (a.suitabilityScore || 0));

    return {
      candidateSites,
      siteScores,
      disqualifiedSites
    };
  }
}
