import React, { useState } from 'react';
import { Habitation, RelocationSite } from '../types';
import { OpenStreetMap } from '../components/OpenStreetMap';
import { 
  ShieldAlert, 
  Filter, 
  Layers, 
  Activity, 
  AlertTriangle, 
  Compass, 
  Calendar, 
  Building2, 
  Users, 
  HelpCircle,
  BarChart2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface RiskIntelligencePageProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedHabitation: Habitation | null;
  onSelectHabitation: (hab: Habitation) => void;
  onSelectSite: (site: RelocationSite) => void;
}

export const RiskIntelligencePage: React.FC<RiskIntelligencePageProps> = ({
  habitations,
  sites,
  selectedHabitation,
  onSelectHabitation,
  onSelectSite
}) => {
  const [selectedTaluka, setSelectedTaluka] = useState('All');
  const [selectedHazard, setSelectedHazard] = useState('All');
  const [selectedRiskTier, setSelectedRiskTier] = useState('All');
  const [selectedHab, setSelectedHab] = useState<Habitation>(
    selectedHabitation || habitations[0]
  );

  const talukas = ['All', 'Ukhimath', 'Joshimath', 'Chamoli', 'Rudraprayag', 'Tharali', 'Karnaprayag'];
  const hazardTypes = ['All', 'Flood', 'Landslide', 'Cloudburst', 'Multi-hazard'];
  const riskTiers = ['All', 'Immediate', 'Short-term', 'Medium-term', 'Monitor'];

  // Filter habitations according to selectors
  const filteredHabitations = habitations.filter(h => {
    if (selectedTaluka !== 'All' && h.taluka !== selectedTaluka) return false;
    if (selectedHazard !== 'All' && selectedHazard !== 'Multi-hazard' && h.dominantHazard !== selectedHazard) return false;
    if (selectedRiskTier !== 'All' && h.priorityWindow !== selectedRiskTier) return false;
    return true;
  });

  const handleSelect = (h: Habitation) => {
    setSelectedHab(h);
    onSelectHabitation(h);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Crisp Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Multi-Hazard Data Fusion & InSAR Geotechnical Zonation</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Habitation-Level Risk Intelligence
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Integrates CWC river gauge thresholds, IMD convective nowcasts, GSI landslide shear planes, and local census vulnerability matrices into a multi-hazard composite priority index.
          </p>
        </div>

        {/* Governance Disclaimer */}
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 max-w-sm">
          <strong className="text-indigo-950 block font-bold mb-0.5">Decision-Support Positioning:</strong>
          This intelligence system fuses existing validated government observations. It is not an autonomous prediction model.
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-bold uppercase tracking-wider text-[11px] mr-2">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          Filter Spatial Feeds:
        </div>

        {/* Taluka Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Taluka:</span>
          <select
            value={selectedTaluka}
            onChange={e => setSelectedTaluka(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {talukas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Hazard Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Dominant Hazard:</span>
          <select
            value={selectedHazard}
            onChange={e => setSelectedHazard(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {hazardTypes.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600 font-medium">Priority Tier:</span>
          <select
            value={selectedRiskTier}
            onChange={e => setSelectedRiskTier(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {riskTiers.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Active Matches Count */}
        <div className="ml-auto font-mono text-slate-500 text-[11px]">
          Showing <strong className="text-slate-900 font-bold">{filteredHabitations.length}</strong> of {habitations.length} Habitations
        </div>
      </div>

      {/* Main Section: OpenStreetMap GIS (Left) + Detailed Risk & Vulnerability Profile (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OpenStreetMap Component with Hazard Layers */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              OpenStreetMap Multi-Hazard Inundation & Slope Matrix
            </span>
            <span>Click any node to load comprehensive risk profile</span>
          </div>

          <OpenStreetMap
            habitations={filteredHabitations}
            sites={sites}
            selectedHabitation={selectedHab}
            onSelectHabitation={handleSelect}
            onSelectSite={onSelectSite}
            heightClass="h-[620px]"
            filterHazard={selectedHazard}
          />
        </div>

        {/* Right: Selected Habitation Risk & Vulnerability Profile in Clean Light UI */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs space-y-5">
            
            {/* Header */}
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-indigo-700">{selectedHab.code}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  {selectedHab.priorityWindow} Priority
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedHab.name}</h2>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Taluka: <strong className="text-slate-800">{selectedHab.taluka}</strong> • Population: <strong className="text-slate-900">{selectedHab.population.toLocaleString()}</strong>
              </div>
            </div>

            {/* Overall Composite Score Visual Ring */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                  Composite Risk Index
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-red-600">{selectedHab.riskScore}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 100</span>
                </div>
                <span className="text-[10px] text-red-700 font-bold mt-0.5 block">
                  Dominant Hazard: {selectedHab.dominantHazard}
                </span>
              </div>

              {/* Mini visual circular progress representation */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-600"
                    strokeDasharray={`${selectedHab.riskScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-bold text-xs text-slate-900 font-mono">{selectedHab.riskScore}%</span>
              </div>
            </div>

            {/* Multi-Factor Contribution Bar Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Multi-Factor Contribution</span>
                <span className="text-[10px] font-mono font-semibold text-slate-400">WEIGHTED IMPACT</span>
              </div>

              {/* Hazard Exposure */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Hazard Exposure (Physical Inundation & Slope)</span>
                  <span className="font-mono font-bold text-amber-700">{selectedHab.hazardExposure}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${selectedHab.hazardExposure}%` }} />
                </div>
              </div>

              {/* Population Exposure */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Population Exposure Density</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedHab.populationExposure}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedHab.populationExposure}%` }} />
                </div>
              </div>

              {/* Vulnerability */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Social Vulnerability (Kutcha, Children, Elderly)</span>
                  <span className="font-mono font-bold text-purple-700">{selectedHab.vulnerabilityScore}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${selectedHab.vulnerabilityScore}%` }} />
                </div>
              </div>

              {/* Historical Impact */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Historical Breach Frequency</span>
                  <span className="font-mono font-bold text-rose-700">{selectedHab.historicalImpact}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${selectedHab.historicalImpact}%` }} />
                </div>
              </div>

              {/* Access Risk */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Evacuation Chokepoint & Access Risk</span>
                  <span className="font-mono font-bold text-orange-700">{selectedHab.accessRisk}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${selectedHab.accessRisk}%` }} />
                </div>
              </div>
            </div>

            {/* Qualitative Assessment Record */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1">Field Observation Summary:</span>
              {selectedHab.historySummary}
            </div>

            {/* Quick List of Other Habitations in Same Risk Category */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Select in {selectedHab.priorityWindow} Tier:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {habitations
                  .filter(h => h.priorityWindow === selectedHab.priorityWindow && h.id !== selectedHab.id)
                  .slice(0, 4)
                  .map(h => (
                    <button
                      key={h.id}
                      onClick={() => handleSelect(h)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 border border-slate-300 transition"
                    >
                      {h.name.replace('Village ', '')}
                    </button>
                  ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
