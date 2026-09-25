import React, { useState } from 'react';
import { RelocationSite, Habitation } from '../types';
import { OpenStreetMap } from '../components/OpenStreetMap';
import { 
  Building2, 
  ShieldCheck, 
  Filter, 
  Droplet, 
  HeartPulse, 
  Car, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpDown,
  Search,
  Sparkles
} from 'lucide-react';

interface RelocationSitesPageProps {
  sites: RelocationSite[];
  habitations: Habitation[];
  selectedSite: RelocationSite | null;
  onSelectSite: (site: RelocationSite) => void;
  onNavigateToGenerate: () => void;
}

export const RelocationSitesPage: React.FC<RelocationSitesPageProps> = ({
  sites,
  habitations,
  selectedSite,
  onSelectSite,
  onNavigateToGenerate
}) => {
  const [minAvailableCap, setMinAvailableCap] = useState<number>(0);
  const [minSuitability, setMinSuitability] = useState<number>(85);
  const [searchQuery, setSearchQuery] = useState('');
  const [roadFilter, setRoadFilter] = useState('All');

  const filteredSites = sites.filter(s => {
    if (s.remainingCapacity < minAvailableCap) return false;
    if (s.suitabilityScore < minSuitability) return false;
    if (roadFilter !== 'All' && s.roadAccess !== roadFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalMaxCap = sites.reduce((acc, s) => acc + s.maxCapacity, 0);
  const totalOccupied = sites.reduce((acc, s) => acc + s.currentOccupancy, 0);
  const totalRemaining = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Safe Candidate Relocation Sites (Carrying Capacity Registry)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Pre-Screened Disaster Haven Enclaves
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Geotechnically screened high-ground havens evaluated for slope stability (&lt;5°), water yield (SPHERE standards &ge;45 LPCD), sanitation facilities, and emergency arterial connectivity.
          </p>
        </div>

        {/* Global Capacity Summary Pill */}
        <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Safe Capacity</span>
            <span className="text-base font-black text-slate-900">{totalMaxCap.toLocaleString()}</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Occupied</span>
            <span className="text-base font-bold text-amber-700">{totalOccupied.toLocaleString()}</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-emerald-800 block text-[10px] uppercase font-bold">Available Buffer</span>
            <span className="text-base font-black text-emerald-700">{totalRemaining.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* OpenStreetMap GIS Spatial Overview of Candidate Sites */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            OpenStreetMap Safe Haven Geographic Distribution & Capacity Clusters
          </span>
          <span>Click any safe haven marker to inspect carrying capacity breakdown</span>
        </div>

        <OpenStreetMap
          habitations={habitations}
          sites={sites}
          selectedSite={selectedSite}
          onSelectHabitation={() => {}}
          onSelectSite={onSelectSite}
          heightClass="h-[480px]"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search safe haven name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Min Suitability Slider */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Min Suitability:</span>
          <input
            type="range"
            min="80"
            max="95"
            value={minSuitability}
            onChange={e => setMinSuitability(Number(e.target.value))}
            className="w-24 accent-emerald-600 cursor-pointer"
          />
          <span className="font-mono text-emerald-700 font-bold">{minSuitability}%</span>
        </div>

        {/* Min Remaining Capacity Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Min Available Spots:</span>
          <select
            value={minAvailableCap}
            onChange={e => setMinAvailableCap(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value={0}>Any Available (&gt; 0)</option>
            <option value={500}>&ge; 500 spots</option>
            <option value={1000}>&ge; 1,000 spots</option>
            <option value={1400}>&ge; 1,400 spots</option>
          </select>
        </div>

        {/* Road Accessibility */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 font-medium">Road Quality:</span>
          <select
            value={roadFilter}
            onChange={e => setRoadFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="All">All Roads</option>
            <option value="Good">Good (All-Weather Paved)</option>
            <option value="Fair">Fair</option>
          </select>
        </div>

        <div className="font-mono text-slate-500 text-[11px]">
          Showing <strong className="text-slate-900 font-bold">{filteredSites.length}</strong> of {sites.length} Safe Havens
        </div>
      </div>

      {/* Relocation Sites Comparison Table in Clean Light UI */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Site Name & Code</th>
                <th className="p-3.5">Taluka / Location</th>
                <th className="p-3.5">Suitability Score</th>
                <th className="p-3.5">Carrying Capacity</th>
                <th className="p-3.5">Occupancy / Remaining</th>
                <th className="p-3.5">Water Supply</th>
                <th className="p-3.5">Sanitation</th>
                <th className="p-3.5">Healthcare</th>
                <th className="p-3.5">Road Access</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSites.map(site => {
                const occPct = (site.currentOccupancy / site.maxCapacity) * 100;
                return (
                  <tr
                    key={site.id}
                    onClick={() => onSelectSite(site)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        {site.name}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-emerald-700 mt-0.5">
                        {site.code} • {site.elevationM}m Elev
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{site.taluka}</div>
                      <div className="text-[11px] text-slate-500">{site.location}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-700">{site.suitabilityScore}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${site.suitabilityScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-800 font-bold">
                      {site.maxCapacity.toLocaleString()} spots
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-amber-700 font-semibold">{site.currentOccupancy.toLocaleString()} occ</span>
                        <span className="text-emerald-700 font-black">{site.remainingCapacity.toLocaleString()} free</span>
                      </div>
                      <div className="w-28 h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${occPct > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(occPct, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-cyan-800 font-semibold">{site.water.status}</span>
                      <div className="text-[10px] text-slate-500 font-medium">{site.water.lpcd} LPCD</div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-indigo-800 font-semibold">{site.sanitation.status}</span>
                      <div className="text-[10px] text-slate-500 font-medium">{site.sanitation.toiletsAvailable} toilets</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-medium">
                      {site.healthcareKm} km
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {site.roadAccess}
                      </span>
                    </td>
                    <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectSite(site)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition"
                        title="View Full Facility Inspection"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
