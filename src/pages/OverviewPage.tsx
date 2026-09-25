import React, { useState } from 'react';
import { Habitation, RelocationSite } from '../types';
import { OpenStreetMap } from '../components/OpenStreetMap';
import { 
  AlertTriangle, 
  Users, 
  Building2, 
  ShieldCheck, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  Activity, 
  Info,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  MapPin
} from 'lucide-react';

interface OverviewPageProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedDistrict: string;
  onSelectHabitation: (hab: Habitation) => void;
  onSelectSite: (site: RelocationSite) => void;
  onNavigateToGenerate: () => void;
  onNavigateToTracking: () => void;
  onNavigateToPriorities: () => void;
  onOpenBrief: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  habitations,
  sites,
  selectedDistrict,
  onSelectHabitation,
  onSelectSite,
  onNavigateToGenerate,
  onNavigateToTracking,
  onNavigateToPriorities,
  onOpenBrief
}) => {
  const [activeSideHab, setActiveSideHab] = useState<Habitation | null>(null);

  // Compute live KPIs from reactive state
  const criticalHabs = habitations.filter(h => h.priorityWindow === 'Immediate' || h.riskScore >= 80);
  const populationAtHighRisk = criticalHabs.reduce((acc, h) => acc + h.population, 0);
  const totalMaxCapacity = sites.reduce((acc, s) => acc + s.maxCapacity, 0);
  const totalOccupancy = sites.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const totalAvailableCapacity = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);
  const activeRelocationCases = habitations.filter(h => h.status === 'In Progress' || h.status === 'Assigned').length;
  const completedRelocations = habitations.filter(h => h.status === 'Relocated').length;

  // Top 5 habitations sorted by risk score descending
  const topPriorityHabs = [...habitations]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const handleMapSelectHab = (hab: Habitation) => {
    setActiveSideHab(hab);
    onSelectHabitation(hab);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Hero / Command Center Header in Crisp Light Mode */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-700 uppercase tracking-wider">
              OPERATIONAL SITUATION REPORT • MONSOON SURGE CYCLE 2026
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-600 font-mono font-semibold">SECTOR: {selectedDistrict}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Multi-Hazard Disaster Intelligence
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Decision support for proactive, capacity-feasible relocation planning. Fuses observational hydrology, slope kinematics, and demographic vulnerability to answer: <span className="text-indigo-700 font-semibold italic">“Who moves first? Where can they go? Can the destination accommodate them?”</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-overview-open-brief"
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            Authority Brief
          </button>
          <button
            id="btn-overview-launch-optimization"
            onClick={onNavigateToGenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition"
          >
            <Sparkles className="w-4 h-4" />
            Run DSS Relocation Optimization
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards in Crisp Light Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1 */}
        <div 
          onClick={onNavigateToPriorities}
          className="bg-white hover:bg-red-50/40 border border-red-200 rounded-2xl p-4.5 shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">Immediate Priority</span>
            <span className="p-1.5 rounded-xl bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{criticalHabs.length}</span>
            <span className="text-xs font-bold text-red-600">Urgent Settlements</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total in District: {habitations.length}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">Exposed Population</span>
            <span className="p-1.5 rounded-xl bg-orange-100 text-orange-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{populationAtHighRisk.toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-500">citizens</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            High-vulnerability demographic triage
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">Relocation Havens</span>
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{sites.length}</span>
            <span className="text-xs font-bold text-emerald-700">100% Screened Safe</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Avg Suitability: 91.2/100
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">Safe Carrying Headroom</span>
            <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{totalAvailableCapacity.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-medium">/ {totalMaxCapacity.toLocaleString()}</span>
          </div>
          {/* Capacity Bar */}
          <div className="mt-2 w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(totalOccupancy / totalMaxCapacity) * 100}%` }}
            />
          </div>
        </div>

        {/* KPI 5 */}
        <div 
          onClick={onNavigateToTracking}
          className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4.5 shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[11px]">Active Convey Pipeline</span>
            <span className="p-1.5 rounded-xl bg-cyan-100 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeRelocationCases}</span>
            <span className="text-xs font-bold text-emerald-700">{completedRelocations} Relocated</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tracking Pipeline Active</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

      </div>

      {/* Main OpenStreetMap + Priority Snapshot Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* OpenStreetMap GIS Component (3 Cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Interactive OpenStreetMap Multi-Hazard Spatial Intelligence
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Real OpenStreetMap tiles • Click any marker to inspect
            </span>
          </div>

          <OpenStreetMap
            habitations={habitations}
            sites={sites}
            selectedHabitation={activeSideHab}
            onSelectHabitation={handleMapSelectHab}
            onSelectSite={onSelectSite}
            heightClass="h-[580px]"
            showCorridors={true}
          />
        </div>

        {/* Right Side: Priority Snapshot & Selected Habitation Panel (1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Priority Snapshot Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Priority Snapshot
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">TOP 5 URGENT</span>
            </div>

            <div className="space-y-2.5">
              {topPriorityHabs.map((hab, idx) => (
                <div
                  key={hab.id}
                  onClick={() => handleMapSelectHab(hab)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    activeSideHab?.id === hab.id
                      ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-bold text-slate-900 text-[13px] leading-snug">
                      {idx + 1}. {hab.name.replace('Village ', '')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200 shrink-0 font-mono">
                      {hab.riskScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Pop: <strong className="text-slate-800">{hab.population.toLocaleString()}</strong></span>
                    <span className="text-amber-700 font-semibold">{hab.dominantHazard}</span>
                    <span className="text-indigo-700 font-medium">{hab.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onNavigateToPriorities}
              className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center gap-1.5 transition"
            >
              <span>View All 24 Habitations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Selected Habitation Quick Card (If one is clicked) */}
          {activeSideHab ? (
            <div className="bg-white border border-indigo-300 rounded-2xl p-4 shadow-md text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2">
                <span className="font-mono text-indigo-700 font-bold text-[11px]">{activeSideHab.code}</span>
                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                  {activeSideHab.priorityWindow}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{activeSideHab.name}</h3>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed line-clamp-2">
                {activeSideHab.historySummary}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200 text-[11px]">
                <div>Population: <strong className="text-slate-900">{activeSideHab.population.toLocaleString()}</strong></div>
                <div>Risk Score: <strong className="text-red-600 font-mono font-bold">{activeSideHab.riskScore}/100</strong></div>
                <div>Vulnerability: <strong className="text-purple-700 font-mono font-bold">{activeSideHab.vulnerabilityScore}/100</strong></div>
                <div>Action: <strong className="text-amber-800">{activeSideHab.recommendedAction}</strong></div>
              </div>
              <button
                onClick={() => onSelectHabitation(activeSideHab)}
                className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
              >
                View Full Intelligence Profile
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500 shadow-sm">
              <Info className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
              Click any habitation or safe haven on the OpenStreetMap to preview its live telemetry and relocation status.
            </div>
          )}

        </div>

      </div>

      {/* Bottom: System Insight Banner in Clean Light Styling */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-slate-50 border border-indigo-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Carrying Capacity Feasibility Insight
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              <strong className="text-slate-900 font-bold">{criticalHabs.length} habitations ({populationAtHighRisk.toLocaleString()} citizens)</strong> require immediate/short-term assessment. Currently, <strong className="text-emerald-700 font-bold">{sites.length} safe relocation sites</strong> provide <strong className="text-emerald-700 font-bold">{totalAvailableCapacity.toLocaleString()} available spots</strong>, confirming a net capacity surplus of <strong className="text-indigo-900 font-bold">{(totalAvailableCapacity - populationAtHighRisk).toLocaleString()} buffer slots</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToGenerate}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 whitespace-nowrap transition"
        >
          <span>Open Constraint Solver</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
