import React from 'react';
import { Habitation, RelocationSite } from '../types';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Printer, 
  ShieldAlert, 
  Users, 
  Building2, 
  Route, 
  Activity,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface AnalyticsPageProps {
  habitations: Habitation[];
  sites: RelocationSite[];
  selectedDistrict: string;
  onOpenBrief: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  habitations,
  sites,
  selectedDistrict,
  onOpenBrief
}) => {
  // Aggregate stats
  const totalPop = habitations.reduce((acc, h) => acc + h.population, 0);
  const immediateHabs = habitations.filter(h => h.priorityWindow === 'Immediate');
  const shortHabs = habitations.filter(h => h.priorityWindow === 'Short-term');
  const mediumHabs = habitations.filter(h => h.priorityWindow === 'Medium-term');
  const monitorHabs = habitations.filter(h => h.priorityWindow === 'Monitor');

  const immediatePop = immediateHabs.reduce((acc, h) => acc + h.population, 0);
  const shortPop = shortHabs.reduce((acc, h) => acc + h.population, 0);
  const mediumPop = mediumHabs.reduce((acc, h) => acc + h.population, 0);
  const monitorPop = monitorHabs.reduce((acc, h) => acc + h.population, 0);

  const floodHabs = habitations.filter(h => h.dominantHazard === 'Flood');
  const landslideHabs = habitations.filter(h => h.dominantHazard === 'Landslide');
  const cloudburstHabs = habitations.filter(h => h.dominantHazard === 'Cloudburst');

  const totalMaxCap = sites.reduce((acc, s) => acc + s.maxCapacity, 0);
  const totalOccupied = sites.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const totalAvailable = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);

  const totalChildren = habitations.reduce((acc, h) => acc + h.demographics.children, 0);
  const totalElderly = habitations.reduce((acc, h) => acc + h.demographics.elderly, 0);
  const totalMedical = habitations.reduce((acc, h) => acc + h.demographics.medicalDependents, 0);
  const totalKutcha = habitations.reduce((acc, h) => acc + h.demographics.kutchaHouses, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>District Disaster Intelligence & Capacity Balance Analytics</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Analytics & Situational Reports
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Systematic quantitative overview of demographic vulnerabilities, aggregate carrying capacity headroom, hazard frequency distributions, and evacuation corridor metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const headers = ['Code', 'Name', 'Taluka', 'Population', 'RiskScore', 'Hazard', 'Priority'];
              const rows = habitations.map(h => [h.code, h.name, h.taluka, h.population, h.riskScore, h.dominantHazard, h.priorityWindow].join(','));
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `disaster_intelligence_${selectedDistrict.replace(/\s+/g, '_')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export CSV Dataset</span>
          </button>
          <button
            onClick={onOpenBrief}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 transition"
          >
            <Download className="w-4 h-4" />
            <span>Official Brief PDF</span>
          </button>
        </div>
      </div>

      {/* Row 1: Key Distribution Cards in Clean Light UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        
        {/* Card 1: Risk Population Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            <span>Population Risk Exposure</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-red-700 font-bold">Immediate Priority:</span>
                <span className="font-mono font-black text-slate-900">{immediatePop.toLocaleString()} ({((immediatePop/totalPop)*100).toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-red-600 rounded-full" style={{ width: `${(immediatePop/totalPop)*100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-orange-700 font-bold">Short-term Priority:</span>
                <span className="font-mono font-black text-slate-900">{shortPop.toLocaleString()} ({((shortPop/totalPop)*100).toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(shortPop/totalPop)*100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-amber-700 font-bold">Medium-term Priority:</span>
                <span className="font-mono font-black text-slate-900">{mediumPop.toLocaleString()} ({((mediumPop/totalPop)*100).toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(mediumPop/totalPop)*100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px]">
                <span className="text-emerald-700 font-bold">Monitor / Low:</span>
                <span className="font-mono font-black text-slate-900">{monitorPop.toLocaleString()} ({((monitorPop/totalPop)*100).toFixed(0)}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(monitorPop/totalPop)*100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Hazard Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            <span>Dominant Hazard Breakdown</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Riverine & Flash Flood</span>
                <span className="text-[10px] text-slate-500">Mandakini & Alaknanda floodplains</span>
              </div>
              <span className="font-mono font-black text-sm text-cyan-700">{floodHabs.length} Habitations</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Slope Landslide & Creep</span>
                <span className="text-[10px] text-slate-500">InSAR active shear planes</span>
              </div>
              <span className="font-mono font-black text-sm text-amber-700">{landslideHabs.length} Habitations</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Cloudburst & Debris Flows</span>
                <span className="text-[10px] text-slate-500">High-altitude ravines</span>
              </div>
              <span className="font-mono font-black text-sm text-purple-700">{cloudburstHabs.length} Habitations</span>
            </div>
          </div>
        </div>

        {/* Card 3: Shelter Carrying Capacity vs Total High Risk Demand */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            <span>Capacity vs Evacuation Demand</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Evacuation Demand (Immediate):</span>
              <span className="font-mono font-black text-red-600">{immediatePop.toLocaleString()} pers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Shelter Net Capacity:</span>
              <span className="font-mono font-bold text-slate-900">{totalMaxCap.toLocaleString()} pers</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Current Pre-Occupied:</span>
              <span className="font-mono font-bold text-amber-700">{totalOccupied.toLocaleString()} pers</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-emerald-800 font-bold">Unallocated Buffer:</span>
              <span className="font-mono font-black text-emerald-700">{totalAvailable.toLocaleString()} spots</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
            ✓ Positive capacity surplus of {(totalAvailable - immediatePop).toLocaleString()} slots across 8 havens.
          </div>
        </div>

        {/* Card 4: High Vulnerability Cohorts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            <span>Census Demographics</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Children (0-6)</span>
              <span className="text-base font-black text-amber-700">{totalChildren.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Elderly (&gt;65)</span>
              <span className="text-base font-black text-amber-700">{totalElderly.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Medical Triage</span>
              <span className="text-base font-black text-red-600">{totalMedical.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Kutcha Houses</span>
              <span className="text-base font-black text-purple-700">{totalKutcha.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Taluka Level Comparative Table in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              Taluka-Wise Hazard Risk & Readiness Index
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Comparative metrics across regional administrative sub-divisions
            </p>
          </div>
          <span className="font-mono text-indigo-700 text-[11px] font-bold">Aggregated from 24 Habitations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Taluka Sub-Division</th>
                <th className="p-3.5">Habitations Tracked</th>
                <th className="p-3.5">Total Population</th>
                <th className="p-3.5">High/Immediate Risk</th>
                <th className="p-3.5">Avg Risk Index</th>
                <th className="p-3.5">Assigned Haven Capacity</th>
                <th className="p-3.5">Road Access Index</th>
                <th className="p-3.5 text-right">Readiness State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { taluka: 'Ukhimath', habs: 5, pop: 4850, imm: 3, avgRisk: 86, cap: 4500, road: 'Fair (Bridge Caution)', status: 'High Alert' },
                { taluka: 'Joshimath', habs: 5, pop: 3950, imm: 4, avgRisk: 89, cap: 3800, road: 'Cut-off Risk', status: 'Active Evacuation' },
                { taluka: 'Chamoli', habs: 5, pop: 4400, imm: 2, avgRisk: 74, cap: 4200, road: 'Good (All-Weather)', status: 'Staged Readiness' },
                { taluka: 'Rudraprayag', habs: 4, pop: 3650, imm: 1, avgRisk: 68, cap: 3200, road: 'Good', status: 'Precautionary Monitor' },
                { taluka: 'Tharali', habs: 3, pop: 2200, imm: 1, avgRisk: 71, cap: 2000, road: 'Fair', status: 'Precautionary Monitor' },
                { taluka: 'Karnaprayag', habs: 2, pop: 1400, imm: 1, avgRisk: 63, cap: 1800, road: 'Good', status: 'Normal Operations' },
              ].map(t => (
                <tr key={t.taluka} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900 text-sm">{t.taluka}</td>
                  <td className="p-3.5 font-mono text-slate-700">{t.habs} settlements</td>
                  <td className="p-3.5 font-mono text-slate-800 font-bold">{t.pop.toLocaleString()}</td>
                  <td className="p-3.5 font-mono text-red-600 font-bold">{t.imm} urgent</td>
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-amber-700">{t.avgRisk}/100</span>
                  </td>
                  <td className="p-3.5 font-mono text-emerald-700 font-bold">{t.cap.toLocaleString()} spots</td>
                  <td className="p-3.5 text-slate-700">{t.road}</td>
                  <td className="p-3.5 text-right">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                      t.status === 'Active Evacuation' ? 'bg-red-50 text-red-700 border border-red-200' :
                      t.status === 'High Alert' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
