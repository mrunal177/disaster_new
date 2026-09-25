import React from 'react';
import { Habitation, RelocationSite } from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  ShieldAlert, 
  Activity, 
  Car, 
  Radio, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Building2,
  ExternalLink
} from 'lucide-react';

interface HabitationDetailModalProps {
  habitation: Habitation | null;
  sites: RelocationSite[];
  onClose: () => void;
  onAddToPlan?: (hab: Habitation) => void;
  onOpenGeneratePlan?: () => void;
}

export const HabitationDetailModal: React.FC<HabitationDetailModalProps> = ({
  habitation,
  sites,
  onClose,
  onAddToPlan,
  onOpenGeneratePlan
}) => {
  if (!habitation) return null;

  const candidateSites = sites.slice(0, 3);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="habitation-detailed-profile"
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900"
      >
        {/* Top Header in Clean Light UI */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">{habitation.code}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadge(habitation.priorityWindow)}`}>
                  {habitation.priorityWindow} Priority
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Status: {habitation.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{habitation.name}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5 font-medium">
                <span>Taluka: <strong className="text-slate-800">{habitation.taluka}</strong></span>
                <span>•</span>
                <span>District: <strong className="text-slate-800">{habitation.district}</strong></span>
                <span>•</span>
                <span className="font-mono text-indigo-700 font-bold">{habitation.coords.lat}°N, {habitation.coords.lng}°E</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Top Score Matrix */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                AI-assisted Multi-Hazard Risk Composition
              </h3>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">Fused IMD + CWC + GSI + Census</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-red-700 block">OVERALL RISK</span>
                <span className="text-2xl font-black text-red-600">{habitation.riskScore}</span>
                <span className="text-[10px] text-slate-500 block">/ 100</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">HAZARD EXP</span>
                <span className="text-xl font-bold text-amber-700">{habitation.hazardExposure}</span>
                <span className="text-[10px] text-slate-500 block">/ 100</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">POP EXPOSURE</span>
                <span className="text-xl font-bold text-slate-900">{habitation.populationExposure}</span>
                <span className="text-[10px] text-slate-500 block">/ 100</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">VULNERABILITY</span>
                <span className="text-xl font-bold text-purple-700">{habitation.vulnerabilityScore}</span>
                <span className="text-[10px] text-slate-500 block">/ 100</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">PAST IMPACT</span>
                <span className="text-xl font-bold text-rose-700">{habitation.historicalImpact}</span>
                <span className="text-[10px] text-slate-500 block">/ 100</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 block">ACCESS RISK</span>
                <span className="text-xl font-bold text-orange-700">{habitation.accessRisk}</span>
                <span className="text-[10px] text-slate-500 block">/ 100</span>
              </div>
            </div>
          </div>

          {/* Demographics & Special Needs */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Census Demographics & High-Vulnerability Cohorts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Total Population</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{habitation.population.toLocaleString()}</div>
                <div className="text-[10px] text-indigo-700 font-medium">100% in scope</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Children (0-6 yrs)</div>
                <div className="text-base font-black text-amber-700 mt-0.5">{habitation.demographics.children}</div>
                <div className="text-[10px] text-slate-500">Nutritional care</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Elderly (&gt;65 yrs)</div>
                <div className="text-base font-black text-amber-700 mt-0.5">{habitation.demographics.elderly}</div>
                <div className="text-[10px] text-slate-500">Mobility assistance</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Medical Dependents</div>
                <div className="text-base font-black text-red-600 mt-0.5">{habitation.demographics.medicalDependents}</div>
                <div className="text-[10px] text-red-700 font-medium">Requires triage/ICU</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 text-[10px] font-semibold uppercase">Kutcha Mud Houses</div>
                <div className="text-base font-black text-rose-700 mt-0.5">{habitation.demographics.kutchaHouses}</div>
                <div className="text-[10px] text-slate-500">Vulnerable walls</div>
              </div>
            </div>
          </div>

          {/* Disaster History & Infrastructure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Historical Inundation / Slide Record
              </span>
              <p className="text-slate-700 leading-relaxed">{habitation.historySummary}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Dominant Hazard:</span>
                <span className="font-bold text-red-600">{habitation.dominantHazard}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-500 font-medium">Secondary Hazards:</span>
                <span className="text-amber-800 font-semibold">{habitation.secondaryHazards.join(', ') || 'None identified'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-cyan-600" />
                Evacuation Corridors & Accessibility
              </span>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Road Status:</span>
                  <span className={`font-bold ${habitation.accessibility.roadStatus === 'Cut-off Risk' ? 'text-red-600' : 'text-emerald-700'}`}>
                    {habitation.accessibility.roadStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bridge Cut-off Risk:</span>
                  <span className={`font-bold ${habitation.accessibility.bridgeCutoffRisk === 'Critical' ? 'text-red-600' : 'text-amber-700'}`}>
                    {habitation.accessibility.bridgeCutoffRisk}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nearest Helipad:</span>
                  <span className="font-mono text-slate-900 font-bold">{habitation.accessibility.nearestHelipadKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telecomm Status:</span>
                  <span className={`font-semibold ${habitation.accessibility.telecommWorking ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {habitation.accessibility.telecommWorking ? 'Operational' : 'Down / Radio Only'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Safe Relocation Sites */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Screened Relocation Destinations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {candidateSites.map(site => (
                <div key={site.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="font-bold text-slate-900">{site.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{site.location}</div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px]">
                    <span className="text-slate-500">Available:</span>
                    <span className="font-black text-emerald-700">{site.remainingCapacity.toLocaleString()} spots</span>
                  </div>
                  <div className="flex justify-between text-[11px] mt-0.5">
                    <span className="text-slate-500">Suitability:</span>
                    <span className="font-bold text-indigo-700">{site.suitabilityScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Recommended Action: <strong className="text-amber-800 font-bold">{habitation.recommendedAction}</strong>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onAddToPlan?.(habitation);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Add to Relocation Plan
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenGeneratePlan?.();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
            >
              Launch DSS Solver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
