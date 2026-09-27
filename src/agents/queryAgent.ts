import { Habitation, RelocationSite, PriorityWindow } from '../types';
import { SiteCapacityStatus } from './capacityAgent';

export interface HabitationFilterArgs {
  district?: string;
  priority?: PriorityWindow | string;
  hasMedicalDependents?: boolean;
  dominantHazard?: string;
}

export interface SiteCapacityArgs {
  siteId: string;
}

export interface QueryToolContext {
  habitations: Habitation[];
  sites: RelocationSite[];
  capacityLedger: Record<string, SiteCapacityStatus>;
}

export interface QueryAgentResponse {
  answer: string;
  toolsCalled: Array<{
    toolName: string;
    args: Record<string, unknown>;
    resultCount: number;
    returnedHabitationNames?: string[];
  }>;
  guardrailPassed: boolean;
  guardrailRejectionReason?: string;
}

/**
 * AI-Assisted Query & RAG Agent (Intent-Routed & Tool-Grounded)
 * Scoped strictly to the application dataset using verified tool functions.
 * Employs deterministic intent routing to fetch ground-truth database records
 * before feeding results into synthesis with output entity verification.
 * STRICT GUARDRAILS:
 * 1. Model may ONLY answer questions using verified data returned by tool calls.
 * 2. Anti-Hallucination Guardrail: Any response naming a habitation NOT returned by an active tool query is strictly rejected.
 * 3. May NEVER set or mutate riskScore, priorityWindow, or assignedSiteId.
 */
export class QueryAgent {
  private context: QueryToolContext;

  constructor(context: QueryToolContext) {
    this.context = context;
  }

  public updateContext(context: QueryToolContext): void {
    this.context = context;
  }

  /**
   * Tool: getHabitationsByFilter
   */
  public getHabitationsByFilter(args: HabitationFilterArgs): Habitation[] {
    return this.context.habitations.filter(h => {
      if (args.district && !h.district.toLowerCase().includes(args.district.toLowerCase())) {
        return false;
      }
      if (args.priority && h.priorityWindow.toLowerCase() !== args.priority.toLowerCase()) {
        return false;
      }
      if (args.hasMedicalDependents === true && (h.demographics.medicalDependents || 0) <= 0) {
        return false;
      }
      if (args.dominantHazard && h.dominantHazard.toLowerCase() !== args.dominantHazard.toLowerCase()) {
        return false;
      }
      return true;
    });
  }

  /**
   * Tool: getSiteCapacity
   */
  public getSiteCapacity(siteId: string): (SiteCapacityStatus & { siteName: string; location: string }) | null {
    const site = this.context.sites.find(s => s.id === siteId || s.code === siteId);
    if (!site) return null;

    const ledger = this.context.capacityLedger[site.id];
    const avail = ledger ? ledger.availableCapacity : site.remainingCapacity;
    const maxCap = site.maxCapacity;

    return {
      siteId: site.id,
      siteName: site.name,
      location: site.location,
      maxCapacity: maxCap,
      bufferMarginPct: ledger?.bufferMarginPct ?? 15,
      bufferMarginPersons: ledger?.bufferMarginPersons ?? Math.floor(maxCap * 0.15),
      effectiveCapacity: ledger?.effectiveCapacity ?? Math.floor(maxCap * 0.85),
      currentOccupancy: site.currentOccupancy,
      availableCapacity: avail,
      occupancyPct: Number(((site.currentOccupancy / maxCap) * 100).toFixed(1)),
      isSaturated: avail <= 0,
      canAcceptSurge: (maxCap - site.currentOccupancy) > 0
    };
  }

  /**
   * Evaluates guardrail: verifies that any habitation name mentioned in text was legitimately returned by tool calls
   */
  public verifyResponseHabitations(
    responseAnswer: string,
    authorizedHabitationNames: Set<string>
  ): { isValid: boolean; unauthorizedHabitation?: string } {
    const lowerAnswer = responseAnswer.toLowerCase();

    for (const hab of this.context.habitations) {
      const lowerName = hab.name.toLowerCase();
      // Check if full name or distinct village identifier is mentioned
      if (lowerAnswer.includes(lowerName)) {
        if (!authorizedHabitationNames.has(hab.name)) {
          return {
            isValid: false,
            unauthorizedHabitation: hab.name
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Executes a user query through tool calling and strict guardrails
   */
  public async executeQuery(userQuestion: string): Promise<QueryAgentResponse> {
    const lowerQuery = userQuestion.toLowerCase();
    const toolsCalled: QueryAgentResponse['toolsCalled'] = [];
    const authorizedHabitationNames = new Set<string>();

    // Determine tool calls needed based on query intent
    let habitationsResult: Habitation[] = [];

    // Tool 1: getSiteCapacity query intent
    if (lowerQuery.includes('site') || lowerQuery.includes('capacity') || lowerQuery.includes('shelter')) {
      for (const site of this.context.sites) {
        if (
          lowerQuery.includes(site.id.toLowerCase()) || 
          lowerQuery.includes(site.code.toLowerCase()) || 
          lowerQuery.includes(site.name.toLowerCase())
        ) {
          const cap = this.getSiteCapacity(site.id);
          if (cap) {
            toolsCalled.push({
              toolName: 'getSiteCapacity',
              args: { siteId: site.id },
              resultCount: 1
            });
          }
        }
      }
    }

    // Tool 2: getHabitationsByFilter query intent
    const filterArgs: HabitationFilterArgs = {};
    if (lowerQuery.includes('immediate')) filterArgs.priority = 'Immediate';
    else if (lowerQuery.includes('short-term') || lowerQuery.includes('short term')) filterArgs.priority = 'Short-term';
    else if (lowerQuery.includes('medium-term') || lowerQuery.includes('medium term')) filterArgs.priority = 'Medium-term';

    if (lowerQuery.includes('medical') || lowerQuery.includes('patients') || lowerQuery.includes('assisted')) {
      filterArgs.hasMedicalDependents = true;
    }
    if (lowerQuery.includes('flood')) filterArgs.dominantHazard = 'Flood';
    if (lowerQuery.includes('landslide')) filterArgs.dominantHazard = 'Landslide';
    if (lowerQuery.includes('cloudburst')) filterArgs.dominantHazard = 'Cloudburst';

    habitationsResult = this.getHabitationsByFilter(filterArgs);
    habitationsResult.forEach(h => authorizedHabitationNames.add(h.name));

    toolsCalled.push({
      toolName: 'getHabitationsByFilter',
      args: filterArgs as Record<string, unknown>,
      resultCount: habitationsResult.length,
      returnedHabitationNames: habitationsResult.map(h => h.name)
    });

    // Try server-side LLM tool synthesis if available
    let generatedAnswer = '';
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const res = await fetch('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userQuestion,
            toolResults: {
              habitations: habitationsResult.slice(0, 10).map(h => ({
                id: h.id,
                name: h.name,
                priority: h.priorityWindow,
                riskScore: h.riskScore,
                population: h.population,
                medicalDependents: h.demographics.medicalDependents,
                dominantHazard: h.dominantHazard
              })),
              toolsCalled
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.answer) {
            generatedAnswer = data.answer;
          }
        }
      }
    } catch {
      // Fallback below
    }

    if (!generatedAnswer) {
      // Grounded deterministic response synthesis based strictly on tool results
      if (toolsCalled.some(t => t.toolName === 'getSiteCapacity')) {
        const siteStatus = this.context.sites.map(s => this.getSiteCapacity(s.id)).filter(Boolean);
        const details = siteStatus
          .slice(0, 3)
          .map(s => `${s!.siteName}: Available capacity ${s!.availableCapacity} persons (${s!.occupancyPct}% utilized).`)
          .join(' ');
        generatedAnswer = `Site capacity analysis from verified ledger: ${details}`;
      } else {
        const count = habitationsResult.length;
        const names = habitationsResult.slice(0, 4).map(h => `${h.name} (Risk ${h.riskScore}, ${h.priorityWindow})`).join(', ');
        generatedAnswer = `Based on database tool query matching your criteria, ${count} habitations found: ${names}${count > 4 ? ` and ${count - 4} others.` : '.'}`;
      }
    }

    // STRICT GUARDRAIL CHECK:
    // Reject any response naming a habitation not returned by a tool call!
    const guardrailCheck = this.verifyResponseHabitations(generatedAnswer, authorizedHabitationNames);

    if (!guardrailCheck.isValid) {
      return {
        answer: `[SECURITY GUARDRAIL TRIGGERED] Response rejected: The AI agent attempted to mention an unverified habitation ("${guardrailCheck.unauthorizedHabitation}") that was NOT returned by the data query tool. Hallucination blocked.`,
        toolsCalled,
        guardrailPassed: false,
        guardrailRejectionReason: `Referenced unverified habitation "${guardrailCheck.unauthorizedHabitation}" not in tool return set.`
      };
    }

    return {
      answer: generatedAnswer,
      toolsCalled,
      guardrailPassed: true
    };
  }
}
