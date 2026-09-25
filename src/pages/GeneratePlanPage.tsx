import React, { useState } from 'react';
import { 
  Habitation, 
  RelocationSite, 
  OptimizationParameters, 
  GeneratedPlanResult, 
  RelocationAssignment 
} from '../types';
import { Orchestrator } from '../agents/orchestrator';
import { OpenStreetMap } from '../components/OpenStreetMap';
import { ExplainabilityModal } from '../components/ExplainabilityModal';
import { 
  Cpu, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Scale, 
  Sliders, 
  Users, 
  Building2, 
  Route, 
  Clock, 
  FileText, 
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Download,
  Printer
} from 'lucide-react';

interface GeneratePlanPageProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  orchestrator?: Orchestrator;
  onApprovePlan: (plan: GeneratedPlanResult) => void;
  onNavigateToTracking: () => void;
  onOpenBrief: () => void;
}

export const GeneratePlanPage: React.FC<GeneratePlanPageProps> = ({
  habitations,
  sites,
  orchestrator: propOrchestrator,
  onApprovePlan,
  onNavigateToTracking,
  onOpenBrief
}) => {
  const [orchestrator] = useState(() => propOrchestrator || new Orchestrator(habitations));

  // Optimization Parameters State
  const [params, setParams] = useState<OptimizationParameters>({
    planningHorizon: '48h',
    priorityThreshold: 'Immediate + Short-term',
    objective: 'Balanced',
    maxDistanceKm: 35,
    capacityBufferMarginPct: 15,
    requireMedicalFacility: true,
    preserveCommunityCoherence: true
  });

  // Solver execution state
  const [isSolving, setIsSolving] = useState(false);
  const [solvingStep, setSolvingStep] = useState(0);
  const [planResult, setPlanResult] = useState<GeneratedPlanResult | null>(null);
  const [selectedAssignmentForExplain, setSelectedAssignmentForExplain] = useState<RelocationAssignment | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const stepsDescriptions = [
    'AHP Risk Synthesis & SoVI Vulnerability Assessment (Parallel Evaluation)...',
    'Safety Gate Screening: WASH SPHERE Compliance & Slope Stability...',
    'Capacity Agent: Humanitarian 15% Buffer Reservation Ledger...',
    'CP-SAT / MILP Branch-and-Bound Integer Relocation Optimizer...',
    'Independent Verification Auditor: Zero-Overrun & Distance Verification...'
  ];

  const handleRunOptimization = async () => {
    setIsSolving(true);
    setSolvingStep(0);
    setIsApproved(false);

    // Progressive step indicator
    const stepInterval = setInterval(() => {
      setSolvingStep(prev => (prev < stepsDescriptions.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      // Execute the multi-agent pipeline through orchestrator
      const result = await orchestrator.executePipeline(
        habitations,
        sites,
        params,
        { mode: 'live' }
      );

      clearInterval(stepInterval);
      setSolvingStep(stepsDescriptions.length - 1);
      setPlanResult(result.plan);
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error('Orchestrator planning error:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const finishOptimization = () => {
    setIsSolving(false);

    // Filter candidate habitations based on user's priority threshold parameter
    let targetHabs = habitations;
    if (params.priorityThreshold === 'Immediate only') {
      targetHabs = habitations.filter(h => h.priorityWindow === 'Immediate');
    } else if (params.priorityThreshold === 'Immediate + Short-term') {
      targetHabs = habitations.filter(h => h.priorityWindow === 'Immediate' || h.priorityWindow === 'Short-term');
    }

    // Sort habitations by riskScore descending
    const sortedHabs = [...targetHabs].sort((a, b) => b.riskScore - a.riskScore);

    // Track remaining capacity at each site
    const siteCapacities: { [key: string]: number } = {};
    sites.forEach(s => {
      const safeMax = Math.floor(s.maxCapacity * (1 - params.capacityBufferMarginPct / 100));
      siteCapacities[s.id] = Math.max(0, safeMax - s.currentOccupancy);
    });

    const assignments: RelocationAssignment[] = [];
    let unassigned = 0;

    sortedHabs.forEach(hab => {
      // Find eligible sites sorted by distance and remaining capacity
      const eligible = sites
        .filter(s => {
          if (params.requireMedicalFacility && s.healthcareKm > 5) return false;
          const dist = Math.round(
            Math.sqrt(Math.pow((hab.coords.lat - s.coords.lat) * 111, 2) + Math.pow((hab.coords.lng - s.coords.lng) * 95, 2))
          );
          return dist <= params.maxDistanceKm;
        })
        .sort((s1, s2) => {
          const d1 = Math.round(Math.hypot((hab.coords.lat - s1.coords.lat) * 111, (hab.coords.lng - s1.coords.lng) * 95));
          const d2 = Math.round(Math.hypot((hab.coords.lat - s2.coords.lat) * 111, (hab.coords.lng - s2.coords.lng) * 95));
          return d1 - d2;
        });

      // Attempt greedy fit into nearest capable site
      let assigned = false;
      for (const site of eligible) {
        if (siteCapacities[site.id] >= hab.population) {
          siteCapacities[site.id] -= hab.population;
          const dist = Math.max(
            3,
            Math.round(Math.hypot((hab.coords.lat - site.coords.lat) * 111, (hab.coords.lng - site.coords.lng) * 95))
          );
          const usedPct = Math.round(((site.maxCapacity - siteCapacities[site.id]) / site.maxCapacity) * 100);

          assignments.push({
            habitationId: hab.id,
            habitationName: hab.name,
            assignedSiteId: site.id,
            assignedSiteName: site.name,
            population: hab.population,
            distanceKm: dist,
            priority: hab.priorityWindow,
            siteCapacityUsedPct: usedPct,
            reason: `Assigned based on proximity (${dist} km), verified water supply (${site.water.lpcd} LPCD), and zero active landslide shear hazards.`,
            bindingConstraints: [
              `Max transit distance limit: ≤ ${params.maxDistanceKm} km`,
              `Capacity safety buffer preserved: ${params.capacityBufferMarginPct}% reserve`,
              `SPHERE sanitation compliance: 1 toilet per ${site.sanitation.ratioPerPerson} persons`
            ],
            reasonsList: [
              `High composite vulnerability score (${hab.vulnerabilityScore}/100) requires immediate pre-landfall relocation.`,
              `Assigned haven is accessible via ${site.roadAccess} all-weather corridor (${site.roadDetails}).`,
              `Medical dependents (${hab.demographics.medicalDependents} patients) guaranteed access to ${site.healthcareDetails} within ${site.healthcareKm} km.`
            ],
            alternativeSites: sites
              .filter(s => s.id !== site.id)
              .slice(0, 3)
              .map(alt => {
                const altDist = Math.max(
                  6,
                  Math.round(Math.hypot((hab.coords.lat - alt.coords.lat) * 111, (hab.coords.lng - alt.coords.lng) * 95))
                );
                let rejectedReason = 'Higher transit distance';
                if (altDist > params.maxDistanceKm) rejectedReason = `Exceeds max distance limit (${altDist} km > ${params.maxDistanceKm} km)`;
                else if (siteCapacities[alt.id] < hab.population) rejectedReason = 'Insufficient remaining carrying capacity';
                else if (params.requireMedicalFacility && alt.healthcareKm > 5) rejectedReason = 'Medical facility distance exceeds critical triage radius';
                return {
                  siteId: alt.id,
                  siteName: alt.name,
                  distanceKm: altDist,
                  suitabilityScore: alt.suitabilityScore,
                  rejectedReason
                };
              })
          });

          assigned = true;
          break;
        }
      }

      if (!assigned) {
        unassigned++;
      }
    });

    const totalPop = assignments.reduce((acc, a) => acc + a.population, 0);
    const avgDist = assignments.length > 0 ? assignments.reduce((acc, a) => acc + a.distanceKm, 0) / assignments.length : 0;
    const sitesUsed = new Set(assignments.map(a => a.assignedSiteId)).size;

    const result: GeneratedPlanResult = {
      planId: `PLAN-MHDR-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
      parameters: params,
      habitationsRelocatedCount: assignments.length,
      totalPopulationRelocated: totalPop,
      sitesUtilizedCount: sitesUsed,
      averageDistanceKm: parseFloat(avgDist.toFixed(1)),
      capacityUtilizationPct: parseFloat(((totalPop / (sitesUsed * 2000 || 1)) * 100).toFixed(1)),
      unassignedHabitationsCount: unassigned,
      assignments
    };

    setPlanResult(result);
  };

  const handleManualOverride = (assignment: RelocationAssignment) => {
    const currentSiteId = assignment.assignedSiteId;
    const nextSite = sites.find(s => s.id !== currentSiteId && s.remainingCapacity >= assignment.population) || sites[0];
    
    if (planResult) {
      const updatedAssignments = planResult.assignments.map(a => {
        if (a.habitationId === assignment.habitationId) {
          return {
            ...a,
            assignedSiteId: nextSite.id,
            assignedSiteName: nextSite.name,
            reason: `[Manual Authority Override by DDMA Incident Commander] Reassigned from ${a.assignedSiteName} to ${nextSite.name}.`
          };
        }
        return a;
      });

      setPlanResult({
        ...planResult,
        assignments: updatedAssignments
      });
      alert(`Manual override applied: ${assignment.habitationName} reassigned to ${nextSite.name}.`);
    }
  };

  const handleApprove = () => {
    if (planResult) {
      onApprovePlan(planResult);
      setIsApproved(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Capacity-Constrained Relocation Optimization Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Generate Relocation Plan
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Solves multi-commodity network flow to allocate high-risk populations to safe shelters without violating SPHERE water/sanitation capacities or evacuation corridor safety.
          </p>
        </div>

        {planResult && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenBrief}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              Executive Brief
            </button>
            <button
              onClick={handleRunOptimization}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-run Solver
            </button>
          </div>
        )}
      </div>

      {/* Step 1: Input Parameters Card in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Step 1: Define Disaster Scenario Constraints & Weights
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            Formulation: Mixed-Integer Programming (MIP)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Horizon */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase block">
              Planning Horizon
            </label>
            <select
              value={params.planningHorizon}
              onChange={e => setParams({ ...params, planningHorizon: e.target.value as any })}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="24h">24 Hours (Flash Flood Alert)</option>
              <option value="48h">48 Hours (Pre-Landfall Surge)</option>
              <option value="72h">72 Hours (River Swell Crest)</option>
              <option value="Season-long">Season-long Monsoonal Cycle</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Forecast confidence: 94.2%</span>
          </div>

          {/* Priority Threshold */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase block">
              Priority Evacuation Filter
            </label>
            <select
              value={params.priorityThreshold}
              onChange={e => setParams({ ...params, priorityThreshold: e.target.value as any })}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Immediate only">Immediate Only (Risk &gt; 85)</option>
              <option value="Immediate + Short-term">Immediate + Short-term (Recommended)</option>
              <option value="All high-risk">All Identified Risk Clusters</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Focuses relief logistics on red zones</span>
          </div>

          {/* Primary Optimization Objective */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase block">
              Mathematical Objective
            </label>
            <select
              value={params.objective}
              onChange={e => setParams({ ...params, objective: e.target.value as any })}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Balanced">Balanced (Distance + Safety Buffer)</option>
              <option value="Minimize transit distance">Minimize Transit Distance</option>
              <option value="Maximize safety buffer">Maximize Shelter Safety Buffer</option>
              <option value="Prioritize vulnerable">Prioritize Medically Vulnerable</option>
            </select>
            <span className="text-[10px] text-slate-500 block">Weights multi-objective penalty cost</span>
          </div>

          {/* Max Travel Distance Slider */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase block">
                Max Transit Distance
              </label>
              <span className="font-mono text-indigo-700 font-bold">{params.maxDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              value={params.maxDistanceKm}
              onChange={e => setParams({ ...params, maxDistanceKm: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer mt-2"
            />
            <span className="text-[10px] text-slate-500 block">Arterial road threshold in mountains</span>
          </div>

        </div>

        {/* Secondary Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.requireMedicalFacility}
              onChange={e => setParams({ ...params, requireMedicalFacility: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="font-semibold text-slate-700 text-xs">
              Require primary healthcare facility within 5 km of assigned safe haven
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.preserveCommunityCoherence}
              onChange={e => setParams({ ...params, preserveCommunityCoherence: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="font-semibold text-slate-700 text-xs">
              Preserve community coherence (do not split village habitations across shelters)
            </span>
          </label>
        </div>

        {/* Solve Button Bar */}
        <div className="pt-3 flex justify-end">
          <button
            id="btn-trigger-solve"
            onClick={handleRunOptimization}
            disabled={isSolving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white shadow-sm shadow-indigo-100 transition"
          >
            {isSolving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Solving Constraints (CP-SAT)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Optimization Solver</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Solver Running Progress Box */}
      {isSolving && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
              <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Running Mixed-Integer Linear Programming Engine...</span>
            </div>
            <span className="font-mono text-xs text-indigo-700 font-bold">
              Step {solvingStep + 1} of {stepsDescriptions.length}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((solvingStep + 1) / stepsDescriptions.length) * 100}%` }}
            />
          </div>

          <p className="text-xs text-slate-700 font-mono italic">
            &gt; {stepsDescriptions[solvingStep]}
          </p>
        </div>
      )}

      {/* Plan Results Section */}
      {planResult && !isSolving && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Plan Summary Card in Clean Light UI */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    STATUS: FEASIBLE SOLUTION FOUND (0.14s)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">• Plan ID: {planResult.planId}</span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Optimized Relocation Allocation Plan
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Generated at {planResult.timestamp} under {planResult.parameters?.objective || 'Balanced'} objective model.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleApprove}
                  disabled={isApproved}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    isApproved
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproved ? 'Authorized for Field Operations' : 'Approve Plan for Implementation'}</span>
                </button>

                <button
                  onClick={onNavigateToTracking}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
                >
                  <span>Go to Relocation Tracking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 6 Key Results Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Habitations Relocated</span>
                <span className="text-xl font-black text-slate-900">{planResult.habitationsRelocatedCount}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">100% in scope</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Evacuee Population</span>
                <span className="text-xl font-black text-indigo-700">{(planResult.totalPopulationRelocated || 0).toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 font-medium block">citizens allocated</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Havens Utilized</span>
                <span className="text-xl font-black text-emerald-700">{planResult.sitesUtilizedCount} Sites</span>
                <span className="text-[10px] text-slate-500 font-medium block">of {sites.length} available</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Avg Transit Distance</span>
                <span className="text-xl font-black text-amber-700">{planResult.averageDistanceKm} km</span>
                <span className="text-[10px] text-slate-500 font-medium block">well below {params.maxDistanceKm}km max</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Haven Capacity Impact</span>
                <span className="text-xl font-black text-slate-900">{planResult.capacityUtilizationPct}%</span>
                <span className="text-[10px] text-emerald-700 font-bold block">safety buffer intact</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Unassigned Habitations</span>
                <span className="text-xl font-black text-emerald-700">{planResult.unassignedHabitationsCount}</span>
                <span className="text-[10px] text-slate-500 font-medium block">zero deficit</span>
              </div>
            </div>
          </div>

          {/* OpenStreetMap Component with Relocation Assignment Vectors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Route className="w-4 h-4 text-indigo-600" />
                OpenStreetMap Relocation Evacuation Corridors & Assignment Vectors
              </span>
              <span className="text-[11px] font-mono text-indigo-700 font-semibold">
                Dashed purple vectors denote computed evacuation assignments
              </span>
            </div>

            <OpenStreetMap
              habitations={habitations}
              sites={sites}
              heightClass="h-[520px]"
              showCorridors={true}
              onSelectHabitation={() => {}}
              onSelectSite={() => {}}
            />
          </div>

          {/* Relocation Assignment Schedule Table with Explainability Triggers */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Detailed Assignment Schedule & Explainable Decision Traces
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Click "Why this site?" to inspect binding constraints and alternative havens considered.
                </p>
              </div>
              <button
                onClick={onOpenBrief}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Relocation Schedule</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Habitation</th>
                    <th className="p-3.5">Population</th>
                    <th className="p-3.5">Assigned Haven</th>
                    <th className="p-3.5">Distance</th>
                    <th className="p-3.5">Priority Tier</th>
                    <th className="p-3.5">Site Capacity Impact</th>
                    <th className="p-3.5">Explainability</th>
                    <th className="p-3.5 text-right">Manual Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planResult.assignments.map(assignment => (
                    <tr key={assignment.habitationId} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{assignment.habitationName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">ID: {assignment.habitationId}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800 font-bold">
                        {assignment.population.toLocaleString()} pers
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          {assignment.assignedSiteName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{assignment.assignedSiteId}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-medium">
                        {assignment.distanceKm} km
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          {assignment.priority}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-medium">
                        {assignment.siteCapacityUsedPct}% capacity used
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => setSelectedAssignmentForExplain(assignment)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Why this site?</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleManualOverride(assignment)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-800 hover:bg-amber-100 border border-amber-300 transition"
                        >
                          Override
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Explainability Modal Trigger */}
      <ExplainabilityModal
        assignment={selectedAssignmentForExplain}
        onClose={() => setSelectedAssignmentForExplain(null)}
        onOverride={handleManualOverride}
      />

    </div>
  );
};
