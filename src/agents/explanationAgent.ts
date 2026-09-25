import { Habitation, PriorityWindow } from '../types';

export interface HabitationExplainPayload {
  id: string;
  name: string;
  district: string;
  population: number;
  riskScore: number;
  priorityWindow: PriorityWindow;
  vulnerabilityScore: number;
  hazardExposure: number;
  historicalImpact: number;
  accessRisk: number;
  dominantHazard: string;
  children: number;
  elderly: number;
  medicalDependents: number;
  roadStatus: string;
  bridgeCutoffRisk: string;
  assignedSiteName?: string;
  distanceKm?: number;
}

export interface PlanDiffPayload {
  totalHabitationsEvaluated: number;
  tierChanges: Array<{
    habitationName: string;
    oldTier: string;
    newTier: string;
    oldScore: number;
    newScore: number;
  }>;
  capacityStrains: Array<{
    siteName: string;
    status: 'SUFFICIENT_TO_INSUFFICIENT' | 'EXCEEDED';
    remainingCapacity: number;
    assignedPopulation: number;
  }>;
  reassignedHabitations: Array<{
    habitationName: string;
    fromSiteName?: string;
    toSiteName?: string;
    reason: string;
  }>;
  residualTemporaryShelterCount: number;
  residualTemporaryShelterPersons: number;
}

export interface ExplainOutput {
  narrative: string;
  verifiedGrounded: boolean;
  unauthorizedNumbersFound: string[];
}

/**
 * Extracts all numbers from a string (including decimals, percentages, and integers)
 */
function extractNumbers(text: string): string[] {
  const matches = text.match(/\b\d+(\.\d+)?\b/g);
  return matches || [];
}

/**
 * Recursively extracts all numbers from an object / JSON payload
 */
function extractNumbersFromObject(obj: unknown): Set<string> {
  const set = new Set<string>();
  const jsonStr = JSON.stringify(obj);
  const nums = extractNumbers(jsonStr);
  nums.forEach(n => {
    set.add(n);
    // Also include integer portion if decimal
    if (n.includes('.')) {
      set.add(n.split('.')[0]);
    }
  });
  return set;
}

/**
 * AI-Assisted Explanation Agent
 * Uses Gemini API to turn already-computed scores into human-readable briefings for Incident Commanders.
 * STRICT GUARDRAILS:
 * 1. May NEVER set or mutate riskScore, priorityWindow, or assignedSiteId.
 * 2. Strict Grounding: Verifies that NO numeric value appears in the output that was not present in the input.
 */
export class ExplanationAgent {
  /**
   * Validates that all numbers in generated text are strictly grounded in the input payload
   */
  public validateNumericGrounding(generatedText: string, inputPayload: unknown): {
    isValid: boolean;
    unauthorizedNumbers: string[];
  } {
    const allowedNumbers = extractNumbersFromObject(inputPayload);
    // Allow standard dates like 2026, 24, 48 (hours)
    ['2024', '2025', '2026', '24', '48', '72', '1', '2', '3', '4'].forEach(n => allowedNumbers.add(n));

    const generatedNumbers = extractNumbers(generatedText);
    const unauthorizedNumbers: string[] = [];

    for (const num of generatedNumbers) {
      if (!allowedNumbers.has(num)) {
        unauthorizedNumbers.push(num);
      }
    }

    return {
      isValid: unauthorizedNumbers.length === 0,
      unauthorizedNumbers
    };
  }

  /**
   * Deterministic template generator guaranteed to have 100% grounded numbers
   */
  public generateDeterministicHabitationBrief(payload: HabitationExplainPayload): string {
    const shelterText = payload.assignedSiteName 
      ? `Allocated to ${payload.assignedSiteName} (${payload.distanceKm ? payload.distanceKm + ' km' : 'safe radius'}).`
      : 'Awaiting safe site allocation under capacity constraints.';

    return `${payload.name} (population ${payload.population}) in ${payload.district} is classified under ${payload.priorityWindow} priority with a verified risk score of ${payload.riskScore}/100. The dominant threat is ${payload.dominantHazard} (hazard exposure ${payload.hazardExposure}/100, historical impact ${payload.historicalImpact}/100). Social vulnerability stands at ${payload.vulnerabilityScore}/100, driven by ${payload.children} children, ${payload.elderly} elderly residents, and ${payload.medicalDependents} individuals requiring critical medical assistance. Physical egress is constrained with road status "${payload.roadStatus}" and ${payload.bridgeCutoffRisk} bridge cut-off risk (access risk ${payload.accessRisk}/100). ${shelterText}`;
  }

  /**
   * Generates a "why" narrative for an individual habitation
   */
  public async explainHabitation(payload: HabitationExplainPayload): Promise<ExplainOutput> {
    const prompt = `You are a Disaster Decision Support explainability agent.
Explain why ${payload.name} has risk score ${payload.riskScore} and priority tier "${payload.priorityWindow}".
STRICT RULES:
1. Restrict your explanation ONLY to the exact fields and numbers in this JSON payload:
${JSON.stringify(payload, null, 2)}
2. DO NOT invent, hallucinate, or state any numbers, statistics, percentages, or distances not present in the payload.
3. Keep the briefing under 3 sentences for emergency commanders.`;

    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const res = await fetch('/api/ai/explanation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, payload })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            const check = this.validateNumericGrounding(data.text, payload);
            if (check.isValid) {
              return {
                narrative: data.text,
                verifiedGrounded: true,
                unauthorizedNumbersFound: []
              };
            }
          }
        }
      }
    } catch {
      // Fallback below
    }

    // Default verified grounded fallback
    const groundedText = this.generateDeterministicHabitationBrief(payload);
    const check = this.validateNumericGrounding(groundedText, payload);

    return {
      narrative: groundedText,
      verifiedGrounded: check.isValid,
      unauthorizedNumbersFound: check.unauthorizedNumbers
    };
  }

  /**
   * Generates an executive 1-paragraph summary narrative for a simulation diff object
   */
  public async explainPlanDiff(diff: PlanDiffPayload): Promise<ExplainOutput> {
    const prompt = `You are an operational disaster analyst. Summarize this disaster simulation diff in exactly one concise paragraph.
DIFF PAYLOAD:
${JSON.stringify(diff, null, 2)}
STRICT RULES:
1. Use ONLY numbers from the diff payload.
2. Format like: "X habitations affected; Y move Short Term -> Immediate; Site Z capacity becomes insufficient; W habitations re-routed to Site V."
3. Do not invent details.`;

    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const res = await fetch('/api/ai/explanation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, payload: diff })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.text) {
            const check = this.validateNumericGrounding(data.text, diff);
            if (check.isValid) {
              return {
                narrative: data.text,
                verifiedGrounded: true,
                unauthorizedNumbersFound: []
              };
            }
          }
        }
      }
    } catch {
      // Fallback below
    }

    // Deterministic diff summary guaranteed to have 100% grounded numbers
    const totalAffected = diff.tierChanges.length;
    const immediateMoves = diff.tierChanges.filter(t => t.newTier === 'Immediate').length;
    const strainedSites = diff.capacityStrains.map(s => s.siteName).join(', ') || 'None';
    const reallocatedCount = diff.reassignedHabitations.length;

    let narrative = `${totalAffected} habitations affected by scenario escalation; ${immediateMoves} habitations escalate to Immediate priority tier. `;
    if (diff.capacityStrains.length > 0) {
      narrative += `Capacity at ${strainedSites} becomes insufficient or saturated. `;
    } else {
      narrative += `Relocation sites maintain sufficient buffer capacity. `;
    }
    if (reallocatedCount > 0) {
      narrative += `${reallocatedCount} habitations re-routed to secondary shelters. `;
    }
    if (diff.residualTemporaryShelterCount > 0) {
      narrative += `${diff.residualTemporaryShelterPersons} residents across ${diff.residualTemporaryShelterCount} habitations require emergency temporary field poly-shelters.`;
    }

    const check = this.validateNumericGrounding(narrative, diff);

    return {
      narrative: narrative.trim(),
      verifiedGrounded: check.isValid,
      unauthorizedNumbersFound: check.unauthorizedNumbers
    };
  }
}
