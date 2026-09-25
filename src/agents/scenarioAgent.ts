import { Habitation, RelocationSite, Accessibility } from '../types';

export interface ScenarioOverrides {
  rainfallIntensity?: number;           // mm/hr (e.g. 85 mm/hr)
  floodLevelM?: number;                 // meters above danger level (e.g. +2.8m)
  landslideSeverity?: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  roadAvailability?: Record<string, Accessibility['roadStatus']>; // per habId or siteId
  siteCapacityOverride?: Record<string, number>;                  // siteId -> maxCapacity
  populationOverride?: Record<string, number>;                    // habId -> new population
  hazardZoneExtent?: number;            // percentage expansion (e.g. 25% expansion)
}

export interface ScenarioSnapshot {
  scenarioId: string;
  timestamp: string;
  overridesApplied: ScenarioOverrides;
  habitations: Habitation[];
  sites: RelocationSite[];
}

/**
 * Deterministic Scenario Agent
 * Creates an isolated, deep-cloned simulation snapshot from officer-supplied hazard overrides.
 * GUARANTEE: Never mutates the live application dataset in any way.
 */
export class ScenarioAgent {
  /**
   * Deep clones data safely
   */
  public deepClone<T>(item: T): T {
    return JSON.parse(JSON.stringify(item));
  }

  /**
   * Generates a modified snapshot based on hypothetical disaster parameters
   */
  public createScenarioSnapshot(
    liveHabitations: Habitation[],
    liveSites: RelocationSite[],
    overrides: ScenarioOverrides
  ): ScenarioSnapshot {
    // 1. Strict Deep Clone: Complete isolation from live state
    const habitationsSnapshot = this.deepClone(liveHabitations);
    const sitesSnapshot = this.deepClone(liveSites);

    const rain = overrides.rainfallIntensity ?? 0;
    const flood = overrides.floodLevelM ?? 0;
    const landslide = overrides.landslideSeverity;
    const hazardExtentMultiplier = 1 + ((overrides.hazardZoneExtent ?? 0) / 100);

    // 2. Apply Habitation Overrides
    for (const hab of habitationsSnapshot) {
      // Population override
      if (overrides.populationOverride && overrides.populationOverride[hab.id] !== undefined) {
        hab.population = Math.max(1, overrides.populationOverride[hab.id]);
      }

      // Road availability override
      if (overrides.roadAvailability && overrides.roadAvailability[hab.id]) {
        hab.accessibility.roadStatus = overrides.roadAvailability[hab.id];
      }

      // Rainfall intensity effect on hazard exposure
      if (rain > 40) {
        const rainBonus = Math.min(30, (rain - 40) * 0.45);
        hab.hazardExposure = Math.min(100, Math.round(hab.hazardExposure + rainBonus));
      }

      // Flood level surge effect
      if (flood > 0 && (hab.dominantHazard === 'Flood' || hab.dominantHazard === 'Cloudburst')) {
        const floodBonus = Math.min(35, flood * 9.5);
        hab.hazardExposure = Math.min(100, Math.round(hab.hazardExposure + floodBonus));
      }

      // Landslide severity escalation
      if (landslide && (hab.dominantHazard === 'Landslide' || hab.secondaryHazards.includes('Landslide'))) {
        let slideBonus = 0;
        if (landslide === 'Critical') slideBonus = 35;
        else if (landslide === 'Severe') slideBonus = 25;
        else if (landslide === 'Moderate') slideBonus = 12;
        hab.hazardExposure = Math.min(100, Math.round(hab.hazardExposure + slideBonus));
      }

      // Hazard zone geographic extent expansion
      if (overrides.hazardZoneExtent && overrides.hazardZoneExtent > 0) {
        hab.hazardExposure = Math.min(100, Math.round(hab.hazardExposure * hazardExtentMultiplier));
      }
    }

    // 3. Apply Relocation Site Overrides
    for (const site of sitesSnapshot) {
      // Capacity override
      if (overrides.siteCapacityOverride && overrides.siteCapacityOverride[site.id] !== undefined) {
        const newCap = Math.max(0, overrides.siteCapacityOverride[site.id]);
        site.maxCapacity = newCap;
        site.remainingCapacity = Math.max(0, newCap - site.currentOccupancy);
      }

      // Road availability override for sites
      if (overrides.roadAvailability && overrides.roadAvailability[site.id]) {
        const status = overrides.roadAvailability[site.id];
        if (status === 'Impassable' || status === 'Cut-off Risk') {
          site.roadAccess = 'Poor';
          site.roadDetails = `Simulated road severance (${status}) on primary approach`;
        } else if (status === 'Passable 4x4') {
          site.roadAccess = 'Fair';
        }
      }
    }

    return {
      scenarioId: `SCENARIO-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      overridesApplied: overrides,
      habitations: habitationsSnapshot,
      sites: sitesSnapshot
    };
  }
}
