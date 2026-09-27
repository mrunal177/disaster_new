import React, { useState } from 'react';
import { 
  Habitation, 
  RelocationSite, 
  GeneratedPlanResult, 
  OptimizationParameters,
  PriorityWindow
} from '../types';
import { Orchestrator, PipelineExecutionProgress } from '../agents/orchestrator';
import { ScenarioOverrides } from '../agents/scenarioAgent';
import { StructuredPlanDiff } from '../agents/diffEngine';
import { QueryAgent, QueryAgentResponse } from '../agents/queryAgent';
import { ExplainOutput } from '../agents/explanationAgent';
import { OpenStreetMap } from '../components/OpenStreetMap';
import { PipelineFlowchart } from '../components/PipelineFlowchart';
import { SimulatorPanel } from '../components/SimulatorPanel';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Bot, 
  Sparkles, 
  Send, 
  Compass, 
  FileText, 
  Activity, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Cpu,
  Info
} from 'lucide-react';

interface AuthorityDashboardPageProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedDistrict: string;
  orchestrator: Orchestrator;
  activePlan: GeneratedPlanResult | null;
  onSelectHabitation: (hab: Habitation) => void;
  onSelectSite: (site: RelocationSite) => void;
  onUpdatePlan: (plan: GeneratedPlanResult) => void;
}

export const AuthorityDashboardPage: React.FC<AuthorityDashboardPageProps> = ({
  habitations,
  sites,
  selectedDistrict,
  orchestrator,
  activePlan,
  onSelectHabitation,
  onSelectSite,
  onUpdatePlan
}) => {
  // Operational Mode: Live Operations vs What-If Simulator
  const [dashboardMode, setDashboardMode] = useState<'live' | 'simulator'>('live');

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDiff, setSimulationDiff] = useState<StructuredPlanDiff | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineExecutionProgress | null>(null);

  // Per-habitation explanation drawer state
  const [selectedHabForExplanation, setSelectedHabForExplanation] = useState<Habitation | null>(null);
  const [explanationMap, setExplanationMap] = useState<Map<string, ExplainOutput>>(new Map());
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Query Agent chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    toolsCalled?: QueryAgentResponse['toolsCalled'];
    guardrailPassed?: boolean;
    timestamp: string;
  }>>([
    {
      sender: 'assistant',
      text: 'SDMA Decision Support Intelligence initialized. You may query habitations by risk priority, medical vulnerability, or inspect shelter capacities.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  // Initialize Query Agent instance
  const [queryAgent] = useState(() => new QueryAgent({
    habitations,
    sites,
    capacityLedger: {}
  }));

  // Handle running what-if simulation
  const handleRunSimulation = async (overrides: ScenarioOverrides) => {
    setIsSimulating(true);
    try {
      const defaultParams: OptimizationParameters = {
        planningHorizon: '48h',
        priorityThreshold: 'Immediate + Short-term',
        objective: 'Balanced',
        maxDistanceKm: 35,
        capacityBufferMarginPct: 15,
        requireMedicalFacility: false,
        preserveCommunityCoherence: true
      };

      const result = await orchestrator.runScenario(
        overrides,
        habitations,
        sites,
        activePlan,
        defaultParams
      );

      setSimulationDiff(result.diff);
    } catch (err: any) {
      console.error('Simulation execution error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle clicking a habitation to inspect AI explanation
  const handleInspectExplanation = async (hab: Habitation) => {
    setSelectedHabForExplanation(hab);
    if (!explanationMap.has(hab.id)) {
      setLoadingExplanation(true);
      try {
        const assignment = activePlan?.assignments.find(a => a.habitationId === hab.id);
        const explanation = await orchestrator.explanationAgent.explainHabitation({
          id: hab.id,
          name: hab.name,
          district: hab.district,
          population: hab.population,
          riskScore: hab.riskScore,
          priorityWindow: hab.priorityWindow,
          vulnerabilityScore: hab.vulnerabilityScore,
          hazardExposure: hab.hazardExposure,
          historicalImpact: hab.historicalImpact,
          accessRisk: hab.accessRisk,
          dominantHazard: hab.dominantHazard,
          children: hab.demographics.children,
          elderly: hab.demographics.elderly,
          medicalDependents: hab.demographics.medicalDependents,
          roadStatus: hab.accessibility.roadStatus,
          bridgeCutoffRisk: hab.accessibility.bridgeCutoffRisk,
          assignedSiteName: assignment?.assignedSiteName,
          distanceKm: assignment?.distanceKm
        });
        setExplanationMap(prev => new Map(prev).set(hab.id, explanation));
      } finally {
        setLoadingExplanation(false);
      }
    }
  };

  // Handle Query Agent message send
  const handleSendMessage = async () => {
    if (!inputQuery.trim() || isQuerying) return;
    const userMsg = inputQuery.trim();
    setInputQuery('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: time }]);
    setIsQuerying(true);

    try {
      queryAgent.updateContext({
        habitations,
        sites,
        capacityLedger: {}
      });
      const response = await queryAgent.executeQuery(userMsg);

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: response.answer,
          toolsCalled: response.toolsCalled,
          guardrailPassed: response.guardrailPassed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Error processing intelligence query. Verification guardrails remain active.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top SDMA Command Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  SDMA Incident Command Dashboard
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Sector: <span className="font-semibold text-slate-700">{selectedDistrict}</span> · Multi-Hazard AHP Decision Pipeline with What-If Simulation
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher: Live Operations vs What-If Simulator */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setDashboardMode('live')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              dashboardMode === 'live'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Operations
          </button>
          <button
            onClick={() => setDashboardMode('simulator')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              dashboardMode === 'simulator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            What-If Simulator Mode
          </button>
        </div>
      </div>

      {/* Pipeline Flowchart Component */}
      <PipelineFlowchart
        progress={pipelineProgress}
        redZoneMonitor={orchestrator.redZoneMonitor}
        onTriggerSpike={(habId) => {
          orchestrator.redZoneMonitor.triggerSpike(habId, 'Cloudburst', 92);
        }}
      />

      {/* What-If Simulator Panel (Displayed in Simulator Mode) */}
      {dashboardMode === 'simulator' && (
        <SimulatorPanel
          liveHabitations={habitations}
          liveSites={sites}
          isRunning={isSimulating}
          onRunSimulation={handleRunSimulation}
          simulationDiff={simulationDiff}
          onReset={() => setSimulationDiff(null)}
        />
      )}

      {/* Main Grid: GIS Map & Habitations Priority List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: GIS Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col min-h-[580px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Tactical GIS Spatial Overview
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Immediate ({habitations.filter(h => h.priorityWindow === 'Immediate').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Short-term ({habitations.filter(h => h.priorityWindow === 'Short-term').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Safe Sites ({sites.length})
              </span>
            </div>
          </div>

          <div className="flex-1 w-full h-[520px]">
            <OpenStreetMap
              habitations={habitations}
              sites={sites}
              onSelectHabitation={onSelectHabitation}
              onSelectSite={onSelectSite}
            />
          </div>
        </div>

        {/* Right: Priority Roster & Per-Habitation AI Explanation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Priority List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                AHP Risk Prioritization Roster
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                CR: {orchestrator.riskAgent.getAhpResult().consistencyRatio} (≤ 0.10)
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {habitations
                .slice()
                .sort((a, b) => b.riskScore - a.riskScore)
                .map(hab => {
                  const isImmediate = hab.priorityWindow === 'Immediate';
                  return (
                    <div
                      key={hab.id}
                      onClick={() => handleInspectExplanation(hab)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedHabForExplanation?.id === hab.id
                          ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{hab.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isImmediate
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {hab.priorityWindow}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pop: {hab.population} · Dominant: {hab.dominantHazard} · Vulnerability: {hab.vulnerabilityScore}/100
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          {hab.riskScore}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/100</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* AI Explainability Card for Selected Habitation */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  AI Explanation Agent Audit Brief
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Number-Grounded
              </span>
            </div>

            {selectedHabForExplanation ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-white">{selectedHabForExplanation.name}</h4>
                  <span className="text-xs font-mono text-indigo-300">
                    Risk: {selectedHabForExplanation.riskScore} · {selectedHabForExplanation.priorityWindow}
                  </span>
                </div>

                {loadingExplanation ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-indigo-300 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating audit narrative...
                  </div>
                ) : (
                  <p className="text-xs text-indigo-100 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                    "{explanationMap.get(selectedHabForExplanation.id)?.narrative || 
                      orchestrator.explanationAgent.generateDeterministicHabitationBrief({
                        id: selectedHabForExplanation.id,
                        name: selectedHabForExplanation.name,
                        district: selectedHabForExplanation.district,
                        population: selectedHabForExplanation.population,
                        riskScore: selectedHabForExplanation.riskScore,
                        priorityWindow: selectedHabForExplanation.priorityWindow,
                        vulnerabilityScore: selectedHabForExplanation.vulnerabilityScore,
                        hazardExposure: selectedHabForExplanation.hazardExposure,
                        historicalImpact: selectedHabForExplanation.historicalImpact,
                        accessRisk: selectedHabForExplanation.accessRisk,
                        dominantHazard: selectedHabForExplanation.dominantHazard,
                        children: selectedHabForExplanation.demographics.children,
                        elderly: selectedHabForExplanation.demographics.elderly,
                        medicalDependents: selectedHabForExplanation.demographics.medicalDependents,
                        roadStatus: selectedHabForExplanation.accessibility.roadStatus,
                        bridgeCutoffRisk: selectedHabForExplanation.accessibility.bridgeCutoffRisk
                      })}"
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-300">
                  <span>Demographics: {selectedHabForExplanation.demographics.children} kids, {selectedHabForExplanation.demographics.elderly} elderly</span>
                  <span className="font-mono">Medical: {selectedHabForExplanation.demographics.medicalDependents}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-indigo-300 italic">
                Select any habitation in the roster above to inspect its verified audit explanation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relocation Plan Overview & QueryAgent Interactive Assistant Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Relocation Plan Overview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Relocation Plan Allocation & Binding Constraints
              </h3>
            </div>
            {activePlan && (
              <span className="text-[11px] font-mono text-slate-500">
                Plan ID: {activePlan.planId} · Avg Dist: {activePlan.averageDistanceKm} km
              </span>
            )}
          </div>

          {activePlan && activePlan.assignments.length > 0 ? (
            <div className="space-y-3">
              {activePlan.assignments.slice(0, 5).map(assignment => (
                <div
                  key={assignment.habitationId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col gap-2 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{assignment.habitationName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {assignment.assignedSiteName}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {assignment.population.toLocaleString()} residents · {assignment.distanceKm} km
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {assignment.bindingConstraints.map((bc, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                      >
                        ✓ {bc}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No active relocation plan generated yet. Navigate to 'Generate Plan' or run a simulation.
            </div>
          )}
        </div>

        {/* QueryAgent Chat Assistant Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[480px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                SDMA Intelligence Assistant (QueryAgent)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Intent-Routed & Tool-Grounded RAG
            </span>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Tool execution badge */}
                  {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                      {msg.toolsCalled.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/70 text-slate-600 border border-slate-300"
                        >
                          ⚡ tool: {tool.toolName} ({tool.resultCount} records)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}
            {isQuerying && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                QueryAgent executing verified database tools...
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask e.g. 'Which Immediate habitations have medical dependents?'"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isQuerying}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
