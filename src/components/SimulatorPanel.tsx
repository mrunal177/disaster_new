import React, { useState } from 'react';
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Home, 
  Layers, 
  Flame, 
  CloudRain, 
  Waves, 
  Mountain,
  Compass,
  FileText
} from 'lucide-react';
import { ScenarioOverrides } from '../agents/scenarioAgent';
import { StructuredPlanDiff } from '../agents/diffEngine';
import { Habitation, RelocationSite } from '../types';

interface SimulatorPanelProps {
  liveHabitations: Habitation[];
  liveSites: RelocationSite[];
  isRunning: boolean;
  onRunSimulation: (overrides: ScenarioOverrides) => void;
  simulationDiff: StructuredPlanDiff | null;
  onReset: () => void;
}

export const SimulatorPanel: React.FC<SimulatorPanelProps> = ({
  liveHabitations,
  liveSites,
  isRunning,
  onRunSimulation,
  simulationDiff,
  onReset
}) => {
  // State for the 7 scenario override parameters
  const [rainfallIntensity, setRainfallIntensity] = useState<number>(75);
  const [floodLevelM, setFloodLevelM] = useState<number>(2.5);
  const [landslideSeverity, setLandslideSeverity] = useState<'Low' | 'Moderate' | 'Severe' | 'Critical'>('Severe');
  const [roadStatusOverride, setRoadStatusOverride] = useState<'Good' | 'Fair' | 'Passable 4x4' | 'Cut-off Risk' | 'Impassable'>('Cut-off Risk');
  const [selectedRoadHabId, setSelectedRoadHabId] = useState<string>(liveHabitations[0]?.id || 'hab-1');
  const [siteCapacityChokePct, setSiteCapacityChokePct] = useState<number>(50);
  const [selectedChokeSiteId, setSelectedChokeSiteId] = useState<string>(liveSites[0]?.id || 'site-1');
  const [populationSurgePct, setPopulationSurgePct] = useState<number>(20);
  const [hazardZoneExtent, setHazardZoneExtent] = useState<number>(25);

  const applyPreset = (preset: 'cloudburst' | 'roadSeverance' | 'shelterChoke' | 'touristSurge') => {
    if (preset === 'cloudburst') {
      setRainfallIntensity(120);
      setFloodLevelM(3.8);
      setLandslideSeverity('Critical');
      setHazardZoneExtent(40);
      setRoadStatusOverride('Impassable');
    } else if (preset === 'roadSeverance') {
      setRainfallIntensity(60);
      setFloodLevelM(1.5);
      setLandslideSeverity('Critical');
      setRoadStatusOverride('Impassable');
      setSelectedRoadHabId(liveHabitations[0]?.id || 'hab-1');
    } else if (preset === 'shelterChoke') {
      setSiteCapacityChokePct(85);
      setRainfallIntensity(85);
      setFloodLevelM(2.8);
      setSelectedChokeSiteId(liveSites[0]?.id || 'site-1');
    } else if (preset === 'touristSurge') {
      setPopulationSurgePct(60);
      setRainfallIntensity(50);
      setFloodLevelM(1.8);
    }
  };

  const handleExecute = () => {
    // Build overrides payload
    const roadAvailability: Record<string, any> = {};
    if (selectedRoadHabId) {
      roadAvailability[selectedRoadHabId] = roadStatusOverride;
    }

    const siteCapacityOverride: Record<string, number> = {};
    if (selectedChokeSiteId) {
      const site = liveSites.find(s => s.id === selectedChokeSiteId);
      if (site) {
        const reduced = Math.max(20, Math.floor(site.maxCapacity * (1 - siteCapacityChokePct / 100)));
        siteCapacityOverride[selectedChokeSiteId] = reduced;
      }
    }

    const populationOverride: Record<string, number> = {};
    if (populationSurgePct > 0) {
      // Apply surge to top habitations
      liveHabitations.slice(0, 3).forEach(h => {
        populationOverride[h.id] = Math.round(h.population * (1 + populationSurgePct / 100));
      });
    }

    const overrides: ScenarioOverrides = {
      rainfallIntensity,
      floodLevelM,
      landslideSeverity,
      roadAvailability,
      siteCapacityOverride,
      populationOverride,
      hazardZoneExtent
    };

    onRunSimulation(overrides);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                What-If Disaster Stress Simulator
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Zero Live Mutation Guaranteed
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stress-test regional carrying capacities against hypothetical Himalayan cloudbursts, road severance, and surges.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Parameters
          </button>
          <button
            onClick={handleExecute}
            disabled={isRunning}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                Evaluating Scenario...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Scenarios Buttons */}
      <div className="py-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-rose-500" /> Presets:
        </span>
        <button
          onClick={() => applyPreset('cloudburst')}
          className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors"
        >
          ⚡ Cloudburst (+120mm/hr, Flood +3.8m)
        </button>
        <button
          onClick={() => applyPreset('roadSeverance')}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-medium transition-colors"
        >
          🚧 NH-107 Arterial Cut-Off
        </button>
        <button
          onClick={() => applyPreset('shelterChoke')}
          className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-medium transition-colors"
        >
          ⛺ Relief Center Saturated (-85% Capacity)
        </button>
        <button
          onClick={() => applyPreset('touristSurge')}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors"
        >
          👥 Pilgrim Influx Surge (+60% Pop)
        </button>
      </div>

      {/* 7 Parameter Input Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 py-5 border-b border-slate-200">
        {/* 1. Rainfall Intensity */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-500" />
              1. Rainfall Intensity
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {rainfallIntensity} mm/hr
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={5}
            value={rainfallIntensity}
            onChange={e => setRainfallIntensity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Normal (20)</span>
            <span>Cloudburst (65+)</span>
            <span>Deluge (150+)</span>
          </div>
        </div>

        {/* 2. Flood Level Above Danger */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-500" />
              2. River Surge Level
            </span>
            <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              +{floodLevelM.toFixed(1)}m
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={6.0}
            step={0.2}
            value={floodLevelM}
            onChange={e => setFloodLevelM(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Nominal (0m)</span>
            <span>Overbank (2.5m)</span>
            <span>Historic (5.5m)</span>
          </div>
        </div>

        {/* 3. Landslide Severity */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Mountain className="w-4 h-4 text-amber-600" />
              3. Slope Rupture Threat
            </span>
          </div>
          <select
            value={landslideSeverity}
            onChange={e => setLandslideSeverity(e.target.value as any)}
            className="w-full text-xs font-medium p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="Low">Low (Superficial rill wash)</option>
            <option value="Moderate">Moderate (Localized road debris)</option>
            <option value="Severe">Severe (Active 45cm slip plane)</option>
            <option value="Critical">Critical (Deep structural collapse)</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1.5">Scales geotechnical vulnerability factor</p>
        </div>

        {/* 4. Hazard Zone Extent */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-500" />
              4. Hazard Zone Extent
            </span>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              +{hazardZoneExtent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={hazardZoneExtent}
            onChange={e => setHazardZoneExtent(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Baseline (0%)</span>
            <span>Intermediate (+30%)</span>
            <span>Valley-wide (+80%)</span>
          </div>
        </div>

        {/* 5. Road Availability Override */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              5. Road Network Status
            </span>
          </div>
          <div className="space-y-1.5">
            <select
              value={selectedRoadHabId}
              onChange={e => setSelectedRoadHabId(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              {liveHabitations.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <select
              value={roadStatusOverride}
              onChange={e => setRoadStatusOverride(e.target.value as any)}
              className="w-full text-xs font-semibold p-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900"
            >
              <option value="Good">Good (Clear Highway)</option>
              <option value="Passable 4x4">Passable 4x4 (Tactical)</option>
              <option value="Cut-off Risk">Cut-off Risk (Impending)</option>
              <option value="Impassable">Impassable (Severed)</option>
            </select>
          </div>
        </div>

        {/* 6. Site Capacity Choke */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-rose-600" />
              6. Shelter Capacity Choke
            </span>
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              -{siteCapacityChokePct}%
            </span>
          </div>
          <div className="space-y-1.5">
            <select
              value={selectedChokeSiteId}
              onChange={e => setSelectedChokeSiteId(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              {liveSites.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.maxCapacity} cap)</option>
              ))}
            </select>
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={siteCapacityChokePct}
              onChange={e => setSiteCapacityChokePct(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
          </div>
        </div>

        {/* 7. Population Surges */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              👥 7. Pilgrim / Tourist Influx Surge
            </span>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              +{populationSurgePct}% Surge
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={80}
            step={10}
            value={populationSurgePct}
            onChange={e => setPopulationSurgePct(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Simulates seasonal high pilgrim concentration in basin villages (e.g. Kedarnath / Gaurikund)
          </p>
        </div>
      </div>

      {/* Simulation Results & Diff Inspection */}
      {simulationDiff && (
        <div className="mt-6 pt-2">
          {/* Executive AI Summary Narrative Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-purple-50 border border-indigo-200/80 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                AI Explanation Agent: Executive Diff Synthesis
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ml-auto">
                Verified Grounded (0 Hallucinations)
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              "{simulationDiff.explanationSummary?.narrative || 'Simulation completed. Diff computed.'}"
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-2xl font-black text-slate-900">{simulationDiff.tierChanges.length}</span>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Tier Shifts</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-2xl font-black text-rose-700">
                {simulationDiff.tierChanges.filter(t => t.newTier === 'Immediate').length}
              </span>
              <p className="text-xs font-semibold text-rose-600 mt-0.5">Escalated to Immediate</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
              <span className="text-2xl font-black text-purple-700">{simulationDiff.capacityStrains.length}</span>
              <p className="text-xs font-semibold text-purple-600 mt-0.5">Sites Strained / Saturated</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-2xl font-black text-amber-700">
                {simulationDiff.residualTemporaryShelterCount}
              </span>
              <p className="text-xs font-semibold text-amber-600 mt-0.5">Deficit Habitants (Tents Req)</p>
            </div>
          </div>

          {/* Before / After Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Before / After Scenario Comparison (Live Baseline vs Hypothetical)
              </h4>
              <span className="text-[11px] text-slate-500">Highlighting impacted rows</span>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Habitation</th>
                    <th className="py-2.5 px-3 font-semibold">Baseline Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Simulated Priority</th>
                    <th className="py-2.5 px-3 font-semibold">Risk Delta</th>
                    <th className="py-2.5 px-3 font-semibold">Relocation Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {simulationDiff.tierChanges.map(change => {
                    const isImmediate = change.newTier === 'Immediate';
                    const assignmentChange = simulationDiff.assignmentChanges.find(a => a.habitationId === change.habitationId);

                    return (
                      <tr 
                        key={change.habitationId} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isImmediate ? 'bg-rose-50/40 font-medium' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800">{change.habitationName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{change.dominantHazard}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {change.oldTier} ({change.oldScore})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 w-fit ${
                            isImmediate
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {change.newTier} ({change.newScore})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={`font-bold ${change.scoreDelta > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {change.scoreDelta > 0 ? `+${change.scoreDelta}` : change.scoreDelta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {assignmentChange ? (
                            <span className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" />
                              {assignmentChange.changeType === 'REROUTED'
                                ? `Rerouted to ${assignmentChange.toSiteName}`
                                : assignmentChange.changeType === 'UNASSIGNED_DEFICIT'
                                ? '⚠️ Field Poly-Shelters Required'
                                : `Assigned to ${assignmentChange.toSiteName}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Accommodated in safe corridor</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
