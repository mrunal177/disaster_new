import { RelocationSite } from '../types';

export interface SiteCapacityStatus {
  siteId: string;
  siteName: string;
  maxCapacity: number;
  bufferMarginPct: number;
  bufferMarginPersons: number;
  effectiveCapacity: number;
  currentOccupancy: number;
  availableCapacity: number; // strictly clamped at 0
  occupancyPct: number;
  isSaturated: boolean;
  canAcceptSurge: boolean;
}

/**
 * Deterministic Capacity Agent
 * Strictly enforces humanitarian safety buffer margins and prevents over-allocation.
 * Formula: availableCapacity = max(0, floor(maxCapacity * (1 - bufferMarginPct/100) - currentOccupancy))
 */
export class CapacityAgent {
  private defaultBufferMarginPct: number;
  private capacityStore: Map<string, SiteCapacityStatus>;

  constructor(defaultBufferMarginPct = 15) {
    this.defaultBufferMarginPct = defaultBufferMarginPct;
    this.capacityStore = new Map();
  }

  /**
   * Initializes capacity ledger from candidate sites
   */
  public initializeSites(sites: RelocationSite[], bufferMarginPct?: number): Map<string, SiteCapacityStatus> {
    const margin = bufferMarginPct !== undefined ? bufferMarginPct : this.defaultBufferMarginPct;
    this.capacityStore.clear();

    for (const site of sites) {
      const status = this.calculateCapacity(site, margin);
      this.capacityStore.set(site.id, status);
    }
    return new Map(this.capacityStore);
  }

  /**
   * Calculates capacity status for a single site
   */
  public calculateCapacity(site: RelocationSite, bufferMarginPct?: number): SiteCapacityStatus {
    const margin = bufferMarginPct !== undefined ? bufferMarginPct : this.defaultBufferMarginPct;
    const bufferMultiplier = 1 - (margin / 100);
    const effectiveCapacity = Math.floor(site.maxCapacity * bufferMultiplier);
    const bufferMarginPersons = site.maxCapacity - effectiveCapacity;

    // Strict formula: availableCapacity = max(0, effectiveCapacity - currentOccupancy)
    const availableCapacity = Math.max(0, effectiveCapacity - site.currentOccupancy);
    const occupancyPct = site.maxCapacity > 0 
      ? Number(((site.currentOccupancy / site.maxCapacity) * 100).toFixed(1)) 
      : 100;

    return {
      siteId: site.id,
      siteName: site.name,
      maxCapacity: site.maxCapacity,
      bufferMarginPct: margin,
      bufferMarginPersons,
      effectiveCapacity,
      currentOccupancy: site.currentOccupancy,
      availableCapacity,
      occupancyPct,
      isSaturated: availableCapacity <= 0,
      canAcceptSurge: (site.maxCapacity - site.currentOccupancy) > 0
    };
  }

  public getStatus(siteId: string): SiteCapacityStatus | undefined {
    return this.capacityStore.get(siteId);
  }

  public getAllStatuses(): Map<string, SiteCapacityStatus> {
    return new Map(this.capacityStore);
  }

  /**
   * Checks if a site can accommodate a given population within its clamped available capacity
   */
  public canAccommodate(siteId: string, population: number): boolean {
    const status = this.capacityStore.get(siteId);
    if (!status) return false;
    return status.availableCapacity >= population;
  }

  /**
   * Deducts capacity when an assignment is executed
   */
  public allocate(siteId: string, population: number): boolean {
    const status = this.capacityStore.get(siteId);
    if (!status || status.availableCapacity < population) {
      return false;
    }

    const newOccupancy = status.currentOccupancy + population;
    const newAvailable = Math.max(0, status.effectiveCapacity - newOccupancy);

    this.capacityStore.set(siteId, {
      ...status,
      currentOccupancy: newOccupancy,
      availableCapacity: newAvailable,
      occupancyPct: Number(((newOccupancy / status.maxCapacity) * 100).toFixed(1)),
      isSaturated: newAvailable <= 0
    });

    return true;
  }

  /**
   * Releases allocated capacity
   */
  public release(siteId: string, population: number): void {
    const status = this.capacityStore.get(siteId);
    if (!status) return;

    const newOccupancy = Math.max(0, status.currentOccupancy - population);
    const newAvailable = Math.max(0, status.effectiveCapacity - newOccupancy);

    this.capacityStore.set(siteId, {
      ...status,
      currentOccupancy: newOccupancy,
      availableCapacity: newAvailable,
      occupancyPct: Number(((newOccupancy / status.maxCapacity) * 100).toFixed(1)),
      isSaturated: newAvailable <= 0
    });
  }

  /**
   * Resets ledger to baseline site occupancy
   */
  public reset(sites: RelocationSite[], bufferMarginPct?: number): void {
    this.initializeSites(sites, bufferMarginPct);
  }
}
