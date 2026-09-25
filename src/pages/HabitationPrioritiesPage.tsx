import React, { useState } from 'react';
import { Habitation, PriorityWindow, HazardType } from '../types';
import { 
  ListOrdered, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ShieldAlert, 
  AlertTriangle, 
  Users, 
  PlusCircle, 
  Eye, 
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';

interface HabitationPrioritiesPageProps {
  habitations: Habitation[];
  onSelectHabitation: (hab: Habitation) => void;
  onAddToPlan: (hab: Habitation) => void;
  onNavigateToGenerate: () => void;
}

export const HabitationPrioritiesPage: React.FC<HabitationPrioritiesPageProps> = ({
  habitations,
  onSelectHabitation,
  onAddToPlan,
  onNavigateToGenerate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [hazardFilter, setHazardFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'riskScore' | 'population' | 'vulnerabilityScore'>('riskScore');
  const [sortAsc, setSortAsc] = useState(false);

  const priorityWindows = ['All', 'Immediate', 'Short-term', 'Medium-term', 'Monitor'];
  const hazardTypes = ['All', 'Flood', 'Landslide', 'Cloudburst'];

  // Sorting and filtering
  const filteredHabs = habitations
    .filter(h => {
      if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase()) && !h.taluka.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (priorityFilter !== 'All' && h.priorityWindow !== priorityFilter) return false;
      if (hazardFilter !== 'All' && h.dominantHazard !== hazardFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  const getPriorityBadge = (window: PriorityWindow) => {
    switch (window) {
      case 'Immediate':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Short-term':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium-term':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Monitor':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Relocated':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Assessed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner in Clean Light Styling */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
            <ListOrdered className="w-4 h-4" />
            <span>Habitation Prioritization Matrix</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Prioritized Relocation Roster
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Rank-ordered hierarchy of at-risk settlements based on fused hazard severity, structural housing fragility, demographic dependency, and isolation risk.
          </p>
        </div>

        <button
          onClick={onNavigateToGenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100 transition"
        >
          <Building2 className="w-4 h-4" />
          Assign Habitats via Optimization Engine
        </button>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search village name or taluka..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Priority:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {priorityWindows.map(w => (
              <button
                key={w}
                onClick={() => setPriorityFilter(w)}
                className={`px-3 py-1 rounded-lg transition font-semibold text-[11px] ${
                  priorityFilter === w ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Hazard Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Hazard:</span>
          <select
            value={hazardFilter}
            onChange={e => setHazardFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {hazardTypes.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* Sort Switch */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Sort by:</span>
          <button
            onClick={() => {
              if (sortField === 'riskScore') setSortAsc(!sortAsc);
              else {
                setSortField('riskScore');
                setSortAsc(false);
              }
            }}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 ${
              sortField === 'riskScore' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Risk Score</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (sortField === 'population') setSortAsc(!sortAsc);
              else {
                setSortField('population');
                setSortAsc(false);
              }
            }}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 ${
              sortField === 'population' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Population</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Main Table in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 text-center w-16">Rank</th>
                <th className="p-3.5">Habitation & Taluka</th>
                <th className="p-3.5">Population</th>
                <th className="p-3.5">Risk Score</th>
                <th className="p-3.5">Vulnerability</th>
                <th className="p-3.5">Dominant Hazard</th>
                <th className="p-3.5">Priority Window</th>
                <th className="p-3.5">Recommended Action</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHabs.map((hab, index) => (
                <tr
                  key={hab.id}
                  onClick={() => onSelectHabitation(hab)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="p-3.5 text-center font-mono font-bold text-slate-500">
                    #{index + 1}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{hab.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {hab.taluka} • <span className="font-mono text-slate-400 font-semibold">{hab.code}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-800 font-bold">
                    {hab.population.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-red-600">{hab.riskScore}</span>
                      <div className="w-16 h-1.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full"
                          style={{ width: `${hab.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {hab.vulnerabilityScore >= 80 ? 'High' : hab.vulnerabilityScore >= 60 ? 'Medium' : 'Low'} ({hab.vulnerabilityScore}%)
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-amber-700">
                    {hab.dominantHazard}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(hab.priorityWindow)}`}>
                      {hab.priorityWindow}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800">{hab.recommendedAction}</span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(hab.status)}`}>
                      {hab.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectHabitation(hab)}
                        title="View Detailed Dossier"
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAddToPlan(hab)}
                        title="Add to Relocation Plan"
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded-lg transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredHabs.length} habitation priority records</span>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Formula: Risk = 0.35(Hazard) + 0.25(Vulnerability) + 0.20(Pop Exposure) + 0.20(Access Risk)
          </span>
        </div>
      </div>

    </div>
  );
};
