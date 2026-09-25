import { HazardType, Habitation } from '../types';

export interface IngestedHazardIntel {
  id: string;
  sourceText: string;
  location: string;
  hazardType: HazardType;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  confidence: number; // 0.0 to 1.0
  matchedHabitationId?: string;
  situationalIntelligenceBonus: number; // 0 - 15 max bonus for riskAnalysisAgent
  roadImpactMentioned?: string;
  timestamp: string;
}

export const MOCK_BULLETINS = [
  {
    id: 'BUL-01',
    source: 'State Emergency Operations Center (SEOC) Flash Disptach',
    timestamp: '25 Sep 2026, 02:40 UTC',
    text: 'URGENT: Flash flood surge and severe bank scouring observed near Gaurikund Lower sector. Local disaster response team reports 3 pedestrian culverts washed out. Slope debris creeping onto arterial road. High risk of complete cut-off within 2 hours.'
  },
  {
    id: 'BUL-02',
    source: 'NDRF 14th Battalion Ground Sitrep',
    timestamp: '25 Sep 2026, 03:10 UTC',
    text: 'Reconnaissance patrol at Rambara North Slopes reports active tension cracks widening to 45cm across hillside. Soil saturation at peak. Landslide slip potential classified EXTREME. Requesting immediate priority staging.'
  },
  {
    id: 'BUL-03',
    source: 'District Forest Officer Field Radio',
    timestamp: '25 Sep 2026, 03:25 UTC',
    text: 'Ukhimath sector reports high water velocity in Madhyamaheshwar river. Sonprayag Riverside retaining wall showing 15-degree tilt. Backwater flooding affecting lowest 20 dwellings.'
  }
];

/**
 * AI-Assisted Intelligence Ingestion Agent
 * Converts unstructured field bulletins into structured hazard signals.
 * STRICT GUARDRAIL:
 * Never sets or overwrites riskScore, priorityWindow, or assignedSiteId directly.
 * Only outputs a situational intelligence bonus (0-15) that feeds into RiskAnalysisAgent's AHP step.
 */
export class IntelligenceIngestionAgent {
  /**
   * Parses free-text bulletins into structured intelligence
   */
  public async ingestBulletin(
    bulletinText: string, 
    habitations: Habitation[]
  ): Promise<IngestedHazardIntel> {
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const res = await fetch('/api/ai/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: bulletinText })
        });
        if (res.ok) {
          const parsed = await res.json();
          if (parsed && parsed.hazardType && parsed.severity) {
            return this.normalizeAndMatch(parsed, bulletinText, habitations);
          }
        }
      }
    } catch {
      // Fallback to deterministic NLP entity extraction
    }

    return this.deterministicExtractor(bulletinText, habitations);
  }

  /**
   * Deterministic entity and sentiment extractor as safe fallback
   */
  public deterministicExtractor(
    text: string, 
    habitations: Habitation[]
  ): IngestedHazardIntel {
    const lower = text.toLowerCase();

    // 1. Hazard type
    let hazardType: HazardType = 'Flood';
    if (lower.includes('landslide') || lower.includes('slope') || lower.includes('cracks') || lower.includes('debris')) {
      hazardType = 'Landslide';
    } else if (lower.includes('cloudburst') || lower.includes('torrential') || lower.includes('deluge')) {
      hazardType = 'Cloudburst';
    } else if (lower.includes('cyclone') || lower.includes('gust')) {
      hazardType = 'Cyclone';
    } else if (lower.includes('flood') || lower.includes('surge') || lower.includes('water') || lower.includes('scouring')) {
      hazardType = 'Flood';
    }

    // 2. Severity
    let severity: IngestedHazardIntel['severity'] = 'MODERATE';
    let bonus = 6;
    if (lower.includes('extreme') || lower.includes('urgent') || lower.includes('washed out') || lower.includes('imminent')) {
      severity = 'EXTREME';
      bonus = 15;
    } else if (lower.includes('high') || lower.includes('severe') || lower.includes('breached')) {
      severity = 'HIGH';
      bonus = 11;
    } else if (lower.includes('minor') || lower.includes('slight')) {
      severity = 'LOW';
      bonus = 3;
    }

    // 3. Location match against known habitations
    let matchedHab: Habitation | undefined;
    for (const hab of habitations) {
      const habWords = hab.name.toLowerCase().split(/\s+/);
      const matched = habWords.some(w => w.length > 3 && lower.includes(w));
      if (matched) {
        matchedHab = hab;
        break;
      }
    }

    return {
      id: `INTEL-${Date.now().toString().slice(-4)}`,
      sourceText: text,
      location: matchedHab ? matchedHab.name : 'Sector Corridor',
      hazardType,
      severity,
      confidence: 0.88,
      matchedHabitationId: matchedHab?.id,
      situationalIntelligenceBonus: Math.min(15, bonus),
      roadImpactMentioned: lower.includes('road') || lower.includes('culvert') ? 'Transport corridor impaired' : undefined,
      timestamp: new Date().toISOString()
    };
  }

  private normalizeAndMatch(
    raw: { location?: string; hazardType?: string; severity?: string; confidence?: number },
    sourceText: string,
    habitations: Habitation[]
  ): IngestedHazardIntel {
    const norm = this.deterministicExtractor(sourceText, habitations);
    return {
      ...norm,
      location: raw.location || norm.location,
      hazardType: (raw.hazardType as HazardType) || norm.hazardType,
      confidence: raw.confidence || 0.90
    };
  }
}
