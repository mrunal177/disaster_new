import { Habitation, HazardType, PriorityWindow } from '../types';
import { RiskAnalysisAgent, DynamicFeedInput } from './riskAnalysisAgent';
import { VulnerabilityAgent } from './vulnerabilityAgent';

export interface StaticGeotechData {
  elevationM: number;
  slopeDeg: number;
  gsiLandslideSusceptibility: 'Very High' | 'High' | 'Moderate' | 'Low';
  censusPopulation: number;
  lastPeriodicSurveyDate: string;
}

export interface DynamicTelemetryFeed {
  habitationId: string;
  source: 'IMD' | 'CWC' | 'INCOIS';
  sourceName: string;
  timestamp: string;
  rainfallIntensityMmHr: number;
  cumulative24hMm: number;
  riverGaugeM: number;
  riverGaugeDangerLevelM: number;
  slopeInclinometerMm: number;
  alertLevel: 'NORMAL' | 'WATCH' | 'ALERT' | 'WARNING';
}

export interface RedZoneEvent {
  id: string;
  timestamp: string;
  habitationId: string;
  habitationName: string;
  triggerFeed: string;
  hazardType: HazardType;
  metricValue: string;
  threshold: string;
  oldTier: PriorityWindow;
  newTier: PriorityWindow;
  oldScore: number;
  newScore: number;
}

export type RedZoneEventListener = (event: RedZoneEvent) => void;

/**
 * Real-time Red Zone Monitor Agent
 * Continuously ingests dynamic telemetry (IMD, CWC, INCOIS) and compares against hazard thresholds.
 * On threshold crossing: selectively re-triggers RiskAnalysisAgent & VulnerabilityAgent for that specific habitation.
 * Emits typed event logs for live UI subscription.
 */
export class RedZoneMonitor {
  private staticStore: Map<string, StaticGeotechData>;
  private habitationsMap: Map<string, Habitation>;
  private riskAgent: RiskAnalysisAgent;
  private vulnAgent: VulnerabilityAgent;
  private listeners: Set<RedZoneEventListener>;
  private eventHistory: RedZoneEvent[];
  private pollingTimer: NodeJS.Timeout | null = null;
  private isSimulationMode = false;

  constructor(
    initialHabitations: Habitation[],
    riskAgent?: RiskAnalysisAgent,
    vulnAgent?: VulnerabilityAgent
  ) {
    this.habitationsMap = new Map(initialHabitations.map(h => [h.id, { ...h }]));
    this.staticStore = new Map();
    this.riskAgent = riskAgent || new RiskAnalysisAgent();
    this.vulnAgent = vulnAgent || new VulnerabilityAgent();
    this.listeners = new Set();
    this.eventHistory = [];

    // Initialize static data layer for habitations
    for (const h of initialHabitations) {
      this.staticStore.set(h.id, {
        elevationM: 1400 + Math.round(h.coords.lat * 30),
        slopeDeg: 18 + Math.round(h.coords.lng * 2) % 20,
        gsiLandslideSusceptibility: h.dominantHazard === 'Landslide' ? 'Very High' : 'High',
        censusPopulation: h.population,
        lastPeriodicSurveyDate: '2026-08-15'
      });
    }
  }

  public setSimulationMode(isSim: boolean): void {
    this.isSimulationMode = isSim;
  }

  public subscribe(listener: RedZoneEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getRecentEvents(count = 5): RedZoneEvent[] {
    return this.eventHistory.slice(0, count);
  }

  public getAllEvents(): RedZoneEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Evaluates incoming dynamic telemetry against threshold rules
   */
  public ingestTelemetry(telemetry: DynamicTelemetryFeed): RedZoneEvent | null {
    const habitation = this.habitationsMap.get(telemetry.habitationId);
    if (!habitation) return null;

    const staticData = this.staticStore.get(telemetry.habitationId);

    // Hazard threshold rules:
    let thresholdCrossed = false;
    let triggerHazard: HazardType = habitation.dominantHazard;
    let metricValue = '';
    let threshold = '';

    // 1. IMD Cloudburst / Flash flood threshold (> 65 mm/hr)
    if (telemetry.rainfallIntensityMmHr >= 65) {
      thresholdCrossed = true;
      triggerHazard = 'Cloudburst';
      metricValue = `${telemetry.rainfallIntensityMmHr} mm/hr`;
      threshold = 'IMD Cloudburst Standard (>= 65 mm/hr)';
    }
    // 2. CWC River Gauge Inundation threshold
    else if (telemetry.riverGaugeM >= telemetry.riverGaugeDangerLevelM) {
      thresholdCrossed = true;
      triggerHazard = 'Flood';
      metricValue = `${telemetry.riverGaugeM.toFixed(1)}m (Danger: ${telemetry.riverGaugeDangerLevelM.toFixed(1)}m)`;
      threshold = 'CWC High Flood Inundation Mark';
    }
    // 3. Slope stability creep threshold
    else if (
      telemetry.slopeInclinometerMm >= 15 || 
      (telemetry.cumulative24hMm > 110 && (staticData?.slopeDeg || 0) > 22)
    ) {
      thresholdCrossed = true;
      triggerHazard = 'Landslide';
      metricValue = `${telemetry.slopeInclinometerMm}mm creep / ${telemetry.cumulative24hMm}mm rain`;
      threshold = 'GSI Slope Rupture Warning (>= 15mm creep or >110mm rain)';
    }

    if (!thresholdCrossed) {
      return null;
    }

    // SELECTIVELY re-trigger riskAnalysisAgent + vulnerabilityAgent for this habitation ONLY
    const oldTier = habitation.priorityWindow;
    const oldScore = habitation.riskScore;

    // Run vulnerability agent
    const vulnResult = this.vulnAgent.analyzeHabitation(habitation);

    // Prepare dynamic feed for risk analysis agent
    const dynamicFeedInput: DynamicFeedInput = {
      habitationId: habitation.id,
      rainfallIntensityMmHr: telemetry.rainfallIntensityMmHr,
      riverGaugeM: telemetry.riverGaugeM,
      landslideSlipMm: telemetry.slopeInclinometerMm
    };

    // Run risk analysis agent
    const riskResult = this.riskAgent.analyzeHabitation(
      habitation,
      vulnResult.vulnerabilityScore,
      dynamicFeedInput
    );

    const newTier = riskResult.priorityWindow;
    const newScore = riskResult.compositeRiskScore;

    // Update internal habitation snapshot
    habitation.riskScore = newScore;
    habitation.vulnerabilityScore = vulnResult.vulnerabilityScore;
    habitation.priorityWindow = newTier;
    habitation.dominantHazard = triggerHazard;

    const event: RedZoneEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-GB') + ' UTC',
      habitationId: habitation.id,
      habitationName: habitation.name,
      triggerFeed: `${telemetry.sourceName} (${metricValue})`,
      hazardType: triggerHazard,
      metricValue,
      threshold,
      oldTier,
      newTier,
      oldScore,
      newScore
    };

    // Store in history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 50) {
      this.eventHistory.pop();
    }

    // Notify listeners if not in simulation mode
    if (!this.isSimulationMode) {
      this.listeners.forEach(fn => fn(event));
    }

    return event;
  }

  /**
   * Generates a realistic simulated telemetry reading for testing / live monitoring feeds
   */
  public generateSimulatedReading(habitationId: string): DynamicTelemetryFeed {
    const hab = this.habitationsMap.get(habitationId);
    const baseRain = hab?.dominantHazard === 'Cloudburst' ? 55 : 30;

    return {
      habitationId,
      source: 'IMD',
      sourceName: 'IMD Automated Weather Station (Telemetry Net-4)',
      timestamp: new Date().toISOString(),
      rainfallIntensityMmHr: baseRain + Math.floor(Math.random() * 35),
      cumulative24hMm: 80 + Math.floor(Math.random() * 50),
      riverGaugeM: 2.1 + (Math.random() * 1.5),
      riverGaugeDangerLevelM: 3.0,
      slopeInclinometerMm: Math.floor(Math.random() * 18),
      alertLevel: 'ALERT'
    };
  }

  /**
   * Starts periodic polling of simulated telemetry feeds
   */
  public startPolling(intervalMs = 12000): void {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => {
      const habIds = Array.from(this.habitationsMap.keys());
      if (habIds.length === 0) return;
      // Pick random habitation
      const randomHabId = habIds[Math.floor(Math.random() * habIds.length)];
      const telemetry = this.generateSimulatedReading(randomHabId);
      this.ingestTelemetry(telemetry);
    }, intervalMs);
  }

  public stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Manually trigger a spike for testing or live demonstrations
   */
  public triggerSpike(
    habitationId: string, 
    hazardType: HazardType = 'Cloudburst', 
    rainfallMmHr = 88
  ): RedZoneEvent | null {
    const telemetry: DynamicTelemetryFeed = {
      habitationId,
      source: 'IMD',
      sourceName: `IMD High-Altitude Doppler Alert [${hazardType}]`,
      timestamp: new Date().toISOString(),
      rainfallIntensityMmHr: rainfallMmHr,
      cumulative24hMm: 145,
      riverGaugeM: 3.8,
      riverGaugeDangerLevelM: 3.0,
      slopeInclinometerMm: 22,
      alertLevel: 'WARNING'
    };
    return this.ingestTelemetry(telemetry);
  }
}
